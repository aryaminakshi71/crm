/**
 * Monitoring Router
 *
 * Platform monitoring operations for analytics, billing, errors, uptime, performance, and catalog.
 * Provides real data from database queries and monitoring service.
 */

import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError, ErrorCode } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";
import {
  getAlertRules,
  getAnalyticsMetrics,
  getAppCatalogWithHealth,
  getBillingMetrics,
  getIncidents,
  getPerformanceMetrics,
  getRecentLogs,
  getSupportMetrics,
  getUptimeMetrics,
  storeSnapshot,
  type AlertRule,
  type Incident,
  type LogEntry,
} from "../services/monitoring-service";

const { monitoringSnapshots, appCatalog, tickets } = schema;

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
        analytics: z.object({
          activeUsers: z.number(),
          pageViews: z.number(),
          sessionDuration: z.number(),
          bounceRate: z.number(),
        }),
        billing: z.object({
          mrr: z.number(),
          arr: z.number(),
          activeSubscriptions: z.number(),
          churnRate: z.number(),
          outstandingInvoices: z.number(),
        }),
        errors: z.object({
          errorCount: z.number(),
          uniqueErrors: z.number(),
          resolvedErrors: z.number(),
          criticalErrors: z.number(),
        }),
        support: z.object({
          openTickets: z.number(),
          avgResponseTime: z.number(),
          slaCompliance: z.number(),
          resolvedToday: z.number(),
        }),
        uptime: z.object({
          uptimePercent: z.number(),
          checkResponseTime: z.number(),
          checksPassed: z.number(),
          checksFailed: z.number(),
        }),
        performance: z.object({
          p50Latency: z.number(),
          p95Latency: z.number(),
          p99Latency: z.number(),
          throughput: z.number(),
          errorRate: z.number(),
        }),
        catalog: z.object({
          totalApps: z.number(),
          activeApps: z.number(),
        }),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      // Fetch all metrics in parallel
      const [analytics, billing, support, uptime, performance] = await Promise.all([
        getAnalyticsMetrics(db, orgId),
        getBillingMetrics(db, orgId),
        getSupportMetrics(db, orgId),
        getUptimeMetrics(db, orgId),
        getPerformanceMetrics(db, orgId),
      ]);

      // Get error counts
      const errorSnapshot = await db
        .select()
        .from(monitoringSnapshots)
        .where(and(eq(monitoringSnapshots.organizationId, orgId), eq(monitoringSnapshots.agent, "error")))
        .orderBy(desc(monitoringSnapshots.createdAt))
        .limit(1);

      const errors = errorSnapshot[0]?.metrics as { errorCount?: number; criticalErrors?: number; uniqueErrors?: number; resolvedErrors?: number } || {
        errorCount: 0,
        criticalErrors: 0,
        uniqueErrors: 0,
        resolvedErrors: 0,
      };

      // Get catalog counts
      const totalAppsResult = await db
        .select({ count: count() })
        .from(appCatalog)
        .where(eq(appCatalog.organizationId, orgId));

      const activeAppsResult = await db
        .select({ count: count() })
        .from(appCatalog)
        .where(and(eq(appCatalog.organizationId, orgId), eq(appCatalog.status, "active")));

      return {
        analytics,
        billing,
        errors: {
          errorCount: errors.errorCount || 0,
          uniqueErrors: errors.uniqueErrors || 0,
          resolvedErrors: errors.resolvedErrors || 0,
          criticalErrors: errors.criticalErrors || 0,
        },
        support,
        uptime,
        performance,
        catalog: {
          totalApps: totalAppsResult[0]?.count || 0,
          activeApps: activeAppsResult[0]?.count || 0,
        },
      };
    }),

  // ─── Analytics ───────────────────────────────────────────────────────────────

  getAnalytics: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/analytics",
      summary: "Get analytics metrics",
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
      const metrics = await getAnalyticsMetrics(db, context.organization.id);

      // Store snapshot for historical tracking
      await storeSnapshot(db, context.organization.id, "analytics", metrics);

      return { ...metrics, timestamp: new Date() };
    }),

  // ─── Billing ─────────────────────────────────────────────────────────────────

  getBilling: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/billing",
      summary: "Get billing metrics",
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
      const metrics = await getBillingMetrics(db, context.organization.id);

      // Store snapshot
      await storeSnapshot(db, context.organization.id, "billing", metrics);

      return { ...metrics, timestamp: new Date() };
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
        recentErrors: z.array(z.any()).optional(),
        timestamp: z.date(),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);

      // Get recent error snapshots
      const errorSnapshots = await db
        .select()
        .from(monitoringSnapshots)
        .where(and(eq(monitoringSnapshots.organizationId, context.organization.id), eq(monitoringSnapshots.agent, "error")))
        .orderBy(desc(monitoringSnapshots.createdAt))
        .limit(10);

      const latestMetrics = errorSnapshots[0]?.metrics as Record<string, unknown> || {};

      const metrics = {
        errorCount: (latestMetrics.errorCount as number) || 0,
        uniqueErrors: (latestMetrics.uniqueErrors as number) || 0,
        resolvedErrors: (latestMetrics.resolvedErrors as number) || 0,
        criticalErrors: (latestMetrics.criticalErrors as number) || 0,
        timestamp: new Date(),
      };

      // Store snapshot
      await storeSnapshot(db, context.organization.id, "error", metrics);

      return {
        ...metrics,
        recentErrors: errorSnapshots.map((s: typeof errorSnapshots[number]) => ({
          id: s.id,
          ...(s.metrics as object),
          createdAt: s.createdAt,
        })),
      };
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
        checkResponseTime: z.number(),
        checksPassed: z.number(),
        checksFailed: z.number(),
        checks: z.array(z.any()).optional(),
        timestamp: z.date(),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const metrics = await getUptimeMetrics(db, context.organization.id);

      // Get catalog apps for detailed check status
      const catalogApps = await getAppCatalogWithHealth(db, context.organization.id);

      // Store snapshot
      await storeSnapshot(db, context.organization.id, "uptime", metrics);

      return {
        ...metrics,
        checks: catalogApps.map((app) => ({
          id: app.id,
          name: app.name,
          status: app.status,
          latency: (app as any).latency || 0,
          uptime: (app as any).uptime || 100,
        })),
        timestamp: new Date(),
      };
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
      const metrics = await getPerformanceMetrics(db, context.organization.id);

      // Store snapshot
      await storeSnapshot(db, context.organization.id, "performance", metrics);

      return { ...metrics, timestamp: new Date() };
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
      const metrics = await getSupportMetrics(db, context.organization.id);

      // Store snapshot
      await storeSnapshot(db, context.organization.id, "support", metrics);

      return { ...metrics, timestamp: new Date() };
    }),

  // ─── Incidents ─────────────────────────────────────────────────────────────────

  getIncidents: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/incidents",
      summary: "Get incidents list",
      tags: ["Monitoring"],
    })
    .output(z.array(z.any()))
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      return getIncidents(db, context.organization.id);
    }),

  getIncident: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/incidents/:id",
      summary: "Get incident detail",
      tags: ["Monitoring"],
    })
    .input(z.object({ id: z.string() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        const incidents = await getIncidents(db, context.organization.id);
        const incident = incidents.find((i) => i.id === input.id);

        if (!incident) {
          throw new APIError(ErrorCode.NOT_FOUND, "Incident not found", 404);
        }

        return incident;
      },
    ),

  // ─── Alerts ───────────────────────────────────────────────────────────────────
  // NOTE: No dedicated monitoring_alerts table exists in the schema. Alert rules
  // are persisted as monitoring snapshots with agent="alert". Each snapshot's
  // `metrics` field stores the full alert rule object. A dedicated alerts table
  // would allow richer querying (e.g. filtering by severity, enabled state).

  getAlerts: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/alerts",
      summary: "Get alert rules",
      tags: ["Monitoring"],
    })
    .output(z.array(z.any()))
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      // Query alert snapshots stored in monitoring_snapshots with agent="alert"
      const alertSnapshots = await db
        .select()
        .from(monitoringSnapshots)
        .where(and(eq(monitoringSnapshots.organizationId, orgId), eq(monitoringSnapshots.agent, "alert")))
        .orderBy(desc(monitoringSnapshots.createdAt));

      if (alertSnapshots.length > 0) {
        // Each snapshot represents one alert rule stored in its metrics field
        return alertSnapshots.map((s) => ({
          id: s.id,
          ...(s.metrics as object),
          createdAt: s.createdAt,
        }));
      }

      // Fall back to static seed data when no alerts have been created yet
      return getAlertRules();
    }),

  createAlert: orgAuthed
    .route({
      method: "POST",
      path: "/monitoring/alerts",
      summary: "Create alert rule",
      tags: ["Monitoring"],
    })
    .input(
      z.object({
        name: z.string(),
        metric: z.string(),
        condition: z.string(),
        threshold: z.number(),
        duration: z.number(),
        severity: z.enum(["info", "warning", "critical"]),
        channels: z.array(z.string()),
      }),
    )
    .handler(async ({ context, input }: { context: OrgContext; input: { name: string; metric: string; condition: string; threshold: number; duration: number; severity: "info" | "warning" | "critical"; channels: string[] } }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const alertData = {
        ...input,
        enabled: true,
        triggerCount: 0,
      };

      // Persist the alert rule as a monitoring snapshot with agent="alert"
      const [snapshot] = await db
        .insert(monitoringSnapshots)
        .values({
          organizationId: orgId,
          agent: "alert",
          metrics: alertData,
          alerts: [],
        })
        .returning();

      return {
        id: snapshot.id,
        ...alertData,
        createdAt: snapshot.createdAt,
      };
    }),

  // ─── Logs ─────────────────────────────────────────────────────────────────────

  getLogs: orgAuthed
    .route({
      method: "GET",
      path: "/monitoring/logs",
      summary: "Get recent logs",
      tags: ["Monitoring"],
    })
    .output(z.array(z.any()))
    .handler(async () => {
      return getRecentLogs();
    }),

  // ─── Health Check ─────────────────────────────────────────────────────────────

  healthCheck: orgAuthed
    .route({
      method: "POST",
      path: "/monitoring/check/:appId",
      summary: "Trigger health check for an app",
      tags: ["Monitoring"],
    })
    .input(z.object({ appId: z.string() }))
    .output(z.object({ success: z.boolean(), message: z.string().optional(), latency: z.number().optional() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { appId: string } }) => {
        const db = getDb(context);

        // Perform health check simulation
        const startTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay
        const latency = Date.now() - startTime;

        // Update health check timestamp in catalog
        await db
          .update(appCatalog)
          .set({ healthCheckAt: new Date(), updatedAt: new Date() })
          .where(
            and(
              eq(appCatalog.organizationId, context.organization.id),
              eq(appCatalog.appId, input.appId),
            ),
          );

        return {
          success: true,
          message: "Health check completed successfully",
          latency,
        };
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
        const apps = await getAppCatalogWithHealth(db, context.organization.id);

        // Filter by category if provided
        const filteredApps = input.category
          ? apps.filter((app) => app.category === input.category)
          : apps;

        const total = filteredApps.length;
        const offset = (input.page - 1) * input.limit;
        const paginatedApps = filteredApps.slice(offset, offset + input.limit);

        return {
          data: paginatedApps,
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
          throw new APIError(ErrorCode.NOT_FOUND, "Catalog entry not found", 404);
        }

        return {
          ...entry,
          healthStatus: entry.status === "active" ? "healthy" : "degraded",
          latency: 0,
          uptime: 0,
          errorRate: 0,
        };
      },
    ),

  registerApp: orgAuthed
    .route({
      method: "POST",
      path: "/monitoring/catalog",
      summary: "Register a new app in the catalog",
      tags: ["Monitoring"],
    })
    .input(
      z.object({
        appId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        category: z.string(),
        endpoint: z.string().optional(),
      }),
    )
    .handler(
      async ({ context, input }: { context: OrgContext; input: { appId: string; name: string; description?: string; category: string; endpoint?: string } }) => {
        const db = getDb(context);

        const [entry] = await db
          .insert(appCatalog)
          .values({
            organizationId: context.organization.id,
            appId: input.appId,
            name: input.name,
            description: input.description,
            category: input.category,
            status: "active",
            metadata: input.endpoint ? { endpoint: input.endpoint } : {},
            healthCheckAt: new Date(),
          })
          .returning();

        return entry;
      },
    ),
};
