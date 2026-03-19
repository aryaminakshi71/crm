/**
 * Advertising Router
 *
 * Programmatic advertising operations including conversion tracking,
 * OAuth connection management, and campaign data.
 */

import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, pub, schema } from "../procedures";

const { adConversions, integrationAccounts } = schema;

// Input schema for creating a conversion
const conversionInputSchema = z.object({
  leadId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  adNetwork: z.enum(["google_ads", "microsoft_ads", "facebook_ads"]).default("google_ads"),
  campaignId: z.string().optional(),
  adGroupId: z.string().optional(),
  conversionType: z.enum(["form_submission", "page_view", "purchase", "signup"]).default("form_submission"),
  conversionValue: z.number().optional(),
  formId: z.string().uuid().optional(),
  formName: z.string().optional(),
  pageUrl: z.string().optional(),
  pagePath: z.string().optional(),
  // UTM data
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  // Click IDs
  gclid: z.string().optional(),
  msclkid: z.string().optional(),
  fbclid: z.string().optional(),
});

// Input schema for connecting an ad account
const connectInputSchema = z.object({
  adNetwork: z.enum(["google_ads", "microsoft_ads", "facebook_ads"]),
  authCode: z.string().optional(), // For OAuth flow
  accessToken: z.string().optional(), // Direct token input
  refreshToken: z.string().optional(),
  customerId: z.string().optional(), // Google Ads Customer ID
  accountName: z.string().optional(),
});

