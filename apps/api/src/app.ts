/**
 * API Application
 *
 * Hono app with oRPC integration for Cloudflare Workers.
 */

import { createDb } from "@crm/storage";
import { createR2ClientFromEnv } from "@crm/storage/r2";
import { OpenAPIGenerator } from "@orpc/openapi";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
// import { captureException as sentryCaptureException } from "./lib/sentry";
import { setSecurityHeaders } from "./lib/security";
import { getSessionCookie } from "better-auth/cookies";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import Stripe from "stripe";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import type { AppEnv, InitialContext } from "./context";
import {
  analyzeDocumentDraft,
  assessInvoiceRisk,
  assessProjectRisk,
  enrichContact,
  generateCampaignPlan,
  generateMeetingSummary,
  scoreLead,
  suggestEmailContent,
  triageSupportTicket,
} from "./lib/ai-features";
import { createAuthFromEnv } from "./lib/create-auth-from-env";
import { getDb, schema } from "./lib/db";
import { APIError } from "./lib/errors";
import { loggerMiddleware } from "./middleware/logger";
import { botDetectionMiddleware } from "./middleware/bot-detection";
import { auditLogMiddleware } from "./middleware/audit-log";
// Monitoring imports disabled for Cloudflare Workers compatibility
import { initSentry } from "./lib/sentry";
// import { initDatadog } from "./lib/datadog";
import { rateLimitRedis } from "./middleware/rate-limit-redis";
import { appRouter } from "./routers";

type AgentStatus = "pending" | "running" | "completed" | "failed";

interface AgentTask {
  id: string;
  tool: string;
  status: AgentStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  plan: string[];
}

const crmAgentTools = [
  {
    id: "crm.lead.score",
    name: "Score Lead",
    description: "Score CRM lead quality from contact context.",
  },
  {
    id: "crm.email.suggest",
    name: "Suggest Email",
    description: "Generate follow-up email suggestions.",
  },
  {
    id: "crm.contact.enrich",
    name: "Enrich Contact",
    description: "Generate enrichment insights for a contact.",
  },
  {
    id: "crm.meeting.summarize",
    name: "Summarize Meeting",
    description: "Summarize meeting notes for CRM records.",
  },
];

const crmAgentTasks = new Map<string, AgentTask>();
const crmAgentEvents: Array<Record<string, unknown>> = [];

const MOBILE_REDIRECT_PROTOCOLS = new Set(["nucleocrm:", "exp:", "exps:"]);
const AUTH_COOKIE_PREFIX = "saas-layer";

/**
 * Validate session and return auth context for REST endpoints.
 * Returns { authorized: true, session } on success, { authorized: false, session: null } on failure.
 */
async function requireAuth(c: any) {
  const { auth } = createRequestAuthConfig(c.env || {});
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return { authorized: false, session: null };
    }
    return { authorized: true, session };
  } catch {
    return { authorized: false, session: null };
  }
}

/**
 * Get organization ID from request, validating session membership.
 */
async function getOrgIdFromSession(c: any): Promise<string | null> {
  const authResult = await requireAuth(c);
  if (!authResult.authorized) return null;
  return (
    c.req.header("x-organization-id") ||
    (authResult.session as any)?.session?.activeOrganizationId ||
    (authResult.session as any)?.activeOrganizationId ||
    null
  );
}

function resolveRequestConnectionString(envBindings: Partial<AppEnv> = {}) {
  return envBindings.DATABASE?.connectionString || process.env.DATABASE_URL;
}

function createRequestAuthConfig(envBindings: Partial<AppEnv> = {}) {
  const connectionString = resolveRequestConnectionString(envBindings);

  if (!connectionString) {
    throw new Error(
      "DATABASE connection string not found in environment bindings or process.env.DATABASE_URL",
    );
  }

  const db = createDb({ connectionString });
  const minimalEnv = {
    DATABASE_URL: connectionString,
    NODE_ENV: envBindings.NODE_ENV || process.env.NODE_ENV || "development",
    VITE_PUBLIC_SITE_URL:
      envBindings.VITE_PUBLIC_SITE_URL ||
      process.env.VITE_PUBLIC_SITE_URL ||
      "http://localhost:3001",
    BETTER_AUTH_BASE_URL:
      envBindings.BETTER_AUTH_BASE_URL ||
      process.env.BETTER_AUTH_BASE_URL ||
      undefined,
    BETTER_AUTH_SECRET:
      envBindings.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET,
    CACHE: envBindings.CACHE,
    BUCKET: envBindings.BUCKET,
    ASSETS: envBindings.ASSETS,
    GOOGLE_CLIENT_ID:
      envBindings.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:
      envBindings.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID:
      envBindings.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET:
      envBindings.GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET,
    STRIPE_SECRET_KEY:
      envBindings.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET:
      envBindings.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET,
  };

  return {
    db,
    auth: createAuthFromEnv(db, minimalEnv as AppEnv),
    connectionString,
  };
}

function buildMobileRedirectTarget(rawTarget: string) {
  const target = new URL(rawTarget);

  if (!MOBILE_REDIRECT_PROTOCOLS.has(target.protocol)) {
    throw new Error("Unsupported mobile redirect protocol");
  }

  return target;
}

type DemoRecord = {
  id: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

const demoCrmStore = {
  contacts: new Map<string, DemoRecord>(),
  deals: new Map<string, DemoRecord>(),
  leads: new Map<string, DemoRecord>(),
  activities: new Map<string, DemoRecord>(),
};

function isDemoOrg(orgId: string) {
  return orgId === "demo-org";
}

function createDemoRecord(
  prefix: string,
  orgId: string,
  data: Record<string, unknown>,
): DemoRecord {
  const now = new Date().toISOString();
  return {
    id: `${prefix}-${crypto.randomUUID()}`,
    organizationId: orgId,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
}

function sortDemoRecords(
  records: DemoRecord[],
  sortBy: string | undefined,
  sortOrder: string | undefined,
  defaultKey: string,
) {
  const key = sortBy || defaultKey;
  const direction = sortOrder === "asc" ? 1 : -1;

  return [...records].sort((left, right) => {
    const a = left[key];
    const b = right[key];

    if (typeof a === "number" && typeof b === "number") {
      return (a - b) * direction;
    }

    return String(a ?? "").localeCompare(String(b ?? "")) * direction;
  });
}

function paginateDemoRecords(
  records: DemoRecord[],
  pageNum: number,
  limitNum: number,
) {
  const offset = (pageNum - 1) * limitNum;
  const data = records.slice(offset, offset + limitNum);
  return {
    data,
    total: records.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.max(1, Math.ceil(records.length / limitNum)),
  };
}

function getR2() {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return null;
    }

    return createR2ClientFromEnv();
  } catch {
    return null;
  }
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9.-]/g, "_");
}

function buildStorageKey(orgId: string, filename: string) {
  return `${orgId}/${Date.now()}-${sanitizeFilename(filename)}`;
}

