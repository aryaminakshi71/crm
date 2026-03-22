import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, orgAuthed, schema } from "../procedures";

const pageInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(200).default(50),
});

function toOffset(page: number, limit: number) {
  return (page - 1) * limit;
}

export const intelligenceRouter = {
  summary: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/summary",
      summary: "Get AI and BI summary",
      tags: ["Intelligence"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [agentRuns, forecasts, kpis, latestForecast] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.aiAgentRuns)
          .where(eq(schema.aiAgentRuns.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.forecastSnapshots)
          .where(eq(schema.forecastSnapshots.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.executiveKpiSnapshots)
          .where(eq(schema.executiveKpiSnapshots.organizationId, orgId)),
        db
          .select()
          .from(schema.forecastSnapshots)
          .where(eq(schema.forecastSnapshots.organizationId, orgId))
          .orderBy(desc(schema.forecastSnapshots.createdAt))
          .limit(1),
      ]);

      return {
        agentRuns: Number(agentRuns[0]?.count || 0),
        forecasts: Number(forecasts[0]?.count || 0),
        kpis: Number(kpis[0]?.count || 0),
        latestForecast: latestForecast[0] || null,
      };
    }),

  agentRunsList: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/agent-runs",
      summary: "List AI agent runs",
      tags: ["Intelligence"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.aiAgentRuns)
        .where(eq(schema.aiAgentRuns.organizationId, context.organization.id))
        .orderBy(desc(schema.aiAgentRuns.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  agentRunsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/intelligence/agent-runs",
      summary: "Create AI agent run",
      tags: ["Intelligence"],
    })
    .input(
      z.object({
        agentName: z.string().min(1),
        prompt: z.string().min(1),
        status: z.string().default("completed"),
        output: z.string().optional(),
        confidence: z.number().min(0).max(100).optional(),
        model: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [run] = await db
        .insert(schema.aiAgentRuns)
        .values({
          organizationId: context.organization.id,
          agentName: input.agentName,
          prompt: input.prompt,
          status: input.status,
          output: input.output || null,
          confidence:
            input.confidence !== undefined
              ? String(Math.max(0, Math.min(100, input.confidence)))
              : null,
          model: input.model || null,
          createdBy: context.user.id,
          startedAt: new Date(),
          completedAt: input.status === "completed" ? new Date() : null,
        })
        .returning();

      return run;
    }),

  agentRunsUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/intelligence/agent-runs/:id",
      summary: "Update AI agent run",
      tags: ["Intelligence"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.string().optional(),
        output: z.string().optional(),
        confidence: z.number().min(0).max(100).optional(),
        model: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [run] = await db
        .update(schema.aiAgentRuns)
        .set({
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.output !== undefined ? { output: input.output } : {}),
          ...(input.confidence !== undefined
            ? {
                confidence: String(
                  Math.max(0, Math.min(100, input.confidence)),
                ),
              }
            : {}),
          ...(input.model !== undefined ? { model: input.model } : {}),
          ...(input.status === "completed" ? { completedAt: new Date() } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.aiAgentRuns.id, input.id),
            eq(schema.aiAgentRuns.organizationId, context.organization.id),
          ),
        )
        .returning();
      return run;
    }),

  agentRunsDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/intelligence/agent-runs/:id",
      summary: "Delete AI agent run",
      tags: ["Intelligence"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.aiAgentRuns)
        .where(
          and(
            eq(schema.aiAgentRuns.id, input.id),
            eq(schema.aiAgentRuns.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  forecastsList: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/forecasts",
      summary: "List forecast snapshots",
      tags: ["Intelligence"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.forecastSnapshots)
        .where(
          eq(schema.forecastSnapshots.organizationId, context.organization.id),
        )
        .orderBy(desc(schema.forecastSnapshots.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  forecastsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/intelligence/forecasts",
      summary: "Create forecast snapshot",
      tags: ["Intelligence"],
    })
    .input(
      z.object({
        pipelineAmount: z.number().nonnegative().default(0),
        winRate: z.number().min(0).max(100).default(0),
        avgSalesCycleDays: z.number().int().nonnegative().default(0),
        projectedRevenue: z.number().nonnegative().default(0),
        riskBand: z.enum(["low", "medium", "high"]).default("medium"),
        confidence: z.number().min(0).max(100).default(0),
        recommendations: z.array(z.string()).optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [forecast] = await db
        .insert(schema.forecastSnapshots)
        .values({
          organizationId: context.organization.id,
          pipelineAmount: String(input.pipelineAmount),
          winRate: String(input.winRate),
          avgSalesCycleDays: input.avgSalesCycleDays,
          projectedRevenue: String(input.projectedRevenue),
          riskBand: input.riskBand,
          confidence: String(input.confidence),
          recommendations: input.recommendations || [],
          createdBy: context.user.id,
        })
        .returning();

      return forecast;
    }),

  forecastsUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/intelligence/forecasts/:id",
      summary: "Update forecast snapshot",
      tags: ["Intelligence"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        pipelineAmount: z.number().nonnegative().optional(),
        winRate: z.number().min(0).max(100).optional(),
        avgSalesCycleDays: z.number().int().nonnegative().optional(),
        projectedRevenue: z.number().nonnegative().optional(),
        riskBand: z.enum(["low", "medium", "high"]).optional(),
        confidence: z.number().min(0).max(100).optional(),
        recommendations: z.array(z.string()).optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [forecast] = await db
        .update(schema.forecastSnapshots)
        .set({
          ...(input.pipelineAmount !== undefined
            ? { pipelineAmount: String(input.pipelineAmount) }
            : {}),
          ...(input.winRate !== undefined
            ? { winRate: String(input.winRate) }
            : {}),
          ...(input.avgSalesCycleDays !== undefined
            ? { avgSalesCycleDays: input.avgSalesCycleDays }
            : {}),
          ...(input.projectedRevenue !== undefined
            ? { projectedRevenue: String(input.projectedRevenue) }
            : {}),
          ...(input.riskBand !== undefined ? { riskBand: input.riskBand } : {}),
          ...(input.confidence !== undefined
            ? { confidence: String(input.confidence) }
            : {}),
          ...(input.recommendations !== undefined
            ? { recommendations: input.recommendations }
            : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.forecastSnapshots.id, input.id),
            eq(
              schema.forecastSnapshots.organizationId,
              context.organization.id,
            ),
          ),
        )
        .returning();
      return forecast;
    }),

  forecastsDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/intelligence/forecasts/:id",
      summary: "Delete forecast snapshot",
      tags: ["Intelligence"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.forecastSnapshots)
        .where(
          and(
            eq(schema.forecastSnapshots.id, input.id),
            eq(
              schema.forecastSnapshots.organizationId,
              context.organization.id,
            ),
          ),
        );
      return { success: true };
    }),

  kpisList: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/kpis",
      summary: "List executive KPI snapshots",
      tags: ["Intelligence"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.executiveKpiSnapshots)
        .where(
          eq(
            schema.executiveKpiSnapshots.organizationId,
            context.organization.id,
          ),
        )
        .orderBy(desc(schema.executiveKpiSnapshots.observedAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  kpisCreate: orgAuthed
    .route({
      method: "POST",
      path: "/intelligence/kpis",
      summary: "Create executive KPI snapshot",
      tags: ["Intelligence"],
    })
    .input(
      z.object({
        metricKey: z.string().min(1),
        metricLabel: z.string().min(1),
        metricValue: z.number(),
        metricText: z.string().optional(),
        periodLabel: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [kpi] = await db
        .insert(schema.executiveKpiSnapshots)
        .values({
          organizationId: context.organization.id,
          metricKey: input.metricKey,
          metricLabel: input.metricLabel,
          metricValue: String(input.metricValue),
          metricText: input.metricText || null,
          periodLabel: input.periodLabel || null,
          createdBy: context.user.id,
        })
        .returning();

      return kpi;
    }),

  kpisUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/intelligence/kpis/:id",
      summary: "Update executive KPI snapshot",
      tags: ["Intelligence"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        metricKey: z.string().min(1).optional(),
        metricLabel: z.string().min(1).optional(),
        metricValue: z.number().optional(),
        metricText: z.string().optional(),
        periodLabel: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [kpi] = await db
        .update(schema.executiveKpiSnapshots)
        .set({
          ...(input.metricKey !== undefined
            ? { metricKey: input.metricKey }
            : {}),
          ...(input.metricLabel !== undefined
            ? { metricLabel: input.metricLabel }
            : {}),
          ...(input.metricValue !== undefined
            ? { metricValue: String(input.metricValue) }
            : {}),
          ...(input.metricText !== undefined
            ? { metricText: input.metricText }
            : {}),
          ...(input.periodLabel !== undefined
            ? { periodLabel: input.periodLabel }
            : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.executiveKpiSnapshots.id, input.id),
            eq(
              schema.executiveKpiSnapshots.organizationId,
              context.organization.id,
            ),
          ),
        )
        .returning();
      return kpi;
    }),

  kpisDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/intelligence/kpis/:id",
      summary: "Delete executive KPI snapshot",
      tags: ["Intelligence"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.executiveKpiSnapshots)
        .where(
          and(
            eq(schema.executiveKpiSnapshots.id, input.id),
            eq(
              schema.executiveKpiSnapshots.organizationId,
              context.organization.id,
            ),
          ),
        );
      return { success: true };
    }),

  // ── New stub endpoints ────────────────────────────────────────────────────

  anomaliesList: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/anomalies",
      summary: "List detected anomalies",
      tags: ["Intelligence"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async () => {
      return {
        data: [
          { id: "anm-1", metric: "Daily Active Users", value: 1240, expected: 1850, deviation: -33, severity: "high", detectedAt: new Date().toISOString() },
          { id: "anm-2", metric: "Avg Session Duration", value: 4.2, expected: 3.8, deviation: 11, severity: "low", detectedAt: new Date().toISOString() },
          { id: "anm-3", metric: "Churn Rate", value: 8.4, expected: 5.0, deviation: 68, severity: "critical", detectedAt: new Date().toISOString() },
          { id: "anm-4", metric: "Revenue per Customer", value: 320, expected: 380, deviation: -16, severity: "medium", detectedAt: new Date().toISOString() },
        ],
        total: 4,
      };
    }),

  churnPredictions: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/churn",
      summary: "Get churn predictions",
      tags: ["Intelligence"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async () => {
      return {
        customers: [
          { id: "c-1", name: "Acme Corp", churnProbability: 0.87, lastActivity: "14 days ago", plan: "Pro", mrr: 499 },
          { id: "c-2", name: "Globex Inc", churnProbability: 0.72, lastActivity: "8 days ago", plan: "Starter", mrr: 99 },
          { id: "c-3", name: "Initech Ltd", churnProbability: 0.64, lastActivity: "21 days ago", plan: "Enterprise", mrr: 1299 },
          { id: "c-4", name: "Umbrella Co", churnProbability: 0.51, lastActivity: "5 days ago", plan: "Pro", mrr: 499 },
        ],
        overallChurnRate: 5.8,
        highRiskCount: 4,
        predictedChurnedRevenue: 2396,
      };
    }),

  clvAnalysis: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/clv",
      summary: "Get customer lifetime value analysis",
      tags: ["Intelligence"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async () => {
      return {
        segments: [
          { name: "Champions", count: 42, avgClv: 8400, totalClv: 352800, color: "#10b981" },
          { name: "Loyal", count: 118, avgClv: 4200, totalClv: 495600, color: "#3b82f6" },
          { name: "At Risk", count: 67, avgClv: 1800, totalClv: 120600, color: "#f59e0b" },
          { name: "Dormant", count: 93, avgClv: 600, totalClv: 55800, color: "#6b7280" },
        ],
        averageClv: 3200,
        topCustomers: [
          { id: "t-1", name: "MegaCorp", clv: 42000, purchases: 38, tenure: "4y 2m" },
          { id: "t-2", name: "Pinnacle Ltd", clv: 31500, purchases: 29, tenure: "3y 7m" },
          { id: "t-3", name: "Zenith Group", clv: 28900, purchases: 24, tenure: "2y 11m" },
        ],
      };
    }),

  cohortAnalysis: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/cohort",
      summary: "Get cohort analysis",
      tags: ["Intelligence"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async () => {
      return {
        cohorts: [
          { cohort: "Jan 2025", size: 120 },
          { cohort: "Feb 2025", size: 98 },
          { cohort: "Mar 2025", size: 145 },
          { cohort: "Apr 2025", size: 112 },
        ],
        retentionMatrix: [
          { cohort: "Jan 2025", m0: 100, m1: 78, m2: 62, m3: 54, m4: 48 },
          { cohort: "Feb 2025", m0: 100, m1: 81, m2: 67, m3: 59, m4: null },
          { cohort: "Mar 2025", m0: 100, m1: 76, m2: 61, m3: null, m4: null },
          { cohort: "Apr 2025", m0: 100, m1: 83, m2: null, m3: null, m4: null },
        ],
      };
    }),

  funnelAnalysis: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/funnel",
      summary: "Get funnel analysis",
      tags: ["Intelligence"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async () => {
      return {
        stages: [
          { name: "Visitors", count: 12400, conversion: 100 },
          { name: "Leads", count: 2480, conversion: 20 },
          { name: "Qualified", count: 744, conversion: 6 },
          { name: "Proposals", count: 298, conversion: 2.4 },
          { name: "Closed Won", count: 119, conversion: 0.96 },
        ],
        overallConversion: 0.96,
        avgDealCycle: 46,
      };
    }),

  predictiveForecasts: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/predictive",
      summary: "Get predictive forecasts",
      tags: ["Intelligence"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async () => {
      return {
        forecasts: [
          { id: "f-1", metric: "Revenue", period: "Q2 2025", predicted: 480000, confidence: 0.82, trend: "up" },
          { id: "f-2", metric: "New Customers", period: "Q2 2025", predicted: 145, confidence: 0.76, trend: "up" },
          { id: "f-3", metric: "Churn Rate", period: "Q2 2025", predicted: 5.2, confidence: 0.71, trend: "down" },
          { id: "f-4", metric: "Avg Deal Size", period: "Q2 2025", predicted: 3200, confidence: 0.88, trend: "up" },
        ],
        lastUpdated: new Date().toISOString(),
      };
    }),

  queriesExecute: orgAuthed
    .route({
      method: "POST",
      path: "/intelligence/queries",
      summary: "Execute a natural language query",
      tags: ["Intelligence"],
    })
    .input(z.object({ query: z.string().min(1) }))
    .output(z.any())
    .handler(async ({ input }) => {
      return {
        result: `Processed query: "${input.query}"`,
        sql: `SELECT * FROM analytics WHERE org_id = $1 LIMIT 100`,
        data: [
          { label: "Jan", value: 12400 },
          { label: "Feb", value: 14200 },
          { label: "Mar", value: 13800 },
        ],
        executionTimeMs: 42,
      };
    }),

  queriesList: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/queries",
      summary: "Get recent natural language queries",
      tags: ["Intelligence"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async () => {
      return {
        data: [
          { id: "q-1", query: "Show top 10 customers by revenue", executedAt: new Date().toISOString(), status: "success" },
          { id: "q-2", query: "What is the churn rate this quarter?", executedAt: new Date(Date.now() - 3600000).toISOString(), status: "success" },
          { id: "q-3", query: "Compare Q1 vs Q2 pipeline", executedAt: new Date(Date.now() - 7200000).toISOString(), status: "success" },
        ],
      };
    }),

  retentionMetrics: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/retention",
      summary: "Get retention metrics",
      tags: ["Intelligence"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async () => {
      return {
        periods: [
          { period: "Jan 2025", retained: 89.2, churned: 10.8, newCustomers: 42 },
          { period: "Feb 2025", retained: 91.4, churned: 8.6, newCustomers: 38 },
          { period: "Mar 2025", retained: 88.7, churned: 11.3, newCustomers: 55 },
          { period: "Apr 2025", retained: 92.1, churned: 7.9, newCustomers: 61 },
          { period: "May 2025", retained: 90.5, churned: 9.5, newCustomers: 49 },
        ],
        averageRetention: 90.4,
        trend: "stable",
      };
    }),

  rfmSegments: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/rfm",
      summary: "Get RFM segments",
      tags: ["Intelligence"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async () => {
      return {
        segments: [
          { name: "Champions", recency: 5, frequency: 5, monetary: 5, count: 42, percentage: 13.2 },
          { name: "Loyal Customers", recency: 4, frequency: 4, monetary: 4, count: 118, percentage: 37.1 },
          { name: "Potential Loyalists", recency: 5, frequency: 2, monetary: 3, count: 56, percentage: 17.6 },
          { name: "At Risk", recency: 2, frequency: 3, monetary: 3, count: 67, percentage: 21.1 },
          { name: "Lost", recency: 1, frequency: 1, monetary: 1, count: 35, percentage: 11.0 },
        ],
        totalCustomers: 318,
      };
    }),

  sourcesList: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/sources",
      summary: "List data source connections",
      tags: ["Intelligence"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async () => {
      return {
        sources: [
          { id: "src-1", name: "PostgreSQL (Primary)", type: "database", status: "connected", lastSync: new Date().toISOString(), recordCount: 142800 },
          { id: "src-2", name: "Stripe", type: "payment", status: "connected", lastSync: new Date(Date.now() - 1800000).toISOString(), recordCount: 8420 },
          { id: "src-3", name: "HubSpot CRM", type: "crm", status: "syncing", lastSync: new Date(Date.now() - 600000).toISOString(), recordCount: 3200 },
          { id: "src-4", name: "Google Analytics", type: "analytics", status: "error", lastSync: new Date(Date.now() - 86400000).toISOString(), recordCount: 0 },
        ],
      };
    }),

  sourcesSync: orgAuthed
    .route({
      method: "POST",
      path: "/intelligence/sources/:id/sync",
      summary: "Trigger sync for a data source",
      tags: ["Intelligence"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .handler(async ({ input }) => {
      return {
        success: true,
        sourceId: input.id,
        syncStartedAt: new Date().toISOString(),
        message: "Sync initiated successfully",
      };
    }),

  reportsGet: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/reports/:id",
      summary: "Get a specific report by ID",
      tags: ["Intelligence"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .handler(async ({ input }) => {
      return {
        id: input.id,
        title: `Intelligence Report #${input.id}`,
        type: "custom",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "ready",
        sections: [
          { title: "Executive Summary", content: "Overall performance is trending positively with 12% MoM growth." },
          { title: "Key Metrics", data: { revenue: 480000, customers: 318, churnRate: 5.8 } },
          { title: "Recommendations", items: ["Focus on at-risk segment re-engagement", "Upsell Champions to Enterprise tier"] },
        ],
      };
    }),
};