export const advertisingRouter = {
  /**
   * Connect an ad network account (OAuth or manual token)
   */
  connect: orgAuthed
    .route({
      method: "POST",
      path: "/advertising/connect",
      summary: "Connect ad network account",
      tags: ["Advertising"],
    })
    .input(connectInputSchema)
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: z.infer<typeof connectInputSchema> }) => {
        const db = getDb(context);

        // Check if already connected
        const existing = await db
          .select()
          .from(integrationAccounts)
          .where(
            eq(integrationAccounts.organizationId, context.organization.id) &&
              eq(integrationAccounts.integrationType, input.adNetwork)
          );

        if (existing.length > 0) {
          // Update existing
          await db
            .update(integrationAccounts)
            .set({
              accessToken: input.accessToken || existing[0].accessToken,
              refreshToken: input.refreshToken || existing[0].refreshToken,
              config: {
                ...(existing[0].config as Record<string, unknown> || {}),
                customerId: input.customerId,
                accountName: input.accountName,
              },
              updatedAt: new Date(),
            })
            .where(eq(integrationAccounts.id, existing[0].id));

          return { success: true, message: `${input.adNetwork} account updated` };
        }

        // Create new connection
        await db.insert(integrationAccounts).values({
          organizationId: context.organization.id,
          integrationType: input.adNetwork,
          accountName: input.accountName || `${input.adNetwork} account`,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          config: {
            customerId: input.customerId,
          },
          isActive: true,
        });

        return { success: true, message: `${input.adNetwork} connected successfully` };
      },
    ),

  /**
   * Disconnect an ad network account
   */
  disconnect: orgAuthed
    .route({
      method: "DELETE",
      path: "/advertising/disconnect",
      summary: "Disconnect ad network",
      tags: ["Advertising"],
    })
    .input(z.object({ adNetwork: z.enum(["google_ads", "microsoft_ads", "facebook_ads"]) }))
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { adNetwork: string } }) => {
        const db = getDb(context);

        await db
          .delete(integrationAccounts)
          .where(
            eq(integrationAccounts.organizationId, context.organization.id) &&
              eq(integrationAccounts.integrationType, input.adNetwork)
          );

        return { success: true, message: `${input.adNetwork} disconnected` };
      },
    ),

  /**
   * Get connection status for all ad networks
   */
  status: orgAuthed
    .route({
      method: "GET",
      path: "/advertising/status",
      summary: "Get ad network connection status",
      tags: ["Advertising"],
    })
    .output(
      z.array(
        z.object({
          adNetwork: z.string(),
          connected: z.boolean(),
          accountName: z.string().nullable(),
          lastSyncedAt: z.date().nullable(),
        }),
      ),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);

      const accounts = await db
        .select({
          integrationType: integrationAccounts.integrationType,
          accountName: integrationAccounts.accountName,
          updatedAt: integrationAccounts.updatedAt,
        })
        .from(integrationAccounts)
        .where(eq(integrationAccounts.organizationId, context.organization.id));

      const adNetworks = ["google_ads", "microsoft_ads", "facebook_ads"];

      return adNetworks.map((network) => {
        const account = accounts.find((a: typeof accounts[number]) => a.integrationType === network);
        return {
          adNetwork: network,
          connected: !!account,
          accountName: account?.accountName || null,
          lastSyncedAt: account?.updatedAt || null,
        };
      });
    }),

  /**
   * Track a conversion
   */
  trackConversion: orgAuthed
    .route({
      method: "POST",
      path: "/advertising/conversions",
      summary: "Track ad conversion",
      tags: ["Advertising"],
    })
    .input(conversionInputSchema)
    .output(z.object({ id: z.string().uuid(), success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: z.infer<typeof conversionInputSchema> }) => {
        const db = getDb(context);

        const [conversion] = await db
          .insert(adConversions)
          .values({
            organizationId: context.organization.id,
            leadId: input.leadId,
            contactId: input.contactId,
            adNetwork: input.adNetwork,
            conversionType: input.conversionType,
            conversionValue: input.conversionValue,
            campaignId: input.campaignId,
            adGroupId: input.adGroupId,
            formId: input.formId,
            formName: input.formName,
            pageUrl: input.pageUrl,
            pagePath: input.pagePath,
            // UTM data
            utmSource: input.utmSource,
            utmMedium: input.utmMedium,
            utmCampaign: input.utmCampaign,
            utmTerm: input.utmTerm,
            utmContent: input.utmContent,
            // Click IDs
            gclid: input.gclid,
            msclkid: input.msclkid,
            fbclid: input.fbclid,
            conversionTimestamp: new Date(),
          })
          .returning();

        return { id: conversion.id, success: true };
      },
    ),

  /**
   * List conversions with filtering
   */
  listConversions: orgAuthed
    .route({
      method: "GET",
      path: "/advertising/conversions",
      summary: "List ad conversions",
      tags: ["Advertising"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        adNetwork: z.enum(["google_ads", "microsoft_ads", "facebook_ads"]).optional(),
        campaignId: z.string().optional(),
        conversionType: z.enum(["form_submission", "page_view", "purchase", "signup"]).optional(),
        startDate: z.string().optional(), // ISO date string
        endDate: z.string().optional(),
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
      async ({ context, input }: { context: OrgContext; input: any }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(adConversions.organizationId, context.organization.id)];

        if (input.adNetwork) {
          conditions.push(eq(adConversions.adNetwork, input.adNetwork) as any);
        }
        if (input.campaignId) {
          conditions.push(eq(adConversions.campaignId, input.campaignId) as any);
        }
        if (input.conversionType) {
          conditions.push(eq(adConversions.conversionType, input.conversionType) as any);
        }
        if (input.startDate) {
          conditions.push(gte(adConversions.conversionTimestamp, new Date(input.startDate)) as any);
        }
        if (input.endDate) {
          conditions.push(lte(adConversions.conversionTimestamp, new Date(input.endDate)) as any);
        }

        const [totalResult] = await db
          .select({ count: count() })
          .from(adConversions)
          .where(and(...conditions) as any);

        const data = await db
          .select()
          .from(adConversions)
          .where(and(...conditions) as any)
          .orderBy(desc(adConversions.conversionTimestamp))
          .limit(input.limit)
          .offset(offset);

        return {
          data,
          total: totalResult.count,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(totalResult.count / input.limit),
        };
      },
    ),

  /**
   * Get dashboard overview stats
   */
  overview: orgAuthed
    .route({
      method: "GET",
      path: "/advertising/overview",
      summary: "Get advertising overview stats",
      tags: ["Advertising"],
    })
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .output(
      z.object({
        totalConversions: z.number(),
        totalValue: z.number(),
        byNetwork: z.array(
          z.object({
            adNetwork: z.string(),
            count: z.number(),
            value: z.number(),
          }),
        ),
        byCampaign: z.array(
          z.object({
            campaignId: z.string().nullable(),
            utmCampaign: z.string().nullable(),
            count: z.number(),
            value: z.number(),
          }),
        ),
        byType: z.array(
          z.object({
            conversionType: z.string(),
            count: z.number(),
          }),
        ),
        recentConversions: z.array(z.any()),
      }),
    )
    .handler(async ({ context, input }: { context: OrgContext; input: any }) => {
      const db = getDb(context);

      const conditions = [eq(adConversions.organizationId, context.organization.id)];

      if (input.startDate) {
        conditions.push(gte(adConversions.conversionTimestamp, new Date(input.startDate)) as any);
      }
      if (input.endDate) {
        conditions.push(lte(adConversions.conversionTimestamp, new Date(input.endDate)) as any);
      }

      const whereClause = and(...conditions) as any;

      // Total conversions
      const [totalResult] = await db
        .select({ count: count() })
        .from(adConversions)
        .where(whereClause);

      // Total value
      const [valueResult] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${adConversions.conversionValue}), 0)`,
        })
        .from(adConversions)
        .where(whereClause);

      // By network
      const byNetwork = await db
        .select({
          adNetwork: adConversions.adNetwork,
          count: count(),
          value: sql<string>`COALESCE(SUM(${adConversions.conversionValue}), 0)`,
        })
        .from(adConversions)
        .where(whereClause)
        .groupBy(adConversions.adNetwork);

      // By campaign
      const byCampaign = await db
        .select({
          campaignId: adConversions.campaignId,
          utmCampaign: adConversions.utmCampaign,
          count: count(),
          value: sql<string>`COALESCE(SUM(${adConversions.conversionValue}), 0)`,
        })
        .from(adConversions)
        .where(whereClause)
        .groupBy(adConversions.campaignId, adConversions.utmCampaign)
        .orderBy(desc(sql`count`))
        .limit(10);

      // By type
      const byType = await db
        .select({
          conversionType: adConversions.conversionType,
          count: count(),
        })
        .from(adConversions)
        .where(whereClause)
        .groupBy(adConversions.conversionType);

      // Recent conversions
      const recentConversions = await db
        .select()
        .from(adConversions)
        .where(whereClause)
        .orderBy(desc(adConversions.conversionTimestamp))
        .limit(5);

      return {
        totalConversions: totalResult.count,
        totalValue: Number(valueResult.total) || 0,
        byNetwork: byNetwork.map((n: typeof byNetwork[number]) => ({
          adNetwork: n.adNetwork,
          count: n.count,
          value: Number(n.value) || 0,
        })),
        byCampaign: byCampaign.map((c: typeof byCampaign[number]) => ({
          campaignId: c.campaignId,
          utmCampaign: c.utmCampaign,
          count: c.count,
          value: Number(c.value) || 0,
        })),
        byType: byType.map((t: typeof byType[number]) => ({
          conversionType: t.conversionType,
          count: t.count,
        })),
        recentConversions,
      };
    }),

  /**
   * Get campaigns performance summary (mock data for now - real Google Ads API integration later)
   */
  campaigns: orgAuthed
    .route({
      method: "GET",
      path: "/advertising/campaigns",
      summary: "Get campaign performance",
      tags: ["Advertising"],
    })
    .output(
      z.array(
        z.object({
          campaignId: z.string(),
          campaignName: z.string(),
          adNetwork: z.string(),
          impressions: z.number(),
          clicks: z.number(),
          cost: z.number(),
          conversions: z.number(),
          ctr: z.number(),
          cpc: z.number(),
          roas: z.number(),
        }),
      ),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      // For now, return data based on tracked conversions
      // Real implementation would call Google Ads API
      const db = getDb(context);

      const conversions = await db
        .select({
          campaignId: adConversions.campaignId,
          utmCampaign: adConversions.utmCampaign,
          adNetwork: adConversions.adNetwork,
          count: count(),
          value: sql<string>`COALESCE(SUM(${adConversions.conversionValue}), 0)`,
        })
        .from(adConversions)
        .where(eq(adConversions.organizationId, context.organization.id))
        .groupBy(adConversions.campaignId, adConversions.utmCampaign, adConversions.adNetwork);

      // Return mock data combined with tracked conversions
      return conversions.map((c: typeof conversions[number]) => ({
        campaignId: c.campaignId || "unknown",
        campaignName: c.utmCampaign || c.campaignId || "Direct Traffic",
        adNetwork: c.adNetwork,
        impressions: Math.floor(c.count * 25), // Mock: 25x impressions ratio
        clicks: Math.floor(c.count * 4), // Mock: 4x click ratio
        cost: Number(c.value) * 0.5, // Mock: CPC of $0.50 per conversion value
        conversions: c.count,
        ctr: 4.0, // Mock CTR
        cpc: 0.125, // Mock CPC
        roas: 4.0, // Mock ROAS
      }));
    }),

  /**
   * Sync a conversion to the ad network (for enhanced conversions)
   */
  syncConversion: orgAuthed
    .route({
      method: "POST",
      path: "/advertising/conversions/:id/sync",
      summary: "Sync conversion to ad network",
      tags: ["Advertising"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), error: z.string().optional() }))
    .handler(async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
      const db = getDb(context);

      const [conversion] = await db
        .select()
        .from(adConversions)
        .where(eq(adConversions.id, input.id));

      if (!conversion) {
        return { success: false, error: "Conversion not found" };
      }

      // Check if already synced
      if (conversion.syncedToAdNetwork) {
        return { success: true }; // Already synced
      }

      // TODO: Implement actual Google Ads API sync here
      // For now, just mark as synced
      await db
        .update(adConversions)
        .set({
          syncedToAdNetwork: true,
          syncedAt: new Date(),
        })
        .where(eq(adConversions.id, input.id));

      return { success: true };
    }),
};
