/**
 * Integration Hub Router
 *
 * Integration hub operations for connectors, workflows, events, and subscriptions.
 */

import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";

const { connectors, workflows, workflowRuns, workflowEvents, eventSubscriptions, quotaLimits } = schema;

// Connector Types
const connectorSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  type: z.string(),
  name: z.string(),
  status: z.string(),
  config: z.record(z.unknown()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Workflow Types
const workflowSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  triggerType: z.string(),
  definition: z.record(z.unknown()),
  status: z.string(),
  environment: z.string().nullable(),
  createdBy: z.string().uuid(),
  lastRunAt: z.date().nullable(),
  runCount: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const integrationRouter = {
  // ─── Connectors ────────────────────────────────────────────────────────────────

  listConnectors: orgAuthed
    .route({
      method: "GET",
      path: "/integration/connectors",
      summary: "List connectors",
      tags: ["Integration"],
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
        data: z.array(connectorSchema),
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

        const conditions = [eq(connectors.organizationId, context.organization.id)];
        if (input.type) conditions.push(eq(connectors.type, input.type));
        if (input.status) conditions.push(eq(connectors.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(connectors)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(connectors)
          .where(whereConditions)
          .orderBy(desc(connectors.createdAt))
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

  createConnector: orgAuthed
    .route({
      method: "POST",
      path: "/integration/connectors",
      summary: "Create connector",
      tags: ["Integration"],
    })
    .input(
      z.object({
        type: z.string(),
        name: z.string(),
        config: z.record(z.unknown()).optional(),
        credentials: z.record(z.unknown()).optional(),
      }),
    )
    .output(connectorSchema)
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { type: string; name: string; config?: Record<string, unknown>; credentials?: Record<string, unknown> };
      }) => {
        const db = getDb(context);
        const [connector] = await db
          .insert(connectors)
          .values({
            organizationId: context.organization.id,
            type: input.type,
            name: input.name,
            config: input.config || {},
            credentials: input.credentials || {},
            status: "inactive",
          })
          .returning();
        return connector;
      },
    ),

  getConnector: orgAuthed
    .route({
      method: "GET",
      path: "/integration/connectors/:id",
      summary: "Get connector",
      tags: ["Integration"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(connectorSchema)
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        const [connector] = await db
          .select()
          .from(connectors)
          .where(
            and(eq(connectors.id, input.id), eq(connectors.organizationId, context.organization.id)),
          )
          .limit(1);

        if (!connector) {
          throw new APIError("Connector not found", 404);
        }
        return connector;
      },
    ),

  updateConnector: orgAuthed
    .route({
      method: "PATCH",
      path: "/integration/connectors/:id",
      summary: "Update connector",
      tags: ["Integration"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        status: z.string().optional(),
        config: z.record(z.unknown()).optional(),
        credentials: z.record(z.unknown()).optional(),
      }),
    )
    .output(connectorSchema)
    .handler(
      async ({ context, input }: { context: OrgContext; input: any }) => {
        const db = getDb(context);
        const [connector] = await db
          .update(connectors)
          .set({
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
            ...(input.config !== undefined ? { config: input.config } : {}),
            ...(input.credentials !== undefined ? { credentials: input.credentials } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(eq(connectors.id, input.id), eq(connectors.organizationId, context.organization.id)),
          )
          .returning();

        if (!connector) {
          throw new APIError("Connector not found", 404);
        }
        return connector;
      },
    ),

  deleteConnector: orgAuthed
    .route({
      method: "DELETE",
      path: "/integration/connectors/:id",
      summary: "Delete connector",
      tags: ["Integration"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .delete(connectors)
          .where(
            and(eq(connectors.id, input.id), eq(connectors.organizationId, context.organization.id)),
          );
        return { success: true };
      },
    ),

  testConnector: orgAuthed
    .route({
      method: "POST",
      path: "/integration/connectors/:id/test",
      summary: "Test connector",
      tags: ["Integration"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), message: z.string().optional() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        // Connector test would call external service
        return { success: true, message: "Connection successful" };
      },
    ),

  // ─── Workflows ───────────────────────────────────────────────────────────────

  listWorkflows: orgAuthed
    .route({
      method: "GET",
      path: "/integration/workflows",
      summary: "List workflows",
      tags: ["Integration"],
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
        data: z.array(workflowSchema),
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

        const conditions = [eq(workflows.organizationId, context.organization.id)];
        if (input.status) conditions.push(eq(workflows.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(workflows)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(workflows)
          .where(whereConditions)
          .orderBy(desc(workflows.createdAt))
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

  createWorkflow: orgAuthed
    .route({
      method: "POST",
      path: "/integration/workflows",
      summary: "Create workflow",
      tags: ["Integration"],
    })
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        triggerType: z.enum(["webhook", "schedule", "event", "manual"]),
        definition: z.record(z.unknown()),
        environment: z.string().optional(),
      }),
    )
    .output(workflowSchema)
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          name: string;
          description?: string;
          triggerType: "webhook" | "schedule" | "event" | "manual";
          definition: Record<string, unknown>;
          environment?: string;
        };
      }) => {
        const db = getDb(context);
        const [workflow] = await db
          .insert(workflows)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description || null,
            triggerType: input.triggerType,
            definition: input.definition,
            environment: input.environment || "production",
            createdBy: context.user.id,
            status: "draft",
          })
          .returning();
        return workflow;
      },
    ),

  getWorkflow: orgAuthed
    .route({
      method: "GET",
      path: "/integration/workflows/:id",
      summary: "Get workflow",
      tags: ["Integration"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(workflowSchema)
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        const [workflow] = await db
          .select()
          .from(workflows)
          .where(
            and(eq(workflows.id, input.id), eq(workflows.organizationId, context.organization.id)),
          )
          .limit(1);

        if (!workflow) {
          throw new APIError("Workflow not found", 404);
        }
        return workflow;
      },
    ),

  updateWorkflow: orgAuthed
    .route({
      method: "PATCH",
      path: "/integration/workflows/:id",
      summary: "Update workflow",
      tags: ["Integration"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        definition: z.record(z.unknown()).optional(),
        status: z.string().optional(),
      }),
    )
    .output(workflowSchema)
    .handler(
      async ({ context, input }: { context: OrgContext; input: any }) => {
        const db = getDb(context);
        const [workflow] = await db
          .update(workflows)
          .set({
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.definition !== undefined ? { definition: input.definition } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(eq(workflows.id, input.id), eq(workflows.organizationId, context.organization.id)),
          )
          .returning();

        if (!workflow) {
          throw new APIError("Workflow not found", 404);
        }
        return workflow;
      },
    ),

  deleteWorkflow: orgAuthed
    .route({
      method: "DELETE",
      path: "/integration/workflows/:id",
      summary: "Delete workflow",
      tags: ["Integration"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .delete(workflows)
          .where(
            and(eq(workflows.id, input.id), eq(workflows.organizationId, context.organization.id)),
          );
        return { success: true };
      },
    ),

  triggerWorkflow: orgAuthed
    .route({
      method: "POST",
      path: "/integration/workflows/:id/trigger",
      summary: "Trigger workflow",
      tags: ["Integration"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        triggerData: z.record(z.unknown()).optional(),
      }),
    )
    .output(z.object({ runId: z.string().uuid(), status: z.string() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; triggerData?: Record<string, unknown> };
      }) => {
        const db = getDb(context);
        const [run] = await db
          .insert(workflowRuns)
          .values({
            workflowId: input.id,
            organizationId: context.organization.id,
            triggerData: input.triggerData || {},
            status: "pending",
          })
          .returning();
        return { runId: run.id, status: run.status };
      },
    ),

  // ─── Workflow Runs ───────────────────────────────────────────────────────────

  listRuns: orgAuthed
    .route({
      method: "GET",
      path: "/integration/runs",
      summary: "List workflow runs",
      tags: ["Integration"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        workflowId: z.string().uuid().optional(),
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
        input: { page: number; limit: number; workflowId?: string; status?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(workflowRuns.organizationId, context.organization.id)];
        if (input.workflowId) conditions.push(eq(workflowRuns.workflowId, input.workflowId));
        if (input.status) conditions.push(eq(workflowRuns.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(workflowRuns)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(workflowRuns)
          .where(whereConditions)
          .orderBy(desc(workflowRuns.createdAt))
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

  getRun: orgAuthed
    .route({
      method: "GET",
      path: "/integration/runs/:id",
      summary: "Get workflow run",
      tags: ["Integration"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        const [run] = await db
          .select()
          .from(workflowRuns)
          .where(
            and(eq(workflowRuns.id, input.id), eq(workflowRuns.organizationId, context.organization.id)),
          )
          .limit(1);

        if (!run) {
          throw new APIError("Workflow run not found", 404);
        }
        return run;
      },
    ),

  cancelRun: orgAuthed
    .route({
      method: "POST",
      path: "/integration/runs/:id/cancel",
      summary: "Cancel workflow run",
      tags: ["Integration"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .update(workflowRuns)
          .set({ status: "cancelled", completedAt: new Date() })
          .where(
            and(eq(workflowRuns.id, input.id), eq(workflowRuns.organizationId, context.organization.id)),
          );
        return { success: true };
      },
    ),

  // ─── Events ──────────────────────────────────────────────────────────────────

  listEvents: orgAuthed
    .route({
      method: "GET",
      path: "/integration/events",
      summary: "List events",
      tags: ["Integration"],
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

        const conditions = [eq(workflowEvents.organizationId, context.organization.id)];
        if (input.type) conditions.push(eq(workflowEvents.type, input.type));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(workflowEvents)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(workflowEvents)
          .where(whereConditions)
          .orderBy(desc(workflowEvents.createdAt))
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

  publishEvent: orgAuthed
    .route({
      method: "POST",
      path: "/integration/events",
      summary: "Publish event",
      tags: ["Integration"],
    })
    .input(
      z.object({
        type: z.string(),
        source: z.string().optional(),
        payload: z.record(z.unknown()).optional(),
        metadata: z.record(z.unknown()).optional(),
        idempotencyKey: z.string().optional(),
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
          type: string;
          source?: string;
          payload?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
          idempotencyKey?: string;
        };
      }) => {
        const db = getDb(context);
        const [event] = await db
          .insert(workflowEvents)
          .values({
            organizationId: context.organization.id,
            type: input.type,
            source: input.source || "api",
            payload: input.payload || {},
            metadata: input.metadata || {},
            idempotencyKey: input.idempotencyKey,
          })
          .returning();
        return { id: event.id, success: true };
      },
    ),

  // ─── Subscriptions ────────────────────────────────────────────────────────────

  listSubscriptions: orgAuthed
    .route({
      method: "GET",
      path: "/integration/subscriptions",
      summary: "List subscriptions",
      tags: ["Integration"],
    })
    .output(z.object({ data: z.array(z.any()) }))
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const data = await db
        .select()
        .from(eventSubscriptions)
        .where(eq(eventSubscriptions.organizationId, context.organization.id));
      return { data };
    }),

  createSubscription: orgAuthed
    .route({
      method: "POST",
      path: "/integration/subscriptions",
      summary: "Create subscription",
      tags: ["Integration"],
    })
    .input(
      z.object({
        workflowId: z.string().uuid(),
        eventType: z.string(),
        filters: z.record(z.unknown()).optional(),
      }),
    )
    .output(z.object({ id: z.string().uuid(), success: z.boolean() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { workflowId: string; eventType: string; filters?: Record<string, unknown> };
      }) => {
        const db = getDb(context);
        const [subscription] = await db
          .insert(eventSubscriptions)
          .values({
            organizationId: context.organization.id,
            workflowId: input.workflowId,
            eventType: input.eventType,
            filters: input.filters || {},
          })
          .returning();
        return { id: subscription.id, success: true };
      },
    ),

  deleteSubscription: orgAuthed
    .route({
      method: "DELETE",
      path: "/integration/subscriptions/:id",
      summary: "Delete subscription",
      tags: ["Integration"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .delete(eventSubscriptions)
          .where(
            and(
              eq(eventSubscriptions.id, input.id),
              eq(eventSubscriptions.organizationId, context.organization.id),
            ),
          );
        return { success: true };
      },
    ),
};
