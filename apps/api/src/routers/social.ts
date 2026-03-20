/**
 * Social Media Router (Fanbean API)
 *
 * Social accounts, posts, analytics, listening, and campaigns.
 */

import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError, ErrorCode } from "../lib/errors";
import { getDb, requireModule, schema } from "../procedures";

const {
  socialAccounts,
  scheduledPosts,
  socialAnalytics,
  socialListeningAlerts,
  socialCampaigns,
} = schema;

// Social media scoped procedure with module check
const socialAuthed = requireModule("social_media");

export const socialRouter = {
  // ─── Accounts ──────────────────────────────────────────────────────────────

  // List Accounts
  listAccounts: socialAuthed
    .route({
      method: "GET",
      path: "/social/accounts",
      summary: "List social accounts",
      tags: ["Social Media"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        platform: z.string().optional(),
        status: z.string().optional(),
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
        input: { page: number; limit: number; platform?: string; status?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(socialAccounts.organizationId, context.organization.id)];
        if (input.platform) conditions.push(eq(socialAccounts.platform, input.platform));
        if (input.status) conditions.push(eq(socialAccounts.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(socialAccounts)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(socialAccounts)
          .where(whereConditions)
          .orderBy(desc(socialAccounts.connectedAt))
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

  // Connect Account
  connectAccount: socialAuthed
    .route({
      method: "POST",
      path: "/social/accounts",
      summary: "Connect social account",
      tags: ["Social Media"],
    })
    .input(
      z.object({
        platform: z.string().min(1),
        platformAccountId: z.string().min(1),
        username: z.string().optional(),
        displayName: z.string().optional(),
        accessToken: z.string(),
        refreshToken: z.string().optional(),
        profileData: z.object({
          bio: z.string().optional(),
          website: z.string().optional(),
          followers: z.number().optional(),
          following: z.number().optional(),
          posts: z.number().optional(),
        }).optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          platform: string;
          platformAccountId: string;
          username?: string;
          displayName?: string;
          accessToken: string;
          refreshToken?: string;
          profileData?: {
            bio?: string;
            website?: string;
            followers?: number;
            following?: number;
            posts?: number;
          };
        };
      }) => {
        const db = getDb(context);

        const [account] = await db
          .insert(socialAccounts)
          .values({
            organizationId: context.organization.id,
            platform: input.platform,
            platformAccountId: input.platformAccountId,
            username: input.username,
            displayName: input.displayName,
            accessToken: input.accessToken,
            refreshToken: input.refreshToken,
            profileData: input.profileData,
          })
          .returning();

        return account;
      },
    ),

  // Refresh Token
  refreshAccount: socialAuthed
    .route({
      method: "POST",
      path: "/social/accounts/:id/refresh",
      summary: "Refresh social account token",
      tags: ["Social Media"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        // TODO: Actually refresh the token with the platform

        const [account] = await db
          .update(socialAccounts)
          .set({
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(socialAccounts.id, input.id),
              eq(socialAccounts.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!account) {
          throw new APIError(ErrorCode.NOT_FOUND, "Social account not found", 404);
        }

        return account;
      },
    ),

  // Disconnect Account
  disconnectAccount: socialAuthed
    .route({
      method: "DELETE",
      path: "/social/accounts/:id",
      summary: "Disconnect social account",
      tags: ["Social Media"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [deleted] = await db
          .delete(socialAccounts)
          .where(
            and(
              eq(socialAccounts.id, input.id),
              eq(socialAccounts.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!deleted) {
          throw new APIError(ErrorCode.NOT_FOUND, "Social account not found", 404);
        }

        return { success: true };
      },
    ),

  // ─── Posts ─────────────────────────────────────────────────────────────────

  // List Posts
  listPosts: socialAuthed
    .route({
      method: "GET",
      path: "/social/posts",
      summary: "List scheduled posts",
      tags: ["Social Media"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        accountId: z.string().uuid().optional(),
        status: z.string().optional(),
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
        input: { page: number; limit: number; accountId?: string; status?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(scheduledPosts.organizationId, context.organization.id)];
        if (input.accountId) conditions.push(eq(scheduledPosts.accountId, input.accountId));
        if (input.status) conditions.push(eq(scheduledPosts.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(scheduledPosts)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(scheduledPosts)
          .where(whereConditions)
          .orderBy(desc(scheduledPosts.scheduledFor))
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

  // Schedule Post
  schedulePost: socialAuthed
    .route({
      method: "POST",
      path: "/social/posts/schedule",
      summary: "Schedule a post",
      tags: ["Social Media"],
    })
    .input(
      z.object({
        accountId: z.string().uuid(),
        platform: z.string().min(1),
        content: z.string().min(1),
        mediaUrls: z.array(z.object({
          type: z.string(),
          url: z.string(),
          thumbnailUrl: z.string().optional(),
        })).optional(),
        scheduledFor: z.string().datetime(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          accountId: string;
          platform: string;
          content: string;
          mediaUrls?: Array<{ type: string; url: string; thumbnailUrl?: string }>;
          scheduledFor: string;
        };
      }) => {
        const db = getDb(context);

        const [post] = await db
          .insert(scheduledPosts)
          .values({
            organizationId: context.organization.id,
            accountId: input.accountId,
            platform: input.platform,
            content: input.content,
            mediaUrls: input.mediaUrls || [],
            scheduledFor: new Date(input.scheduledFor),
            status: "scheduled",
            createdBy: context.user.id,
          })
          .returning();

        return post;
      },
    ),

  // Publish Now
  publishPost: socialAuthed
    .route({
      method: "POST",
      path: "/social/posts/:id/publish",
      summary: "Publish post now",
      tags: ["Social Media"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        // TODO: Actually publish to the social platform

        const [post] = await db
          .update(scheduledPosts)
          .set({
            status: "published",
            publishedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(scheduledPosts.id, input.id),
              eq(scheduledPosts.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!post) {
          throw new APIError(ErrorCode.NOT_FOUND, "Post not found", 404);
        }

        return post;
      },
    ),

  // Delete Scheduled Post
  deletePost: socialAuthed
    .route({
      method: "DELETE",
      path: "/social/posts/:id",
      summary: "Delete scheduled post",
      tags: ["Social Media"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [deleted] = await db
          .delete(scheduledPosts)
          .where(
            and(
              eq(scheduledPosts.id, input.id),
              eq(scheduledPosts.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!deleted) {
          throw new APIError(ErrorCode.NOT_FOUND, "Post not found", 404);
        }

        return { success: true };
      },
    ),

  // Get Post Analytics
  getPostAnalytics: socialAuthed
    .route({
      method: "GET",
      path: "/social/posts/:id/analytics",
      summary: "Get post analytics",
      tags: ["Social Media"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [post] = await db
          .select()
          .from(scheduledPosts)
          .where(
            and(
              eq(scheduledPosts.id, input.id),
              eq(scheduledPosts.organizationId, context.organization.id),
            ),
          );

        if (!post) {
          throw new APIError(ErrorCode.NOT_FOUND, "Post not found", 404);
        }

        return post.engagement || { likes: 0, comments: 0, shares: 0, views: 0, clicks: 0 };
      },
    ),

  // ─── Analytics ─────────────────────────────────────────────────────────────

  // Get Analytics Overview
  getAnalyticsOverview: socialAuthed
    .route({
      method: "GET",
      path: "/social/analytics/overview",
      summary: "Get social analytics overview",
      tags: ["Social Media"],
    })
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
    )
    .output(
      z.object({
        totalFollowers: z.number(),
        totalEngagement: z.number(),
        totalPosts: z.number(),
        totalReach: z.number(),
        accounts: z.array(z.any()),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { dateFrom?: string; dateTo?: string };
      }) => {
        const db = getDb(context);

        const accounts = await db
          .select()
          .from(socialAccounts)
          .where(eq(socialAccounts.organizationId, context.organization.id));

        // Calculate totals from profile data
        let totalFollowers = 0;
        let totalPosts = 0;
        for (const account of accounts) {
          totalFollowers += account.profileData?.followers || 0;
          totalPosts += account.profileData?.posts || 0;
        }

        // Get analytics data
        const conditions = [eq(socialAnalytics.organizationId, context.organization.id)];
        if (input.dateFrom) conditions.push(gte(socialAnalytics.date, new Date(input.dateFrom)));
        if (input.dateTo) conditions.push(lte(socialAnalytics.date, new Date(input.dateTo)));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const analytics = await db
          .select()
          .from(socialAnalytics)
          .where(whereConditions)
          .orderBy(desc(socialAnalytics.date));

        let totalEngagement = 0;
        let totalReach = 0;
        for (const a of analytics) {
          totalEngagement += a.engagement || 0;
          totalReach += a.reach || 0;
        }

        return {
          totalFollowers,
          totalEngagement,
          totalPosts,
          totalReach,
          accounts,
        };
      },
    ),

  // Get Account Analytics
  getAccountAnalytics: socialAuthed
    .route({
      method: "GET",
      path: "/social/analytics/:accountId",
      summary: "Get account analytics",
      tags: ["Social Media"],
    })
    .input(
      z.object({
        accountId: z.string().uuid(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
    )
    .output(z.array(z.any()))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { accountId: string; dateFrom?: string; dateTo?: string };
      }) => {
        const db = getDb(context);

        const conditions = [
          eq(socialAnalytics.accountId, input.accountId),
          eq(socialAnalytics.organizationId, context.organization.id),
        ];
        if (input.dateFrom) conditions.push(gte(socialAnalytics.date, new Date(input.dateFrom)));
        if (input.dateTo) conditions.push(lte(socialAnalytics.date, new Date(input.dateTo)));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const data = await db
          .select()
          .from(socialAnalytics)
          .where(whereConditions)
          .orderBy(desc(socialAnalytics.date));

        return data;
      },
    ),

  // ─── Listening ──────────────────────────────────────────────────────────────

  // List Listening Alerts
  listAlerts: socialAuthed
    .route({
      method: "GET",
      path: "/social/listening/alerts",
      summary: "List social listening alerts",
      tags: ["Social Media"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        alertType: z.string().optional(),
        isRead: z.boolean().optional(),
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
        input: { page: number; limit: number; alertType?: string; isRead?: boolean };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(socialListeningAlerts.organizationId, context.organization.id)];
        if (input.alertType) conditions.push(eq(socialListeningAlerts.alertType, input.alertType));
        if (input.isRead !== undefined) conditions.push(eq(socialListeningAlerts.isRead, input.isRead));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(socialListeningAlerts)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(socialListeningAlerts)
          .where(whereConditions)
          .orderBy(desc(socialListeningAlerts.detectedAt))
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

  // Create Listening Alert
  createAlert: socialAuthed
    .route({
      method: "POST",
      path: "/social/listening/alerts",
      summary: "Create social listening alert",
      tags: ["Social Media"],
    })
    .input(
      z.object({
        keyword: z.string().min(1),
        platform: z.string().optional(),
        alertType: z.string(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { keyword: string; platform?: string; alertType: string };
      }) => {
        const db = getDb(context);

        const [alert] = await db
          .insert(socialListeningAlerts)
          .values({
            organizationId: context.organization.id,
            keyword: input.keyword,
            platform: input.platform,
            alertType: input.alertType,
          })
          .returning();

        return alert;
      },
    ),

  // List Mentions
  listMentions: socialAuthed
    .route({
      method: "GET",
      path: "/social/listening/mentions",
      summary: "List mentions",
      tags: ["Social Media"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        keyword: z.string().optional(),
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
        input: { page: number; limit: number; keyword?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [
          eq(socialListeningAlerts.organizationId, context.organization.id),
          eq(socialListeningAlerts.alertType, "mention"),
        ];
        if (input.keyword) conditions.push(eq(socialListeningAlerts.keyword, input.keyword));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(socialListeningAlerts)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(socialListeningAlerts)
          .where(whereConditions)
          .orderBy(desc(socialListeningAlerts.detectedAt))
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

  // ─── Campaigns ──────────────────────────────────────────────────────────────

  // List Campaigns
  listCampaigns: socialAuthed
    .route({
      method: "GET",
      path: "/social/campaigns",
      summary: "List social campaigns",
      tags: ["Social Media"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        status: z.string().optional(),
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
        input: { page: number; limit: number; status?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(socialCampaigns.organizationId, context.organization.id)];
        if (input.status) conditions.push(eq(socialCampaigns.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(socialCampaigns)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(socialCampaigns)
          .where(whereConditions)
          .orderBy(desc(socialCampaigns.createdAt))
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

  // Create Campaign
  createCampaign: socialAuthed
    .route({
      method: "POST",
      path: "/social/campaigns",
      summary: "Create social campaign",
      tags: ["Social Media"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        platforms: z.array(z.string()),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        content: z.string().optional(),
        budget: z.number().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          name: string;
          description?: string;
          platforms: string[];
          startDate?: string;
          endDate?: string;
          content?: string;
          budget?: number;
        };
      }) => {
        const db = getDb(context);

        const [campaign] = await db
          .insert(socialCampaigns)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description,
            platforms: input.platforms,
            startDate: input.startDate ? new Date(input.startDate) : null,
            endDate: input.endDate ? new Date(input.endDate) : null,
            content: input.content,
            budget: input.budget,
            createdBy: context.user.id,
          })
          .returning();

        return campaign;
      },
    ),

  // Get Campaign
  getCampaign: socialAuthed
    .route({
      method: "GET",
      path: "/social/campaigns/:id",
      summary: "Get social campaign",
      tags: ["Social Media"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [campaign] = await db
          .select()
          .from(socialCampaigns)
          .where(
            and(
              eq(socialCampaigns.id, input.id),
              eq(socialCampaigns.organizationId, context.organization.id),
            ),
          );

        if (!campaign) {
          throw new APIError(ErrorCode.NOT_FOUND, "Campaign not found", 404);
        }

        return campaign;
      },
    ),

  // Update Campaign
  updateCampaign: socialAuthed
    .route({
      method: "PATCH",
      path: "/social/campaigns/:id",
      summary: "Update social campaign",
      tags: ["Social Media"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        platforms: z.array(z.string()).optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        content: z.string().optional(),
        budget: z.number().optional(),
        status: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          id: string;
          name?: string;
          description?: string;
          platforms?: string[];
          startDate?: string;
          endDate?: string;
          content?: string;
          budget?: number;
          status?: string;
        };
      }) => {
        const db = getDb(context);

        const [campaign] = await db
          .update(socialCampaigns)
          .set({
            ...(input.name && { name: input.name }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.platforms && { platforms: input.platforms }),
            ...(input.startDate && { startDate: new Date(input.startDate) }),
            ...(input.endDate && { endDate: new Date(input.endDate) }),
            ...(input.content !== undefined && { content: input.content }),
            ...(input.budget !== undefined && { budget: input.budget }),
            ...(input.status && { status: input.status }),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(socialCampaigns.id, input.id),
              eq(socialCampaigns.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!campaign) {
          throw new APIError(ErrorCode.NOT_FOUND, "Campaign not found", 404);
        }

        return campaign;
      },
    ),
};
