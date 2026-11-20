/**
 * Social Router
 *
 * Social media influencer and competitor tracking operations.
 */

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

const { socialInfluencers, socialCompetitors } = schema;

export const socialRouter = {
  /**
   * List saved influencers for the organization
   */
  "influencers.list": orgAuthed
    .route({
      method: "GET",
      path: "/social/influencers",
      summary: "List social influencers",
      tags: ["Social"],
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
        input: {
          page: number;
          limit: number;
          platform?: string;
          status?: string;
        };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;
        const orgId = context.organization.id;

        const conditions = [
          eq(socialInfluencers.organizationId, orgId),
          isNull(socialInfluencers.deletedAt),
        ];
        if (input.platform) {
          conditions.push(eq(socialInfluencers.platform, input.platform));
        }
        if (input.status) {
          conditions.push(eq(socialInfluencers.status, input.status));
        }
        const where = and(...conditions);

        const [all, paginated] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)` })
            .from(socialInfluencers)
            .where(where),
          db
            .select()
            .from(socialInfluencers)
            .where(where)
            .orderBy(desc(socialInfluencers.followersCount))
            .limit(input.limit)
            .offset(offset),
        ]);

        const total = Number(all[0]?.count ?? 0);

        return {
          data: paginated,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      },
    ),

  /**
   * Create a new influencer record
   */
  "influencers.create": orgAuthed
    .route({
      method: "POST",
      path: "/social/influencers",
      summary: "Create social influencer",
      tags: ["Social"],
    })
    .input(
      z.object({
        handle: z.string().min(1).max(255),
        platform: z.enum([
          "instagram",
          "tiktok",
          "youtube",
          "twitter",
          "linkedin",
        ]),
        followersCount: z.number().int().min(0).default(0),
        engagementRate: z.number().min(0).max(100).optional(),
        status: z.enum(["prospect", "active", "inactive"]).default("prospect"),
        metadata: z.record(z.unknown()).optional(),
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
          handle: string;
          platform: string;
          followersCount: number;
          engagementRate?: number;
          status: string;
          metadata?: Record<string, unknown>;
        };
      }) => {
        const db = getDb(context);
        const [influencer] = await db
          .insert(socialInfluencers)
          .values({
            organizationId: context.organization.id,
            handle: input.handle,
            platform: input.platform,
            followersCount: input.followersCount,
            engagementRate: input.engagementRate?.toString() ?? null,
            status: input.status,
            metadata: input.metadata ?? null,
            createdBy: context.user.id,
          })
          .returning();

        return influencer;
      },
    ),

  /**
   * List tracked competitors for the organization
   */
  "competitors.list": orgAuthed
    .route({
      method: "GET",
      path: "/social/competitors",
      summary: "List social competitors",
      tags: ["Social"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        platform: z.string().optional(),
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
        input: { page: number; limit: number; platform?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;
        const orgId = context.organization.id;

        const conditions = [
          eq(socialCompetitors.organizationId, orgId),
          isNull(socialCompetitors.deletedAt),
        ];
        if (input.platform) {
          conditions.push(eq(socialCompetitors.platform, input.platform));
        }
        const where = and(...conditions);

        const [all, paginated] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)` })
            .from(socialCompetitors)
            .where(where),
          db
            .select()
            .from(socialCompetitors)
            .where(where)
            .orderBy(desc(socialCompetitors.followersCount))
            .limit(input.limit)
            .offset(offset),
        ]);

        const total = Number(all[0]?.count ?? 0);

        return {
          data: paginated,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      },
    ),

  /**
   * Create a new competitor record
   */
  "competitors.create": orgAuthed
    .route({
      method: "POST",
      path: "/social/competitors",
      summary: "Create social competitor",
      tags: ["Social"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        handle: z.string().max(255).optional(),
        platform: z.enum([
          "instagram",
          "tiktok",
          "youtube",
          "twitter",
          "linkedin",
        ]),
        followersCount: z.number().int().min(0).default(0),
        engagementRate: z.number().min(0).max(100).optional(),
        notes: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
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
          handle?: string;
          platform: string;
          followersCount: number;
          engagementRate?: number;
          notes?: string;
          metadata?: Record<string, unknown>;
        };
      }) => {
        const db = getDb(context);
        const [competitor] = await db
          .insert(socialCompetitors)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            handle: input.handle ?? null,
            platform: input.platform,
            followersCount: input.followersCount,
            engagementRate: input.engagementRate?.toString() ?? null,
            notes: input.notes ?? null,
            metadata: input.metadata ?? null,
            createdBy: context.user.id,
          })
          .returning();

        return competitor;
      },
    ),
};
