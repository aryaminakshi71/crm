/**
 * Deals Router
 *
 * Deal management operations.
 */

import { getOrCache } from "@crm/storage/redis";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

const { deals } = schema;

export const dealsRouter = {
  /**
   * List deals for the organization
   */
  list: orgAuthed
    .route({
      method: "GET",
      path: "/deals",
      summary: "List deals",
      tags: ["Deals"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        stage: z.string().optional(),
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
        input: { page: number; limit: number; stage?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        // Cache key for list queries
        const cacheKey = `deals:list:${context.organization.id}:${input.page}:${input.limit}:${input.stage || "all"}`;

        // Use cache for list queries (5 min TTL)
        return getOrCache(
          cacheKey,
          async () => {
            // Build where conditions
            const whereConditions = input.stage
              ? and(
                  eq(deals.organizationId, context.organization.id),
                  eq(deals.stage, input.stage),
                )
              : eq(deals.organizationId, context.organization.id);

            // Get total count
            const allDeals = await db
              .select()
              .from(deals)
              .where(whereConditions);
            const total = allDeals.length;

            // Get paginated results
            const paginatedDeals = await db
              .select()
              .from(deals)
              .where(whereConditions)
              .orderBy(desc(deals.createdAt))
              .limit(input.limit)
              .offset(offset);

            return {
              data: paginatedDeals,
              total,
              page: input.page,
              limit: input.limit,
              totalPages: Math.ceil(total / input.limit),
            };
          },
          300, // 5 minutes
        );
      },
    ),

  /**
   * Create a new deal
   */
  create: orgAuthed
    .route({
      method: "POST",
      path: "/deals",
      summary: "Create deal",
      tags: ["Deals"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        value: z.number().positive(),
        stage: z
          .enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"])
          .default("lead"),
        notes: z.string().optional(),
        contactId: z.string().uuid().optional(),
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
          value: number;
          stage: string;
          notes?: string;
          contactId?: string;
        };
      }) => {
        const db = getDb(context);
        const [deal] = await db
          .insert(deals)
          .values({
            name: input.name,
            value: String(input.value),
            stage: input.stage,
            notes: input.notes ?? null,
            contactId: input.contactId ?? null,
            organizationId: context.organization.id,
            createdBy: context.user.id,
          })
          .returning();

        return deal;
      },
    ),

  /**
   * Update deal stage
   */
  updateStage: orgAuthed
    .route({
      method: "PATCH",
      path: "/deals/:id/stage",
      summary: "Update deal stage",
      tags: ["Deals"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        stage: z.enum([
          "lead",
          "qualified",
          "proposal",
          "negotiation",
          "won",
          "lost",
        ]),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: { context: OrgContext; input: { id: string; stage: string } }) => {
        const db = getDb(context);
        const [deal] = await db
          .update(deals)
          .set({ stage: input.stage })
          .where(eq(deals.id, input.id))
          .returning();

        if (!deal) {
          throw new Error("Deal not found");
        }

        return deal;
      },
    ),
};
