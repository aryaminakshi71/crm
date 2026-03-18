/**
 * Leads Router
 *
 * Lead management operations.
 */

import { getOrCache, invalidateCache } from "@crm/storage/redis";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError } from "../lib/errors";
import { trackQuery } from "../lib/db-performance";
import { getDb, orgAuthed, schema } from "../procedures";

const { leads, contacts } = schema;

// Create a Zod schema from the leads table columns
const leadSchema = schema.leads ? z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().email(),
  phone: z.string().nullable(),
  companyName: z.string().nullable(),
  status: z.string(),
  source: z.string().nullable(),
  notes: z.string().nullable(),
  assignedTo: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).passthrough() : z.unknown();

export const leadsRouter = {
  /**
   * List leads for the organization
   */
  list: orgAuthed
    .route({
      method: "GET",
      path: "/leads",
      summary: "List leads",
      tags: ["Leads"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        status: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(leadSchema),
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
          status?: string;
          search?: string;
        };
      }) => {
        const offset = (input.page - 1) * input.limit;
        const search = input.search?.trim();

        // Cache key for list queries
        const cacheKey = `leads:list:${context.organization.id}:${input.page}:${input.limit}:${input.status || "all"}:${search || "all"}`;

        // Use cache for list queries (5 min TTL)
        return getOrCache<{
          data: any[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }>(
          cacheKey,
          async () => {
            const db = getDb(context);

            // Build where conditions
            const conditions = [eq(leads.organizationId, context.organization.id)];
            if (input.status) {
              conditions.push(eq(leads.status, input.status));
            }
            if (search) {
              conditions.push(
                or(
                  ilike(leads.email, `%${search}%`),
                  ilike(leads.firstName, `%${search}%`),
                  ilike(leads.lastName, `%${search}%`),
                  ilike(leads.companyName, `%${search}%`),
                  ilike(leads.notes, `%${search}%`),
                )!,
              );
            }
            const whereConditions =
              conditions.length > 1 ? and(...conditions) : conditions[0];

            // Get total count using SQL COUNT()
            const countResult = await trackQuery("listLeadsCount", () =>
              db.select({ count: count() }).from(leads).where(whereConditions),
            );
            const total = countResult[0]?.count ?? 0;

            // Get paginated results
            const paginatedLeads = await trackQuery(
              "listLeadsPaginated",
              () =>
                db
                  .select()
                  .from(leads)
                  .where(whereConditions)
                  .orderBy(desc(leads.createdAt))
                  .limit(input.limit)
                  .offset(offset),
            );

            return {
              data: paginatedLeads,
              total,
              page: input.page,
              limit: input.limit,
              totalPages: Math.ceil(total / input.limit),
            };
          },
          300, // 5 minutes TTL
        );
      },
    ),

  /**
   * Get a lead
   */
  get: orgAuthed
    .route({
      method: "GET",
      path: "/leads/:id",
      summary: "Get lead",
      tags: ["Leads"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(leadSchema)
    .handler(
      async ({
        context,
        input,
      }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        const [lead] = await db
          .select()
          .from(leads)
          .where(
            and(
              eq(leads.id, input.id),
              eq(leads.organizationId, context.organization.id),
            ),
          )
          .limit(1);

        if (!lead) {
          throw new APIError("Lead not found", 404);
        }

        return lead;
      },
    ),

  /**
   * Create a new lead
   */
  create: orgAuthed
    .route({
      method: "POST",
      path: "/leads",
      summary: "Create lead",
      tags: ["Leads"],
    })
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        companyName: z.string().optional(),
        phone: z.string().optional(),
        source: z
          .enum([
            "website",
            "referral",
            "cold_outreach",
            "social_media",
            "event",
            "advertising",
            "other",
          ])
          .default("website"),
        notes: z.string().optional(),
      }),
    )
    .output(leadSchema)
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          email: string;
          firstName?: string;
          lastName?: string;
          companyName?: string;
          phone?: string;
          source: string;
          notes?: string;
        };
      }) => {
        const db = getDb(context);
        const [lead] = await db
          .insert(leads)
          .values({
            email: input.email.toLowerCase(),
            firstName: input.firstName || null,
            lastName: input.lastName || null,
            companyName: input.companyName || null,
            phone: input.phone || null,
            source: input.source,
            organizationId: context.organization.id,
            createdBy: context.user.id,
          })
          .returning();

        // Invalidate list cache
        await invalidateCache(`leads:list:${context.organization.id}`);

        return lead;
      },
    ),

  /**
   * Update a lead
   */
  update: orgAuthed
    .route({
      method: "PATCH",
      path: "/leads/:id",
      summary: "Update lead",
      tags: ["Leads"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        email: z.string().email().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        companyName: z.string().optional(),
        phone: z.string().optional(),
        source: z
          .enum([
            "website",
            "referral",
            "cold_outreach",
            "social_media",
            "event",
            "advertising",
            "other",
          ])
          .optional(),
        status: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .output(leadSchema)
    .handler(
      async ({ context, input }: { context: OrgContext; input: any }) => {
        const db = getDb(context);
        const [lead] = await db
          .update(leads)
          .set({
            ...(input.email !== undefined
              ? { email: input.email.toLowerCase() }
              : {}),
            ...(input.firstName !== undefined
              ? { firstName: input.firstName }
              : {}),
            ...(input.lastName !== undefined
              ? { lastName: input.lastName }
              : {}),
            ...(input.companyName !== undefined
              ? { companyName: input.companyName }
              : {}),
            ...(input.phone !== undefined ? { phone: input.phone } : {}),
            ...(input.source !== undefined ? { source: input.source } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
            ...(input.notes !== undefined ? { notes: input.notes } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(leads.id, input.id),
              eq(leads.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!lead) {
          throw new APIError("Lead not found", 404);
        }

        return lead;
      },
    ),

  /**
   * Convert a lead to a contact
   */
  convert: orgAuthed
    .route({
      method: "POST",
      path: "/leads/:id/convert",
      summary: "Convert lead to contact",
      tags: ["Leads"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        companyName: z.string().optional(),
      }),
    )
    .output(leadSchema)
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          id: string;
          firstName?: string;
          lastName?: string;
          companyName?: string;
        };
      }) => {
        const db = getDb(context);

        // Get the lead
        const [lead] = await db
          .select()
          .from(leads)
          .where(
            and(
              eq(leads.id, input.id),
              eq(leads.organizationId, context.organization.id),
            ),
          )
          .limit(1);

        if (!lead) {
          throw new APIError("Lead not found", 404);
        }

        // Create contact from lead
        const [contact] = await db
          .insert(contacts)
          .values({
            firstName: input.firstName || lead.firstName || "Unknown",
            lastName: input.lastName || lead.lastName || "",
            email: lead.email,
            phone: lead.phone ?? null,
            companyName: (input.companyName || lead.companyName) ?? null,
            organizationId: lead.organizationId,
            createdBy: context.user.id,
          })
          .returning();

        // Update lead status
        await db
          .update(leads)
          .set({ status: "converted", updatedAt: new Date() })
          .where(eq(leads.id, input.id));

        return contact;
      },
    ),

  /**
   * Delete a lead
   */
  delete: orgAuthed
    .route({
      method: "DELETE",
      path: "/leads/:id",
      summary: "Delete lead",
      tags: ["Leads"],
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
          .delete(leads)
          .where(
            and(
              eq(leads.id, input.id),
              eq(leads.organizationId, context.organization.id),
            ),
          );
        return { success: true };
      },
    ),
};
