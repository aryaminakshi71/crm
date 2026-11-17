/**
 * Deals Router
 *
 * Deal management operations.
 */

import { getOrCache, invalidateCache } from "@crm/storage/redis";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError, ErrorCode } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";

const { deals } = schema;

// Create a Zod schema from the deals table columns
const dealSchema = schema.deals ? z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  value: z.number().nullable(),
  stage: z.string(),
  probability: z.number().nullable(),
  notes: z.string().nullable(),
  contactId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).passthrough() : z.unknown();

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
        search: z.string().optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(dealSchema),
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
        input: { page: number; limit: number; stage?: string; search?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;
        const search = input.search?.trim();

        // Cache key for list queries
        const cacheKey = `deals:list:${context.organization.id}:${input.page}:${input.limit}:${input.stage || "all"}:${search || "all"}`;

        // Use cache for list queries (5 min TTL)
        return getOrCache(
          cacheKey,
          async () => {
            // Build where conditions
            const conditions = [
              eq(deals.organizationId, context.organization.id),
            ];
            if (input.stage) {
              conditions.push(eq(deals.stage, input.stage));
            }
            if (search) {
              conditions.push(
                or(
                  ilike(deals.name, `%${search}%`),
                  ilike(deals.notes, `%${search}%`),
                  ilike(deals.stage, `%${search}%`),
                )!,
              );
            }
            const whereConditions =
              conditions.length > 1 ? and(...conditions) : conditions[0];

            // Get total count using SQL COUNT()
            const countResult = await db
              .select({ count: count() })
              .from(deals)
              .where(whereConditions);
            const total = countResult[0]?.count ?? 0;

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
   * Get a deal
   */
  get: orgAuthed
    .route({
      method: "GET",
      path: "/deals/:id",
      summary: "Get deal",
      tags: ["Deals"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(dealSchema)
    .handler(
      async ({
        context,
        input,
      }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        const [deal] = await db
          .select()
          .from(deals)
          .where(
            and(
              eq(deals.id, input.id),
              eq(deals.organizationId, context.organization.id),
            ),
          )
          .limit(1);

        if (!deal) {
          throw new APIError(ErrorCode.NOT_FOUND, "Deal not found", 404);
        }

        return deal;
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
    .output(dealSchema)
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

        // Invalidate all deals list caches for this org
        for (let page = 1; page <= 10; page++) {
          for (const stage of [
            "all",
            "lead",
            "qualified",
            "proposal",
            "negotiation",
            "won",
            "lost",
          ]) {
            await invalidateCache(
              `deals:list:${context.organization.id}:${page}:50:${stage}`,
            );
          }
        }

        return deal;
      },
    ),

  /**
   * Update deal
   */
  update: orgAuthed
    .route({
      method: "PATCH",
      path: "/deals/:id",
      summary: "Update deal",
      tags: ["Deals"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        value: z.number().positive().optional(),
        stage: z
          .enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"])
          .optional(),
        notes: z.string().optional(),
      }),
    )
    .output(dealSchema)
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          id: string;
          name?: string;
          value?: number;
          stage?: string;
          notes?: string;
        };
      }) => {
        const db = getDb(context);
        const [deal] = await db
          .update(deals)
          .set({
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.value !== undefined
              ? { value: String(input.value) }
              : {}),
            ...(input.stage !== undefined ? { stage: input.stage } : {}),
            ...(input.notes !== undefined ? { notes: input.notes } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(deals.id, input.id),
              eq(deals.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!deal) {
          throw new APIError(ErrorCode.NOT_FOUND, "Deal not found", 404);
        }

        return deal;
      },
    ),

  /**
   * Update deal stage (alias)
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
    .output(dealSchema)
    .handler(
      async ({
        context,
        input,
      }: { context: OrgContext; input: { id: string; stage: string } }) => {
        const db = getDb(context);
        const [deal] = await db
          .update(deals)
          .set({ stage: input.stage, updatedAt: new Date() })
          .where(
            and(
              eq(deals.id, input.id),
              eq(deals.organizationId, context.organization.id),
            ),
          )
          .returning();
        if (!deal) {
          throw new APIError(ErrorCode.NOT_FOUND, "Deal not found", 404);
        }
        return deal;
      },
    ),

  /**
   * Delete a deal
   */
  delete: orgAuthed
    .route({
      method: "DELETE",
      path: "/deals/:id",
      summary: "Delete deal",
      tags: ["Deals"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({
        context,
        input,
      }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .delete(deals)
          .where(
            and(
              eq(deals.id, input.id),
              eq(deals.organizationId, context.organization.id),
            ),
          );
        return { success: true };
      },
    ),
};
