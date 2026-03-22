/**
 * Communications Router
 *
 * Handles conversations, messages, phone numbers, queues,
 * SMS campaigns, templates and bots.
 */

import { desc, eq, sql } from "drizzle-orm";
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

// ─── Helper: paginated list builder ──────────────────────────────────────────

async function paginatedList<T extends { organizationId: string }>(
  db: ReturnType<typeof getDb>,
  table: any,
  orgId: string,
  page: number,
  limit: number,
): Promise<{ data: any[]; total: number; page: number; limit: number }> {
  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(table)
    .where(eq(table.organizationId, orgId));

  const rows = await db
    .select()
    .from(table)
    .where(eq(table.organizationId, orgId))
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
  // ── Summary ────────────────────────────────────────────────────────────────
  summary: orgAuthed
    .route({
      method: "GET",
      path: "/communications/summary",
      summary: "Get communications summary stats",
      tags: ["Communications"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [conversations, messages, phoneNumbers, queues, campaigns, templates, bots] =
        await Promise.all([
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.conversations)
            .where(eq(schema.conversations.organizationId, orgId)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.commMessages)
            .where(eq(schema.commMessages.organizationId, orgId)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.phoneNumbers)
            .where(eq(schema.phoneNumbers.organizationId, orgId)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.commQueues)
            .where(eq(schema.commQueues.organizationId, orgId)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.smsCampaigns)
            .where(eq(schema.smsCampaigns.organizationId, orgId)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.commTemplates)
            .where(eq(schema.commTemplates.organizationId, orgId)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.commBots)
            .where(eq(schema.commBots.organizationId, orgId)),
        ]);

      return {
        conversations: Number(conversations[0]?.count ?? 0),
        messages: Number(messages[0]?.count ?? 0),
        phoneNumbers: Number(phoneNumbers[0]?.count ?? 0),
        queues: Number(queues[0]?.count ?? 0),
        campaigns: Number(campaigns[0]?.count ?? 0),
        templates: Number(templates[0]?.count ?? 0),
        bots: Number(bots[0]?.count ?? 0),
      };
    }),

  // ── Conversations ──────────────────────────────────────────────────────────
  listConversations: orgAuthed
    .route({
      method: "GET",
      path: "/communications/conversations",
      summary: "List conversations",
      tags: ["Communications"],
    })
    .input(
      pageInput.extend({
        channel: z.string().optional(),
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
        input: { page: number; limit: number; channel?: string; status?: string };
      }) => {
        const db = getDb(context);
        return paginatedList(
          db,
          schema.conversations,
          context.organization.id,
          input.page,
          input.limit,
        );
      },
    ),

  createConversation: orgAuthed
    .route({
      method: "POST",
      path: "/communications/conversations",
      summary: "Create conversation",
      tags: ["Communications"],
    })
    .input(
      z.object({
        channel: z.enum(["chat", "sms", "email", "voice"]).default("chat"),
        subject: z.string().optional(),
        participantName: z.string().optional(),
        participantContact: z.string().optional(),
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
          channel: "chat" | "sms" | "email" | "voice";
          subject?: string;
          participantName?: string;
          participantContact?: string;
        };
      }) => {
        const db = getDb(context);
        const [row] = await db
          .insert(schema.conversations)
          .values({
            organizationId: context.organization.id,
            channel: input.channel,
            subject: input.subject ?? null,
            participantName: input.participantName ?? null,
            participantContact: input.participantContact ?? null,
          })
          .returning();
        return row;
      },
    ),

  // ── Messages ───────────────────────────────────────────────────────────────
  listMessages: orgAuthed
    .route({
      method: "GET",
      path: "/communications/messages",
      summary: "List messages",
      tags: ["Communications"],
    })
    .input(pageInput.extend({ conversationId: z.string().uuid().optional() }))
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; conversationId?: string };
      }) => {
        const db = getDb(context);
        return paginatedList(
          db,
          schema.commMessages,
          context.organization.id,
          input.page,
          input.limit,
        );
      },
    ),

  // ── Phone Numbers ──────────────────────────────────────────────────────────
  listPhoneNumbers: orgAuthed
    .route({
      method: "GET",
      path: "/communications/phone-numbers",
      summary: "List phone numbers",
      tags: ["Communications"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { page: number; limit: number } }) => {
        const db = getDb(context);
        return paginatedList(
          db,
          schema.phoneNumbers,
          context.organization.id,
          input.page,
          input.limit,
        );
      },
    ),

  createPhoneNumber: orgAuthed
    .route({
      method: "POST",
      path: "/communications/phone-numbers",
      summary: "Add phone number",
      tags: ["Communications"],
    })
    .input(
      z.object({
        number: z.string().min(1),
        friendlyName: z.string().optional(),
        provider: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { number: string; friendlyName?: string; provider?: string };
      }) => {
        const db = getDb(context);
        const [row] = await db
          .insert(schema.phoneNumbers)
          .values({
            organizationId: context.organization.id,
            number: input.number,
            friendlyName: input.friendlyName ?? null,
            provider: input.provider ?? "twilio",
          })
          .returning();
        return row;
      },
    ),

  // ── Comm Queues ────────────────────────────────────────────────────────────
  listQueues: orgAuthed
    .route({
      method: "GET",
      path: "/communications/queues",
      summary: "List communication queues",
      tags: ["Communications"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { page: number; limit: number } }) => {
        const db = getDb(context);
        return paginatedList(
          db,
          schema.commQueues,
          context.organization.id,
          input.page,
          input.limit,
        );
      },
    ),

  createQueue: orgAuthed
    .route({
      method: "POST",
      path: "/communications/queues",
      summary: "Create communication queue",
      tags: ["Communications"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        channel: z.enum(["chat", "voice", "sms"]).default("chat"),
        maxWait: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { name: string; description?: string; channel: "chat" | "voice" | "sms"; maxWait?: string };
      }) => {
        const db = getDb(context);
        const [row] = await db
          .insert(schema.commQueues)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description ?? null,
            channel: input.channel,
            maxWait: input.maxWait ?? null,
          })
          .returning();
        return row;
      },
    ),

  // ── SMS Campaigns ──────────────────────────────────────────────────────────
  listSmsCampaigns: orgAuthed
    .route({
      method: "GET",
      path: "/communications/campaigns",
      summary: "List SMS campaigns",
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
        return paginatedList(
          db,
          schema.smsCampaigns,
          context.organization.id,
          input.page,
          input.limit,
        );
      },
    ),

  createSmsCampaign: orgAuthed
    .route({
      method: "POST",
      path: "/communications/campaigns",
      summary: "Create SMS campaign",
      tags: ["Communications"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        body: z.string().min(1),
        fromNumber: z.string().optional(),
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
        input: { name: string; body: string; fromNumber?: string; scheduledAt?: string };
      }) => {
        const db = getDb(context);
        const [row] = await db
          .insert(schema.smsCampaigns)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            body: input.body,
            fromNumber: input.fromNumber ?? null,
            scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          })
          .returning();
        return row;
      },
    ),

  // ── Templates ──────────────────────────────────────────────────────────────
  listTemplates: orgAuthed
    .route({
      method: "GET",
      path: "/communications/templates",
      summary: "List message templates",
      tags: ["Communications"],
    })
    .input(pageInput.extend({ channel: z.string().optional() }))
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; channel?: string };
      }) => {
        const db = getDb(context);
        return paginatedList(
          db,
          schema.commTemplates,
          context.organization.id,
          input.page,
          input.limit,
        );
      },
    ),

  createTemplate: orgAuthed
    .route({
      method: "POST",
      path: "/communications/templates",
      summary: "Create message template",
      tags: ["Communications"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        channel: z.enum(["sms", "email", "chat"]).default("sms"),
        category: z.string().optional(),
        body: z.string().min(1),
        variables: z.array(z.string()).optional(),
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
          channel: "sms" | "email" | "chat";
          category?: string;
          body: string;
          variables?: string[];
        };
      }) => {
        const db = getDb(context);
        const [row] = await db
          .insert(schema.commTemplates)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            channel: input.channel,
            category: input.category ?? "general",
            body: input.body,
            variables: input.variables ?? [],
            createdById: context.user.id,
          })
          .returning();
        return row;
      },
    ),

  deleteTemplate: orgAuthed
    .route({
      method: "DELETE",
      path: "/communications/templates/:id",
      summary: "Delete message template",
      tags: ["Communications"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .delete(schema.commTemplates)
          .where(eq(schema.commTemplates.id, input.id));
        return { success: true };
      },
    ),

  // ── Bots ───────────────────────────────────────────────────────────────────
  listBots: orgAuthed
    .route({
      method: "GET",
      path: "/communications/bots",
      summary: "List chatbots",
      tags: ["Communications"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { page: number; limit: number } }) => {
        const db = getDb(context);
        return paginatedList(
          db,
          schema.commBots,
          context.organization.id,
          input.page,
          input.limit,
        );
      },
    ),

  createBot: orgAuthed
    .route({
      method: "POST",
      path: "/communications/bots",
      summary: "Create chatbot",
      tags: ["Communications"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        channel: z.enum(["chat", "sms", "voice"]).default("chat"),
        systemPrompt: z.string().optional(),
        model: z.string().optional(),
        handoffThreshold: z.string().optional(),
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
          channel: "chat" | "sms" | "voice";
          systemPrompt?: string;
          model?: string;
          handoffThreshold?: string;
        };
      }) => {
        const db = getDb(context);
        const [row] = await db
          .insert(schema.commBots)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description ?? null,
            channel: input.channel,
            systemPrompt: input.systemPrompt ?? null,
            model: input.model ?? "gpt-4o-mini",
            handoffThreshold: input.handoffThreshold ?? "0.7",
          })
          .returning();
        return row;
      },
    ),

  updateBot: orgAuthed
    .route({
      method: "PATCH",
      path: "/communications/bots/:id",
      summary: "Update chatbot",
      tags: ["Communications"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["active", "inactive", "training"]).optional(),
        name: z.string().optional(),
        systemPrompt: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; status?: string; name?: string; systemPrompt?: string };
      }) => {
        const db = getDb(context);
        const updateData: Record<string, unknown> = {
          updatedAt: new Date(),
        };
        if (input.status !== undefined) updateData.status = input.status;
        if (input.name !== undefined) updateData.name = input.name;
        if (input.systemPrompt !== undefined) updateData.systemPrompt = input.systemPrompt;

        const [row] = await db
          .update(schema.commBots)
          .set(updateData)
          .where(eq(schema.commBots.id, input.id))
          .returning();
        return row;
      },
    ),
};
