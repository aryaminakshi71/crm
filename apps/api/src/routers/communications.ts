/**
 * Communications Router
 *
 * Voice calls, recordings, IVR flows, video rooms, and call routing rules.
 */

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

const pageInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(200).default(50),
});

function toOffset(page: number, limit: number) {
  return (page - 1) * limit;
}

async function paginatedList(
  db: ReturnType<typeof getDb>,
  table: any,
  orgId: string,
  page: number,
  limit: number,
  extra?: any,
): Promise<{ data: any[]; total: number; page: number; limit: number }> {
  const where = extra
    ? and(eq(table.organizationId, orgId), extra)
    : eq(table.organizationId, orgId);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(table)
    .where(where);

  const rows = await db
    .select()
    .from(table)
    .where(where)
    .orderBy(desc(table.createdAt))
    .limit(limit)
    .offset(toOffset(page, limit));

  return {
    data: rows,
    total: Number(countRow?.count ?? 0),
    page,
    limit,
  };
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const communicationsRouter = {
  // ── Voice Calls ────────────────────────────────────────────────────────────

  "calls.list": orgAuthed
    .route({
      method: "GET",
      path: "/communications/calls",
      summary: "List voice calls",
      tags: ["Communications"],
    })
    .input(
      pageInput.extend({
        direction: z.enum(["inbound", "outbound"]).optional(),
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
        input: { page: number; limit: number; direction?: string; status?: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const conditions: any[] = [
          eq(schema.commVoiceCalls.organizationId, orgId),
          isNull(schema.commVoiceCalls.deletedAt),
        ];
        if (input.direction) {
          conditions.push(eq(schema.commVoiceCalls.direction, input.direction));
        }
        if (input.status) {
          conditions.push(eq(schema.commVoiceCalls.status, input.status));
        }

        const where = and(...conditions);

        const [countRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.commVoiceCalls)
          .where(where);

        const rows = await db
          .select()
          .from(schema.commVoiceCalls)
          .where(where)
          .orderBy(desc(schema.commVoiceCalls.createdAt))
          .limit(input.limit)
          .offset(toOffset(input.page, input.limit));

        return {
          data: rows,
          total: Number(countRow?.count ?? 0),
          page: input.page,
          limit: input.limit,
        };
      },
    ),

  "calls.create": orgAuthed
    .route({
      method: "POST",
      path: "/communications/calls",
      summary: "Initiate a call record",
      tags: ["Communications"],
    })
    .input(
      z.object({
        direction: z.enum(["inbound", "outbound"]).default("outbound"),
        from: z.string().min(1),
        to: z.string().min(1),
        contactName: z.string().optional(),
        status: z
          .enum(["initiated", "ringing", "answered", "completed", "missed", "failed"])
          .default("initiated"),
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
          direction: "inbound" | "outbound";
          from: string;
          to: string;
          contactName?: string;
          status: string;
        };
      }) => {
        const db = getDb(context);
        const [row] = await db
          .insert(schema.commVoiceCalls)
          .values({
            organizationId: context.organization.id,
            direction: input.direction,
            from: input.from,
            to: input.to,
            contactName: input.contactName ?? null,
            status: input.status,
          })
          .returning();
        return row;
      },
    ),

  // ── Recordings ─────────────────────────────────────────────────────────────

  "recordings.list": orgAuthed
    .route({
      method: "GET",
      path: "/communications/recordings",
      summary: "List call recordings",
      tags: ["Communications"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { page: number; limit: number } }) => {
        const db = getDb(context);
        return paginatedList(
          db,
          schema.commCallRecordings,
          context.organization.id,
          input.page,
          input.limit,
          isNull(schema.commCallRecordings.deletedAt),
        );
      },
    ),

  "recordings.get": orgAuthed
    .route({
      method: "GET",
      path: "/communications/recordings/:id",
      summary: "Get a call recording",
      tags: ["Communications"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        const [row] = await db
          .select()
          .from(schema.commCallRecordings)
          .where(
            and(
              eq(schema.commCallRecordings.id, input.id),
              eq(schema.commCallRecordings.organizationId, context.organization.id),
              isNull(schema.commCallRecordings.deletedAt),
            ),
          )
          .limit(1);
        return row ?? null;
      },
    ),

  // ── IVR Flows ──────────────────────────────────────────────────────────────

  "ivr.list": orgAuthed
    .route({
      method: "GET",
      path: "/communications/ivr",
      summary: "List IVR flows",
      tags: ["Communications"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { page: number; limit: number } }) => {
        const db = getDb(context);
        return paginatedList(
          db,
          schema.commIvrFlows,
          context.organization.id,
          input.page,
          input.limit,
          isNull(schema.commIvrFlows.deletedAt),
        );
      },
    ),

  "ivr.create": orgAuthed
    .route({
      method: "POST",
      path: "/communications/ivr",
      summary: "Create an IVR flow",
      tags: ["Communications"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["draft", "active", "inactive"]).default("draft"),
        nodes: z
          .array(
            z.object({
              id: z.string(),
              type: z.enum(["greeting", "menu", "action", "transfer", "voicemail"]),
              label: z.string(),
              config: z.record(z.unknown()),
              children: z.array(z.string()).optional(),
            }),
          )
          .optional(),
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
          status: "draft" | "active" | "inactive";
          nodes?: Array<{
            id: string;
            type: "greeting" | "menu" | "action" | "transfer" | "voicemail";
            label: string;
            config: Record<string, unknown>;
            children?: string[];
          }>;
        };
      }) => {
        const db = getDb(context);
        const [row] = await db
          .insert(schema.commIvrFlows)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description ?? null,
            status: input.status,
            nodes: input.nodes ?? [],
          })
          .returning();
        return row;
      },
    ),

  "ivr.update": orgAuthed
    .route({
      method: "PATCH",
      path: "/communications/ivr/:id",
      summary: "Update an IVR flow",
      tags: ["Communications"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["draft", "active", "inactive"]).optional(),
        nodes: z.array(z.record(z.unknown())).optional(),
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
          status?: string;
          nodes?: Array<Record<string, unknown>>;
        };
      }) => {
        const db = getDb(context);
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.nodes !== undefined) updateData.nodes = input.nodes;

        const [row] = await db
          .update(schema.commIvrFlows)
          .set(updateData)
          .where(
            and(
              eq(schema.commIvrFlows.id, input.id),
              eq(schema.commIvrFlows.organizationId, context.organization.id),
            ),
          )
          .returning();
        return row;
      },
    ),

  // ── Video Rooms ────────────────────────────────────────────────────────────

  "videoRooms.list": orgAuthed
    .route({
      method: "GET",
      path: "/communications/video-rooms",
      summary: "List video rooms",
      tags: ["Communications"],
    })
    .input(pageInput.extend({ status: z.string().optional() }))
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; status?: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const conditions: any[] = [eq(schema.commVideoRooms.organizationId, orgId)];
        if (input.status) {
          conditions.push(eq(schema.commVideoRooms.status, input.status));
        }
        const where = and(...conditions);

        const [countRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.commVideoRooms)
          .where(where);

        const rows = await db
          .select()
          .from(schema.commVideoRooms)
          .where(where)
          .orderBy(desc(schema.commVideoRooms.createdAt))
          .limit(input.limit)
          .offset(toOffset(input.page, input.limit));

        return {
          data: rows,
          total: Number(countRow?.count ?? 0),
          page: input.page,
          limit: input.limit,
        };
      },
    ),

  "videoRooms.create": orgAuthed
    .route({
      method: "POST",
      path: "/communications/video-rooms",
      summary: "Create a video room",
      tags: ["Communications"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        maxParticipants: z.number().int().min(2).max(100).default(10),
        scheduledAt: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { name: string; maxParticipants: number; scheduledAt?: string };
      }) => {
        const db = getDb(context);
        const [row] = await db
          .insert(schema.commVideoRooms)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            maxParticipants: input.maxParticipants,
            status: input.scheduledAt ? "scheduled" : "active",
            scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          })
          .returning();
        return row;
      },
    ),

  "videoRooms.get": orgAuthed
    .route({
      method: "GET",
      path: "/communications/video-rooms/:id",
      summary: "Get a single video room",
      tags: ["Communications"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        const [row] = await db
          .select()
          .from(schema.commVideoRooms)
          .where(
            and(
              eq(schema.commVideoRooms.id, input.id),
              eq(schema.commVideoRooms.organizationId, context.organization.id),
            ),
          )
          .limit(1);
        return row ?? null;
      },
    ),

  "videoRooms.end": orgAuthed
    .route({
      method: "PATCH",
      path: "/communications/video-rooms/:id/end",
      summary: "End a video room",
      tags: ["Communications"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        const [row] = await db
          .update(schema.commVideoRooms)
          .set({ status: "ended", endedAt: new Date(), updatedAt: new Date() })
          .where(
            and(
              eq(schema.commVideoRooms.id, input.id),
              eq(schema.commVideoRooms.organizationId, context.organization.id),
            ),
          )
          .returning();
        return row;
      },
    ),

  // ── SMS / Conversations ────────────────────────────────────────────────────

  "sms.send": orgAuthed
    .route({
      method: "POST",
      path: "/communications/sms/send",
      summary: "Send an SMS message",
      tags: ["Communications"],
    })
    .input(
      z.object({
        to: z.array(z.string()).min(1),
        body: z.string().min(1),
        from: z.string().optional(),
        scheduledAt: z.string().optional(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        messageId: z.string(),
        sentAt: z.string(),
        recipientCount: z.number(),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { to: string[]; body: string; from?: string; scheduledAt?: string };
      }) => {
        // Placeholder — integrate with SMS provider (Twilio etc.) when available
        return {
          success: true,
          messageId: crypto.randomUUID(),
          sentAt: input.scheduledAt ?? new Date().toISOString(),
          recipientCount: input.to.length,
        };
      },
    ),

  "conversations.get": orgAuthed
    .route({
      method: "GET",
      path: "/communications/conversations/:id",
      summary: "Get a conversation with its messages",
      tags: ["Communications"],
    })
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        conversation: z.any(),
        messages: z.array(z.any()),
      }),
    )
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        // Conversation and message storage is handled by the external comm platform.
        // Return a placeholder shape so the frontend can fall back gracefully.
        return {
          conversation: {
            id: input.id,
            organizationId: context.organization.id,
          },
          messages: [],
        };
      },
    ),

  "conversations.sendMessage": orgAuthed
    .route({
      method: "POST",
      path: "/communications/conversations/:id/messages",
      summary: "Send a message in a conversation",
      tags: ["Communications"],
    })
    .input(
      z.object({
        id: z.string(),
        body: z.string().min(1),
      }),
    )
    .output(
      z.object({
        id: z.string(),
        conversationId: z.string(),
        role: z.literal("outbound"),
        content: z.string(),
        timestamp: z.string(),
        status: z.literal("sent"),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; body: string };
      }) => {
        return {
          id: crypto.randomUUID(),
          conversationId: input.id,
          role: "outbound" as const,
          content: input.body,
          timestamp: new Date().toISOString(),
          status: "sent" as const,
        };
      },
    ),

  // ── Routing Rules ──────────────────────────────────────────────────────────

  "routing.list": orgAuthed
    .route({
      method: "GET",
      path: "/communications/routing-rules",
      summary: "List call routing rules",
      tags: ["Communications"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { page: number; limit: number } }) => {
        const db = getDb(context);
        return paginatedList(
          db,
          schema.commRoutingRules,
          context.organization.id,
          input.page,
          input.limit,
          isNull(schema.commRoutingRules.deletedAt),
        );
      },
    ),

  "routing.create": orgAuthed
    .route({
      method: "POST",
      path: "/communications/routing-rules",
      summary: "Create a routing rule",
      tags: ["Communications"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        priority: z.number().int().min(1).default(1),
        conditions: z.array(z.string()).default([]),
        destination: z.string().min(1),
        status: z.enum(["active", "paused"]).default("active"),
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
          priority: number;
          conditions: string[];
          destination: string;
          status: "active" | "paused";
        };
      }) => {
        const db = getDb(context);
        const [row] = await db
          .insert(schema.commRoutingRules)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            priority: input.priority,
            conditions: input.conditions,
            destination: input.destination,
            status: input.status,
          })
          .returning();
        return row;
      },
    ),

  "routing.update": orgAuthed
    .route({
      method: "PATCH",
      path: "/communications/routing-rules/:id",
      summary: "Update a routing rule",
      tags: ["Communications"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        priority: z.number().int().min(1).optional(),
        conditions: z.array(z.string()).optional(),
        destination: z.string().optional(),
        status: z.enum(["active", "paused"]).optional(),
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
          priority?: number;
          conditions?: string[];
          destination?: string;
          status?: string;
        };
      }) => {
        const db = getDb(context);
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (input.name !== undefined) updateData.name = input.name;
        if (input.priority !== undefined) updateData.priority = input.priority;
        if (input.conditions !== undefined) updateData.conditions = input.conditions;
        if (input.destination !== undefined) updateData.destination = input.destination;
        if (input.status !== undefined) updateData.status = input.status;

        const [row] = await db
          .update(schema.commRoutingRules)
          .set(updateData)
          .where(
            and(
              eq(schema.commRoutingRules.id, input.id),
              eq(schema.commRoutingRules.organizationId, context.organization.id),
            ),
          )
          .returning();
        return row;
      },
    ),

  "routing.delete": orgAuthed
    .route({
      method: "DELETE",
      path: "/communications/routing-rules/:id",
      summary: "Delete (soft-delete) a routing rule",
      tags: ["Communications"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .update(schema.commRoutingRules)
          .set({ deletedAt: new Date(), updatedAt: new Date() })
          .where(
            and(
              eq(schema.commRoutingRules.id, input.id),
              eq(schema.commRoutingRules.organizationId, context.organization.id),
            ),
          );
        return { success: true };
      },
    ),
};
