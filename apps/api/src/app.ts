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
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import type { AppEnv, InitialContext } from "./context";
import { createAuthFromEnv } from "./lib/create-auth-from-env";
import { getDb, schema } from "./lib/db";
import { APIError } from "./lib/errors";
import {
  enrichContact,
  generateMeetingSummary,
  scoreLead,
  suggestEmailContent,
} from "./lib/ai-features";
import { loggerMiddleware } from "./middleware/logger";
// Monitoring imports disabled for Cloudflare Workers compatibility
// import { initSentry } from "./lib/sentry";
// import { initDatadog } from "./lib/datadog";
import { rateLimitRedis } from "./middleware/rate-limit-redis";
import { appRouter } from "./routers";

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
      ...process.env,
      ...((c as any).env || {}),
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
        "http://localhost:5173",
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
      await db.execute<any>("SELECT 1");
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

        // Capture in Sentry (disabled for Cloudflare Workers compatibility)
        // if (error instanceof Error) {
        //   sentryCaptureException(error);
        // }

        // Handle APIError
        if (error instanceof APIError) {
          // APIError will be handled by oRPC's error handling
          return;
        }
      }),
    ],
  });

  app.use("/api/rpc/*", async (c: any, next: any) => {
    const initialContext: InitialContext = {
      env: c.env,
      headers: c.req.raw.headers,
      requestId: c.get("requestId") || crypto.randomUUID(),
      logger: c.get("logger"),
    };

    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: "/api/rpc",
      context: initialContext,
    });

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
        title: "CRM API",
        version: "1.0.0",
        description: "Customer Relationship Management API",
      },
      servers: [
        {
          url: c.env?.VITE_PUBLIC_SITE_URL || "http://localhost:5173",
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
    return Scalar({
      spec: {
        url: "/api/openapi.json",
      },
      theme: "purple",
    })(c);
  });

  return app;
}

// Default app instance
export const api = createApp();
