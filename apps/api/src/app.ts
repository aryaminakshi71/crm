/**
 * API Application
 *
 * Hono app with oRPC integration for Cloudflare Workers.
 */

import { createDb } from "@crm/storage";
import { OpenAPIGenerator } from "@orpc/openapi";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
// import { captureException as sentryCaptureException } from "./lib/sentry";
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import type { AppEnv, InitialContext } from "./context";
import { createAuthFromEnv } from "./lib/create-auth-from-env";
import { getDb, schema } from "./lib/db";
import { APIError } from "./lib/errors";
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
import { loggerMiddleware } from "./middleware/logger";
// Monitoring imports disabled for Cloudflare Workers compatibility
// import { initSentry } from "./lib/sentry";
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
const fileContentStore = new Map<string, { content: string; mimeType: string }>();

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

  // Global middleware
  app.use(
    "*",
    cors({ origin: (origin: string | null) => origin, credentials: true }),
  );
  app.use("*", requestId());
  app.use("*", loggerMiddleware);

  // Populate env from process.env when running outside Workers.
  app.use("*", async (c, next) => {
    (c as any).env = {
      ...((c as any).env || {}),
      ...process.env,
    };
    await next();
  });

  // Health check (non-RPC) - must be before rate limiting
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
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const { search, stage, sortBy, sortOrder, page, limit } = c.req.query();
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
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
    const countResult = await db.select({ count: sql`count(*)` }).from(deals).where(eq(deals.organizationId, orgId));
    const total = Number(countResult[0]?.count || 0);
    
    // Sort
    const sortColumn = sortBy === "value" ? deals.value : 
                       sortBy === "createdAt" ? deals.createdAt : 
                       deals.createdAt;
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
      totalPages: Math.ceil(total / limitNum)
    });
  });

  app.post("/api/v1/deals", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const body = await c.req.json().catch(() => null);
    if (!body?.name || !body?.value) {
      return c.json({ error: "Name and value are required" }, 400);
    }
    try {
      const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
      const { deals } = schema;
      const userId = await getDemoUserId(db);
      
      const [deal] = await db.insert(deals).values({
        name: body.name,
        value: String(body.value),
        stage: body.stage || "lead",
        notes: body.notes || null,
        organizationId: orgId,
        createdBy: userId,
      }).returning();
      return c.json(deal);
    } catch (err) {
      console.error("Error creating deal:", err);
      return c.json({ error: String(err) }, 500);
    }
  });

  // Get deal by ID
  app.get("/api/v1/deals/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const dealId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { deals } = schema;
    const [deal] = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
    if (!deal || deal.organizationId !== orgId) {
      return c.json({ error: "Deal not found" }, 404);
    }
    return c.json(deal);
  });

  // Update deal
  app.patch("/api/v1/deals/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const dealId = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { deals } = schema;
    
    const [existing] = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Deal not found" }, 404);
    }
    
    const [deal] = await db.update(deals).set({
      ...(body.name && { name: body.name }),
      ...(body.value !== undefined && { value: String(body.value) }),
      ...(body.stage && { stage: body.stage }),
      ...(body.notes !== undefined && { notes: body.notes }),
      updatedAt: new Date(),
    }).where(eq(deals.id, dealId)).returning();
    
    return c.json(deal);
  });

  // Delete deal
  app.delete("/api/v1/deals/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const dealId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { deals } = schema;
    
    const [existing] = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Deal not found" }, 404);
    }
    
    await db.delete(deals).where(eq(deals.id, dealId));
    return c.json({ success: true });
  });

  // Contacts endpoints
  app.get("/api/v1/contacts", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const { search, sortBy, sortOrder, page, limit } = c.req.query();
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;
    
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { contacts } = schema;
    
    let query = db.select().from(contacts).where(eq(contacts.organizationId, orgId));
    
    // Search by name or email
    if (search) {
      query = query.where(
        sql`(${contacts.firstName} ILIKE ${`%${search}%`}) OR (${contacts.lastName} ILIKE ${`%${search}%`}) OR (${contacts.email} ILIKE ${`%${search}%`})`
      );
    }
    
    // Get total count
    const countResult = await db.select({ count: sql`count(*)` }).from(contacts).where(eq(contacts.organizationId, orgId));
    const total = Number(countResult[0]?.count || 0);
    
    // Sort
    const sortColumn = sortBy === "firstName" ? contacts.firstName : 
                       sortBy === "lastName" ? contacts.lastName : 
                       sortBy === "email" ? contacts.email :
                       contacts.createdAt;
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
      totalPages: Math.ceil(total / limitNum)
    });
  });

  app.post("/api/v1/contacts", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const body = await c.req.json().catch(() => null);
    if (!body?.firstName || !body?.lastName) {
      return c.json({ error: "First and last name are required" }, 400);
    }
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { contacts } = schema;
    const userId = await getDemoUserId(db);
    const [contact] = await db.insert(contacts).values({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email?.toLowerCase() || null,
      phone: body.phone || null,
      companyName: body.companyName || null,
      organizationId: orgId,
      createdBy: userId,
    }).returning();
    return c.json(contact);
  });

  // Get contact by ID
  app.get("/api/v1/contacts/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const contactId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { contacts } = schema;
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
    if (!contact || contact.organizationId !== orgId) {
      return c.json({ error: "Contact not found" }, 404);
    }
    return c.json(contact);
  });

  // Update contact
  app.patch("/api/v1/contacts/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const contactId = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { contacts } = schema;
    
    const [existing] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Contact not found" }, 404);
    }
    
    const [contact] = await db.update(contacts).set({
      ...(body.firstName && { firstName: body.firstName }),
      ...(body.lastName && { lastName: body.lastName }),
      ...(body.email !== undefined && { email: body.email?.toLowerCase() || null }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.companyName !== undefined && { companyName: body.companyName }),
      updatedAt: new Date(),
    }).where(eq(contacts.id, contactId)).returning();
    
    return c.json(contact);
  });

  // Delete contact
  app.delete("/api/v1/contacts/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const contactId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { contacts } = schema;
    
    const [existing] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Contact not found" }, 404);
    }
    
    await db.delete(contacts).where(eq(contacts.id, contactId));
    return c.json({ success: true });
  });

  // Leads endpoints
  app.get("/api/v1/leads", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const { search, status, source, sortBy, sortOrder, page, limit } = c.req.query();
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
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
        sql`(${leads.firstName} ILIKE ${`%${search}%`}) OR (${leads.lastName} ILIKE ${`%${search}%`}) OR (${leads.email} ILIKE ${`%${search}%`})`
      );
    }
    
    // Get total count
    const countResult = await db.select({ count: sql`count(*)` }).from(leads).where(eq(leads.organizationId, orgId));
    const total = Number(countResult[0]?.count || 0);
    
    // Sort
    const sortColumn = sortBy === "firstName" ? leads.firstName : 
                       sortBy === "email" ? leads.email :
                       leads.createdAt;
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
      totalPages: Math.ceil(total / limitNum)
    });
  });

  app.post("/api/v1/leads", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const body = await c.req.json().catch(() => null);
    if (!body?.email) {
      return c.json({ error: "Email is required" }, 400);
    }
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { leads } = schema;
    const userId = await getDemoUserId(db);
    const [lead] = await db.insert(leads).values({
      firstName: body.firstName || "",
      lastName: body.lastName || "",
      email: body.email.toLowerCase(),
      phone: body.phone || null,
      companyName: body.companyName || null,
      source: body.source || "website",
      status: body.status || "new",
      organizationId: orgId,
      createdBy: userId,
    }).returning();
    return c.json(lead);
  });

  // Convert lead to contact
  app.post("/api/v1/leads/:id/convert", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const leadId = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { leads, contacts } = schema;
    const userId = await getDemoUserId(db);
    
    // Get the lead
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }
    
    // Create contact from lead
    const [contact] = await db.insert(contacts).values({
      firstName: body?.firstName || lead.firstName || "",
      lastName: body?.lastName || lead.lastName || "",
      email: lead.email,
      phone: lead.phone,
      companyName: body?.companyName || lead.companyName,
      organizationId: orgId,
      createdBy: userId,
    }).returning();
    
    // Update lead status
    await db.update(leads).set({ status: "converted" }).where(eq(leads.id, leadId));
    
    return c.json(contact);
  });

  // Get lead by ID
  app.get("/api/v1/leads/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const leadId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { leads } = schema;
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead || lead.organizationId !== orgId) {
      return c.json({ error: "Lead not found" }, 404);
    }
    return c.json(lead);
  });

  // Update lead
  app.patch("/api/v1/leads/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const leadId = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { leads } = schema;
    
    const [existing] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Lead not found" }, 404);
    }
    
    const [lead] = await db.update(leads).set({
      ...(body.firstName !== undefined && { firstName: body.firstName }),
      ...(body.lastName !== undefined && { lastName: body.lastName }),
      ...(body.email !== undefined && { email: body.email.toLowerCase() }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.companyName !== undefined && { companyName: body.companyName }),
      ...(body.source && { source: body.source }),
      ...(body.status && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
      updatedAt: new Date(),
    }).where(eq(leads.id, leadId)).returning();
    
    return c.json(lead);
  });

  // Delete lead
  app.delete("/api/v1/leads/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const leadId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { leads } = schema;
    
    const [existing] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Lead not found" }, 404);
    }
    
    await db.delete(leads).where(eq(leads.id, leadId));
    return c.json({ success: true });
  });

  // Activities endpoints
  app.get("/api/v1/activities", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const { type, contactId, dealId, page, limit } = c.req.query();
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;
    
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { activities } = schema;
    
    let query = db.select().from(activities).where(eq(activities.organizationId, orgId));
    
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
    const countResult = await db.select({ count: sql`count(*)` }).from(activities).where(eq(activities.organizationId, orgId));
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
      totalPages: Math.ceil(total / limitNum)
    });
  });

  app.post("/api/v1/activities", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const body = await c.req.json().catch(() => null);
    if (!body?.type) {
      return c.json({ error: "Activity type is required" }, 400);
    }
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { activities } = schema;
    const userId = await getDemoUserId(db);
    const [activity] = await db.insert(activities).values({
      type: body.type,
      title: body.title || "",
      description: body.description || null,
      contactId: body.contactId || null,
      dealId: body.dealId || null,
      organizationId: orgId,
      createdBy: userId,
    }).returning();
    return c.json(activity);
  });

  // Get activity by ID
  app.get("/api/v1/activities/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const activityId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { activities } = schema;
    const [activity] = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    if (!activity || activity.organizationId !== orgId) {
      return c.json({ error: "Activity not found" }, 404);
    }
    return c.json(activity);
  });

  // Update activity
  app.patch("/api/v1/activities/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const activityId = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { activities } = schema;
    
    const [existing] = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Activity not found" }, 404);
    }
    
    const [activity] = await db.update(activities).set({
      ...(body.type && { type: body.type }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.contactId !== undefined && { contactId: body.contactId }),
      ...(body.dealId !== undefined && { dealId: body.dealId }),
      updatedAt: new Date(),
    }).where(eq(activities.id, activityId)).returning();
    
    return c.json(activity);
  });

  // Delete activity
  app.delete("/api/v1/activities/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const activityId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { activities } = schema;
    
    const [existing] = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "Activity not found" }, 404);
    }
    
    await db.delete(activities).where(eq(activities.id, activityId));
    return c.json({ success: true });
  });

  // Assets/Files endpoints
  app.get("/api/v1/assets", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const { search, contactId, dealId, page, limit } = c.req.query();
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;
    
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { files } = schema;
    
    let query = db.select().from(files).where(eq(files.organizationId, orgId));
    
    // Filter by contact
    if (contactId) {
      query = query.where(eq(files.contactId, contactId));
    }
    
    // Filter by deal
    if (dealId) {
      query = query.where(eq(files.dealId, dealId));
    }
    
    // Search by name
    if (search) {
      query = query.where(ilike(files.name, `%${search}%`));
    }
    
    // Get total count
    const countResult = await db.select({ count: sql`count(*)` }).from(files).where(eq(files.organizationId, orgId));
    const total = Number(countResult[0]?.count || 0);
    
    const allFiles = await query
      .orderBy(desc(files.createdAt))
      .limit(limitNum)
      .offset(offset);
    
    const data = allFiles.map((f: any) => {
      const stored = fileContentStore.get(f.id);
      const url = f.mimeType.startsWith("image/") && stored
        ? `data:${f.mimeType};base64,${stored.content}`
        : null;
      return {
        ...f,
        type: f.mimeType,
        url,
        tags: [],
      };
    });
    
    return c.json({ 
      data, 
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  });

  app.post("/api/v1/assets", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const body = await c.req.json().catch(() => null);
    if (!body?.name || !body?.mimeType || !body?.size) {
      return c.json({ error: "Name, mimeType, and size are required" }, 400);
    }
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { files } = schema;
    const userId = await getDemoUserId(db);
    const [file] = await db.insert(files).values({
      name: body.name,
      originalName: body.originalName || body.name,
      mimeType: body.mimeType,
      size: String(body.size),
      r2Key: body.r2Key || `uploads/${Date.now()}-${body.name}`,
      contactId: body.contactId || null,
      dealId: body.dealId || null,
      leadId: body.leadId || null,
      organizationId: orgId,
      uploadedById: userId,
    }).returning();
    
    // Store file content if provided
    if (body.content) {
      fileContentStore.set(file.id, {
        content: body.content,
        mimeType: body.mimeType,
      });
    }
    
    // Return data URL for images
    const url = body.mimeType.startsWith("image/") && body.content
      ? `data:${body.mimeType};base64,${body.content}`
      : null;
    
    return c.json({
      ...file,
      type: file.mimeType,
      url,
      tags: [],
    });
  });

  app.get("/api/v1/assets/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const fileId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { files } = schema;
    const [file] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
    if (!file || file.organizationId !== orgId) {
      return c.json({ error: "File not found" }, 404);
    }
    return c.json({
      ...file,
      type: file.mimeType,
      url: file.r2Key ? `/api/v1/assets/${file.id}/download` : null,
      tags: [],
    });
  });

  app.delete("/api/v1/assets/:id", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const fileId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { files } = schema;
    
    const [existing] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
    if (!existing || existing.organizationId !== orgId) {
      return c.json({ error: "File not found" }, 404);
    }
    
    await db.delete(files).where(eq(files.id, fileId));
    return c.json({ success: true });
  });

  // Download asset
  app.get("/api/v1/assets/:id/download", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const fileId = c.req.param("id");
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { files } = schema;
    
    const [file] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
    if (!file || file.organizationId !== orgId) {
      return c.json({ error: "File not found" }, 404);
    }
    
    // Check if we have stored content
    const stored = fileContentStore.get(fileId);
    if (stored) {
      return new Response(Buffer.from(stored.content, "base64"), {
        headers: {
          "Content-Type": stored.mimeType,
          "Content-Disposition": `inline; filename="${file.name}"`,
        },
      });
    }
    
    return c.json({ 
      message: "File content not found",
      fileName: file.name,
    }, 404);
  });

  // Dashboard stats endpoint
  app.get("/api/v1/dashboard/stats", async (c: any) => {
    const orgId = c.req.header("x-organization-id") || "demo-org";
    const db = getDb({ env: c.env, headers: c.req.raw.headers } as any);
    const { contacts, deals, leads, activities } = schema;
    
    const allContacts = await db.select().from(contacts).where(eq(contacts.organizationId, orgId));
    const allDeals = await db.select().from(deals).where(eq(deals.organizationId, orgId));
    const allLeads = await db.select().from(leads).where(eq(leads.organizationId, orgId));
    const recentActs = await db.select().from(activities).where(eq(activities.organizationId, orgId)).orderBy(desc(activities.createdAt)).limit(5);
    
    const totalDealsValue = allDeals.reduce((sum: number, deal: any) => sum + Number(deal.value || 0), 0);
    const wonDeals = allDeals.filter((d: any) => d.stage === "won").length;
    const activeDeals = allDeals.filter((d: any) => !["won", "lost"].includes(d.stage)).length;
    const totalLeads = allLeads.length;
    const convertedLeads = allLeads.filter((l: any) => l.status === "converted").length;
    
    // Pipeline by stage
    const pipelineMap = new Map<string, { count: number; value: number }>();
    allDeals.filter((d: any) => !["won", "lost"].includes(d.stage)).forEach((d: any) => {
      const existing = pipelineMap.get(d.stage) || { count: 0, value: 0 };
      pipelineMap.set(d.stage, { count: existing.count + 1, value: existing.value + Number(d.value || 0) });
    });
    const pipeline = Array.from(pipelineMap.entries()).map(([stage, data]) => ({ stage, ...data }));
    
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

  // Rate limiting middleware
  app.use("/api/*", rateLimitRedis({ limiterType: "api" }));
  app.use("/api/auth/*", rateLimitRedis({ limiterType: "auth" }));

  // AI feature endpoints (P0 rollout: CRM)
  app.post("/api/ai/lead/score", async (c: any) => {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    const result = await scoreLead(body);
    return c.json({ result });
  });

  app.post("/api/ai/email/suggest", async (c: any) => {
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
    const body = await c.req.json().catch(() => null);
    const notes = body?.notes;
    if (typeof notes !== "string" || notes.trim().length === 0) {
      return c.json({ error: "notes is required" }, 400);
    }
    const summary = await generateMeetingSummary(notes);
    return c.json({ summary });
  });

  app.post("/api/ai/contact/enrich", async (c: any) => {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body?.name !== "string" || body.name.trim() === "") {
      return c.json({ error: "name is required" }, 400);
    }
    const enriched = await enrichContact(body);
    return c.json({ enriched });
  });

  app.post("/api/ai/helpdesk/triage", async (c: any) => {
    const body = await c.req.json().catch(() => null);
    const subject = body?.subject;
    const description = body?.description;
    const customerTier = body?.customerTier;

    if (
      typeof subject !== "string" ||
      typeof description !== "string"
    ) {
      return c.json({ error: "subject and description are required" }, 400);
    }

    const result = await triageSupportTicket({
      subject,
      description,
      customerTier:
        typeof customerTier === "string" ? customerTier : undefined,
    });
    return c.json({ result });
  });

  app.post("/api/ai/marketing/plan", async (c: any) => {
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
    const limit = Math.max(1, Math.min(500, Number(c.req.query("limit") || 100)));
    return c.json({ events: crmAgentEvents.slice(-limit) });
  });

  app.post("/api/agents/tasks", async (c: any) => {
    const body = await c.req.json().catch(() => null);
    const tool = typeof body?.tool === "string" ? body.tool : "";
    const input =
      body?.input && typeof body.input === "object" && !Array.isArray(body.input)
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
    pushCrmAgentEvent({ id: crypto.randomUUID(), taskId: id, type: "task.started", timestamp: now, tool });

    try {
      let output: Record<string, unknown>;
      if (tool === "crm.lead.score") {
        output = { result: await scoreLead(input as any) };
      } else if (tool === "crm.email.suggest") {
        const recipient = typeof (input as any).recipient === "string" ? (input as any).recipient : "";
        const purpose = typeof (input as any).purpose === "string" ? (input as any).purpose : "follow-up";
        output = {
          suggestions: await suggestEmailContent(
            recipient,
            purpose as "follow-up" | "introduction" | "proposal" | "meeting-request",
          ),
        };
      } else if (tool === "crm.contact.enrich") {
        output = { enriched: await enrichContact(input as any) };
      } else {
        const notes = typeof (input as any).notes === "string" ? (input as any).notes : "";
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
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body.action !== "string" || !body.action.trim()) {
      return c.json({ error: "action is required" }, 400);
    }

    const orgId = c.req.header("x-organization-id") || "demo-org";
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
          body.metadata && typeof body.metadata === "object" ? body.metadata : null,
      })
      .returning();

    return c.json({ data: event }, 201);
  });

  app.post("/api/enterprise/scim/sync", async (c: any) => {
    const body = await c.req.json().catch(() => null);
    const orgId = c.req.header("x-organization-id") || "demo-org";
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
        direction: typeof body?.direction === "string" ? body.direction : "inbound",
        recordsProcessed:
          typeof body?.recordsProcessed === "number"
            ? Math.max(0, Math.floor(body.recordsProcessed))
            : 0,
        errorMessage: typeof body?.errorMessage === "string" ? body.errorMessage : null,
        startedAt: new Date(),
        completedAt: new Date(),
        metadata:
          body?.metadata && typeof body.metadata === "object" ? body.metadata : null,
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

  // Better Auth handler (includes Stripe webhook at /api/auth/stripe/webhook)
  app.on(["GET", "POST"], "/api/auth/*", async (c: any) => {
    // Fallback to process.env when running without Cloudflare Workers
    // c.env may be undefined when not running on Cloudflare (SKIP_CLOUDFLARE=true)
    const envBindings = c.env || {};
    const connectionString =
      envBindings.DATABASE?.connectionString || process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE connection string not found in environment bindings or process.env.DATABASE_URL",
      );
    }

    console.log("[Debug DB] Connection String Check:", {
      val: connectionString,
      isLocal:
        connectionString.includes("localhost") ||
        connectionString.includes("127.0.0.1"),
    });

    const db = createDb({ connectionString });

    // Create minimal env object with defaults for missing bindings
    const minimalEnv = {
      DATABASE_URL: connectionString,
      NODE_ENV: envBindings.NODE_ENV || process.env.NODE_ENV || "development",
      VITE_PUBLIC_SITE_URL:
        envBindings.VITE_PUBLIC_SITE_URL ||
        process.env.VITE_PUBLIC_SITE_URL ||
"http://localhost:3001",
      BETTER_AUTH_SECRET:
        envBindings.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET,
      CACHE: envBindings.CACHE,
      BUCKET: envBindings.BUCKET,
      ASSETS: envBindings.ASSETS,
      GOOGLE_CLIENT_ID: envBindings.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: envBindings.GOOGLE_CLIENT_SECRET,
      GITHUB_CLIENT_ID: envBindings.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: envBindings.GITHUB_CLIENT_SECRET,
      STRIPE_SECRET_KEY: envBindings.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: envBindings.STRIPE_WEBHOOK_SECRET,
    };

    const auth = createAuthFromEnv(db, minimalEnv as any);

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

    console.log("[RPC] Matched:", matched, "Response status:", response?.status);

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
    return Scalar({ url: "/api/openapi.json", theme: "purple" })(c, async () => {});
  });

  return app;
}

// Default app instance
export const api = createApp();
