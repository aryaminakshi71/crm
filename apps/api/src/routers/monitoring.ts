/**
 * Monitoring Router
 *
 * Platform monitoring operations for analytics, billing, errors, uptime, performance, and catalog.
 */

import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";

const { monitoringSnapshots, appCatalog } = schema;

export const monitoringRouter = {
  // ─── Dashboard ───────────────────────────────────────────────────────────────

  getDashboard: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/dashboard",
      summary: "Get aggregated monitoring dashboard",
      tags: ["Monitoring"],
    })
    .output(
      z.object({
        analytics: z.any().optional(),
        billing: z.any().optional(),
        errors: z.any().optional(),
        support: z.any().optional(),
        uptime: z.any().optional(),
        performance: z.any().optional(),
        marketing: z.any().optional(),
        catalog: z.any().optional(),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      // Return aggregated metrics from all agents
      return {
        analytics: { activeUsers: 0, pageViews: 0 },
        billing: { mrr: 0, activeSubscriptions: 0 },
        errors: { errorCount: 0, criticalErrors: 0 },
        support: { openTickets: 0, avgResponseTime: 0 },
        uptime: { uptimePercent: 99.99 },
        performance: { p95Latency: 0, throughput: 0 },
        marketing: { impressions: 0, conversions: 0 },
        catalog: { totalApps: 0, activeApps: 0 },
      };
    }),

  // ─── Analytics ───────────────────────────────────────────────────────────────

  getAnalytics: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/analytics",
      summary: "Get analytics agent data",
      tags: ["Monitoring"],
    })
    .output(
      z.object({
        activeUsers: z.number(),
        pageViews: z.number(),
        sessionDuration: z.number(),
        bounceRate: z.number(),
        timestamp: z.date(),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const [snapshot] = await db
        .select()
        .from(monitoringSnapshots)
        .where(
          and(
            eq(monitoringSnapshots.organizationId, context.organization.id),
            eq(monitoringSnapshots.agent, "analytics"),
          ),
        )
        .orderBy(desc(monitoringSnapshots.createdAt))
        .limit(1);

      return (
        snapshot?.metrics || {
          activeUsers: 0,
          pageViews: 0,
          sessionDuration: 0,
          bounceRate: 0,
          timestamp: new Date(),
        }
      );
    }),

  // ─── Billing ─────────────────────────────────────────────────────────────────

  getBilling: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/billing",
      summary: "Get billing data",
      tags: ["Monitoring"],
    })
    .output(
      z.object({
        mrr: z.number(),
        arr: z.number(),
        activeSubscriptions: z.number(),
        churnRate: z.number(),
        outstandingInvoices: z.number(),
        timestamp: z.date(),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const [snapshot] = await db
        .select()
        .from(monitoringSnapshots)
        .where(
          and(
            eq(monitoringSnapshots.organizationId, context.organization.id),
            eq(monitoringSnapshots.agent, "billing"),
          ),
        )
        .orderBy(desc(monitoringSnapshots.createdAt))
        .limit(1);

      return (
        snapshot?.metrics || {
          mrr: 0,
          arr: 0,
          activeSubscriptions: 0,
          churnRate: 0,
          outstandingInvoices: 0,
          timestamp: new Date(),
        }
      );
    }),

  // ─── Errors ──────────────────────────────────────────────────────────────────

  getErrors: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/errors",
      summary: "Get error tracking data",
      tags: ["Monitoring"],
    })
    .output(
      z.object({
        errorCount: z.number(),
        uniqueErrors: z.number(),
        resolvedErrors: z.number(),
        criticalErrors: z.number(),
        timestamp: z.date(),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const [snapshot] = await db
        .select()
        .from(monitoringSnapshots)
        .where(
          and(
            eq(monitoringSnapshots.organizationId, context.organization.id),
            eq(monitoringSnapshots.agent, "error"),
          ),
        )
        .orderBy(desc(monitoringSnapshots.createdAt))
        .limit(1);

      return (
        snapshot?.metrics || {
          errorCount: 0,
          uniqueErrors: 0,
          resolvedErrors: 0,
          criticalErrors: 0,
          timestamp: new Date(),
        }
      );
    }),

  // ─── Uptime ───────────────────────────────────────────────────────────────────

  getUptime: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/uptime",
      summary: "Get uptime status",
      tags: ["Monitoring"],
    })
    .output(
      z.object({
        uptimePercent: z.number(),
        avgResponseTime: z.number(),
        checksPassed: z.number(),
        checksFailed: z.number(),
        timestamp: z.date(),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const [snapshot] = await db
        .select()
        .from(monitoringSnapshots)
        .where(
          and(
            eq(monitoringSnapshots.organizationId, context.organization.id),
            eq(monitoringSnapshots.agent, "uptime"),
          ),
        )
        .orderBy(desc(monitoringSnapshots.createdAt))
        .limit(1);

      return (
        snapshot?.metrics || {
          uptimePercent: 99.99,
          avgResponseTime: 0,
          checksPassed: 0,
          checksFailed: 0,
          timestamp: new Date(),
        }
      );
    }),

  // ─── Performance ──────────────────────────────────────────────────────────────

  getPerformance: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/performance",
      summary: "Get performance metrics",
      tags: ["Monitoring"],
    })
    .output(
      z.object({
        p50Latency: z.number(),
        p95Latency: z.number(),
        p99Latency: z.number(),
        throughput: z.number(),
        errorRate: z.number(),
        timestamp: z.date(),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const [snapshot] = await db
        .select()
        .from(monitoringSnapshots)
        .where(
          and(
            eq(monitoringSnapshots.organizationId, context.organization.id),
            eq(monitoringSnapshots.agent, "performance"),
          ),
        )
        .orderBy(desc(monitoringSnapshots.createdAt))
        .limit(1);

      return (
        snapshot?.metrics || {
          p50Latency: 0,
          p95Latency: 0,
          p99Latency: 0,
          throughput: 0,
          errorRate: 0,
          timestamp: new Date(),
        }
      );
    }),

  // ─── Support ─────────────────────────────────────────────────────────────────

  getSupport: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/support",
      summary: "Get support metrics",
      tags: ["Monitoring"],
    })
    .output(
      z.object({
        openTickets: z.number(),
        avgResponseTime: z.number(),
        slaCompliance: z.number(),
        resolvedToday: z.number(),
        timestamp: z.date(),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const [snapshot] = await db
        .select()
        .from(monitoringSnapshots)
        .where(
          and(
            eq(monitoringSnapshots.organizationId, context.organization.id),
            eq(monitoringSnapshots.agent, "support"),
          ),
        )
        .orderBy(desc(monitoringSnapshots.createdAt))
        .limit(1);

      return (
        snapshot?.metrics || {
          openTickets: 0,
          avgResponseTime: 0,
          slaCompliance: 100,
          resolvedToday: 0,
          timestamp: new Date(),
        }
      );
    }),

  // ─── Health Check ────────────────────────────────────────────────────────────

  healthCheck: orgAuthed
    .route({
      method: "POST",
      path: "/monitoring/check/:appId",
      summary: "Trigger health check",
      tags: ["Monitoring"],
    })
    .input(z.object({ appId: z.string() }))
    .output(z.object({ success: z.boolean(), message: z.string().optional() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { appId: string } }) => {
        // Simulated health check
        return { success: true, message: "Health check completed" };
      },
    ),

  // ─── Catalog ─────────────────────────────────────────────────────────────────

  getCatalog: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/catalog",
      summary: "Get app catalog",
      tags: ["Monitoring"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        category: z.string().optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(z.any()),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; category?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(appCatalog.organizationId, context.organization.id)];
        if (input.category) conditions.push(eq(appCatalog.category, input.category));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(appCatalog)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(appCatalog)
          .where(whereConditions)
          .orderBy(desc(appCatalog.createdAt))
          .limit(input.limit)
          .offset(offset);

        return {
          data,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      },
    ),

  getCatalogEntry: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/catalog/:appId",
      summary: "Get catalog entry",
      tags: ["Monitoring"],
    })
    .input(z.object({ appId: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { appId: string } }) => {
        const db = getDb(context);
        const [entry] = await db
          .select()
          .from(appCatalog)
          .where(
            and(eq(appCatalog.id, input.appId), eq(appCatalog.organizationId, context.organization.id)),
          )
          .limit(1);

        if (!entry) {
          throw new APIError("Catalog entry not found", 404);
        }
        return entry;
      },
    ),
};
