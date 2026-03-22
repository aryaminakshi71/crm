/**
 * Agents Router
 *
 * Agent workflow management operations.
 */

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

const { agentWorkflows } = schema;

const workflowStepSchema = z.object({
  id: z.string(),
  type: z.string(),
  agentId: z.string().optional(),
  config: z.record(z.unknown()),
});

export const agentsRouter = {
  /**
   * List agent workflows for the organization
   */
  "workflows.list": orgAuthed
    .route({
      method: "GET",
      path: "/agents/workflows",
      summary: "List agent workflows",
      tags: ["Agents"],
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
        const orgId = context.organization.id;

        const conditions = [
          eq(agentWorkflows.organizationId, orgId),
          isNull(agentWorkflows.deletedAt),
        ];
        if (input.status) {
          conditions.push(eq(agentWorkflows.status, input.status));
        }
        const where = and(...conditions);

        const [all, paginated] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(agentWorkflows).where(where),
          db
            .select()
            .from(agentWorkflows)
            .where(where)
            .orderBy(desc(agentWorkflows.createdAt))
            .limit(input.limit)
            .offset(offset),
        ]);

        const total = Number(all[0]?.count ?? 0);

        return {
          data: paginated,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      },
    ),

  /**
   * Create a new agent workflow
   */
  "workflows.create": orgAuthed
    .route({
      method: "POST",
      path: "/agents/workflows",
      summary: "Create agent workflow",
      tags: ["Agents"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        status: z.enum(["active", "paused", "draft"]).default("draft"),
        triggerType: z
          .enum(["schedule", "event", "manual", "webhook"])
          .optional(),
        triggerConfig: z.record(z.unknown()).optional(),
        steps: z.array(workflowStepSchema).optional(),
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
          status: string;
          triggerType?: string;
          triggerConfig?: Record<string, unknown>;
          steps?: Array<{
            id: string;
            type: string;
            agentId?: string;
            config: Record<string, unknown>;
          }>;
        };
      }) => {
        const db = getDb(context);
        const [workflow] = await db
          .insert(agentWorkflows)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description ?? null,
            status: input.status,
            triggerType: input.triggerType ?? null,
            triggerConfig: input.triggerConfig ?? null,
            steps: input.steps ?? [],
            createdBy: context.user.id,
          })
          .returning();

        return workflow;
      },
    ),

  /**
   * Get a single agent workflow by ID
   */
  "workflows.get": orgAuthed
    .route({
      method: "GET",
      path: "/agents/workflows/:id",
      summary: "Get agent workflow",
      tags: ["Agents"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string };
      }) => {
        const db = getDb(context);
        const [workflow] = await db
          .select()
          .from(agentWorkflows)
          .where(
            and(
              eq(agentWorkflows.id, input.id),
              eq(agentWorkflows.organizationId, context.organization.id),
              isNull(agentWorkflows.deletedAt),
            ),
          )
          .limit(1);

        if (!workflow) {
          throw new Error("Workflow not found");
        }

        return workflow;
      },
    ),

  /**
   * Update an agent workflow
   */
  "workflows.update": orgAuthed
    .route({
      method: "PATCH",
      path: "/agents/workflows/:id",
      summary: "Update agent workflow",
      tags: ["Agents"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        status: z.enum(["active", "paused", "draft"]).optional(),
        triggerType: z
          .enum(["schedule", "event", "manual", "webhook"])
          .optional(),
        triggerConfig: z.record(z.unknown()).optional(),
        steps: z.array(workflowStepSchema).optional(),
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
          triggerType?: string;
          triggerConfig?: Record<string, unknown>;
          steps?: Array<{
            id: string;
            type: string;
            agentId?: string;
            config: Record<string, unknown>;
          }>;
        };
      }) => {
        const db = getDb(context);
        const { id, ...rest } = input;

        const updateData: Record<string, unknown> = {
          updatedAt: new Date(),
        };
        if (rest.name !== undefined) updateData.name = rest.name;
        if (rest.description !== undefined)
          updateData.description = rest.description;
        if (rest.status !== undefined) updateData.status = rest.status;
        if (rest.triggerType !== undefined)
          updateData.triggerType = rest.triggerType;
        if (rest.triggerConfig !== undefined)
          updateData.triggerConfig = rest.triggerConfig;
        if (rest.steps !== undefined) updateData.steps = rest.steps;

        const [workflow] = await db
          .update(agentWorkflows)
          .set(updateData as any)
          .where(
            and(
              eq(agentWorkflows.id, id),
              eq(agentWorkflows.organizationId, context.organization.id),
              isNull(agentWorkflows.deletedAt),
            ),
          )
          .returning();

        if (!workflow) {
          throw new Error("Workflow not found");
        }

        return workflow;
      },
    ),

  /**
   * Soft-delete an agent workflow
   */
  "workflows.delete": orgAuthed
    .route({
      method: "DELETE",
      path: "/agents/workflows/:id",
      summary: "Delete agent workflow",
      tags: ["Agents"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string };
      }) => {
        const db = getDb(context);
        await db
          .update(agentWorkflows)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(agentWorkflows.id, input.id),
              eq(agentWorkflows.organizationId, context.organization.id),
              isNull(agentWorkflows.deletedAt),
            ),
          );

        return { success: true };
      },
    ),

  /**
   * Trigger a workflow run
   */
  "workflows.run": orgAuthed
    .route({
      method: "POST",
      path: "/agents/workflows/:id/run",
      summary: "Run agent workflow",
      tags: ["Agents"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        input: z.record(z.unknown()).optional(),
      }),
    )
    .output(
      z.object({
        runId: z.string(),
        workflowId: z.string(),
        status: z.string(),
        startedAt: z.string(),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; input?: Record<string, unknown> };
      }) => {
        const db = getDb(context);

        // Verify workflow exists and belongs to org
        const [workflow] = await db
          .select()
          .from(agentWorkflows)
          .where(
            and(
              eq(agentWorkflows.id, input.id),
              eq(agentWorkflows.organizationId, context.organization.id),
              isNull(agentWorkflows.deletedAt),
            ),
          )
          .limit(1);

        if (!workflow) {
          throw new Error("Workflow not found");
        }

        // Increment run count and update lastRunAt
        await db
          .update(agentWorkflows)
          .set({
            runCount: sql`${agentWorkflows.runCount} + 1`,
            lastRunAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(agentWorkflows.id, input.id));

        const runId = crypto.randomUUID();
        const startedAt = new Date().toISOString();

        return {
          runId,
          workflowId: input.id,
          status: "running",
          startedAt,
        };
      },
    ),

  /**
   * Get workflow statistics for the organization
   */
  "workflows.stats": orgAuthed
    .route({
      method: "GET",
      path: "/agents/workflows/stats",
      summary: "Get agent workflow stats",
      tags: ["Agents"],
    })
    .input(z.object({}).optional())
    .output(
      z.object({
        totalWorkflows: z.number(),
        activeWorkflows: z.number(),
        runsToday: z.number(),
      }),
    )
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [total, active, runsToday] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(agentWorkflows)
          .where(
            and(
              eq(agentWorkflows.organizationId, orgId),
              isNull(agentWorkflows.deletedAt),
            ),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(agentWorkflows)
          .where(
            and(
              eq(agentWorkflows.organizationId, orgId),
              eq(agentWorkflows.status, "active"),
              isNull(agentWorkflows.deletedAt),
            ),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(agentWorkflows)
          .where(
            and(
              eq(agentWorkflows.organizationId, orgId),
              isNull(agentWorkflows.deletedAt),
              sql`${agentWorkflows.lastRunAt} >= ${today.toISOString()}`,
            ),
          ),
      ]);

      return {
        totalWorkflows: Number(total[0]?.count ?? 0),
        activeWorkflows: Number(active[0]?.count ?? 0),
        runsToday: Number(runsToday[0]?.count ?? 0),
      };
    }),
};