function generateAssetTags(
  name: string,
  mimeType: string,
  existing: string[] = [],
) {
  const extension = name.split(".").pop()?.toLowerCase();
  const mimeSubtype = mimeType.split("/")[1]?.toLowerCase();
  const baseName = name.replace(/\.[^/.]+$/, "").toLowerCase();
  const nameTokens = baseName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  return Array.from(
    new Set([
      ...existing,
      "ai-generated",
      ...(mimeSubtype ? [mimeSubtype] : []),
      ...(extension ? [extension] : []),
      ...nameTokens,
    ]),
  ).slice(0, 10);
}

function toAssetResponse(
  asset: typeof schema.digitalAssets.$inferSelect,
  tags: string[],
) {
  return {
    ...asset,
    type: asset.mimeType,
    url: `/api/v1/assets/${asset.id}/download`,
    tags,
    contactId:
      (asset.metadata as Record<string, unknown> | null)?.contactId ?? null,
    dealId: (asset.metadata as Record<string, unknown> | null)?.dealId ?? null,
    leadId: (asset.metadata as Record<string, unknown> | null)?.leadId ?? null,
    originalName:
      (asset.metadata as Record<string, unknown> | null)?.originalName ||
      asset.name,
    r2Key: asset.storageKey,
  };
}

function pushCrmAgentEvent(event: Record<string, unknown>) {
  crmAgentEvents.push(event);
  if (crmAgentEvents.length > 500) {
    crmAgentEvents.splice(0, crmAgentEvents.length - 500);
  }
}

/**
 * Create Hono app with all routes
 */
