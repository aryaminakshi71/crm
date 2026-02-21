/**
 * Leads Router
 *
 * Lead management operations.
 */

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

const { leads, contacts } = schema;

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

        // Build where conditions
        const whereConditions = input.status
          ? and(
              eq(leads.organizationId, context.organization.id),
              eq(leads.status, input.status),
            )
          : eq(leads.organizationId, context.organization.id);

        // Get total count
        const allLeads = await db.select().from(leads).where(whereConditions);
        const total = allLeads.length;

        // Get paginated results
        const paginatedLeads = await db
          .select()
          .from(leads)
          .where(whereConditions)
          .orderBy(desc(leads.createdAt))
          .limit(input.limit)
          .offset(offset);

        return {
          data: paginatedLeads,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
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
    .output(z.any())
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
    .output(z.any())
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
          throw new Error("Lead not found");
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
          .set({ status: "converted" })
          .where(eq(leads.id, input.id));

        return contact;
      },
    ),
};
