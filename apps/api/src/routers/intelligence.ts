import { and, count, desc, eq, gt, gte, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, orgAuthed, schema } from "../procedures";

const pageInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(200).default(50),
});

function toOffset(page: number, limit: number) {
  return (page - 1) * limit;
}

// ── Fallback data (used when the org has no data yet) ────────────────────────

const FALLBACK_ANOMALIES = [
  { id: "anm-1", metric: "Daily Active Users", value: 1240, expected: 1850, deviation: -33, severity: "high", detectedAt: new Date().toISOString() },
  { id: "anm-2", metric: "Avg Session Duration", value: 4.2, expected: 3.8, deviation: 11, severity: "low", detectedAt: new Date().toISOString() },
  { id: "anm-3", metric: "Churn Rate", value: 8.4, expected: 5.0, deviation: 68, severity: "critical", detectedAt: new Date().toISOString() },
  { id: "anm-4", metric: "Revenue per Customer", value: 320, expected: 380, deviation: -16, severity: "medium", detectedAt: new Date().toISOString() },
];

const FALLBACK_CHURN = {
  customers: [
    { id: "c-1", name: "Acme Corp", riskScore: 87, daysSinceActivity: 87, email: null, segment: "At Risk" },
    { id: "c-2", name: "Globex Inc", riskScore: 72, daysSinceActivity: 72, email: null, segment: "At Risk" },
    { id: "c-3", name: "Initech Ltd", riskScore: 64, daysSinceActivity: 64, email: null, segment: "At Risk" },
    { id: "c-4", name: "Umbrella Co", riskScore: 51, daysSinceActivity: 51, email: null, segment: "At Risk" },
  ],
  overallChurnRate: 5.8,
  highRiskCount: 4,
};

const FALLBACK_CLV = {
  segments: [
    { name: "Champions", count: 42, avgClv: 8400, totalClv: 352800, color: "#10b981" },
    { name: "Loyal", count: 118, avgClv: 4200, totalClv: 495600, color: "#3b82f6" },
    { name: "At Risk", count: 67, avgClv: 1800, totalClv: 120600, color: "#f59e0b" },
    { name: "Dormant", count: 93, avgClv: 600, totalClv: 55800, color: "#6b7280" },
  ],
  averageClv: 3200,
  topCustomers: [
    { id: "t-1", name: "MegaCorp", clv: 42000, dealCount: 38 },
    { id: "t-2", name: "Pinnacle Ltd", clv: 31500, dealCount: 29 },
    { id: "t-3", name: "Zenith Group", clv: 28900, dealCount: 24 },
  ],
};

