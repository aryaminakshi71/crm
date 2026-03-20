/**
 * Notifications Router
 *
 * User notifications and notification preferences.
 */

import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";

const { notifications, notificationPreferences } = schema;

const notificationSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  category: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.string(), z.unknown()),
  read: z.string(),
  sentAt: z.date().nullable(),
  createdAt: z.date(),
});

export const notificationsRouter = {
  // ─── Notifications ────────────────────────────────────────────────────────

  list: orgAuthed
    .route({
      method: "GET",
      path: "/notifications",
      summary: "List notifications",
      tags: ["Notifications"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        unreadOnly: z.boolean().optional(),
        category: z.string().optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(notificationSchema),
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
        input: { page: number; limit: number; unreadOnly?: boolean; category?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [
          eq(notifications.organizationId, context.organization.id),
          eq(notifications.userId, context.user.id),
        ];
        if (input.unreadOnly) conditions.push(eq(notifications.read, "false"));
        if (input.category) conditions.push(eq(notifications.category, input.category));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(notifications)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(notifications)
          .where(whereConditions)
          .orderBy(desc(notifications.createdAt))
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

  markAsRead: orgAuthed
    .route({
      method: "PATCH",
      path: "/notifications/:id/read",
      summary: "Mark notification as read",
      tags: ["Notifications"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .update(notifications)
          .set({ read: "true" })
          .where(
            and(
              eq(notifications.id, input.id),
              eq(notifications.userId, context.user.id),
            ),
          );
        return { success: true };
      },
    ),

  markAllAsRead: orgAuthed
    .route({
      method: "POST",
      path: "/notifications/read-all",
      summary: "Mark all notifications as read",
      tags: ["Notifications"],
    })
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      await db
        .update(notifications)
        .set({ read: "true" })
        .where(
          and(
            eq(notifications.organizationId, context.organization.id),
            eq(notifications.userId, context.user.id),
          ),
        );
      return { success: true };
    }),

  delete: orgAuthed
    .route({
      method: "DELETE",
      path: "/notifications/:id",
      summary: "Delete notification",
      tags: ["Notifications"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .delete(notifications)
          .where(
            and(
              eq(notifications.id, input.id),
              eq(notifications.userId, context.user.id),
            ),
          );
        return { success: true };
      },
    ),

  // ─── Preferences ────────────────────────────────────────────────────────

  getPreferences: orgAuthed
    .route({
      method: "GET",
      path: "/notifications/preferences",
      summary: "Get notification preferences",
      tags: ["Notifications"],
    })
    .output(
      z.object({
        email: z.record(z.string(), z.unknown()),
        sms: z.record(z.string(), z.unknown()),
        push: z.record(z.string(), z.unknown()),
        inApp: z.record(z.string(), z.unknown()),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const [prefs] = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.organizationId, context.organization.id),
            eq(notificationPreferences.userId, context.user.id),
          ),
        )
        .limit(1);

      if (!prefs) {
        return {
          email: { enabled: true },
          sms: { enabled: false },
          push: { enabled: true },
          inApp: { enabled: true },
        };
      }

      return {
        email: prefs.email,
        sms: prefs.sms,
        push: prefs.push,
        inApp: prefs.inApp,
      };
    }),

  updatePreferences: orgAuthed
    .route({
      method: "PATCH",
      path: "/notifications/preferences",
      summary: "Update notification preferences",
      tags: ["Notifications"],
    })
    .input(
      z.object({
        email: z.record(z.string(), z.unknown()).optional(),
        sms: z.record(z.string(), z.unknown()).optional(),
        push: z.record(z.string(), z.unknown()).optional(),
        inApp: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }: { context: OrgContext; input: any }) => {
      const db = getDb(context);

      const [existing] = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.organizationId, context.organization.id),
            eq(notificationPreferences.userId, context.user.id),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(notificationPreferences).values({
          organizationId: context.organization.id,
          userId: context.user.id,
          email: input.email || { enabled: true },
          sms: input.sms || { enabled: false },
          push: input.push || { enabled: true },
          inApp: input.inApp || { enabled: true },
        });
      } else {
        await db
          .update(notificationPreferences)
          .set({
            ...(input.email !== undefined ? { email: input.email } : {}),
            ...(input.sms !== undefined ? { sms: input.sms } : {}),
            ...(input.push !== undefined ? { push: input.push } : {}),
            ...(input.inApp !== undefined ? { inApp: input.inApp } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(notificationPreferences.id, existing.id),
            ),
          );
      }

      return { success: true };
    }),

  // ─── Send (Internal) ────────────────────────────────────────────────────

  send: orgAuthed
    .route({
      method: "POST",
      path: "/notifications/send",
      summary: "Send notification (internal)",
      tags: ["Notifications"],
    })
    .input(
      z.object({
        userId: z.string().uuid(),
        type: z.enum(["email", "sms", "push", "in_app"]),
        category: z.string(),
        title: z.string(),
        message: z.string(),
        data: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .output(z.object({ id: z.string().uuid(), success: z.boolean() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          userId: string;
          type: "email" | "sms" | "push" | "in_app";
          category: string;
          title: string;
          message: string;
          data?: Record<string, unknown>;
        };
      }) => {
        const db = getDb(context);
        const [notification] = await db
          .insert(notifications)
          .values({
            organizationId: context.organization.id,
            userId: input.userId,
            type: input.type,
            category: input.category,
            title: input.title,
            message: input.message,
            data: input.data || {},
            sentAt: new Date(),
          })
          .returning();

        return { id: notification.id, success: true };
      },
    ),
};