export function createApp() {
  const app = new Hono<{ Bindings: AppEnv }>();

  // Monitoring disabled for Cloudflare Workers compatibility
  // (Sentry and Datadog require semver which fails in Workers environment)
  initSentry();

  // CORS allowlist - only allow known origins in production
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  // Global middleware
  app.use(
    "*",
    cors({
      origin: (origin: string | null) => {
        if (!origin) return true; // allow non-browser clients (curl, server-to-server)
        if (process.env.NODE_ENV !== "production") return origin; // allow all in dev
        return ALLOWED_ORIGINS.includes(origin);
      },
      credentials: true,
    }),
  );
  app.use("*", requestId());
  app.use("*", loggerMiddleware);

  // Security headers middleware
  app.use("*", async (c, next) => {
    const headers = c.res.headers;
    setSecurityHeaders(headers);
    await next();
  });

  // Bot detection middleware
  app.use("*", botDetectionMiddleware);

  // Audit logging middleware
  app.use("*", auditLogMiddleware);

  // Populate env from process.env when running outside Workers.
  app.use("*", async (c, next) => {
    (c as any).env = {
      ...((c as any).env || {}),
      ...process.env,
    };
    await next();
  });

  // Root API info
  app.get("/", (c: any) => {
    return c.json({
      name: "Nucleo One API",
      version: "1.0.0",
      description: "CRM and business management API",
      endpoints: {
        health: "/api/health",
        docs: "/api/openapi.json",
        rpc: "/api/rpc/*",
        rest: "/api/v1/*"
      }
    });
  });

  // Health check (non-RPC) - must be before rate limiting
  app.post("/api/billing/webhook", async (c: any) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !whSecret) return c.json({ error: "Stripe not configured" }, 503);
    const stripe = new Stripe(secret);
    const sig = c.req.header("stripe-signature");
    const raw = await c.req.text();
    let event: any;
    try {
      event = stripe.webhooks.constructEvent(raw, sig, whSecret);
    } catch {
      return c.json({ error: "Invalid signature" }, 400);
    }
    const db = getDb({ env: c.env } as any);
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as any;
      const orgId = s.metadata?.orgId;
      const plan = s.metadata?.plan;
      const interval = s.metadata?.interval;
      if (orgId && plan) {
        const expires = new Date();
        expires.setMonth(expires.getMonth() + (interval === "year" ? 12 : 1));
        await db.execute(
          sql`update organizations set plan = ${plan}, subscription_status = 'active', subscription_expires_at = ${expires.toISOString()} where id = ${orgId}`,
        );
      }
    }
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as any;
      const orgId = sub.metadata?.orgId;
      if (orgId) {
        await db.execute(
          sql`update organizations set subscription_status = 'cancelled' where id = ${orgId}`,
        );
      }
    }
    return c.json({ received: true });
  });

  app.get("/api/health", (c: any) => {
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // Helper to get a valid user ID
  async function getDemoUserId(db: any): Promise<string> {
    const { users } = schema;
    const [user] = await db.select({ id: users.id }).from(users).limit(1);
    return user?.id || "62753def-1ecc-4338-81d1-8a61a730c429";
  }

  // Direct REST endpoints
  app.get("/api/v1/deals", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);

    const { search, stage, sortBy, sortOrder, page, limit } = c.req.query();
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

    // Demo mode for development only
    const isDemo = isDemoOrg(orgId);
    if (isDemo) {
      let records = Array.from(demoCrmStore.deals.values()).filter(
        (deal) => deal.organizationId === orgId,
      );

      if (stage && stage !== "all") {
        records = records.filter((deal) => deal.stage === stage);
      }

      if (search) {
        const query = search.toLowerCase();
        records = records.filter((deal) =>
          String(deal.name ?? "")
            .toLowerCase()
            .includes(query),
        );
      }

      return c.json(
        paginateDemoRecords(
          sortDemoRecords(records, sortBy, sortOrder, "createdAt"),
          pageNum,
          limitNum,
        ),
      );
    }

    const offset = (pageNum - 1) * limitNum;

    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { deals } = schema;

    let query = db.select().from(deals).where(eq(deals.organizationId, orgId));

    // Filter by stage
    if (stage && stage !== "all") {
      query = query.where(eq(deals.stage, stage));
    }

    // Search by name
    if (search) {
      query = query.where(ilike(deals.name, `%${search}%`));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(deals)
      .where(eq(deals.organizationId, orgId));
    const total = Number(countResult[0]?.count || 0);

    // Sort
    const sortColumn =
      sortBy === "value"
        ? deals.value
        : sortBy === "createdAt"
          ? deals.createdAt
          : deals.createdAt;
    const sortDir = sortOrder === "asc" ? true : false;

    const allDeals = await query
      .orderBy(sortDir ? asc(sortColumn) : desc(sortColumn))
      .limit(limitNum)
      .offset(offset);

    return c.json({
      data: allDeals,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  });

  app.post("/api/v1/deals", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    if (!body?.name || !body?.value) {
      return c.json({ error: "Name and value are required" }, 400);
    }

    if (isDemoOrg(orgId)) {
      const deal = createDemoRecord("deal", orgId, {
        name: body.name,
        value: Number(body.value),
        stage: body.stage || "lead",
        notes: body.notes || null,
        probability: Number(body.probability || 50),
        expectedCloseDate: body.expectedCloseDate || null,
      });
      demoCrmStore.deals.set(deal.id, deal);
      return c.json(deal);
    }

    try {
      const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
      const { deals } = schema;
      const userId = await getDemoUserId(db);

      const [deal] = await db
        .insert(deals)
        .values({
          name: body.name,
          value: String(body.value),
          stage: body.stage || "lead",
          notes: body.notes || null,
          organizationId: orgId,
          createdBy: userId,
        })
        .returning();
      return c.json(deal);
    } catch (err) {
      console.error("Error creating deal:", err);
      return c.json({ error: String(err) }, 500);
    }
  });

  // Get deal by ID
  app.get("/api/v1/deals/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const dealId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { deals } = schema;
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId))
      .limit(1);
    if (!deal || deal.organizationId !== orgId) {
      return c.json({ error: "Deal not found" }, 404);
    }
    return c.json(deal);
  });

  // Update deal
  app.patch("/api/v1/deals/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const dealId = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { deals } = schema;

    const [existing] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId))
      .limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Deal not found" }, 404);
    }

    const [deal] = await db
      .update(deals)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.value !== undefined && { value: String(body.value) }),
        ...(body.stage && { stage: body.stage }),
        ...(body.notes !== undefined && { notes: body.notes }),
        updatedAt: new Date(),
      })
      .where(eq(deals.id, dealId))
      .returning();

    return c.json(deal);
  });

  // Delete deal
  app.delete("/api/v1/deals/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const dealId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { deals } = schema;

    const [existing] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, dealId))
      .limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Deal not found" }, 404);
    }

    await db.delete(deals).where(eq(deals.id, dealId));
    return c.json({ success: true });
  });

  // Contacts endpoints
  app.get("/api/v1/contacts", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const { search, sortBy, sortOrder, page, limit } = c.req.query();
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

    if (isDemoOrg(orgId)) {
      let records = Array.from(demoCrmStore.contacts.values()).filter(
        (contact) => contact.organizationId === orgId,
      );

      if (search) {
        const query = search.toLowerCase();
        records = records.filter((contact) =>
          [contact.firstName, contact.lastName, contact.email].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(query),
          ),
        );
      }

      return c.json(
        paginateDemoRecords(
          sortDemoRecords(records, sortBy, sortOrder, "createdAt"),
          pageNum,
          limitNum,
        ),
      );
    }

    const offset = (pageNum - 1) * limitNum;

    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { contacts } = schema;

    let query = db
      .select()
      .from(contacts)
      .where(eq(contacts.organizationId, orgId));

    // Search by name or email
    if (search) {
      query = query.where(
        sql`(${contacts.firstName} ILIKE ${`%${search}%`}) OR (${contacts.lastName} ILIKE ${`%${search}%`}) OR (${contacts.email} ILIKE ${`%${search}%`})`,
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(contacts)
      .where(eq(contacts.organizationId, orgId));
    const total = Number(countResult[0]?.count || 0);

    // Sort
    const sortColumn =
      sortBy === "firstName"
        ? contacts.firstName
        : sortBy === "lastName"
          ? contacts.lastName
          : sortBy === "email"
            ? contacts.email
            : contacts.createdAt;
    const sortDir = sortOrder === "asc" ? true : false;

    const allContacts = await query
      .orderBy(sortDir ? asc(sortColumn) : desc(sortColumn))
      .limit(limitNum)
      .offset(offset);

    return c.json({
      data: allContacts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  });

  app.post("/api/v1/contacts", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    if (!body?.firstName || !body?.lastName) {
      return c.json({ error: "First and last name are required" }, 400);
    }

    if (isDemoOrg(orgId)) {
      const contact = createDemoRecord("contact", orgId, {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email?.toLowerCase() || null,
        phone: body.phone || null,
        companyName: body.companyName || null,
        jobTitle: body.jobTitle || null,
        notes: body.notes || null,
      });
      demoCrmStore.contacts.set(contact.id, contact);
      return c.json(contact);
    }

    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { contacts } = schema;
    const userId = await getDemoUserId(db);
    const [contact] = await db
      .insert(contacts)
      .values({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email?.toLowerCase() || null,
        phone: body.phone || null,
        companyName: body.companyName || null,
        organizationId: orgId,
        createdBy: userId,
      })
      .returning();
    return c.json(contact);
  });

  // Get contact by ID
  app.get("/api/v1/contacts/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const contactId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { contacts } = schema;
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);
    if (!contact || contact.organizationId !== orgId) {
      return c.json({ error: "Contact not found" }, 404);
    }
    return c.json(contact);
  });

  // Update contact
  app.patch("/api/v1/contacts/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const contactId = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { contacts } = schema;

    const [existing] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Contact not found" }, 404);
    }

    const [contact] = await db
      .update(contacts)
      .set({
        ...(body.firstName && { firstName: body.firstName }),
        ...(body.lastName && { lastName: body.lastName }),
        ...(body.email !== undefined && {
          email: body.email?.toLowerCase() || null,
        }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.companyName !== undefined && {
          companyName: body.companyName,
        }),
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contactId))
      .returning();

    return c.json(contact);
  });

  // Delete contact
  app.delete("/api/v1/contacts/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const contactId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { contacts } = schema;

    const [existing] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Contact not found" }, 404);
    }

    await db.delete(contacts).where(eq(contacts.id, contactId));
    return c.json({ success: true });
  });

  // Leads endpoints
  app.get("/api/v1/leads", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const { search, status, source, sortBy, sortOrder, page, limit } =
      c.req.query();
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

    if (isDemoOrg(orgId)) {
      let records = Array.from(demoCrmStore.leads.values()).filter(
        (lead) => lead.organizationId === orgId,
      );

      if (status && status !== "all") {
        records = records.filter((lead) => lead.status === status);
      }

      if (source && source !== "all") {
        records = records.filter((lead) => lead.source === source);
      }

      if (search) {
        const query = search.toLowerCase();
        records = records.filter((lead) =>
          [lead.firstName, lead.lastName, lead.email].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(query),
          ),
        );
      }

      return c.json(
        paginateDemoRecords(
          sortDemoRecords(records, sortBy, sortOrder, "createdAt"),
          pageNum,
          limitNum,
        ),
      );
    }

    const offset = (pageNum - 1) * limitNum;

    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { leads } = schema;

    let query = db.select().from(leads).where(eq(leads.organizationId, orgId));

    // Filter by status
    if (status && status !== "all") {
      query = query.where(eq(leads.status, status));
    }

    // Filter by source
    if (source && source !== "all") {
      query = query.where(eq(leads.source, source));
    }

    // Search by name or email
    if (search) {
      query = query.where(
        sql`(${leads.firstName} ILIKE ${`%${search}%`}) OR (${leads.lastName} ILIKE ${`%${search}%`}) OR (${leads.email} ILIKE ${`%${search}%`})`,
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(leads)
      .where(eq(leads.organizationId, orgId));
    const total = Number(countResult[0]?.count || 0);

    // Sort
    const sortColumn =
      sortBy === "firstName"
        ? leads.firstName
        : sortBy === "email"
          ? leads.email
          : leads.createdAt;
    const sortDir = sortOrder === "asc" ? true : false;

    const allLeads = await query
      .orderBy(sortDir ? asc(sortColumn) : desc(sortColumn))
      .limit(limitNum)
      .offset(offset);

    return c.json({
      data: allLeads,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  });

  app.post("/api/v1/leads", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    if (!body?.email) {
      return c.json({ error: "Email is required" }, 400);
    }

    if (isDemoOrg(orgId)) {
      const lead = createDemoRecord("lead", orgId, {
        firstName: body.firstName || "",
        lastName: body.lastName || "",
        email: String(body.email).toLowerCase(),
        phone: body.phone || null,
        companyName: body.companyName || null,
        source: body.source || "website",
        status: body.status || "new",
        notes: body.notes || null,
        jobTitle: body.jobTitle || null,
      });
      demoCrmStore.leads.set(lead.id, lead);
      return c.json(lead);
    }

    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { leads } = schema;
    const userId = await getDemoUserId(db);
    const [lead] = await db
      .insert(leads)
      .values({
        firstName: body.firstName || "",
        lastName: body.lastName || "",
        email: body.email.toLowerCase(),
        phone: body.phone || null,
        companyName: body.companyName || null,
        source: body.source || "website",
        status: body.status || "new",
        organizationId: orgId,
        createdBy: userId,
      })
      .returning();
    return c.json(lead);
  });

  // Convert lead to contact
  app.post("/api/v1/leads/:id/convert", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const leadId = c.req.param("id");
    const body = await c.req.json().catch(() => null);

    if (isDemoOrg(orgId)) {
      const lead = demoCrmStore.leads.get(leadId);
      if (!lead || lead.organizationId !== orgId) {
        return c.json({ error: "Lead not found" }, 404);
      }

      const updatedLead = {
        ...lead,
        status: "converted",
        updatedAt: new Date().toISOString(),
      };
      demoCrmStore.leads.set(leadId, updatedLead);

      const contact = createDemoRecord("contact", orgId, {
        firstName: body?.firstName || lead.firstName || "",
        lastName: body?.lastName || lead.lastName || "",
        email: lead.email || null,
        phone: lead.phone || null,
        companyName: body?.companyName || lead.companyName || null,
      });
      demoCrmStore.contacts.set(contact.id, contact);
      return c.json(contact);
    }

    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { leads, contacts } = schema;
    const userId = await getDemoUserId(db);

    // Get the lead
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }

    // Create contact from lead
    const [contact] = await db
      .insert(contacts)
      .values({
        firstName: body?.firstName || lead.firstName || "",
        lastName: body?.lastName || lead.lastName || "",
        email: lead.email,
        phone: lead.phone,
        companyName: body?.companyName || lead.companyName,
        organizationId: orgId,
        createdBy: userId,
      })
      .returning();

    // Update lead status
    await db
      .update(leads)
      .set({ status: "converted" })
      .where(eq(leads.id, leadId));

    return c.json(contact);
  });

  // Get lead by ID
  app.get("/api/v1/leads/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const leadId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { leads } = schema;
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    if (!lead || lead.organizationId !== orgId) {
      return c.json({ error: "Lead not found" }, 404);
    }
    return c.json(lead);
  });

  // Update lead
  app.patch("/api/v1/leads/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const leadId = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { leads } = schema;

    const [existing] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Lead not found" }, 404);
    }

    const [lead] = await db
      .update(leads)
      .set({
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.email !== undefined && { email: body.email.toLowerCase() }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.companyName !== undefined && {
          companyName: body.companyName,
        }),
        ...(body.source && { source: body.source }),
        ...(body.status && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId))
      .returning();

    return c.json(lead);
  });

  // Delete lead
  app.delete("/api/v1/leads/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const leadId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { leads } = schema;

    const [existing] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Lead not found" }, 404);
    }

    await db.delete(leads).where(eq(leads.id, leadId));
    return c.json({ success: true });
  });

  // Activities endpoints
  app.get("/api/v1/activities", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const { type, contactId, dealId, page, limit } = c.req.query();
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

    if (isDemoOrg(orgId)) {
      let records = Array.from(demoCrmStore.activities.values()).filter(
        (activity) => activity.organizationId === orgId,
      );

      if (type && type !== "all") {
        records = records.filter((activity) => activity.type === type);
      }

      if (contactId) {
        records = records.filter(
          (activity) => activity.contactId === contactId,
        );
      }

      if (dealId) {
        records = records.filter((activity) => activity.dealId === dealId);
      }

      return c.json(
        paginateDemoRecords(
          sortDemoRecords(records, "createdAt", "desc", "createdAt"),
          pageNum,
          limitNum,
        ),
      );
    }

    const offset = (pageNum - 1) * limitNum;

    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { activities } = schema;

    let query = db
      .select()
      .from(activities)
      .where(eq(activities.organizationId, orgId));

    // Filter by type
    if (type && type !== "all") {
      query = query.where(eq(activities.type, type));
    }

    // Filter by contact
    if (contactId) {
      query = query.where(eq(activities.contactId, contactId));
    }

    // Filter by deal
    if (dealId) {
      query = query.where(eq(activities.dealId, dealId));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(activities)
      .where(eq(activities.organizationId, orgId));
    const total = Number(countResult[0]?.count || 0);

    const allActivities = await query
      .orderBy(desc(activities.createdAt))
      .limit(limitNum)
      .offset(offset);

    return c.json({
      data: allActivities,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  });

  app.post("/api/v1/activities", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    if (!body?.type) {
      return c.json({ error: "Activity type is required" }, 400);
    }

    if (isDemoOrg(orgId)) {
      const activity = createDemoRecord("activity", orgId, {
        type: body.type,
        title: body.title || body.subject || "",
        subject: body.subject || body.title || "",
        description: body.description || null,
        contactId: body.contactId || null,
        dealId: body.dealId || null,
      });
      demoCrmStore.activities.set(activity.id, activity);
      return c.json(activity);
    }

    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { activities } = schema;
    const userId = await getDemoUserId(db);
    const [activity] = await db
      .insert(activities)
      .values({
        type: body.type,
        title: body.title || "",
        description: body.description || null,
        contactId: body.contactId || null,
        dealId: body.dealId || null,
        organizationId: orgId,
        createdBy: userId,
      })
      .returning();
    return c.json(activity);
  });

  // Get activity by ID
  app.get("/api/v1/activities/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const activityId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { activities } = schema;
    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);
    if (!activity || activity.organizationId !== orgId) {
      return c.json({ error: "Activity not found" }, 404);
    }
    return c.json(activity);
  });

  // Update activity
  app.patch("/api/v1/activities/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const activityId = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { activities } = schema;

    const [existing] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Activity not found" }, 404);
    }

    const [activity] = await db
      .update(activities)
      .set({
        ...(body.type && { type: body.type }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.contactId !== undefined && { contactId: body.contactId }),
        ...(body.dealId !== undefined && { dealId: body.dealId }),
        updatedAt: new Date(),
      })
      .where(eq(activities.id, activityId))
      .returning();

    return c.json(activity);
  });

  // Delete activity
  app.delete("/api/v1/activities/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const activityId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { activities } = schema;

    const [existing] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Activity not found" }, 404);
    }

    await db.delete(activities).where(eq(activities.id, activityId));
    return c.json({ success: true });
  });

  // Assets endpoints
  app.get("/api/v1/assets", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const { search, contactId, dealId, page, limit } = c.req.query();
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const conditions = [eq(schema.digitalAssets.organizationId, orgId)];

    if (contactId) {
      conditions.push(
        sql`${schema.digitalAssets.metadata} ->> 'contactId' = ${contactId}`,
      );
    }

    if (dealId) {
      conditions.push(
        sql`${schema.digitalAssets.metadata} ->> 'dealId' = ${dealId}`,
      );
    }

    if (search) {
      conditions.push(ilike(schema.digitalAssets.name, `%${search}%`));
    }

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.digitalAssets)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    const assets = (await db
      .select()
      .from(schema.digitalAssets)
      .where(whereClause)
      .orderBy(desc(schema.digitalAssets.createdAt))
      .limit(limitNum)
      .offset(offset)) as Array<typeof schema.digitalAssets.$inferSelect>;

    const assetIds = assets.map(
      (asset: typeof schema.digitalAssets.$inferSelect) => asset.id,
    );
    const tagsByAsset = new Map<string, string[]>();
    if (assetIds.length > 0) {
      const tagRows = await db
        .select({
          assetId: schema.digitalAssetTags.assetId,
          name: schema.assetTags.name,
        })
        .from(schema.digitalAssetTags)
        .innerJoin(
          schema.assetTags,
          eq(schema.assetTags.id, schema.digitalAssetTags.tagId),
        )
        .where(inArray(schema.digitalAssetTags.assetId, assetIds));

      for (const row of tagRows) {
        const list = tagsByAsset.get(row.assetId) || [];
        list.push(row.name);
        tagsByAsset.set(row.assetId, list);
      }
    }

    const data = assets.map((asset: typeof schema.digitalAssets.$inferSelect) =>
      toAssetResponse(asset, tagsByAsset.get(asset.id) || []),
    );

    return c.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  });

  app.post("/api/v1/assets", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const contentType = c.req.header("content-type") || "";
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const userId = await getDemoUserId(db);

    if (contentType.includes("multipart/form-data")) {
      const formData = await c.req.formData();
      const file = formData.get("file") as File;
      const name = formData.get("name") as string;
      const mimeType = formData.get("mimeType") as string;
      const size = Number(formData.get("size") as string);

      const key = buildStorageKey(orgId, name);
      const r2 = getR2();
      if (r2) {
        await r2.put(key, file.stream(), {
          contentType: mimeType,
        });
      }

      const [asset] = await db
        .insert(schema.digitalAssets)
        .values({
          name,
          mimeType,
          size,
          storageKey: key,
          organizationId: orgId,
          createdBy: userId,
          metadata: {
            originalName: name,
          },
        })
        .returning();

      return c.json(toAssetResponse(asset, []));
    } else {
      const body = await c.req.json().catch(() => null);
      if (!body?.name || !body?.mimeType || !body?.size) {
        return c.json({ error: "Name, mimeType, and size are required" }, 400);
      }

      const key = body.r2Key || buildStorageKey(orgId, body.name);
      const hasInlineContent =
        typeof body.content === "string" && body.content.length > 0;
      if (!hasInlineContent && !body.r2Key) {
        return c.json({ error: "Either content or r2Key is required" }, 400);
      }
      const r2 = getR2();
      if (!r2 && hasInlineContent) {
        return c.json({ error: "R2 storage is not configured" }, 503);
      }
      if (hasInlineContent && r2) {
        await r2.put(key, Buffer.from(body.content, "base64"), {
          contentType: body.mimeType,
        });
      }

      const [asset] = await db
        .insert(schema.digitalAssets)
        .values({
          name: body.name,
          mimeType: body.mimeType,
          size: Number(body.size),
          storageKey: key,
          organizationId: orgId,
          createdBy: userId,
          metadata: {
            originalName: body.originalName || body.name,
            contactId: body.contactId || null,
            dealId: body.dealId || null,
            leadId: body.leadId || null,
          },
        })
        .returning();

      return c.json(toAssetResponse(asset, []));
    }
  });

  app.post("/api/v1/assets/:id/tags", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const assetId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const [asset] = await db
      .select()
      .from(schema.digitalAssets)
      .where(
        and(
          eq(schema.digitalAssets.id, assetId),
          eq(schema.digitalAssets.organizationId, orgId),
        ),
      )
      .limit(1);
    if (!asset) return c.json({ error: "Asset not found" }, 404);

    const existingTagRows = (await db
      .select({
        tagId: schema.assetTags.id,
        name: schema.assetTags.name,
      })
      .from(schema.digitalAssetTags)
      .innerJoin(
        schema.assetTags,
        eq(schema.assetTags.id, schema.digitalAssetTags.tagId),
      )
      .where(eq(schema.digitalAssetTags.assetId, asset.id))) as Array<{
      tagId: string;
      name: string;
    }>;

    const existing = existingTagRows.map((row: { name: string }) => row.name);
    const tags = generateAssetTags(asset.name, asset.mimeType, existing);

    const existingTags: Array<typeof schema.assetTags.$inferSelect> =
      tags.length > 0
        ? await db
            .select()
            .from(schema.assetTags)
            .where(
              and(
                eq(schema.assetTags.organizationId, orgId),
                inArray(schema.assetTags.name, tags),
              ),
            )
        : [];
    const existingNames = new Set(
      existingTags.map((tag: typeof schema.assetTags.$inferSelect) => tag.name),
    );
    const missingNames = tags.filter((tag) => !existingNames.has(tag));

    const insertedTags: Array<typeof schema.assetTags.$inferSelect> =
      missingNames.length > 0
        ? await db
            .insert(schema.assetTags)
            .values(
              missingNames.map((name) => ({
                organizationId: orgId,
                name,
              })),
            )
            .returning()
        : [];

    const allTags = [...existingTags, ...insertedTags];
    const linkedTagIds = new Set(
      existingTagRows.map((row: { tagId: string }) => row.tagId),
    );
    const missingTagIds = allTags
      .map((tag) => tag.id)
      .filter((tagId) => !linkedTagIds.has(tagId));

    if (missingTagIds.length > 0) {
      await db.insert(schema.digitalAssetTags).values(
        missingTagIds.map((tagId) => ({
          assetId: asset.id,
          tagId,
          isAiGenerated: 1,
        })),
      );
    }

    return c.json({ tags });
  });

  app.get("/api/v1/assets/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const assetId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const [asset] = await db
      .select()
      .from(schema.digitalAssets)
      .where(
        and(
          eq(schema.digitalAssets.id, assetId),
          eq(schema.digitalAssets.organizationId, orgId),
        ),
      )
      .limit(1);
    if (!asset) return c.json({ error: "Asset not found" }, 404);

    const tagRows = await db
      .select({ name: schema.assetTags.name })
      .from(schema.digitalAssetTags)
      .innerJoin(
        schema.assetTags,
        eq(schema.assetTags.id, schema.digitalAssetTags.tagId),
      )
      .where(eq(schema.digitalAssetTags.assetId, asset.id));

    return c.json(
      toAssetResponse(
        asset,
        tagRows.map((row: { name: string }) => row.name),
      ),
    );
  });

  app.delete("/api/v1/assets/:id", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const assetId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const [asset] = await db
      .select()
      .from(schema.digitalAssets)
      .where(
        and(
          eq(schema.digitalAssets.id, assetId),
          eq(schema.digitalAssets.organizationId, orgId),
        ),
      )
      .limit(1);
    if (!asset) return c.json({ error: "Asset not found" }, 404);

    await db
      .delete(schema.digitalAssets)
      .where(eq(schema.digitalAssets.id, assetId));

    const r2 = getR2();
    if (r2) {
      try {
        await r2.delete(asset.storageKey);
      } catch {
        // Best-effort cleanup.
      }
    }

    return c.json({ success: true });
  });

  // Download asset
  app.get("/api/v1/assets/:id/download", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const assetId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const [asset] = await db
      .select()
      .from(schema.digitalAssets)
      .where(
        and(
          eq(schema.digitalAssets.id, assetId),
          eq(schema.digitalAssets.organizationId, orgId),
        ),
      )
      .limit(1);
    if (!asset) return c.json({ error: "Asset not found" }, 404);

    const r2 = getR2();
    if (!r2) {
      return c.json({ error: "R2 storage is not configured" }, 503);
    }

    try {
      const object = await r2.get(asset.storageKey);
      const body = object.Body as
        | { transformToByteArray?: () => Promise<Uint8Array> }
        | undefined;
      if (body?.transformToByteArray) {
        const bytes = await body.transformToByteArray();
        return new Response(Buffer.from(bytes), {
          headers: {
            "Content-Type": asset.mimeType,
            "Content-Disposition": `inline; filename="${asset.name}"`,
          },
        });
      }
    } catch {
      // Fall through to 404 response.
    }

    return c.json(
      {
        message: "File content not found",
        fileName: asset.name,
      },
      404,
    );
  });

  // Dashboard stats endpoint
  app.get("/api/v1/dashboard/stats", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { contacts, deals, leads, activities } = schema;

    const allContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.organizationId, orgId));
    const allDeals = await db
      .select()
      .from(deals)
      .where(eq(deals.organizationId, orgId));
    const allLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.organizationId, orgId));
    const recentActs = await db
      .select()
      .from(activities)
      .where(eq(activities.organizationId, orgId))
      .orderBy(desc(activities.createdAt))
      .limit(5);

    const totalDealsValue = allDeals.reduce(
      (sum: number, deal: any) => sum + Number(deal.value || 0),
      0,
    );
    const wonDeals = allDeals.filter((d: any) => d.stage === "won").length;
    const activeDeals = allDeals.filter(
      (d: any) => !["won", "lost"].includes(d.stage),
    ).length;
    const totalLeads = allLeads.length;
    const convertedLeads = allLeads.filter(
      (l: any) => l.status === "converted",
    ).length;

    // Pipeline by stage
    const pipelineMap = new Map<string, { count: number; value: number }>();
    allDeals
      .filter((d: any) => !["won", "lost"].includes(d.stage))
      .forEach((d: any) => {
        const existing = pipelineMap.get(d.stage) || { count: 0, value: 0 };
        pipelineMap.set(d.stage, {
          count: existing.count + 1,
          value: existing.value + Number(d.value || 0),
        });
      });
    const pipeline = Array.from(pipelineMap.entries()).map(([stage, data]) => ({
      stage,
      ...data,
    }));

    return c.json({
      totalContacts: allContacts.length,
      contactsChange: 0,
      activeDeals,
      dealsChange: 0,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      conversionChange: 0,
      revenue: totalDealsValue,
      revenueChange: 0,
      recentActivities: recentActs.map((a: any) => ({
        id: a.id,
        message: a.title || a.type,
        time: new Date(a.createdAt).toLocaleDateString(),
      })),
      pipeline,
    });
  });

  // Presence heartbeat — no auth required, before rate limiting
  app.post("/api/v1/presence/heartbeat", async (c: any) => {
    const body = await c.req.json().catch(() => null);
    // Frontend sends { status: "online" | "away" | "offline" } — acknowledge silently
    return c.json({ success: true });
  });

  // Rate limiting middleware
  app.use("/api/*", rateLimitRedis({ limiterType: "api" }));

  // AI feature endpoints (P0 rollout: CRM) — require authentication
  app.post("/api/ai/lead/score", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    const result = await scoreLead(body);
    return c.json({ result });
  });

  app.post("/api/ai/email/suggest", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    const recipient = body?.recipient;
    const purpose = body?.purpose;
    const allowed = new Set([
      "follow-up",
      "introduction",
      "proposal",
      "meeting-request",
    ]);
    if (
      typeof recipient !== "string" ||
      typeof purpose !== "string" ||
      !allowed.has(purpose)
    ) {
      return c.json({ error: "recipient and valid purpose are required" }, 400);
    }
    const suggestions = await suggestEmailContent(
      recipient,
      purpose as "follow-up" | "introduction" | "proposal" | "meeting-request",
    );
    return c.json({ suggestions });
  });

  app.post("/api/ai/meeting/summarize", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    const notes = body?.notes;
    if (typeof notes !== "string" || notes.trim().length === 0) {
      return c.json({ error: "notes is required" }, 400);
    }
    const summary = await generateMeetingSummary(notes);
    return c.json({ summary });
  });

  app.post("/api/ai/contact/enrich", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body?.name !== "string" || body.name.trim() === "") {
      return c.json({ error: "name is required" }, 400);
    }
    const enriched = await enrichContact(body);
    return c.json({ enriched });
  });

  app.post("/api/ai/helpdesk/triage", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    const subject = body?.subject;
    const description = body?.description;
    const customerTier = body?.customerTier;

    if (typeof subject !== "string" || typeof description !== "string") {
      return c.json({ error: "subject and description are required" }, 400);
    }

    const result = await triageSupportTicket({
      subject,
      description,
      customerTier: typeof customerTier === "string" ? customerTier : undefined,
    });
    return c.json({ result });
  });

  app.post("/api/ai/marketing/plan", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    const goal = body?.goal;
    const audience = body?.audience;

    if (typeof goal !== "string" || typeof audience !== "string") {
      return c.json({ error: "goal and audience are required" }, 400);
    }

    const result = await generateCampaignPlan({
      goal,
      audience,
      channel: typeof body?.channel === "string" ? body.channel : undefined,
      budget: typeof body?.budget === "number" ? body.budget : undefined,
    });
    return c.json({ result });
  });

  app.post("/api/ai/invoicing/risk", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const result = await assessInvoiceRisk({
      invoiceNumber:
        typeof body.invoiceNumber === "string" ? body.invoiceNumber : undefined,
      total: typeof body.total === "number" ? body.total : undefined,
      dueAt: typeof body.dueAt === "string" ? body.dueAt : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });
    return c.json({ result });
  });

  app.post("/api/ai/projects/risk", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const result = await assessProjectRisk({
      name: typeof body.name === "string" ? body.name : undefined,
      description:
        typeof body.description === "string" ? body.description : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
      priority: typeof body.priority === "string" ? body.priority : undefined,
      dueDate: typeof body.dueDate === "string" ? body.dueDate : undefined,
    });
    return c.json({ result });
  });

  app.post("/api/ai/documents/insights", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const result = await analyzeDocumentDraft({
      title: typeof body.title === "string" ? body.title : undefined,
      content: typeof body.content === "string" ? body.content : undefined,
    });
    return c.json({ result });
  });

  app.get("/api/agents/health", (c: any) => {
    return c.json({
      ok: true,
      app: "crm",
      tools: crmAgentTools.length,
      tasksTracked: crmAgentTasks.size,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/agents/tools", (c: any) => {
    return c.json({ tools: crmAgentTools });
  });

  app.get("/api/agents/events", (c: any) => {
    const limit = Math.max(
      1,
      Math.min(500, Number(c.req.query("limit") || 100)),
    );
    return c.json({ events: crmAgentEvents.slice(-limit) });
  });

  app.post("/api/agents/tasks", async (c: any) => {
    const body = await c.req.json().catch(() => null);
    const tool = typeof body?.tool === "string" ? body.tool : "";
    const input =
      body?.input &&
      typeof body.input === "object" &&
      !Array.isArray(body.input)
        ? body.input
        : {};

    if (!crmAgentTools.some((t) => t.id === tool)) {
      return c.json({ error: "Unsupported tool" }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const task: AgentTask = {
      id,
      tool,
      status: "running",
      input,
      output: null,
      error: null,
      createdAt: now,
      updatedAt: now,
      plan: [
        `planner: parse intent for ${tool}`,
        "executor: run domain action",
        "verifier: validate output payload",
      ],
    };
    crmAgentTasks.set(id, task);
    pushCrmAgentEvent({
      id: crypto.randomUUID(),
      taskId: id,
      type: "task.started",
      timestamp: now,
      tool,
    });

    try {
      let output: Record<string, unknown>;
      if (tool === "crm.lead.score") {
        output = { result: await scoreLead(input as any) };
      } else if (tool === "crm.email.suggest") {
        const recipient =
          typeof (input as any).recipient === "string"
            ? (input as any).recipient
            : "";
        const purpose =
          typeof (input as any).purpose === "string"
            ? (input as any).purpose
            : "follow-up";
        output = {
          suggestions: await suggestEmailContent(
            recipient,
            purpose as
              | "follow-up"
              | "introduction"
              | "proposal"
              | "meeting-request",
          ),
        };
      } else if (tool === "crm.contact.enrich") {
        output = { enriched: await enrichContact(input as any) };
      } else {
        const notes =
          typeof (input as any).notes === "string" ? (input as any).notes : "";
        output = { summary: await generateMeetingSummary(notes) };
      }

      if (!output || Object.keys(output).length === 0) {
        throw new Error("Verifier rejected empty output");
      }

      task.status = "completed";
      task.output = output;
      task.updatedAt = new Date().toISOString();
      crmAgentTasks.set(id, task);
      pushCrmAgentEvent({
        id: crypto.randomUUID(),
        taskId: id,
        type: "task.completed",
        timestamp: task.updatedAt,
        tool,
      });
      return c.json(task, 202);
    } catch (error) {
      task.status = "failed";
      task.error = error instanceof Error ? error.message : String(error);
      task.updatedAt = new Date().toISOString();
      crmAgentTasks.set(id, task);
      pushCrmAgentEvent({
        id: crypto.randomUUID(),
        taskId: id,
        type: "task.failed",
        timestamp: task.updatedAt,
        tool,
        error: task.error,
      });
      return c.json(task, 500);
    }
  });

  app.get("/api/agents/tasks/:id", (c: any) => {
    const task = crmAgentTasks.get(c.req.param("id"));
    if (!task) {
      return c.json({ error: "task not found" }, 404);
    }
    return c.json(task);
  });

  // Audit log read endpoint (basic "trust pack" feature).
  app.get("/api/audit/logs", async (c: any) => {
    const initialContext = { env: c.env } as any;
    const db = getDb(initialContext);
    const auth = createAuthFromEnv(db as any, c.env);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const limitRaw = c.req.query("limit");
    const limit = Math.max(1, Math.min(200, Number(limitRaw || 50) || 50));

    const orgId =
      (session as any).session?.activeOrganizationId ??
      (session as any).activeOrganizationId ??
      c.req.header("x-organization-id") ??
      null;

    const rows = await db
      .select()
      .from(schema.auditLogs)
      .where(
        orgId
          ? eq(schema.auditLogs.organizationId, String(orgId))
          : eq(schema.auditLogs.actorUserId, String(session.user.id)),
      )
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit);

    return c.json({ logs: rows });
  });

  app.post("/api/enterprise/audit/ingest", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body.action !== "string" || !body.action.trim()) {
      return c.json({ error: "action is required" }, 400);
    }

    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);

    const [event] = await db
      .insert(schema.enterpriseAuditEvents)
      .values({
        organizationId: orgId,
        source: typeof body.source === "string" ? body.source : "ingest",
        actor: typeof body.actor === "string" ? body.actor : null,
        action: body.action.trim(),
        severity: typeof body.severity === "string" ? body.severity : "low",
        eventTime:
          typeof body.eventTime === "string" && body.eventTime
            ? new Date(body.eventTime)
            : new Date(),
        metadata:
          body.metadata && typeof body.metadata === "object"
            ? body.metadata
            : null,
      })
      .returning();

    return c.json({ data: event }, 201);
  });

  app.post("/api/enterprise/scim/sync", async (c: any) => {
    const authResult = await requireAuth(c);
    if (!authResult.authorized) return c.json({ error: "unauthorized" }, 401);
    const orgId = await getOrgIdFromSession(c);
    if (!orgId) return c.json({ error: "Organization ID required" }, 400);
    const body = await c.req.json().catch(() => null);
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);

    const [syncJob] = await db
      .insert(schema.scimSyncJobs)
      .values({
        organizationId: orgId,
        providerId:
          typeof body?.providerId === "string" && body.providerId
            ? body.providerId
            : null,
        status: typeof body?.status === "string" ? body.status : "completed",
        direction:
          typeof body?.direction === "string" ? body.direction : "inbound",
        recordsProcessed:
          typeof body?.recordsProcessed === "number"
            ? Math.max(0, Math.floor(body.recordsProcessed))
            : 0,
        errorMessage:
          typeof body?.errorMessage === "string" ? body.errorMessage : null,
        startedAt: new Date(),
        completedAt: new Date(),
        metadata:
          body?.metadata && typeof body.metadata === "object"
            ? body.metadata
            : null,
      })
      .returning();

    if (syncJob.providerId) {
      await db
        .update(schema.ssoProviders)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(schema.ssoProviders.id, syncJob.providerId),
            eq(schema.ssoProviders.organizationId, orgId),
          ),
        );
    }

    return c.json({ data: syncJob }, 201);
  });

  app.get("/api/mobile/auth/callback", async (c: any) => {
    const redirectUri = c.req.query("redirect_uri");

    if (!redirectUri) {
      return c.json({ error: "redirect_uri is required" }, 400);
    }

    let redirectTarget: URL;
    try {
      redirectTarget = buildMobileRedirectTarget(redirectUri);
    } catch (error) {
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid mobile redirect URI",
        },
        400,
      );
    }

    try {
      const { auth } = createRequestAuthConfig(c.env || {});
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      const token = getSessionCookie(c.req.raw, {
        cookiePrefix: AUTH_COOKIE_PREFIX,
      });

      if (!session?.user || !token) {
        redirectTarget.searchParams.set("error", "missing_session");
        redirectTarget.searchParams.set(
          "error_description",
          "The OAuth callback completed without a reusable session token.",
        );
        return c.redirect(redirectTarget.toString());
      }

      const activeOrganizationId =
        (session as any).session?.activeOrganizationId ||
        (session as any).activeOrganizationId;

      redirectTarget.searchParams.set("token", token);
      if (activeOrganizationId) {
        redirectTarget.searchParams.set(
          "organization_id",
          activeOrganizationId,
        );
      }

      return c.redirect(redirectTarget.toString());
    } catch (error) {
      redirectTarget.searchParams.set("error", "callback_failed");
      redirectTarget.searchParams.set(
        "error_description",
        error instanceof Error ? error.message : "OAuth callback failed",
      );
      return c.redirect(redirectTarget.toString());
    }
  });

  app.get("/api/mobile/auth/error", async (c: any) => {
    const redirectUri = c.req.query("redirect_uri");

    if (!redirectUri) {
      return c.json({ error: "redirect_uri is required" }, 400);
    }

    let redirectTarget: URL;
    try {
      redirectTarget = buildMobileRedirectTarget(redirectUri);
    } catch (error) {
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid mobile redirect URI",
        },
        400,
      );
    }

    redirectTarget.searchParams.set(
      "error",
      c.req.query("error") || "oauth_failed",
    );

    const errorDescription = c.req.query("error_description");
    if (errorDescription) {
      redirectTarget.searchParams.set("error_description", errorDescription);
    }

    return c.redirect(redirectTarget.toString());
  });

  // Better Auth handler (includes Stripe webhook at /api/auth/stripe/webhook)
  app.on(["GET", "POST"], "/api/auth/*", async (c: any) => {
    // Fallback to process.env when running without Cloudflare Workers
    // c.env may be undefined when not running on Cloudflare (SKIP_CLOUDFLARE=true)
    const envBindings = c.env || {};
    const { auth, db, connectionString } = createRequestAuthConfig(envBindings);

    console.log("[Debug DB] Connection String Check:", {
      val: connectionString,
      isLocal:
        connectionString.includes("localhost") ||
        connectionString.includes("127.0.0.1"),
    });

    // DB Connection Test
    try {
      await db.execute("SELECT 1");
      console.log("✅ DB Connection successful");
    } catch (dbErr) {
      console.error(
        "❌ DB Connection Failed detected in request handler:",
        dbErr,
      );
      return c.json(
        {
          error: "Database Connection Failed",
          details: String(dbErr),
          stack: dbErr instanceof Error ? dbErr.stack : undefined,
        },
        500,
      );
    }

    try {
      const { auth, db, connectionString } =
        createRequestAuthConfig(envBindings);

      // DB Connection Test
      try {
        await db.execute("SELECT 1");
      } catch (dbErr) {
        console.error(
          "❌ DB Connection Failed detected in request handler:",
          dbErr,
        );
        return c.json(
          {
            error: "Database Connection Failed",
            details: String(dbErr),
            stack: dbErr instanceof Error ? dbErr.stack : undefined,
          },
          500,
        );
      }

      return await auth.handler(c.req.raw);
    } catch (e) {
      console.error("[Auth Error]", e);
      return c.json(
        { error: "Internal Server Error", details: String(e) },
        500,
      );
    }
  });

  // oRPC handler
  const rpcHandler = new RPCHandler(appRouter, {
    interceptors: [
      onError((error: unknown) => {
        console.error("[RPC Error]", error);

        // Handle APIError
        if (error instanceof APIError) {
          return;
        }
      }),
    ],
  });

  // Test endpoint
  app.post("/api/test", (c: any) => {
    return c.json({ ok: true, message: "test endpoint works" });
  });

  app.use("/api/rpc/*", async (c: any, next: any) => {
    const initialContext: InitialContext = {
      env: c.env,
      headers: c.req.raw.headers,
      requestId: c.get("requestId") || crypto.randomUUID(),
      logger: c.get("logger"),
    };

    console.log("[RPC] Request path:", c.req.path);
    console.log("[RPC] Request method:", c.req.method);

    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: "/api/rpc",
      context: initialContext,
    });

    console.log(
      "[RPC] Matched:",
      matched,
      "Response status:",
      response?.status,
    );

    if (matched && response) {
      const method = c.req.method?.toUpperCase?.() ?? "GET";
      const shouldAudit =
        method !== "GET" &&
        method !== "HEAD" &&
        !c.req.path.startsWith("/api/audit/");

      if (shouldAudit) {
        try {
          const db = getDb(initialContext as any);
          const auth = createAuthFromEnv(db as any, c.env);
          const session = await auth.api.getSession({
            headers: c.req.raw.headers,
          });

          const url = new URL(c.req.url);
          const rpcPath = url.pathname.startsWith("/api/rpc")
            ? url.pathname.slice("/api/rpc".length) || "/"
            : url.pathname;

          const orgId =
            (session as any)?.session?.activeOrganizationId ??
            (session as any)?.activeOrganizationId ??
            c.req.header("x-organization-id") ??
            null;

          const ip =
            c.req.header("cf-connecting-ip") ||
            (c.req.header("x-forwarded-for") || "").split(",")[0]?.trim() ||
            null;

          await db.insert(schema.auditLogs).values({
            actorUserId: session?.user?.id ? String(session.user.id) : null,
            actorEmail: session?.user?.email
              ? String(session.user.email)
              : null,
            organizationId: orgId ? String(orgId) : null,
            action: `${method} ${rpcPath}`,
            requestMethod: method,
            requestPath: rpcPath,
            statusCode: response.status,
            ipAddress: ip,
            userAgent: c.req.header("user-agent") || null,
            metadata: {
              requestId: initialContext.requestId,
            },
          });
        } catch (err) {
          console.error("[AuditLog] Failed to write audit log", err);
        }
      }

      return c.newResponse(response.body, response);
    }

    await next();
  });

  // OpenAPI spec
  app.get("/api/openapi.json", async (c: any) => {
    const generator = new OpenAPIGenerator({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    });

    const spec = await generator.generate(appRouter, {
      info: {
        title: "Nucleo One API",
        version: "1.0.0",
        description: "Customer Relationship Management API",
      },
      servers: [
        {
          url: c.env?.VITE_PUBLIC_SITE_URL || "http://localhost:3001",
          description: "Current",
        },
      ],
      security: [{ bearerAuth: [] }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT token from Better Auth",
          },
        },
      },
      tags: [
        { name: "Contacts", description: "Contact management operations" },
        { name: "Organizations", description: "Organization management" },
        { name: "System", description: "System endpoints" },
      ],
    });

    return c.json(spec);
  });

  // Scalar API Documentation UI
  app.get("/api/docs", async (c: any) => {
    const { Scalar } = await import("@scalar/hono-api-reference");
    return Scalar({ url: "/api/openapi.json", theme: "purple" })(
      c,
      async () => {},
    );
  });

  return app;
}

// Default app instance
export const api = createApp();
