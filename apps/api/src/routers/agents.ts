/**
 * AI Agents Router
 *
 * AI agents operations for chatbot, autonomous, code execution, and data analysis agents.
 */

import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError, ErrorCode } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";

const { agents, agentTemplates, agentConversations, agentMessages, agentExecutions } = schema;

// Agent Types
const agentSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  agentType: z.string(),
  status: z.string(),
  config: z.record(z.string(), z.unknown()),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const conversationSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const messageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  tokens: z.string().nullable(),
  createdAt: z.date(),
});

export const agentsRouter = {
  // ─── Agents ──────────────────────────────────────────────────────────────────

  listAgents: orgAuthed
    .route({
      method: "GET",
      path: "/agents",
      summary: "List agents",
      tags: ["AI Agents"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        type: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(agentSchema),
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
        input: { page: number; limit: number; type?: string; status?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(agents.organizationId, context.organization.id)];
        if (input.type) conditions.push(eq(agents.agentType, input.type));
        if (input.status) conditions.push(eq(agents.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(agents)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(agents)
          .where(whereConditions)
          .orderBy(desc(agents.createdAt))
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

  createAgent: orgAuthed
    .route({
      method: "POST",
      path: "/agents",
      summary: "Create agent",
      tags: ["AI Agents"],
    })
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        agentType: z.enum(["chatbot", "autonomous", "code_execution", "data_analysis"]),
        config: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .output(agentSchema)
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          name: string;
          description?: string;
          agentType: "chatbot" | "autonomous" | "code_execution" | "data_analysis";
          config?: Record<string, unknown>;
        };
      }) => {
        const db = getDb(context);
        const [agent] = await db
          .insert(agents)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description || null,
            agentType: input.agentType,
            config: input.config || {},
            createdBy: context.user.id,
            status: "inactive",
          })
          .returning();
        return agent;
      },
    ),

  listTemplates: orgAuthed
    .route({
      method: "GET",
      path: "/agents/templates",
      summary: "List agent templates",
      tags: ["AI Agents"],
    })
    .output(z.object({ data: z.array(z.any()) }))
    .handler(async () => {
      // Return predefined templates
      const templates = [
        {
          id: "template-1",
          name: "Customer Support Agent",
          description: "AI agent for handling customer support queries",
          agentType: "chatbot",
          defaultConfig: { temperature: 0.7, maxTokens: 2048 },
          isPublic: "true",
        },
        {
          id: "template-2",
          name: "Data Analyst Agent",
          description: "AI agent for analyzing data and generating insights",
          agentType: "data_analysis",
          defaultConfig: { temperature: 0.5, maxTokens: 4096 },
          isPublic: "true",
        },
        {
          id: "template-3",
          name: "Code Assistant Agent",
          description: "AI agent for helping with code reviews and debugging",
          agentType: "code_execution",
          defaultConfig: { temperature: 0.3, maxTokens: 4096 },
          isPublic: "true",
        },
      ];
      return { data: templates };
    }),

  getAgent: orgAuthed
    .route({
      method: "GET",
      path: "/agents/:id",
      summary: "Get agent",
      tags: ["AI Agents"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(agentSchema)
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        const [agent] = await db
          .select()
          .from(agents)
          .where(
            and(eq(agents.id, input.id), eq(agents.organizationId, context.organization.id)),
          )
          .limit(1);

        if (!agent) {
          throw new APIError(ErrorCode.NOT_FOUND, "Agent not found", 404);
        }
        return agent;
      },
    ),

  updateAgent: orgAuthed
    .route({
      method: "PATCH",
      path: "/agents/:id",
      summary: "Update agent",
      tags: ["AI Agents"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        config: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .output(agentSchema)
    .handler(
      async ({ context, input }: { context: OrgContext; input: any }) => {
        const db = getDb(context);
        const [agent] = await db
          .update(agents)
          .set({
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
            ...(input.config !== undefined ? { config: input.config } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(eq(agents.id, input.id), eq(agents.organizationId, context.organization.id)),
          )
          .returning();

        if (!agent) {
          throw new APIError(ErrorCode.NOT_FOUND, "Agent not found", 404);
        }
        return agent;
      },
    ),

  deleteAgent: orgAuthed
    .route({
      method: "DELETE",
      path: "/agents/:id",
      summary: "Delete agent",
      tags: ["AI Agents"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .delete(agents)
          .where(
            and(eq(agents.id, input.id), eq(agents.organizationId, context.organization.id)),
          );
        return { success: true };
      },
    ),

  // ─── Chat ────────────────────────────────────────────────────────────────────

  chat: orgAuthed
    .route({
      method: "POST",
      path: "/agents/:id/chat",
      summary: "Chat with agent",
      tags: ["AI Agents"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        message: z.string(),
        conversationId: z.string().uuid().optional(),
        stream: z.boolean().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; message: string; conversationId?: string; stream?: boolean };
      }) => {
        const db = getDb(context);

        // Get or create conversation
        let conversationId = input.conversationId;
        if (!conversationId) {
          const [conversation] = await db
            .insert(agentConversations)
            .values({
              agentId: input.id,
              organizationId: context.organization.id,
              userId: context.user.id,
              status: "active",
            })
            .returning();
          conversationId = conversation.id;
        }

        // Store user message
        await db.insert(agentMessages).values({
          conversationId,
          role: "user",
          content: input.message,
        });

        // Simulated AI response (would call actual AI API)
        const response = "This is a simulated AI response.";

        // Store assistant message
        await db.insert(agentMessages).values({
          conversationId,
          role: "assistant",
          content: response,
        });

        return { conversationId, message: response };
      },
    ),

  listConversations: orgAuthed
    .route({
      method: "GET",
      path: "/agents/:id/conversations",
      summary: "List agent conversations",
      tags: ["AI Agents"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .output(
      z.object({
        data: z.array(conversationSchema),
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
        input: { id: string; page: number; limit: number };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const countResult = await db
          .select({ count: count() })
          .from(agentConversations)
          .where(
            and(
              eq(agentConversations.agentId, input.id),
              eq(agentConversations.organizationId, context.organization.id),
            ),
          );
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(agentConversations)
          .where(
            and(
              eq(agentConversations.agentId, input.id),
              eq(agentConversations.organizationId, context.organization.id),
            ),
          )
          .orderBy(desc(agentConversations.updatedAt))
          .limit(input.limit)
          .offset(offset);

        return { data, total, page: input.page, limit: input.limit };
      },
    ),

  getConversation: orgAuthed
    .route({
      method: "GET",
      path: "/agents/:id/conversations/:cid",
      summary: "Get conversation messages",
      tags: ["AI Agents"],
    })
    .input(z.object({ id: z.string().uuid(), cid: z.string().uuid() }))
    .output(z.object({ data: z.array(messageSchema) }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; cid: string };
      }) => {
        const db = getDb(context);
        const data = await db
          .select()
          .from(agentMessages)
          .where(eq(agentMessages.conversationId, input.cid))
          .orderBy(desc(agentMessages.createdAt));
        return { data };
      },
    ),

  // ─── Execution ───────────────────────────────────────────────────────────────

  execute: orgAuthed
    .route({
      method: "POST",
      path: "/agents/:id/execute",
      summary: "Execute autonomous task",
      tags: ["AI Agents"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        task: z.string(),
        conversationId: z.string().uuid().optional(),
      }),
    )
    .output(z.object({ executionId: z.string().uuid(), status: z.string() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; task: string; conversationId?: string };
      }) => {
        const db = getDb(context);
        const [execution] = await db
          .insert(agentExecutions)
          .values({
            agentId: input.id,
            conversationId: input.conversationId || null,
            organizationId: context.organization.id,
            task: input.task,
            status: "pending",
          })
          .returning();
        return { executionId: execution.id, status: execution.status };
      },
    ),

  listExecutions: orgAuthed
    .route({
      method: "GET",
      path: "/agents/:id/executions",
      summary: "List agent executions",
      tags: ["AI Agents"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
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
        input: { id: string; page: number; limit: number };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const countResult = await db
          .select({ count: count() })
          .from(agentExecutions)
          .where(
            and(
              eq(agentExecutions.agentId, input.id),
              eq(agentExecutions.organizationId, context.organization.id),
            ),
          );
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(agentExecutions)
          .where(
            and(
              eq(agentExecutions.agentId, input.id),
              eq(agentExecutions.organizationId, context.organization.id),
            ),
          )
          .orderBy(desc(agentExecutions.startedAt))
          .limit(input.limit)
          .offset(offset);

        return { data, total, page: input.page, limit: input.limit };
      },
    ),

  getExecution: orgAuthed
    .route({
      method: "GET",
      path: "/agents/:id/executions/:eid",
      summary: "Get execution",
      tags: ["AI Agents"],
    })
    .input(z.object({ id: z.string().uuid(), eid: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; eid: string };
      }) => {
        const db = getDb(context);
        const [execution] = await db
          .select()
          .from(agentExecutions)
          .where(
            and(
              eq(agentExecutions.id, input.eid),
              eq(agentExecutions.organizationId, context.organization.id),
            ),
          )
          .limit(1);

        if (!execution) {
          throw new APIError(ErrorCode.NOT_FOUND, "Execution not found", 404);
        }
        return execution;
      },
    ),
};
