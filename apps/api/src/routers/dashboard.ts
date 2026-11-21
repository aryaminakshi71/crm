/**
 * Dashboard Router
 *
 * Dashboard statistics and metrics.
 */

import { getOrCache } from "@crm/storage/redis";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, getReadDb, orgAuthed, schema } from "../procedures";

const { contacts, deals, activities } = schema;

// Helper function to format time ago
function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return then.toLocaleDateString();
}

export const dashboardRouter = {
  /**
   * Dashboard chart data — pipeline stage breakdown and monthly revenue
   */
  charts: orgAuthed
    .route({ method: "GET", path: "/dashboard/charts", summary: "Dashboard chart data", tags: ["Dashboard"] })
    .input(z.object({}))
    .output(z.any())
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getReadDb(context);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const [pipelineData, revenueData] = await Promise.all([
        db
          .select({
            stage: deals.stage,
            count: count(),
          })
          .from(deals)
          .where(eq(deals.organizationId, context.organization.id))
          .groupBy(deals.stage),
        db
          .select({
            month: sql<string>`to_char(${deals.expectedCloseDate}, 'Mon')`,
            revenue: sql<number>`COALESCE(SUM(CAST(${deals.value} AS NUMERIC)), 0)`,
          })
          .from(deals)
          .where(
            and(
              eq(deals.organizationId, context.organization.id),
              eq(deals.stage, "won"),
              gte(deals.expectedCloseDate, sixMonthsAgo),
            )
          )
          .groupBy(sql`to_char(${deals.expectedCloseDate}, 'Mon'), DATE_TRUNC('month', ${deals.expectedCloseDate})`)
          .orderBy(sql`DATE_TRUNC('month', ${deals.expectedCloseDate})`),
      ]);

      const STAGE_COLORS: Record<string, string> = {
        lead: "#818cf8",
        qualified: "#a78bfa",
        proposal: "#22d3ee",
        negotiation: "#fbbf24",
        won: "#22c55e",
        lost: "#f87171",
      };

      return {
        pipeline: pipelineData.map((p: any) => ({
          name: p.stage ?? "Unknown",
          value: Number(p.count),
          color: STAGE_COLORS[p.stage ?? ""] ?? "#818cf8",
        })),
        revenue: revenueData.map((r: any) => ({
          month: r.month,
          revenue: Number(r.revenue),
          target: 0,
        })),
      };
    }),

  /**
   * Get dashboard statistics
   */
  stats: orgAuthed
    .route({
      method: "GET",
      path: "/dashboard/stats",
      summary: "Get dashboard statistics",
      tags: ["Dashboard"],
    })
    .input(z.object({}))
    .output(
      z.object({
        totalContacts: z.number(),
        activeDeals: z.number(),
        conversionRate: z.number(),
        revenue: z.number(),
        contactsChange: z.number(),
        dealsChange: z.number(),
        conversionChange: z.number(),
        revenueChange: z.number(),
        pipeline: z.array(
          z.object({
            stage: z.string(),
            value: z.number(),
            count: z.number(),
          }),
        ),
        recentActivities: z.array(
          z.object({
            id: z.string(),
            type: z.string(),
            message: z.string(),
            time: z.string(),
          }),
        ),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getReadDb(context);
      const orgId = context.organization.id;

      // Cache dashboard stats (5 minutes TTL - analytics data)
      return await getOrCache(
        `dashboard:stats:${orgId}`,
        async () => {
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

          // Aggregate in SQL instead of loading every row into memory.
          const [contactStats] = await db
            .select({
              total: sql<number>`count(*)::int`,
              current: sql<number>`count(*) FILTER (WHERE ${contacts.createdAt} >= ${thirtyDaysAgo})::int`,
              previous: sql<number>`count(*) FILTER (WHERE ${contacts.createdAt} >= ${sixtyDaysAgo} AND ${contacts.createdAt} < ${thirtyDaysAgo})::int`,
            })
            .from(contacts)
            .where(eq(contacts.organizationId, orgId));

          const [dealStats] = await db
            .select({
              total: sql<number>`count(*)::int`,
              active: sql<number>`count(*) FILTER (WHERE ${deals.stage} NOT IN ('won','lost'))::int`,
              won: sql<number>`count(*) FILTER (WHERE ${deals.stage} = 'won')::int`,
              revenue: sql<number>`COALESCE(SUM(${deals.value}::numeric) FILTER (WHERE ${deals.stage} = 'won'), 0)::float`,
              current: sql<number>`count(*) FILTER (WHERE ${deals.createdAt} >= ${thirtyDaysAgo})::int`,
              previous: sql<number>`count(*) FILTER (WHERE ${deals.createdAt} >= ${sixtyDaysAgo} AND ${deals.createdAt} < ${thirtyDaysAgo})::int`,
            })
            .from(deals)
            .where(eq(deals.organizationId, orgId));

          const totalContacts = Number(contactStats?.total ?? 0);
          const currentPeriodContacts = Number(contactStats?.current ?? 0);
          const previousPeriodContacts = Number(contactStats?.previous ?? 0);
          const totalDeals = Number(dealStats?.total ?? 0);
          const activeDeals = Number(dealStats?.active ?? 0);
          const wonDeals = Number(dealStats?.won ?? 0);
          const revenue = Number(dealStats?.revenue ?? 0);
          const currentPeriodDeals = Number(dealStats?.current ?? 0);
          const previousPeriodDeals = Number(dealStats?.previous ?? 0);

          const conversionRate =
            totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

          const contactsChange =
            previousPeriodContacts > 0
              ? Math.round(
                  ((currentPeriodContacts - previousPeriodContacts) /
                    previousPeriodContacts) *
                    100,
                )
              : currentPeriodContacts > 0
                ? 100
                : 0;

          const dealsChange =
            previousPeriodDeals > 0
              ? Math.round(
                  ((currentPeriodDeals - previousPeriodDeals) /
                    previousPeriodDeals) *
                    100,
                )
              : currentPeriodDeals > 0
                ? 100
                : 0;
          const conversionChange = 0;
          const revenueChange = 0;

          // Pipeline stats in SQL.
          const pipelineRows = await db
            .select({
              stage: deals.stage,
              count: sql<number>`count(*)::int`,
              value: sql<number>`COALESCE(SUM(${deals.value}::numeric), 0)::float`,
            })
            .from(deals)
            .where(eq(deals.organizationId, orgId))
            .groupBy(deals.stage);

          const pipeline = [
            { stage: "lead", value: 0, count: 0 },
            { stage: "qualified", value: 0, count: 0 },
            { stage: "proposal", value: 0, count: 0 },
            { stage: "negotiation", value: 0, count: 0 },
            { stage: "won", value: 0, count: 0 },
          ];
          for (const row of pipelineRows) {
            const idx = pipeline.findIndex((p) => p.stage === row.stage);
            if (idx >= 0) {
              pipeline[idx].count = Number(row.count);
              pipeline[idx].value = Number(row.value);
            }
          }

          // Recent activities
          const recentActivities = await db
            .select()
            .from(activities)
            .where(eq(activities.organizationId, orgId))
            .orderBy(desc(activities.createdAt))
            .limit(10)
            .then((rows: Array<typeof activities.$inferSelect>) =>
              rows.map((activity) => ({
                id: activity.id,
                type: activity.type,
                message: `${activity.type}: ${activity.subject}`,
                time: formatTimeAgo(activity.createdAt),
              })),
            );

          return {
            totalContacts,
            activeDeals,
            conversionRate,
            revenue: Math.round(revenue),
            contactsChange,
            dealsChange,
            conversionChange,
            revenueChange,
            pipeline,
            recentActivities,
          };
        },
        300, // 5 minutes TTL for analytics
      );
    }),
};
