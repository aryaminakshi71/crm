/**
 * Marketing Router
 * Campaigns, email templates, and analytics.
 */

import { and, count, desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

export const marketingRouter = {
  // ── Campaigns ──────────────────────────────────────────────────────────────

  listCampaigns: orgAuthed
    .route({
      method: "GET",
      path: "/marketing/campaigns",
      summary: "List campaigns",
      tags: ["Marketing"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        status: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(z.any()),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; status?: string; search?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions: any[] = [
          eq(schema.campaigns.organizationId, context.organization.id),
        ];
        if (input.status) {
          conditions.push(eq(schema.campaigns.status, input.status));
        }
        if (input.search) {
          conditions.push(ilike(schema.campaigns.name, `%${input.search}%`));
        }

        const where = and(...conditions);

        const [{ total }] = await db
          .select({ total: count() })
          .from(schema.campaigns)
          .where(where);

        const data = await db
          .select()
          .from(schema.campaigns)
          .where(where)
          .orderBy(desc(schema.campaigns.createdAt))
          .limit(input.limit)
          .offset(offset);

        return { data, total: total ?? 0, page: input.page, limit: input.limit };
      },
    ),

  createCampaign: orgAuthed
    .route({
      method: "POST",
      path: "/marketing/campaigns",
      summary: "Create campaign",
      tags: ["Marketing"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        type: z.string().default("multi_channel"),
        channel: z.string().default("email"),
        goal: z.string().optional(),
        budget: z.number().nonnegative().default(0),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: any;
      }) => {
        const db = getDb(context);
        const [campaign] = await db
          .insert(schema.campaigns)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            type: input.type,
            channel: input.channel,
            goal: input.goal || null,
            budget: String(input.budget),
            ownerId: context.user.id,
          })
          .returning();
        return campaign;
      },
    ),

  getCampaign: orgAuthed
    .route({
      method: "GET",
      path: "/marketing/campaigns/:id",
      summary: "Get campaign",
      tags: ["Marketing"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string };
      }) => {
        const db = getDb(context);
        const [campaign] = await db
          .select()
          .from(schema.campaigns)
          .where(
            and(
              eq(schema.campaigns.id, input.id),
              eq(schema.campaigns.organizationId, context.organization.id),
            ),
          );
        if (!campaign) {
          throw new Error("Campaign not found");
        }
        return campaign;
      },
    ),

  updateCampaign: orgAuthed
    .route({
      method: "PATCH",
      path: "/marketing/campaigns/:id",
      summary: "Update campaign",
      tags: ["Marketing"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        type: z.string().optional(),
        channel: z.string().optional(),
        status: z.string().optional(),
        goal: z.string().optional(),
        budget: z.number().nonnegative().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: any;
      }) => {
        const db = getDb(context);
        const { id, budget, ...rest } = input;
        const [campaign] = await db
          .update(schema.campaigns)
          .set({
            ...rest,
            ...(budget !== undefined ? { budget: String(budget) } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.campaigns.id, id),
              eq(schema.campaigns.organizationId, context.organization.id),
            ),
          )
          .returning();
        return campaign;
      },
    ),

  deleteCampaign: orgAuthed
    .route({
      method: "DELETE",
      path: "/marketing/campaigns/:id",
      summary: "Delete campaign",
      tags: ["Marketing"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string };
      }) => {
        const db = getDb(context);
        await db
          .delete(schema.campaigns)
          .where(
            and(
              eq(schema.campaigns.id, input.id),
              eq(schema.campaigns.organizationId, context.organization.id),
            ),
          );
        return { success: true };
      },
    ),

  // ── Stats ───────────────────────────────────────────────────────────────────

  stats: orgAuthed
    .route({
      method: "GET",
      path: "/marketing/stats",
      summary: "Marketing stats",
      tags: ["Marketing"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [total, active, draft, completed] = await Promise.all([
        db
          .select({ total: count() })
          .from(schema.campaigns)
          .where(eq(schema.campaigns.organizationId, orgId)),
        db
          .select({ total: count() })
          .from(schema.campaigns)
          .where(
            and(
              eq(schema.campaigns.organizationId, orgId),
              eq(schema.campaigns.status, "active"),
            ),
          ),
        db
          .select({ total: count() })
          .from(schema.campaigns)
          .where(
            and(
              eq(schema.campaigns.organizationId, orgId),
              eq(schema.campaigns.status, "draft"),
            ),
          ),
        db
          .select({ total: count() })
          .from(schema.campaigns)
          .where(
            and(
              eq(schema.campaigns.organizationId, orgId),
              eq(schema.campaigns.status, "completed"),
            ),
          ),
      ]);

      return {
        totalCampaigns: total[0]?.total ?? 0,
        activeCampaigns: active[0]?.total ?? 0,
        draftCampaigns: draft[0]?.total ?? 0,
        completedCampaigns: completed[0]?.total ?? 0,
      };
    }),

  // ── Email Templates ─────────────────────────────────────────────────────────

  listTemplates: orgAuthed
    .route({
      method: "GET",
      path: "/marketing/templates",
      summary: "List email templates",
      tags: ["Marketing"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const data = await db
          .select()
          .from(schema.emailTemplates)
          .where(eq(schema.emailTemplates.organizationId, context.organization.id))
          .orderBy(desc(schema.emailTemplates.createdAt))
          .limit(input.limit)
          .offset(offset);

        return { data, page: input.page, limit: input.limit };
      },
    ),

  createTemplate: orgAuthed
    .route({
      method: "POST",
      path: "/marketing/templates",
      summary: "Create email template",
      tags: ["Marketing"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        subject: z.string().optional(),
        html: z.string().optional(),
        text: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: any;
      }) => {
        const db = getDb(context);
        const [template] = await db
          .insert(schema.emailTemplates)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            subject: input.subject || null,
            html: input.html || null,
            text: input.text || null,
            category: input.category || null,
          })
          .returning();
        return template;
      },
    ),

  deleteTemplate: orgAuthed
    .route({
      method: "DELETE",
      path: "/marketing/templates/:id",
      summary: "Delete email template",
      tags: ["Marketing"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string };
      }) => {
        const db = getDb(context);
        await db
          .delete(schema.emailTemplates)
          .where(
            and(
              eq(schema.emailTemplates.id, input.id),
              eq(schema.emailTemplates.organizationId, context.organization.id),
            ),
          );
        return { success: true };
      },
    ),
};
