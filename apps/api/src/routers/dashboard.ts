/**
 * Dashboard Router
 *
 * Dashboard statistics and metrics.
 */

import { getOrCache } from "@crm/storage/redis";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

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
      const db = getDb(context);

      const pipelineData = await db
        .select({
          stage: deals.stage,
          count: count(),
        })
        .from(deals)
        .where(eq(deals.organizationId, context.organization.id))
        .groupBy(deals.stage);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const revenueData = await db
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
        .orderBy(sql`DATE_TRUNC('month', ${deals.expectedCloseDate})`);

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
      const db = getDb(context);
      const orgId = context.organization.id;

      // Cache dashboard stats (5 minutes TTL - analytics data)
      return await getOrCache(
        `dashboard:stats:${orgId}`,
        async () => {
          // Get all contacts
          const allContacts = await db
            .select()
            .from(contacts)
            .where(eq(contacts.organizationId, orgId));
          const totalContacts = allContacts.length;

          // Get all deals
          const allDeals = await db
            .select()
            .from(deals)
            .where(eq(deals.organizationId, orgId));

          const activeDeals = allDeals.filter(
            (d: any) => d.stage !== "won" && d.stage !== "lost",
          ).length;
          const wonDeals = allDeals.filter(
            (d: any) => d.stage === "won",
          ).length;
          const totalDeals = allDeals.length;

          const conversionRate =
            totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

          const revenue = allDeals
            .filter((d: any) => d.stage === "won")
            .reduce(
              (sum: number, d: any) => sum + (parseFloat(d.value) || 0),
              0,
            );

          const now = new Date();
          const thirtyDaysAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000,
          );
          const sixtyDaysAgo = new Date(
            now.getTime() - 60 * 24 * 60 * 60 * 1000,
          );

          const currentPeriodContacts = allContacts.filter((c: any) => {
            const createdAt = new Date(c.createdAt);
            return createdAt >= thirtyDaysAgo;
          }).length;

          const previousPeriodContacts = allContacts.filter((c: any) => {
            const createdAt = new Date(c.createdAt);
            return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
          }).length;

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
          const currentPeriodDeals = allDeals.filter((d: any) => {
            const createdAt = new Date(d.createdAt);
            return createdAt >= thirtyDaysAgo;
          }).length;

          const previousPeriodDeals = allDeals.filter((d: any) => {
            const createdAt = new Date(d.createdAt);
            return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
          }).length;

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

          // Pipeline stats
          const pipeline = [
            { stage: "lead", value: 0, count: 0 },
            { stage: "qualified", value: 0, count: 0 },
            { stage: "proposal", value: 0, count: 0 },
            { stage: "negotiation", value: 0, count: 0 },
            { stage: "won", value: 0, count: 0 },
          ];

          allDeals.forEach((deal: any) => {
            const stageIndex = pipeline.findIndex(
              (p) => p.stage === deal.stage,
            );
            if (stageIndex >= 0) {
              pipeline[stageIndex].count++;
              pipeline[stageIndex].value += parseFloat(deal.value) || 0;
            }
          });

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
