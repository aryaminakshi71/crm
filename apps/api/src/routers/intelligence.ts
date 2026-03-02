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
            input.confidence !== undefined ? String(Math.max(0, Math.min(100, input.confidence))) : null,
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
            ? { confidence: String(Math.max(0, Math.min(100, input.confidence))) }
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
        .where(eq(schema.forecastSnapshots.organizationId, context.organization.id))
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
          ...(input.pipelineAmount !== undefined ? { pipelineAmount: String(input.pipelineAmount) } : {}),
          ...(input.winRate !== undefined ? { winRate: String(input.winRate) } : {}),
          ...(input.avgSalesCycleDays !== undefined ? { avgSalesCycleDays: input.avgSalesCycleDays } : {}),
          ...(input.projectedRevenue !== undefined ? { projectedRevenue: String(input.projectedRevenue) } : {}),
          ...(input.riskBand !== undefined ? { riskBand: input.riskBand } : {}),
          ...(input.confidence !== undefined ? { confidence: String(input.confidence) } : {}),
          ...(input.recommendations !== undefined ? { recommendations: input.recommendations } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.forecastSnapshots.id, input.id),
            eq(schema.forecastSnapshots.organizationId, context.organization.id),
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
            eq(schema.forecastSnapshots.organizationId, context.organization.id),
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
        .where(eq(schema.executiveKpiSnapshots.organizationId, context.organization.id))
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
          ...(input.metricKey !== undefined ? { metricKey: input.metricKey } : {}),
          ...(input.metricLabel !== undefined ? { metricLabel: input.metricLabel } : {}),
          ...(input.metricValue !== undefined ? { metricValue: String(input.metricValue) } : {}),
          ...(input.metricText !== undefined ? { metricText: input.metricText } : {}),
          ...(input.periodLabel !== undefined ? { periodLabel: input.periodLabel } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.executiveKpiSnapshots.id, input.id),
            eq(schema.executiveKpiSnapshots.organizationId, context.organization.id),
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
            eq(schema.executiveKpiSnapshots.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),
};
