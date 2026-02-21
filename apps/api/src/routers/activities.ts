/**
 * Activities Router
 *
 * Activity management operations.
 */

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

const { activities } = schema;

export const activitiesRouter = {
  /**
   * List activities for the organization
   */
  list: orgAuthed
    .route({
      method: "GET",
      path: "/activities",
      summary: "List activities",
      tags: ["Activities"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        contactId: z.string().uuid().optional(),
        dealId: z.string().uuid().optional(),
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
          contactId?: string;
          dealId?: string;
        };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        // Build where conditions
        const conditions = [
          eq(activities.organizationId, context.organization.id),
        ];
        if (input.contactId) {
          conditions.push(eq(activities.contactId, input.contactId));
        }
        if (input.dealId) {
          conditions.push(eq(activities.dealId, input.dealId));
        }
        const whereConditions =
          conditions.length > 1 ? and(...conditions) : conditions[0];

        // Get total count
        const allActivities = await db
          .select()
          .from(activities)
          .where(whereConditions);
        const total = allActivities.length;

        // Get paginated results
        const paginatedActivities = await db
          .select()
          .from(activities)
          .where(whereConditions)
          .orderBy(desc(activities.createdAt))
          .limit(input.limit)
          .offset(offset);

        return {
          data: paginatedActivities,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      },
    ),

  /**
   * Create a new activity
   */
  create: orgAuthed
    .route({
      method: "POST",
      path: "/activities",
      summary: "Create activity",
      tags: ["Activities"],
    })
    .input(
      z.object({
        type: z.enum(["call", "email", "meeting", "note", "task", "demo"]),
        subject: z.string().min(1),
        description: z.string().optional(),
        contactId: z.string().uuid().optional(),
        dealId: z.string().uuid().optional(),
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
          type: string;
          subject: string;
          description?: string;
          contactId?: string;
          dealId?: string;
        };
      }) => {
        const db = getDb(context);
        const [activity] = await db
          .insert(activities)
          .values({
            type: input.type,
            subject: input.subject,
            description: input.description || null,
            contactId: input.contactId || null,
            dealId: input.dealId || null,
            organizationId: context.organization.id,
            userId: context.user.id,
          })
          .returning();

        return activity;
      },
    ),
};
