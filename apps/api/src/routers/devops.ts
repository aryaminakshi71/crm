/**
 * DevOps CI/CD Router
 *
 * Pipelines, runs, deployments, infrastructure, and environments.
 */

import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError, ErrorCode } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";

const {
  pipelines,
  pipelineRuns,
  deployments,
  infrastructure,
  environments,
} = schema;

// Devops scoped procedure
const devopsAuthed = orgAuthed;

// ─── Pipelines ───────────────────────────────────────────────────────────────

export const devopsRouter = {
  // List Pipelines
  listPipelines: devopsAuthed
    .route({
      method: "GET",
      path: "/devops/pipelines",
      summary: "List pipelines",
      tags: ["DevOps"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        status: z.string().optional(),
        environment: z.string().optional(),
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
        input: { page: number; limit: number; status?: string; environment?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(pipelines.organizationId, context.organization.id)];
        if (input.status) conditions.push(eq(pipelines.status, input.status));
        if (input.environment) conditions.push(eq(pipelines.environment, input.environment));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(pipelines)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(pipelines)
          .where(whereConditions)
          .orderBy(desc(pipelines.lastRunAt))
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

  // Create Pipeline
  createPipeline: devopsAuthed
    .route({
      method: "POST",
      path: "/devops/pipelines",
      summary: "Create pipeline",
      tags: ["DevOps"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        repo: z.string().optional(),
        branch: z.string().default("main"),
        config: z.object({
          yaml: z.string().optional(),
          steps: z.array(z.object({
            name: z.string(),
            command: z.string(),
            env: z.record(z.string(), z.string()).optional(),
          })).optional(),
          triggers: z.object({
            push: z.boolean().optional(),
            pullRequest: z.boolean().optional(),
            schedule: z.string().optional(),
          }).optional(),
        }).optional(),
        environment: z.string().optional(),
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
          repo?: string;
          branch?: string;
          config?: {
            yaml?: string;
            steps?: Array<{ name: string; command: string; env?: Record<string, string> }>;
            triggers?: { push?: boolean; pullRequest?: boolean; schedule?: string };
          };
          environment?: string;
        };
      }) => {
        const db = getDb(context);

        const [pipeline] = await db
          .insert(pipelines)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description,
            repo: input.repo,
            branch: input.branch || "main",
            config: input.config,
            environment: input.environment,
            status: "active",
            createdBy: context.user.id,
          })
          .returning();

        return pipeline;
      },
    ),

  // Get Pipeline
  getPipeline: devopsAuthed
    .route({
      method: "GET",
      path: "/devops/pipelines/:id",
      summary: "Get pipeline",
      tags: ["DevOps"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [pipeline] = await db
          .select()
          .from(pipelines)
          .where(
            and(
              eq(pipelines.id, input.id),
              eq(pipelines.organizationId, context.organization.id),
            ),
          );

        if (!pipeline) {
          throw new APIError(ErrorCode.NOT_FOUND, "Pipeline not found", 404);
        }

        return pipeline;
      },
    ),

  // Update Pipeline
  updatePipeline: devopsAuthed
    .route({
      method: "PATCH",
      path: "/devops/pipelines/:id",
      summary: "Update pipeline",
      tags: ["DevOps"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        repo: z.string().optional(),
        branch: z.string().optional(),
        config: z.any().optional(),
        environment: z.string().optional(),
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
        input: {
          id: string;
          name?: string;
          description?: string;
          repo?: string;
          branch?: string;
          config?: any;
          environment?: string;
          status?: string;
        };
      }) => {
        const db = getDb(context);

        const [pipeline] = await db
          .update(pipelines)
          .set({
            ...(input.name && { name: input.name }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.repo !== undefined && { repo: input.repo }),
            ...(input.branch !== undefined && { branch: input.branch }),
            ...(input.config !== undefined && { config: input.config }),
            ...(input.environment !== undefined && { environment: input.environment }),
            ...(input.status && { status: input.status }),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(pipelines.id, input.id),
              eq(pipelines.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!pipeline) {
          throw new APIError(ErrorCode.NOT_FOUND, "Pipeline not found", 404);
        }

        return pipeline;
      },
    ),

  // Delete Pipeline
  deletePipeline: devopsAuthed
    .route({
      method: "DELETE",
      path: "/devops/pipelines/:id",
      summary: "Delete pipeline",
      tags: ["DevOps"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [deleted] = await db
          .delete(pipelines)
          .where(
            and(
              eq(pipelines.id, input.id),
              eq(pipelines.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!deleted) {
          throw new APIError(ErrorCode.NOT_FOUND, "Pipeline not found", 404);
        }

        return { success: true };
      },
    ),

  // Trigger Pipeline Run
  triggerRun: devopsAuthed
    .route({
      method: "POST",
      path: "/devops/pipelines/:id/run",
      summary: "Trigger pipeline run",
      tags: ["DevOps"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        branch: z.string().optional(),
        commitSha: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; branch?: string; commitSha?: string };
      }) => {
        const db = getDb(context);

        // Get pipeline
        const [pipeline] = await db
          .select()
          .from(pipelines)
          .where(
            and(
              eq(pipelines.id, input.id),
              eq(pipelines.organizationId, context.organization.id),
            ),
          );

        if (!pipeline) {
          throw new APIError(ErrorCode.NOT_FOUND, "Pipeline not found", 404);
        }

        // Get next run number
        const countResult = await db
          .select({ count: count() })
          .from(pipelineRuns)
          .where(eq(pipelineRuns.pipelineId, input.id));
        const runNumber = (countResult[0]?.count ?? 0) + 1;

        // Create run
        const [run] = await db
          .insert(pipelineRuns)
          .values({
            organizationId: context.organization.id,
            pipelineId: input.id,
            runNumber,
            status: "pending",
            branch: input.branch || pipeline.branch,
            commitSha: input.commitSha,
            triggeredBy: context.user.id,
            triggerSource: "manual",
          })
          .returning();

        // Update pipeline
        await db
          .update(pipelines)
          .set({
            lastRunAt: new Date(),
            runCount: sql`${pipelines.runCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(pipelines.id, input.id));

        return run;
      },
    ),

  // ─── Pipeline Runs ─────────────────────────────────────────────────────────

  // List Runs
  listRuns: devopsAuthed
    .route({
      method: "GET",
      path: "/devops/runs",
      summary: "List pipeline runs",
      tags: ["DevOps"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        pipelineId: z.string().uuid().optional(),
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
        input: { page: number; limit: number; pipelineId?: string; status?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(pipelineRuns.organizationId, context.organization.id)];
        if (input.pipelineId) conditions.push(eq(pipelineRuns.pipelineId, input.pipelineId));
        if (input.status) conditions.push(eq(pipelineRuns.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(pipelineRuns)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(pipelineRuns)
          .where(whereConditions)
          .orderBy(desc(pipelineRuns.createdAt))
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

  // Get Run
  getRun: devopsAuthed
    .route({
      method: "GET",
      path: "/devops/runs/:id",
      summary: "Get pipeline run",
      tags: ["DevOps"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [run] = await db
          .select()
          .from(pipelineRuns)
          .where(
            and(
              eq(pipelineRuns.id, input.id),
              eq(pipelineRuns.organizationId, context.organization.id),
            ),
          );

        if (!run) {
          throw new APIError(ErrorCode.NOT_FOUND, "Pipeline run not found", 404);
        }

        return run;
      },
    ),

  // Cancel Run
  cancelRun: devopsAuthed
    .route({
      method: "POST",
      path: "/devops/runs/:id/cancel",
      summary: "Cancel pipeline run",
      tags: ["DevOps"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [run] = await db
          .update(pipelineRuns)
          .set({
            status: "canceled",
            completedAt: new Date(),
          })
          .where(
            and(
              eq(pipelineRuns.id, input.id),
              eq(pipelineRuns.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!run) {
          throw new APIError(ErrorCode.NOT_FOUND, "Pipeline run not found", 404);
        }

        return run;
      },
    ),

  // ─── Deployments ───────────────────────────────────────────────────────────

  // List Deployments
  listDeployments: devopsAuthed
    .route({
      method: "GET",
      path: "/devops/deployments",
      summary: "List deployments",
      tags: ["DevOps"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        environment: z.string().optional(),
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
        input: { page: number; limit: number; environment?: string; status?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(deployments.organizationId, context.organization.id)];
        if (input.environment) conditions.push(eq(deployments.environment, input.environment));
        if (input.status) conditions.push(eq(deployments.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(deployments)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(deployments)
          .where(whereConditions)
          .orderBy(desc(deployments.deployedAt))
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

  // Create Deployment
  createDeployment: devopsAuthed
    .route({
      method: "POST",
      path: "/devops/deployments",
      summary: "Create deployment",
      tags: ["DevOps"],
    })
    .input(
      z.object({
        pipelineRunId: z.string().uuid().optional(),
        environment: z.string(),
        version: z.string(),
        url: z.string().optional(),
        rolloutStrategy: z.string().default("immediate"),
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
          pipelineRunId?: string;
          environment: string;
          version: string;
          url?: string;
          rolloutStrategy?: string;
        };
      }) => {
        const db = getDb(context);

        // Get previous deployment
        const [prevDeployment] = await db
          .select()
          .from(deployments)
          .where(
            and(
              eq(deployments.organizationId, context.organization.id),
              eq(deployments.environment, input.environment),
            ),
          )
          .orderBy(desc(deployments.deployedAt))
          .limit(1);

        const [deployment] = await db
          .insert(deployments)
          .values({
            organizationId: context.organization.id,
            pipelineRunId: input.pipelineRunId,
            environment: input.environment,
            version: input.version,
            previousVersion: prevDeployment?.version,
            status: "pending",
            url: input.url,
            rolloutStrategy: input.rolloutStrategy,
            deployedBy: context.user.id,
          })
          .returning();

        return deployment;
      },
    ),

  // Rollback Deployment
  rollbackDeployment: devopsAuthed
    .route({
      method: "POST",
      path: "/devops/deployments/:id/rollback",
      summary: "Rollback deployment",
      tags: ["DevOps"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        // Get current deployment
        const [current] = await db
          .select()
          .from(deployments)
          .where(
            and(
              eq(deployments.id, input.id),
              eq(deployments.organizationId, context.organization.id),
            ),
          );

        if (!current) {
          throw new APIError(ErrorCode.NOT_FOUND, "Deployment not found", 404);
        }

        if (!current.previousVersion) {
          throw new APIError(ErrorCode.BAD_REQUEST, "No previous version to rollback to", 400);
        }

        // Create rollback deployment
        const [rollback] = await db
          .insert(deployments)
          .values({
            organizationId: context.organization.id,
            environment: current.environment,
            version: current.previousVersion,
            previousVersion: current.version,
            status: "pending",
            url: current.url,
            rollbackFrom: current.id,
            deployedBy: context.user.id,
          })
          .returning();

        // Update current deployment status
        await db
          .update(deployments)
          .set({
            status: "rolled_back",
            rolledBackAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(deployments.id, input.id));

        return rollback;
      },
    ),

  // ─── Infrastructure ────────────────────────────────────────────────────────

  // List Infrastructure
  listInfrastructure: devopsAuthed
    .route({
      method: "GET",
      path: "/devops/infrastructure",
      summary: "List infrastructure",
      tags: ["DevOps"],
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
        input: { page: number; limit: number; type?: string; status?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(infrastructure.organizationId, context.organization.id)];
        if (input.type) conditions.push(eq(infrastructure.type, input.type));
        if (input.status) conditions.push(eq(infrastructure.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(infrastructure)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(infrastructure)
          .where(whereConditions)
          .orderBy(desc(infrastructure.createdAt))
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

  // Create Infrastructure
  createInfrastructure: devopsAuthed
    .route({
      method: "POST",
      path: "/devops/infrastructure",
      summary: "Create infrastructure",
      tags: ["DevOps"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        type: z.string(),
        provider: z.string().optional(),
        region: z.string().optional(),
        config: z.any().optional(),
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
          provider?: string;
          region?: string;
          config?: any;
        };
      }) => {
        const db = getDb(context);

        const [infra] = await db
          .insert(infrastructure)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            type: input.type,
            provider: input.provider,
            region: input.region,
            config: input.config,
            status: "provisioning",
          })
          .returning();

        return infra;
      },
    ),

  // Get Infrastructure
  getInfrastructure: devopsAuthed
    .route({
      method: "GET",
      path: "/devops/infrastructure/:id",
      summary: "Get infrastructure",
      tags: ["DevOps"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [infra] = await db
          .select()
          .from(infrastructure)
          .where(
            and(
              eq(infrastructure.id, input.id),
              eq(infrastructure.organizationId, context.organization.id),
            ),
          );

        if (!infra) {
          throw new APIError(ErrorCode.NOT_FOUND, "Infrastructure not found", 404);
        }

        return infra;
      },
    ),

  // Update Infrastructure
  updateInfrastructure: devopsAuthed
    .route({
      method: "PATCH",
      path: "/devops/infrastructure/:id",
      summary: "Update infrastructure",
      tags: ["DevOps"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        config: z.any().optional(),
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
        input: { id: string; name?: string; config?: any; status?: string };
      }) => {
        const db = getDb(context);

        const [infra] = await db
          .update(infrastructure)
          .set({
            ...(input.name && { name: input.name }),
            ...(input.config !== undefined && { config: input.config }),
            ...(input.status && { status: input.status }),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(infrastructure.id, input.id),
              eq(infrastructure.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!infra) {
          throw new APIError(ErrorCode.NOT_FOUND, "Infrastructure not found", 404);
        }

        return infra;
      },
    ),

  // Delete Infrastructure
  deleteInfrastructure: devopsAuthed
    .route({
      method: "DELETE",
      path: "/devops/infrastructure/:id",
      summary: "Delete infrastructure",
      tags: ["DevOps"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [deleted] = await db
          .delete(infrastructure)
          .where(
            and(
              eq(infrastructure.id, input.id),
              eq(infrastructure.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!deleted) {
          throw new APIError(ErrorCode.NOT_FOUND, "Infrastructure not found", 404);
        }

        return { success: true };
      },
    ),

  // ─── Environments ───────────────────────────────────────────────────────────

  // List Environments
  listEnvironments: devopsAuthed
    .route({
      method: "GET",
      path: "/devops/environments",
      summary: "List environments",
      tags: ["DevOps"],
    })
    .output(z.array(z.any()))
    .handler(
      async ({ context }: { context: OrgContext }) => {
        const db = getDb(context);

        const data = await db
          .select()
          .from(environments)
          .where(eq(environments.organizationId, context.organization.id))
          .orderBy(environments.createdAt);

        return data;
      },
    ),

  // Create Environment
  createEnvironment: devopsAuthed
    .route({
      method: "POST",
      path: "/devops/environments",
      summary: "Create environment",
      tags: ["DevOps"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        type: z.string(),
        variables: z.record(z.string(), z.string()).optional(),
        isDefault: z.boolean().optional(),
        autoDeploy: z.boolean().optional(),
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
          variables?: Record<string, string>;
          isDefault?: boolean;
          autoDeploy?: boolean;
        };
      }) => {
        const db = getDb(context);

        const [env] = await db
          .insert(environments)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            type: input.type,
            variables: input.variables || {},
            isDefault: input.isDefault || false,
            autoDeploy: input.autoDeploy || false,
          })
          .returning();

        return env;
      },
    ),
};