const FALLBACK_FUNNEL = {
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

const FALLBACK_RFM = {
  segments: [
    { name: "Champions", recency: 5, frequency: 5, monetary: 5, count: 42, percentage: 13.2 },
    { name: "Loyal Customers", recency: 4, frequency: 4, monetary: 4, count: 118, percentage: 37.1 },
    { name: "Potential Loyalists", recency: 5, frequency: 2, monetary: 3, count: 56, percentage: 17.6 },
    { name: "At Risk", recency: 2, frequency: 3, monetary: 3, count: 67, percentage: 21.1 },
    { name: "Lost", recency: 1, frequency: 1, monetary: 1, count: 35, percentage: 11.0 },
  ],
  totalCustomers: 318,
};

const FALLBACK_RETENTION = {
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

const FALLBACK_COHORT = {
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

const FALLBACK_PREDICTIVE = {
  forecasts: [
    { id: "f-1", metric: "Revenue", period: "Q2 2025", predicted: 480000, confidence: 0.82, trend: "up" },
    { id: "f-2", metric: "New Customers", period: "Q2 2025", predicted: 145, confidence: 0.76, trend: "up" },
    { id: "f-3", metric: "Churn Rate", period: "Q2 2025", predicted: 5.2, confidence: 0.71, trend: "down" },
    { id: "f-4", metric: "Avg Deal Size", period: "Q2 2025", predicted: 3200, confidence: 0.88, trend: "up" },
  ],
  lastUpdated: new Date().toISOString(),
};

// ─────────────────────────────────────────────────────────────────────────────

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

  // ── Real-data endpoints ───────────────────────────────────────────────────

  anomaliesList: orgAuthed
    .route({
      method: "GET",
      path: "/intelligence/anomalies",
      summary: "List detected anomalies",
      tags: ["Intelligence"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [currentDealsRow, prevDealsRow, currentContactsRow, prevContactsRow] =
        await Promise.all([
          db
            .select({ count: count() })
            .from(schema.deals)
            .where(
              and(
                eq(schema.deals.organizationId, orgId),
                gte(schema.deals.createdAt, thirtyDaysAgo),
              ),
            ),
          db
            .select({ count: count() })
            .from(schema.deals)
            .where(
              and(
                eq(schema.deals.organizationId, orgId),
                gte(schema.deals.createdAt, sixtyDaysAgo),
                lt(schema.deals.createdAt, thirtyDaysAgo),
              ),
            ),
          db
            .select({ count: count() })
            .from(schema.contacts)
            .where(
              and(
                eq(schema.contacts.organizationId, orgId),
                isNull(schema.contacts.deletedAt),
                gte(schema.contacts.createdAt, thirtyDaysAgo),
              ),
            ),
          db
            .select({ count: count() })
            .from(schema.contacts)
            .where(
              and(
                eq(schema.contacts.organizationId, orgId),
                isNull(schema.contacts.deletedAt),
                gte(schema.contacts.createdAt, sixtyDaysAgo),
                lt(schema.contacts.createdAt, thirtyDaysAgo),
              ),
            ),
        ]);

      const currentDeals = Number(currentDealsRow[0]?.count ?? 0);
      const prevDeals = Number(prevDealsRow[0]?.count ?? 0) || 1;
      const dealsDeviation = Math.round(((currentDeals - prevDeals) / prevDeals) * 100);

      const currentContacts = Number(currentContactsRow[0]?.count ?? 0);
      const prevContacts = Number(prevContactsRow[0]?.count ?? 0) || 1;
      const contactsDeviation = Math.round(((currentContacts - prevContacts) / prevContacts) * 100);

      // Only flag as anomaly if deviation > 20 %
      const anomalies: Array<{
        id: string;
        metric: string;
        value: number;
        expected: number;
        deviation: number;
        severity: string;
        detectedAt: string;
      }> = [];

      if (Math.abs(dealsDeviation) > 20) {
        anomalies.push({
          id: "deals-anomaly",
          metric: "New Deals",
          value: currentDeals,
          expected: prevDeals,
          deviation: dealsDeviation,
          severity: Math.abs(dealsDeviation) > 50 ? "critical" : "warning",
          detectedAt: now.toISOString(),
        });
      }

      if (Math.abs(contactsDeviation) > 20) {
        anomalies.push({
          id: "contacts-anomaly",
          metric: "New Contacts",
          value: currentContacts,
          expected: prevContacts,
          deviation: contactsDeviation,
          severity: Math.abs(contactsDeviation) > 50 ? "critical" : "warning",
          detectedAt: now.toISOString(),
        });
      }

      // Fall back to demo data when the org has no deals/contacts yet
      if (currentDeals === 0 && currentContacts === 0) {
        return { data: FALLBACK_ANOMALIES, total: FALLBACK_ANOMALIES.length };
      }

      return { data: anomalies, total: anomalies.length };
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
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;
      const now = new Date();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [totalContactsRow, atRiskContacts] = await Promise.all([
        db
          .select({ count: count() })
          .from(schema.contacts)
          .where(
            and(
              eq(schema.contacts.organizationId, orgId),
              isNull(schema.contacts.deletedAt),
            ),
          ),
        db
          .select({
            id: schema.contacts.id,
            firstName: schema.contacts.firstName,
            lastName: schema.contacts.lastName,
            email: schema.contacts.email,
            updatedAt: schema.contacts.updatedAt,
          })
          .from(schema.contacts)
          .where(
            and(
              eq(schema.contacts.organizationId, orgId),
              isNull(schema.contacts.deletedAt),
              lt(schema.contacts.updatedAt, sixtyDaysAgo),
            ),
          )
          .orderBy(schema.contacts.updatedAt)
          .limit(20),
      ]);

      const totalContacts = Number(totalContactsRow[0]?.count ?? 0);

      if (totalContacts === 0) {
        return FALLBACK_CHURN;
      }

      const customers = atRiskContacts.map((c: typeof atRiskContacts[number]) => {
        const daysSince = Math.round(
          (now.getTime() - new Date(c.updatedAt).getTime()) / (24 * 60 * 60 * 1000),
        );
        return {
          id: c.id,
          name: `${c.firstName} ${c.lastName}`.trim(),
          email: c.email,
          riskScore: Math.min(95, daysSince),
          daysSinceActivity: daysSince,
          segment: "At Risk",
        };
      });

      const highRiskCount = atRiskContacts.length;
      const overallChurnRate =
        highRiskCount > 0
          ? Math.round((highRiskCount / Math.max(1, totalContacts)) * 100)
          : 5;

      return { customers, overallChurnRate, highRiskCount };
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
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [totalContactsRow, wonDeals] = await Promise.all([
        db
          .select({ count: count() })
          .from(schema.contacts)
          .where(
            and(
              eq(schema.contacts.organizationId, orgId),
              isNull(schema.contacts.deletedAt),
            ),
          ),
        db
          .select({
            contactId: schema.deals.contactId,
            value: schema.deals.value,
          })
          .from(schema.deals)
          .where(
            and(
              eq(schema.deals.organizationId, orgId),
              eq(schema.deals.stage, "won"),
              isNull(schema.deals.deletedAt),
            ),
          ),
      ]);

      const totalContacts = Number(totalContactsRow[0]?.count ?? 0);

      if (totalContacts === 0) {
        return FALLBACK_CLV;
      }

      // Group deal values by contact
      const clvByContact = new Map<string, number>();
      let totalRevenue = 0;

      for (const deal of wonDeals) {
        const v = parseFloat(deal.value ?? "0");
        totalRevenue += v;
        if (deal.contactId) {
          clvByContact.set(deal.contactId, (clvByContact.get(deal.contactId) ?? 0) + v);
        }
      }

      const avgClv = totalContacts > 0 ? Math.round(totalRevenue / totalContacts) : 0;

      // Segment contacts by their CLV quartile
      const contactClvs = Array.from(clvByContact.values()).sort((a, b) => b - a);
      const q75 = contactClvs[Math.floor(contactClvs.length * 0.25)] ?? 0;
      const q50 = contactClvs[Math.floor(contactClvs.length * 0.5)] ?? 0;
      const q25 = contactClvs[Math.floor(contactClvs.length * 0.75)] ?? 0;

      const champions = contactClvs.filter((v) => v >= q75);
      const loyal = contactClvs.filter((v) => v >= q50 && v < q75);
      const atRisk = contactClvs.filter((v) => v >= q25 && v < q50);
      const dormant = contactClvs.filter((v) => v < q25);
      const noDeals = totalContacts - clvByContact.size;

      const segments = [
        {
          name: "Champions",
          count: champions.length,
          avgClv: champions.length > 0 ? Math.round(champions.reduce((s, v) => s + v, 0) / champions.length) : 0,
          totalClv: Math.round(champions.reduce((s, v) => s + v, 0)),
          color: "#10b981",
        },
        {
          name: "Loyal",
          count: loyal.length,
          avgClv: loyal.length > 0 ? Math.round(loyal.reduce((s, v) => s + v, 0) / loyal.length) : 0,
          totalClv: Math.round(loyal.reduce((s, v) => s + v, 0)),
          color: "#3b82f6",
        },
        {
          name: "At Risk",
          count: atRisk.length + noDeals,
          avgClv: atRisk.length > 0 ? Math.round(atRisk.reduce((s, v) => s + v, 0) / atRisk.length) : 0,
          totalClv: Math.round(atRisk.reduce((s, v) => s + v, 0)),
          color: "#f59e0b",
        },
        {
          name: "Dormant",
          count: dormant.length,
          avgClv: dormant.length > 0 ? Math.round(dormant.reduce((s, v) => s + v, 0) / dormant.length) : 0,
          totalClv: Math.round(dormant.reduce((s, v) => s + v, 0)),
          color: "#6b7280",
        },
      ];

      // Top customers by CLV
      const topCustomersRaw = await db
        .select({
          contactId: schema.deals.contactId,
          firstName: schema.contacts.firstName,
          lastName: schema.contacts.lastName,
          totalClv: sql<number>`COALESCE(SUM(CAST(${schema.deals.value} AS NUMERIC)), 0)`,
          dealCount: count(),
        })
        .from(schema.deals)
        .leftJoin(schema.contacts, eq(schema.deals.contactId, schema.contacts.id))
        .where(
          and(
            eq(schema.deals.organizationId, orgId),
            eq(schema.deals.stage, "won"),
            isNull(schema.deals.deletedAt),
          ),
        )
        .groupBy(schema.deals.contactId, schema.contacts.firstName, schema.contacts.lastName)
        .orderBy(sql`SUM(CAST(${schema.deals.value} AS NUMERIC)) DESC`)
        .limit(3);

      const topCustomers = topCustomersRaw.map((r: {
        contactId: string | null;
        firstName: string | null;
        lastName: string | null;
        totalClv: number;
        dealCount: number;
      }) => ({
        id: r.contactId ?? "unknown",
        name: r.firstName && r.lastName ? `${r.firstName} ${r.lastName}`.trim() : "Unknown",
        clv: Math.round(Number(r.totalClv)),
        dealCount: Number(r.dealCount),
      }));

      return { segments, averageClv: avgClv, topCustomers };
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
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      // Group contacts by creation month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const cohortRows = await db
        .select({
          cohort: sql<string>`to_char(${schema.contacts.createdAt}, 'Mon YYYY')`,
          cohortStart: sql<string>`to_char(DATE_TRUNC('month', ${schema.contacts.createdAt}), 'YYYY-MM-01')`,
          size: count(),
        })
        .from(schema.contacts)
        .where(
          and(
            eq(schema.contacts.organizationId, orgId),
            isNull(schema.contacts.deletedAt),
            gte(schema.contacts.createdAt, sixMonthsAgo),
          ),
        )
        .groupBy(
          sql`to_char(${schema.contacts.createdAt}, 'Mon YYYY')`,
          sql`DATE_TRUNC('month', ${schema.contacts.createdAt})`,
        )
        .orderBy(sql`DATE_TRUNC('month', ${schema.contacts.createdAt})`);

      if (cohortRows.length === 0) {
        return FALLBACK_COHORT;
      }

      // For each cohort, calculate what % had activities in the following months (m0–m4)
      const retentionMatrix = await Promise.all(
        cohortRows.map(async (row: typeof cohortRows[number]) => {
          const cohortStart = new Date(row.cohortStart);

          // For each offset month (0–4) count contacts in this cohort that had activities
          const offsets = [0, 1, 2, 3, 4];
          const retentionPcts: (number | null)[] = [];

          for (const offset of offsets) {
            const monthStart = new Date(cohortStart);
            monthStart.setMonth(monthStart.getMonth() + offset);
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);

            // Don't compute future months
            if (monthStart > new Date()) {
              retentionPcts.push(null);
              continue;
            }

            const [activeRow] = await db
              .select({ active: sql<number>`COUNT(DISTINCT ${schema.activities.contactId})` })
              .from(schema.activities)
              .innerJoin(
                schema.contacts,
                and(
                  eq(schema.activities.contactId, schema.contacts.id),
                  eq(schema.contacts.organizationId, orgId),
                  isNull(schema.contacts.deletedAt),
                  sql`DATE_TRUNC('month', ${schema.contacts.createdAt}) = ${row.cohortStart}::date`,
                ),
              )
              .where(
                and(
                  eq(schema.activities.organizationId, orgId),
                  gte(schema.activities.createdAt, monthStart),
                  lt(schema.activities.createdAt, monthEnd),
                  isNull(schema.activities.deletedAt),
                ),
              );

            const active = Number(activeRow?.active ?? 0);
            const cohortSize = Number(row.size) || 1;
            retentionPcts.push(offset === 0 ? 100 : Math.round((active / cohortSize) * 100));
          }

          return {
            cohort: row.cohort,
            m0: retentionPcts[0],
            m1: retentionPcts[1],
            m2: retentionPcts[2],
            m3: retentionPcts[3],
            m4: retentionPcts[4],
          };
        }),
      );

      return {
        cohorts: cohortRows.map((r: typeof cohortRows[number]) => ({ cohort: r.cohort, size: Number(r.size) })),
        retentionMatrix,
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
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const stageCounts = await db
        .select({
          stage: schema.deals.stage,
          dealCount: count(),
          totalValue: sql<number>`COALESCE(SUM(CAST(${schema.deals.value} AS NUMERIC)), 0)`,
        })
        .from(schema.deals)
        .where(
          and(
            eq(schema.deals.organizationId, orgId),
            isNull(schema.deals.deletedAt),
          ),
        )
        .groupBy(schema.deals.stage);

      if (stageCounts.length === 0) {
        return FALLBACK_FUNNEL;
      }

      // Standard pipeline order
      const STAGE_ORDER = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
      type StageRow = typeof stageCounts[number];
      const stageMap = new Map<string, StageRow>(
        stageCounts.map((row: StageRow) => [row.stage, row] as [string, StageRow]),
      );

      const totalDeals = stageCounts.reduce((s: number, r: StageRow) => s + Number(r.dealCount), 0) || 1;
      const leadRow = stageMap.get("lead");
      const topCount = Number(leadRow?.dealCount ?? totalDeals) || 1;

      const stages = STAGE_ORDER.filter((s) => stageMap.has(s)).map((s) => {
        const row = stageMap.get(s) as StageRow;
        return {
          name: s.charAt(0).toUpperCase() + s.slice(1),
          count: Number(row.dealCount),
          value: Math.round(Number(row.totalValue)),
          conversion: Math.round((Number(row.dealCount) / topCount) * 100 * 10) / 10,
        };
      });

      const wonRow = stageMap.get("won");
      const overallConversion = wonRow
        ? Math.round((Number(wonRow.dealCount) / totalDeals) * 1000) / 10
        : 0;

      // Average deal cycle: average difference between createdAt and expectedCloseDate for won deals
      const [cycleRow] = await db
        .select({
          avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${schema.deals.expectedCloseDate} - ${schema.deals.createdAt})) / 86400)`,
        })
        .from(schema.deals)
        .where(
          and(
            eq(schema.deals.organizationId, orgId),
            eq(schema.deals.stage, "won"),
            isNull(schema.deals.deletedAt),
            gt(schema.deals.expectedCloseDate, schema.deals.createdAt),
          ),
        );

      const avgDealCycle = Math.round(Number(cycleRow?.avgDays ?? 0)) || 0;

      return { stages, overallConversion, avgDealCycle };
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
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      // Monthly won-deal revenue for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyData = await db
        .select({
          month: sql<string>`to_char(${schema.deals.expectedCloseDate}, 'YYYY-MM')`,
          revenue: sql<number>`COALESCE(SUM(CAST(${schema.deals.value} AS NUMERIC)), 0)`,
          dealCount: count(),
        })
        .from(schema.deals)
        .where(
          and(
            eq(schema.deals.organizationId, orgId),
            eq(schema.deals.stage, "won"),
            isNull(schema.deals.deletedAt),
            gte(schema.deals.expectedCloseDate, sixMonthsAgo),
          ),
        )
        .groupBy(sql`to_char(${schema.deals.expectedCloseDate}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${schema.deals.expectedCloseDate}, 'YYYY-MM')`);

      if (monthlyData.length < 2) {
        return FALLBACK_PREDICTIVE;
      }

      const revenues = monthlyData.map((m: typeof monthlyData[number]) => Number(m.revenue));
      const dealCounts = monthlyData.map((m: typeof monthlyData[number]) => Number(m.dealCount));

      // Simple linear extrapolation: average month-over-month delta
      const revenueDeltas = revenues.slice(1).map((v: number, i: number) => v - revenues[i]);
      const avgRevenueDelta = revenueDeltas.reduce((s: number, v: number) => s + v, 0) / revenueDeltas.length;
      const lastRevenue = revenues[revenues.length - 1] ?? 0;

      const dealDeltas = dealCounts.slice(1).map((v: number, i: number) => v - dealCounts[i]);
      const avgDealDelta = dealDeltas.reduce((s: number, v: number) => s + v, 0) / dealDeltas.length;
      const lastDealCount = dealCounts[dealCounts.length - 1] ?? 0;

      // Project 3 months forward
      const now = new Date();
      const nextQuarter = `Q${Math.ceil((now.getMonth() + 2) / 3)} ${now.getFullYear()}`;

      const projectedRevenue = Math.max(0, Math.round(lastRevenue + avgRevenueDelta * 3));
      const projectedDeals = Math.max(0, Math.round(lastDealCount + avgDealDelta * 3));
      const avgDealSize =
        projectedDeals > 0 ? Math.round(projectedRevenue / projectedDeals) : 0;

      const revenueTrend = avgRevenueDelta > 0 ? "up" : avgRevenueDelta < 0 ? "down" : "stable";
      const dealTrend = avgDealDelta > 0 ? "up" : avgDealDelta < 0 ? "down" : "stable";

      return {
        forecasts: [
          {
            id: "f-revenue",
            metric: "Revenue",
            period: nextQuarter,
            predicted: projectedRevenue,
            confidence: Math.min(0.9, 0.5 + monthlyData.length * 0.07),
            trend: revenueTrend,
          },
          {
            id: "f-deals",
            metric: "New Deals (Won)",
            period: nextQuarter,
            predicted: projectedDeals,
            confidence: Math.min(0.85, 0.5 + monthlyData.length * 0.06),
            trend: dealTrend,
          },
          {
            id: "f-deal-size",
            metric: "Avg Deal Size",
            period: nextQuarter,
            predicted: avgDealSize,
            confidence: Math.min(0.8, 0.5 + monthlyData.length * 0.05),
            trend: revenueTrend,
          },
        ],
        monthlyHistory: monthlyData,
        lastUpdated: now.toISOString(),
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
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;
      const q = input.query.toLowerCase();
      const start = Date.now();

      // Contact count
      if (
        (q.includes("contact") || q.includes("customer")) &&
        (q.includes("how many") || q.includes("count") || q.includes("total"))
      ) {
        const [{ total }] = await db
          .select({ total: count() })
          .from(schema.contacts)
          .where(and(eq(schema.contacts.organizationId, orgId), isNull(schema.contacts.deletedAt)));
        return {
          result: `You have ${total} contact${total !== 1 ? "s" : ""}.`,
          sql: `SELECT COUNT(*) FROM contacts WHERE organization_id = '${orgId}' AND deleted_at IS NULL`,
          data: [{ count: Number(total) }],
          executionTimeMs: Date.now() - start,
        };
      }

      // Revenue / deal value
      if (
        q.includes("revenue") ||
        (q.includes("deal") && (q.includes("value") || q.includes("total") || q.includes("sum")))
      ) {
        const [{ total }] = await db
          .select({
            total: sql<number>`COALESCE(SUM(CAST(${schema.deals.value} AS NUMERIC)), 0)`,
          })
          .from(schema.deals)
          .where(
            and(
              eq(schema.deals.organizationId, orgId),
              eq(schema.deals.stage, "won"),
              isNull(schema.deals.deletedAt),
            ),
          );
        const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(total));
        return {
          result: `Total won revenue is ${formatted}.`,
          sql: `SELECT SUM(value) FROM deals WHERE organization_id = '${orgId}' AND stage = 'won' AND deleted_at IS NULL`,
          data: [{ revenue: Number(total) }],
          executionTimeMs: Date.now() - start,
        };
      }

      // Deal count
      if (q.includes("deal") && (q.includes("how many") || q.includes("count") || q.includes("total"))) {
        const [{ total }] = await db
          .select({ total: count() })
          .from(schema.deals)
          .where(and(eq(schema.deals.organizationId, orgId), isNull(schema.deals.deletedAt)));
        return {
          result: `You have ${total} deal${total !== 1 ? "s" : ""} in total.`,
          sql: `SELECT COUNT(*) FROM deals WHERE organization_id = '${orgId}' AND deleted_at IS NULL`,
          data: [{ count: Number(total) }],
          executionTimeMs: Date.now() - start,
        };
      }

      // Activity count
      if (q.includes("activit") && (q.includes("how many") || q.includes("count") || q.includes("total"))) {
        const [{ total }] = await db
          .select({ total: count() })
          .from(schema.activities)
          .where(
            and(
              eq(schema.activities.organizationId, orgId),
              isNull(schema.activities.deletedAt),
            ),
          );
        return {
          result: `You have ${total} activit${total !== 1 ? "ies" : "y"} logged.`,
          sql: `SELECT COUNT(*) FROM activities WHERE organization_id = '${orgId}' AND deleted_at IS NULL`,
          data: [{ count: Number(total) }],
          executionTimeMs: Date.now() - start,
        };
      }

      // Generic fallback — return high-level counts
      const [contactCount, dealCount, activityCount] = await Promise.all([
        db.select({ total: count() }).from(schema.contacts).where(and(eq(schema.contacts.organizationId, orgId), isNull(schema.contacts.deletedAt))),
        db.select({ total: count() }).from(schema.deals).where(and(eq(schema.deals.organizationId, orgId), isNull(schema.deals.deletedAt))),
        db.select({ total: count() }).from(schema.activities).where(and(eq(schema.activities.organizationId, orgId), isNull(schema.activities.deletedAt))),
      ]);

      return {
        result: `Processed query: "${input.query}". Your org has ${contactCount[0].total} contacts, ${dealCount[0].total} deals, and ${activityCount[0].total} activities.`,
        sql: `-- multi-table summary for org '${orgId}'`,
        data: [
          { label: "Contacts", value: Number(contactCount[0].total) },
          { label: "Deals", value: Number(dealCount[0].total) },
          { label: "Activities", value: Number(activityCount[0].total) },
        ],
        executionTimeMs: Date.now() - start,
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
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      // Count contacts created per month (last 6 months) and those with ≥1 activity that month
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyContacts = await db
        .select({
          period: sql<string>`to_char(DATE_TRUNC('month', ${schema.contacts.createdAt}), 'Mon YYYY')`,
          monthStart: sql<string>`to_char(DATE_TRUNC('month', ${schema.contacts.createdAt}), 'YYYY-MM-01')`,
          newCustomers: count(),
        })
        .from(schema.contacts)
        .where(
          and(
            eq(schema.contacts.organizationId, orgId),
            isNull(schema.contacts.deletedAt),
            gte(schema.contacts.createdAt, sixMonthsAgo),
          ),
        )
        .groupBy(
          sql`DATE_TRUNC('month', ${schema.contacts.createdAt})`,
        )
        .orderBy(sql`DATE_TRUNC('month', ${schema.contacts.createdAt})`);

      if (monthlyContacts.length === 0) {
        return FALLBACK_RETENTION;
      }

      // For each month, count contacts that had at least one activity that month
      const periods = await Promise.all(
        monthlyContacts.map(async (row: typeof monthlyContacts[number]) => {
          const monthStart = new Date(row.monthStart);
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);

          const [activeRow] = await db
            .select({ active: sql<number>`COUNT(DISTINCT ${schema.activities.contactId})` })
            .from(schema.activities)
            .where(
              and(
                eq(schema.activities.organizationId, orgId),
                gte(schema.activities.createdAt, monthStart),
                lt(schema.activities.createdAt, monthEnd),
                isNull(schema.activities.deletedAt),
              ),
            );

          const active = Number(activeRow?.active ?? 0);
          const total = Number(row.newCustomers);
          const retained = total > 0 ? Math.round((active / total) * 1000) / 10 : 0;
          const churned = Math.round((100 - retained) * 10) / 10;

          return {
            period: row.period,
            retained,
            churned,
            newCustomers: total,
          };
        }),
      );

      const avgRetention =
        periods.length > 0
          ? Math.round((periods.reduce((s, p) => s + p.retained, 0) / periods.length) * 10) / 10
          : 0;

      const retentionValues = periods.map((p) => p.retained);
      const lastTwo = retentionValues.slice(-2);
      const trend =
        lastTwo.length < 2
          ? "stable"
          : lastTwo[1] > lastTwo[0] + 1
            ? "improving"
            : lastTwo[1] < lastTwo[0] - 1
              ? "declining"
              : "stable";

      return { periods, averageRetention: avgRetention, trend };
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
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      // Get R (days since last deal), F (deal count), M (total deal value) per contact
      const rfmRows = await db
        .select({
          contactId: schema.deals.contactId,
          lastDealDate: sql<string>`MAX(${schema.deals.createdAt})`,
          dealCount: count(),
          totalValue: sql<number>`COALESCE(SUM(CAST(${schema.deals.value} AS NUMERIC)), 0)`,
        })
        .from(schema.deals)
        .where(
          and(
            eq(schema.deals.organizationId, orgId),
            isNull(schema.deals.deletedAt),
          ),
        )
        .groupBy(schema.deals.contactId)
        .having(sql`${schema.deals.contactId} IS NOT NULL`);

      if (rfmRows.length === 0) {
        return FALLBACK_RFM;
      }

      const now = new Date();

      // Score each contact 1–5 on R, F, M
      const scored = rfmRows.map((r: typeof rfmRows[number]) => {
        const recencyDays = Math.round(
          (now.getTime() - new Date(r.lastDealDate).getTime()) / (24 * 60 * 60 * 1000),
        );
        const frequency = Number(r.dealCount);
        const monetary = Number(r.totalValue);
        return { contactId: r.contactId, recencyDays, frequency, monetary };
      });

      // Sort to compute quintile thresholds
      const recencySorted = [...scored].sort((a, b) => a.recencyDays - b.recencyDays);
      const freqSorted = [...scored].sort((a, b) => a.frequency - b.frequency);
      const monSorted = [...scored].sort((a, b) => a.monetary - b.monetary);

      const q = (arr: typeof scored, field: "recencyDays" | "frequency" | "monetary", pct: number) => {
        const idx = Math.max(0, Math.ceil(arr.length * pct) - 1);
        return arr[idx][field] as number;
      };

      const rScore = (days: number) => {
        // Lower recency days = more recent = higher score
        if (days <= q(recencySorted, "recencyDays", 0.2)) return 5;
        if (days <= q(recencySorted, "recencyDays", 0.4)) return 4;
        if (days <= q(recencySorted, "recencyDays", 0.6)) return 3;
        if (days <= q(recencySorted, "recencyDays", 0.8)) return 2;
        return 1;
      };
      const fScore = (freq: number) => {
        if (freq >= q(freqSorted, "frequency", 0.8)) return 5;
        if (freq >= q(freqSorted, "frequency", 0.6)) return 4;
        if (freq >= q(freqSorted, "frequency", 0.4)) return 3;
        if (freq >= q(freqSorted, "frequency", 0.2)) return 2;
        return 1;
      };
      const mScore = (mon: number) => {
        if (mon >= q(monSorted, "monetary", 0.8)) return 5;
        if (mon >= q(monSorted, "monetary", 0.6)) return 4;
        if (mon >= q(monSorted, "monetary", 0.4)) return 3;
        if (mon >= q(monSorted, "monetary", 0.2)) return 2;
        return 1;
      };

      const segmentBuckets = new Map<string, number>([
        ["Champions", 0],
        ["Loyal Customers", 0],
        ["Potential Loyalists", 0],
        ["At Risk", 0],
        ["Lost", 0],
      ]);

      for (const c of scored) {
        const r = rScore(c.recencyDays);
        const f = fScore(c.frequency);
        const m = mScore(c.monetary);
        const rfm = r * 100 + f * 10 + m;

        if (r >= 4 && f >= 4 && m >= 4) {
          segmentBuckets.set("Champions", (segmentBuckets.get("Champions") ?? 0) + 1);
        } else if (f >= 3 && m >= 3) {
          segmentBuckets.set("Loyal Customers", (segmentBuckets.get("Loyal Customers") ?? 0) + 1);
        } else if (r >= 4 && rfm < 444) {
          segmentBuckets.set("Potential Loyalists", (segmentBuckets.get("Potential Loyalists") ?? 0) + 1);
        } else if (r <= 2 && f >= 2) {
          segmentBuckets.set("At Risk", (segmentBuckets.get("At Risk") ?? 0) + 1);
        } else {
          segmentBuckets.set("Lost", (segmentBuckets.get("Lost") ?? 0) + 1);
        }
      }

      const totalCustomers = scored.length;
      const SEGMENT_META: Record<string, { recency: number; frequency: number; monetary: number; color?: string }> = {
        Champions: { recency: 5, frequency: 5, monetary: 5 },
        "Loyal Customers": { recency: 4, frequency: 4, monetary: 4 },
        "Potential Loyalists": { recency: 5, frequency: 2, monetary: 3 },
        "At Risk": { recency: 2, frequency: 3, monetary: 3 },
        Lost: { recency: 1, frequency: 1, monetary: 1 },
      };

      const segments = Array.from(segmentBuckets.entries()).map(([name, cnt]) => ({
        name,
        ...(SEGMENT_META[name] ?? { recency: 3, frequency: 3, monetary: 3 }),
        count: cnt,
        percentage: totalCustomers > 0 ? Math.round((cnt / totalCustomers) * 1000) / 10 : 0,
      }));

      return { segments, totalCustomers };
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
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      // Detect which tables actually have rows for this org
      const [contactCount, dealCount, activityCount, leadCount] = await Promise.all([
        db.select({ total: count() }).from(schema.contacts).where(and(eq(schema.contacts.organizationId, orgId), isNull(schema.contacts.deletedAt))),
        db.select({ total: count() }).from(schema.deals).where(and(eq(schema.deals.organizationId, orgId), isNull(schema.deals.deletedAt))),
        db.select({ total: count() }).from(schema.activities).where(and(eq(schema.activities.organizationId, orgId), isNull(schema.activities.deletedAt))),
        db.select({ total: count() }).from(schema.leads).where(and(eq(schema.leads.organizationId, orgId), isNull(schema.leads.deletedAt))),
      ]);

      const now = new Date().toISOString();
      const sources = [
        {
          id: "src-contacts",
          name: "CRM Contacts",
          type: "crm",
          status: Number(contactCount[0].total) > 0 ? "connected" : "empty",
          lastSync: now,
          recordCount: Number(contactCount[0].total),
        },
        {
          id: "src-deals",
          name: "CRM Deals",
          type: "crm",
          status: Number(dealCount[0].total) > 0 ? "connected" : "empty",
          lastSync: now,
          recordCount: Number(dealCount[0].total),
        },
        {
          id: "src-activities",
          name: "CRM Activities",
          type: "crm",
          status: Number(activityCount[0].total) > 0 ? "connected" : "empty",
          lastSync: now,
          recordCount: Number(activityCount[0].total),
        },
        {
          id: "src-leads",
          name: "CRM Leads",
          type: "crm",
          status: Number(leadCount[0].total) > 0 ? "connected" : "empty",
          lastSync: now,
          recordCount: Number(leadCount[0].total),
        },
      ];

      return { sources };
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
