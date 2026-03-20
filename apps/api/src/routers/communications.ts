/**
 * Communications Router (Samva API)
 *
 * SMS, Voice, Video, Chat, Phone Numbers, and Templates.
 */

import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError, ErrorCode } from "../lib/errors";
import { getDb, requireModule, schema } from "../procedures";

const {
  smsMessages,
  voiceCalls,
  videoSessions,
  chatConversations,
  chatMessages,
  phoneNumbers,
  communicationTemplates,
} = schema;

// Communications scoped procedure with module check
const communicationsAuthed = requireModule("communications");

export const communicationsRouter = {
  // ─── SMS ───────────────────────────────────────────────────────────────────

  // Send SMS
  sendSms: communicationsAuthed
    .route({
      method: "POST",
      path: "/communications/sms/send",
      summary: "Send SMS",
      tags: ["Communications"],
    })
    .input(
      z.object({
        to: z.string().min(1),
        body: z.string().min(1),
        from: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { to: string; body: string; from?: string };
      }) => {
        const db = getDb(context);

        // TODO: Integrate with Twilio or other SMS provider
        // For now, create a placeholder record

        const [message] = await db
          .insert(smsMessages)
          .values({
            organizationId: context.organization.id,
            direction: "outbound",
            from: input.from || "+1234567890", // Would come from phone number
            to: input.to,
            body: input.body,
            status: "queued",
          })
          .returning();

        return message;
      },
    ),

  // Get SMS
  getSms: communicationsAuthed
    .route({
      method: "GET",
      path: "/communications/sms/:id",
      summary: "Get SMS",
      tags: ["Communications"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [message] = await db
          .select()
          .from(smsMessages)
          .where(
            and(
              eq(smsMessages.id, input.id),
              eq(smsMessages.organizationId, context.organization.id),
            ),
          );

        if (!message) {
          throw new APIError(ErrorCode.NOT_FOUND, "SMS message not found", 404);
        }

        return message;
      },
    ),

  // List SMS
  listSms: communicationsAuthed
    .route({
      method: "GET",
      path: "/communications/sms",
      summary: "List SMS messages",
      tags: ["Communications"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        direction: z.string().optional(),
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
        input: { page: number; limit: number; direction?: string; status?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(smsMessages.organizationId, context.organization.id)];
        if (input.direction) conditions.push(eq(smsMessages.direction, input.direction));
        if (input.status) conditions.push(eq(smsMessages.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(smsMessages)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(smsMessages)
          .where(whereConditions)
          .orderBy(desc(smsMessages.createdAt))
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

  // Bulk SMS
  sendBulkSms: communicationsAuthed
    .route({
      method: "POST",
      path: "/communications/sms/bulk",
      summary: "Send bulk SMS",
      tags: ["Communications"],
    })
    .input(
      z.object({
        recipients: z.array(z.object({
          to: z.string(),
          body: z.string(),
        })),
        from: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { recipients: Array<{ to: string; body: string }>; from?: string };
      }) => {
        const db = getDb(context);

        const results = [];
        for (const recipient of input.recipients) {
          const [message] = await db
            .insert(smsMessages)
            .values({
              organizationId: context.organization.id,
              direction: "outbound",
              from: input.from || "+1234567890",
              to: recipient.to,
              body: recipient.body,
              status: "queued",
            })
            .returning();
          results.push(message);
        }

        return { sent: results.length, messages: results };
      },
    ),

  // ─── Voice ─────────────────────────────────────────────────────────────────

  // Initiate Call
  initiateCall: communicationsAuthed
    .route({
      method: "POST",
      path: "/communications/voice/call",
      summary: "Initiate voice call",
      tags: ["Communications"],
    })
    .input(
      z.object({
        to: z.string().min(1),
        from: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { to: string; from?: string };
      }) => {
        const db = getDb(context);

        const [call] = await db
          .insert(voiceCalls)
          .values({
            organizationId: context.organization.id,
            direction: "outbound",
            from: input.from || "+1234567890",
            to: input.to,
            status: "initiated",
          })
          .returning();

        return call;
      },
    ),

  // Get Call
  getCall: communicationsAuthed
    .route({
      method: "GET",
      path: "/communications/voice/:id",
      summary: "Get voice call",
      tags: ["Communications"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [call] = await db
          .select()
          .from(voiceCalls)
          .where(
            and(
              eq(voiceCalls.id, input.id),
              eq(voiceCalls.organizationId, context.organization.id),
            ),
          );

        if (!call) {
          throw new APIError(ErrorCode.NOT_FOUND, "Voice call not found", 404);
        }

        return call;
      },
    ),

  // List Calls
  listCalls: communicationsAuthed
    .route({
      method: "GET",
      path: "/communications/voice",
      summary: "List voice calls",
      tags: ["Communications"],
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

        const conditions = [eq(voiceCalls.organizationId, context.organization.id)];
        if (input.status) conditions.push(eq(voiceCalls.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(voiceCalls)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(voiceCalls)
          .where(whereConditions)
          .orderBy(desc(voiceCalls.createdAt))
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

  // ─── Video ─────────────────────────────────────────────────────────────────

  // Create Video Room
  createVideoRoom: communicationsAuthed
    .route({
      method: "POST",
      path: "/communications/video/room",
      summary: "Create video room",
      tags: ["Communications"],
    })
    .input(
      z.object({
        roomName: z.string().min(1),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { roomName: string };
      }) => {
        const db = getDb(context);

        const [room] = await db
          .insert(videoSessions)
          .values({
            organizationId: context.organization.id,
            roomName: input.roomName,
            status: "active",
          })
          .returning();

        return room;
      },
    ),

  // Get Video Room
  getVideoRoom: communicationsAuthed
    .route({
      method: "GET",
      path: "/communications/video/room/:id",
      summary: "Get video room",
      tags: ["Communications"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [room] = await db
          .select()
          .from(videoSessions)
          .where(
            and(
              eq(videoSessions.id, input.id),
              eq(videoSessions.organizationId, context.organization.id),
            ),
          );

        if (!room) {
          throw new APIError(ErrorCode.NOT_FOUND, "Video room not found", 404);
        }

        return room;
      },
    ),

  // End Video Room
  endVideoRoom: communicationsAuthed
    .route({
      method: "POST",
      path: "/communications/video/room/:id/end",
      summary: "End video room",
      tags: ["Communications"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [room] = await db
          .update(videoSessions)
          .set({
            status: "ended",
            endedAt: new Date(),
          })
          .where(
            and(
              eq(videoSessions.id, input.id),
              eq(videoSessions.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!room) {
          throw new APIError(ErrorCode.NOT_FOUND, "Video room not found", 404);
        }

        return room;
      },
    ),

  // List Video Rooms
  listVideoRooms: communicationsAuthed
    .route({
      method: "GET",
      path: "/communications/video",
      summary: "List video rooms",
      tags: ["Communications"],
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

        const conditions = [eq(videoSessions.organizationId, context.organization.id)];
        if (input.status) conditions.push(eq(videoSessions.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(videoSessions)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(videoSessions)
          .where(whereConditions)
          .orderBy(desc(videoSessions.createdAt))
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

  // ─── Chat ──────────────────────────────────────────────────────────────────

  // List Conversations
  listChatConversations: communicationsAuthed
    .route({
      method: "GET",
      path: "/communications/chat/conversations",
      summary: "List chat conversations",
      tags: ["Communications"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
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
        input: { page: number; limit: number };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const countResult = await db
          .select({ count: count() })
          .from(chatConversations)
          .where(eq(chatConversations.organizationId, context.organization.id));
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(chatConversations)
          .where(eq(chatConversations.organizationId, context.organization.id))
          .orderBy(desc(chatConversations.lastMessageAt))
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

  // Create Conversation
  createConversation: communicationsAuthed
    .route({
      method: "POST",
      path: "/communications/chat/conversations",
      summary: "Create chat conversation",
      tags: ["Communications"],
    })
    .input(
      z.object({
        type: z.string().default("direct"),
        participants: z.array(z.object({
          id: z.string(),
          name: z.string(),
        })),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { type?: string; participants: Array<{ id: string; name: string }> };
      }) => {
        const db = getDb(context);

        const [conversation] = await db
          .insert(chatConversations)
          .values({
            organizationId: context.organization.id,
            type: input.type || "direct",
            participants: input.participants,
          })
          .returning();

        return conversation;
      },
    ),

  // Get Conversation Messages
  getConversationMessages: communicationsAuthed
    .route({
      method: "GET",
      path: "/communications/chat/:id/messages",
      summary: "Get conversation messages",
      tags: ["Communications"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
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
        input: { id: string; page: number; limit: number };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const countResult = await db
          .select({ count: count() })
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, input.id));
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, input.id))
          .orderBy(desc(chatMessages.createdAt))
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

  // Send Message
  sendMessage: communicationsAuthed
    .route({
      method: "POST",
      path: "/communications/chat/:id/messages",
      summary: "Send chat message",
      tags: ["Communications"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.string().min(1),
        attachments: z.array(z.object({
          type: z.string(),
          url: z.string(),
          name: z.string(),
          size: z.number(),
        })).optional(),
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
          content: string;
          attachments?: Array<{ type: string; url: string; name: string; size: number }>;
        };
      }) => {
        const db = getDb(context);

        const [message] = await db
          .insert(chatMessages)
          .values({
            organizationId: context.organization.id,
            conversationId: input.id,
            senderId: context.user.id,
            senderName: context.user.name || "Unknown",
            content: input.content,
            attachments: input.attachments || [],
          })
          .returning();

        // Update conversation
        await db
          .update(chatConversations)
          .set({
            lastMessageAt: new Date(),
            lastMessage: input.content,
            lastMessageBy: context.user.id,
          })
          .where(eq(chatConversations.id, input.id));

        return message;
      },
    ),

  // ─── Phone Numbers ──────────────────────────────────────────────────────────

  // List Phone Numbers
  listPhoneNumbers: communicationsAuthed
    .route({
      method: "GET",
      path: "/communications/numbers",
      summary: "List phone numbers",
      tags: ["Communications"],
    })
    .output(z.array(z.any()))
    .handler(
      async ({ context }: { context: OrgContext }) => {
        const db = getDb(context);

        const data = await db
          .select()
          .from(phoneNumbers)
          .where(eq(phoneNumbers.organizationId, context.organization.id))
          .orderBy(desc(phoneNumbers.createdAt));

        return data;
      },
    ),

  // Purchase Phone Number
  purchaseNumber: communicationsAuthed
    .route({
      method: "POST",
      path: "/communications/numbers",
      summary: "Purchase phone number",
      tags: ["Communications"],
    })
    .input(
      z.object({
        number: z.string().min(1),
        type: z.string().default("local"),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { number: string; type?: string };
      }) => {
        const db = getDb(context);

        // TODO: Integrate with Twilio or other provider

        const [phoneNumber] = await db
          .insert(phoneNumbers)
          .values({
            organizationId: context.organization.id,
            number: input.number,
            formattedNumber: input.number,
            type: input.type || "local",
            provider: "twilio",
            status: "active",
            capabilities: ["sms", "voice"],
            monthlyCost: 1.00,
          })
          .returning();

        return phoneNumber;
      },
    ),

  // Release Phone Number
  releaseNumber: communicationsAuthed
    .route({
      method: "DELETE",
      path: "/communications/numbers/:id",
      summary: "Release phone number",
      tags: ["Communications"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [deleted] = await db
          .delete(phoneNumbers)
          .where(
            and(
              eq(phoneNumbers.id, input.id),
              eq(phoneNumbers.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!deleted) {
          throw new APIError(ErrorCode.NOT_FOUND, "Phone number not found", 404);
        }

        return { success: true };
      },
    ),

  // ─── Templates ─────────────────────────────────────────────────────────────

  // List Templates
  listTemplates: communicationsAuthed
    .route({
      method: "GET",
      path: "/communications/templates",
      summary: "List communication templates",
      tags: ["Communications"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        type: z.string().optional(),
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
        input: { page: number; limit: number; type?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(communicationTemplates.organizationId, context.organization.id)];
        if (input.type) conditions.push(eq(communicationTemplates.type, input.type));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(communicationTemplates)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(communicationTemplates)
          .where(whereConditions)
          .orderBy(desc(communicationTemplates.createdAt))
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

  // Create Template
  createTemplate: communicationsAuthed
    .route({
      method: "POST",
      path: "/communications/templates",
      summary: "Create communication template",
      tags: ["Communications"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        type: z.string(),
        content: z.string().min(1),
        variables: z.array(z.string()).optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
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
          type: string;
          content: string;
          variables?: string[];
          category?: string;
          tags?: string[];
        };
      }) => {
        const db = getDb(context);

        const [template] = await db
          .insert(communicationTemplates)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            type: input.type,
            content: input.content,
            variables: input.variables || [],
            category: input.category,
            tags: input.tags || [],
            createdBy: context.user.id,
          })
          .returning();

        return template;
      },
    ),
};
