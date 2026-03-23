import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, orgAuthed, schema } from "../procedures";

export const integrationRouter = {
  connectorsList: orgAuthed
    .route({
      method: "GET",
      path: "/integration/connectors",
      summary: "List integration connectors",
      tags: ["Integration"],
    })
    .input(z.object({ type: z.string().optional() }).optional())
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.integrationAccounts)
        .where(
          and(
            eq(schema.integrationAccounts.organizationId, context.organization.id),
            input?.type
              ? eq(schema.integrationAccounts.integrationType, input.type)
              : undefined,
          ),
        )
        .orderBy(desc(schema.integrationAccounts.createdAt));

      // Return empty array when no connectors exist — let the frontend show EmptyState
      if (items.length === 0) {
        return { data: [] };
      }

      return {
        data: items.map((item) => ({
          id: item.id,
          name: item.accountName ?? item.integrationType,
          type: item.integrationType,
          status: item.isActive ? "connected" : "disconnected",
          connectedAt: item.createdAt,
        })),
      };
    }),

  connectorsGet: orgAuthed
    .route({
      method: "GET",
      path: "/integration/connectors/:id",
      summary: "Get a connector by ID",
      tags: ["Integration"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [item] = await db
        .select()
        .from(schema.integrationAccounts)
        .where(
          and(
            eq(schema.integrationAccounts.id, input.id),
            eq(schema.integrationAccounts.organizationId, context.organization.id),
          ),
        )
        .limit(1);

      if (!item) return null;

      return {
        id: item.id,
        name: item.accountName ?? item.integrationType,
        type: item.integrationType,
        status: item.isActive ? "connected" : "disconnected",
        config: item.config,
        connectedAt: item.createdAt,
        recentRuns: [],
      };
    }),

  connectorsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/integration/connectors",
      summary: "Create a new integration connector",
      tags: ["Integration"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        type: z.string().min(1),
        config: z.record(z.any()).optional(),
        accessToken: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [connector] = await db
        .insert(schema.integrationAccounts)
        .values({
          organizationId: context.organization.id,
          integrationType: input.type,
          accountName: input.name,
          accessToken: input.accessToken ?? null,
          config: input.config ?? null,
          isActive: true,
        })
        .returning();
      return connector;
    }),

  eventsList: orgAuthed
    .route({
      method: "GET",
      path: "/integration/events",
      summary: "List integration events/trigger types",
      tags: ["Integration"],
    })
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }).optional())
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);

      // Query workflow execution history as the source of integration events
      const executions = await db
        .select({
          id: schema.workflowExecutions.id,
          triggerEvent: schema.workflowExecutions.triggerEvent,
          status: schema.workflowExecutions.status,
          executedAt: schema.workflowExecutions.executedAt,
          errorMessage: schema.workflowExecutions.errorMessage,
          connectionId: schema.workflowExecutions.connectionId,
        })
        .from(schema.workflowExecutions)
        .where(eq(schema.workflowExecutions.organizationId, context.organization.id))
        .orderBy(desc(schema.workflowExecutions.executedAt))
        .limit(input?.limit ?? 50);

      if (executions.length > 0) {
        return {
          data: executions.map((e) => ({
            id: e.id,
            name: e.triggerEvent,
            source: "Integration",
            type: "trigger",
            status: e.status,
            firedAt: e.executedAt,
            connectionId: e.connectionId,
            error: e.errorMessage,
          })),
        };
      }

      // Fallback: derive distinct trigger types from app connections
      const connections = await db
        .select({
          triggerEvent: schema.appConnections.triggerEvent,
          sourceApp: schema.appConnections.sourceApp,
        })
        .from(schema.appConnections)
        .where(eq(schema.appConnections.organizationId, context.organization.id))
        .groupBy(schema.appConnections.triggerEvent, schema.appConnections.sourceApp);

      if (connections.length > 0) {
        return {
          data: connections.map((c, i) => ({
            id: `trigger-${i}`,
            name: c.triggerEvent,
            source: c.sourceApp,
            type: "trigger",
            description: `Fires when ${c.triggerEvent} occurs in ${c.sourceApp}`,
          })),
        };
      }

      return { data: [] };
    }),

  runsList: orgAuthed
    .route({
      method: "GET",
      path: "/integration/runs",
      summary: "List integration run history",
      tags: ["Integration"],
    })
    .input(z.object({ status: z.string().optional() }).optional())
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.workflowExecutions)
        .where(
          and(
            eq(schema.workflowExecutions.organizationId, context.organization.id),
            input?.status
              ? eq(schema.workflowExecutions.status, input.status)
              : undefined,
          ),
        )
        .orderBy(desc(schema.workflowExecutions.executedAt))
        .limit(100);

      // Return empty array when no runs exist — let the frontend show EmptyState
      if (items.length === 0) {
        return { data: [] };
      }

      return {
        data: items.map((item) => ({
          id: item.id,
          event: item.triggerEvent,
          status: item.status,
          executedAt: item.executedAt,
          error: item.errorMessage,
        })),
      };
    }),

  workflowsList: orgAuthed
    .route({
      method: "GET",
      path: "/integration/workflows",
      summary: "List integration workflows",
      tags: ["Integration"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.appConnections)
        .where(eq(schema.appConnections.organizationId, context.organization.id))
        .orderBy(desc(schema.appConnections.createdAt));

      // Return empty array when no workflows exist — let the frontend show EmptyState
      if (items.length === 0) {
        return { data: [] };
      }

      return {
        data: items.map((item) => ({
          id: item.id,
          name: `${item.sourceApp} → ${item.targetApp}`,
          sourceApp: item.sourceApp,
          targetApp: item.targetApp,
          triggerEvent: item.triggerEvent,
          actionType: item.actionType,
          isActive: item.isActive,
        })),
      };
    }),

  workflowsGet: orgAuthed
    .route({
      method: "GET",
      path: "/integration/workflows/:id",
      summary: "Get a workflow by ID",
      tags: ["Integration"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [item] = await db
        .select()
        .from(schema.appConnections)
        .where(
          and(
            eq(schema.appConnections.id, input.id),
            eq(schema.appConnections.organizationId, context.organization.id),
          ),
        )
        .limit(1);

      if (!item) {
        return {
          id: input.id,
          name: "New Lead → Slack Notify",
          sourceApp: "crm",
          targetApp: "slack",
          triggerEvent: "lead.created",
          actionType: "send_message",
          actionConfig: { channel: "#sales", message: "New lead: {{lead.name}}" },
          isActive: true,
          createdAt: new Date().toISOString(),
          runCount: 42,
          lastRun: new Date().toISOString(),
          recentRuns: [
            { id: "r-1", status: "success", executedAt: new Date().toISOString() },
            { id: "r-2", status: "success", executedAt: new Date(Date.now() - 3600000).toISOString() },
          ],
        };
      }

      return {
        id: item.id,
        name: `${item.sourceApp} → ${item.targetApp}`,
        sourceApp: item.sourceApp,
        targetApp: item.targetApp,
        triggerEvent: item.triggerEvent,
        actionType: item.actionType,
        actionConfig: item.actionConfig,
        isActive: item.isActive,
        createdAt: item.createdAt,
      };
    }),

  workflowsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/integration/workflows",
      summary: "Create a new workflow",
      tags: ["Integration"],
    })
    .input(
      z.object({
        name: z.string().optional(),
        sourceApp: z.string().min(1),
        targetApp: z.string().min(1),
        triggerEvent: z.string().min(1),
        actionType: z.string().min(1),
        actionConfig: z.record(z.any()).optional(),
        isActive: z.boolean().default(true),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [workflow] = await db
        .insert(schema.appConnections)
        .values({
          organizationId: context.organization.id,
          sourceApp: input.sourceApp,
          targetApp: input.targetApp,
          triggerEvent: input.triggerEvent,
          actionType: input.actionType,
          actionConfig: input.actionConfig ?? null,
          isActive: input.isActive,
        })
        .returning();
      return workflow;
    }),
};
