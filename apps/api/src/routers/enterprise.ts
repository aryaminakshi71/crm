import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, orgAuthed, schema } from "../procedures";

const pageInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(200).default(50),
});

function toOffset(page: number, limit: number) {
  return (page - 1) * limit;
}

export const enterpriseRouter = {
  summary: orgAuthed
    .route({
      method: "GET",
      path: "/enterprise/summary",
      summary: "Get enterprise controls summary",
      tags: ["Enterprise"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [roles, workflows, audits, providers, scimJobs] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.enterpriseRoles)
          .where(eq(schema.enterpriseRoles.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.approvalWorkflows)
          .where(eq(schema.approvalWorkflows.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.enterpriseAuditEvents)
          .where(eq(schema.enterpriseAuditEvents.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.ssoProviders)
          .where(eq(schema.ssoProviders.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.scimSyncJobs)
          .where(eq(schema.scimSyncJobs.organizationId, orgId)),
      ]);

      return {
        roles: Number(roles[0]?.count || 0),
        workflows: Number(workflows[0]?.count || 0),
        auditEvents: Number(audits[0]?.count || 0),
        ssoProviders: Number(providers[0]?.count || 0),
        scimJobs: Number(scimJobs[0]?.count || 0),
      };
    }),

  rolesList: orgAuthed
    .route({
      method: "GET",
      path: "/enterprise/roles",
      summary: "List enterprise roles",
      tags: ["Enterprise"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.enterpriseRoles)
        .where(eq(schema.enterpriseRoles.organizationId, context.organization.id))
        .orderBy(desc(schema.enterpriseRoles.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  rolesCreate: orgAuthed
    .route({
      method: "POST",
      path: "/enterprise/roles",
      summary: "Create enterprise role",
      tags: ["Enterprise"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        scope: z.string().min(1),
        riskLevel: z.enum(["low", "medium", "high"]).default("low"),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [role] = await db
        .insert(schema.enterpriseRoles)
        .values({
          organizationId: context.organization.id,
          name: input.name,
          scope: input.scope,
          riskLevel: input.riskLevel,
          createdBy: context.user.id,
        })
        .returning();

      return role;
    }),

  rolesUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/enterprise/roles/:id",
      summary: "Update enterprise role",
      tags: ["Enterprise"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        scope: z.string().min(1).optional(),
        riskLevel: z.enum(["low", "medium", "high"]).optional(),
        assignedUsers: z.number().int().min(0).optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [role] = await db
        .update(schema.enterpriseRoles)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.scope !== undefined ? { scope: input.scope } : {}),
          ...(input.riskLevel !== undefined ? { riskLevel: input.riskLevel } : {}),
          ...(input.assignedUsers !== undefined ? { assignedUsers: input.assignedUsers } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.enterpriseRoles.id, input.id),
            eq(schema.enterpriseRoles.organizationId, context.organization.id),
          ),
        )
        .returning();
      return role;
    }),

  rolesDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/enterprise/roles/:id",
      summary: "Delete enterprise role",
      tags: ["Enterprise"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.enterpriseRoles)
        .where(
          and(
            eq(schema.enterpriseRoles.id, input.id),
            eq(schema.enterpriseRoles.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  workflowsList: orgAuthed
    .route({
      method: "GET",
      path: "/enterprise/approval-workflows",
      summary: "List approval workflows",
      tags: ["Enterprise"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.approvalWorkflows)
        .where(eq(schema.approvalWorkflows.organizationId, context.organization.id))
        .orderBy(desc(schema.approvalWorkflows.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  workflowsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/enterprise/approval-workflows",
      summary: "Create approval workflow",
      tags: ["Enterprise"],
    })
    .input(
      z.object({
        title: z.string().min(1),
        ownerTeam: z.string().default("operations"),
        stageCount: z.number().int().min(1).default(1),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [workflow] = await db
        .insert(schema.approvalWorkflows)
        .values({
          organizationId: context.organization.id,
          title: input.title,
          ownerTeam: input.ownerTeam,
          stageCount: input.stageCount,
          notes: input.notes || null,
          createdBy: context.user.id,
        })
        .returning();

      return workflow;
    }),

  workflowsUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/enterprise/approval-workflows/:id",
      summary: "Update approval workflow",
      tags: ["Enterprise"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        ownerTeam: z.string().optional(),
        stageCount: z.number().int().min(1).optional(),
        status: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [workflow] = await db
        .update(schema.approvalWorkflows)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.ownerTeam !== undefined ? { ownerTeam: input.ownerTeam } : {}),
          ...(input.stageCount !== undefined ? { stageCount: input.stageCount } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.approvalWorkflows.id, input.id),
            eq(schema.approvalWorkflows.organizationId, context.organization.id),
          ),
        )
        .returning();
      return workflow;
    }),

  workflowsUpdateStatus: orgAuthed
    .route({
      method: "PATCH",
      path: "/enterprise/approval-workflows/:id/status",
      summary: "Update workflow status",
      tags: ["Enterprise"],
    })
    .input(z.object({ id: z.string().uuid(), status: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [workflow] = await db
        .update(schema.approvalWorkflows)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.approvalWorkflows.id, input.id),
            eq(schema.approvalWorkflows.organizationId, context.organization.id),
          ),
        )
        .returning();

      return workflow;
    }),

  workflowsDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/enterprise/approval-workflows/:id",
      summary: "Delete approval workflow",
      tags: ["Enterprise"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.approvalWorkflows)
        .where(
          and(
            eq(schema.approvalWorkflows.id, input.id),
            eq(schema.approvalWorkflows.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  auditEventsList: orgAuthed
    .route({
      method: "GET",
      path: "/enterprise/audit-events",
      summary: "List enterprise audit events",
      tags: ["Enterprise"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.enterpriseAuditEvents)
        .where(eq(schema.enterpriseAuditEvents.organizationId, context.organization.id))
        .orderBy(desc(schema.enterpriseAuditEvents.eventTime))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  ssoProvidersList: orgAuthed
    .route({
      method: "GET",
      path: "/enterprise/sso-providers",
      summary: "List SSO providers",
      tags: ["Enterprise"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.ssoProviders)
        .where(eq(schema.ssoProviders.organizationId, context.organization.id))
        .orderBy(desc(schema.ssoProviders.updatedAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  ssoProvidersCreate: orgAuthed
    .route({
      method: "POST",
      path: "/enterprise/sso-providers",
      summary: "Create SSO provider",
      tags: ["Enterprise"],
    })
    .input(
      z.object({
        providerName: z.string().min(1),
        providerType: z.string().default("oidc"),
        status: z.string().default("connected"),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [provider] = await db
        .insert(schema.ssoProviders)
        .values({
          organizationId: context.organization.id,
          providerName: input.providerName,
          providerType: input.providerType,
          status: input.status,
        })
        .returning();

      return provider;
    }),

  ssoProvidersUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/enterprise/sso-providers/:id",
      summary: "Update SSO provider",
      tags: ["Enterprise"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        providerName: z.string().optional(),
        providerType: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [provider] = await db
        .update(schema.ssoProviders)
        .set({
          ...(input.providerName !== undefined ? { providerName: input.providerName } : {}),
          ...(input.providerType !== undefined ? { providerType: input.providerType } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.status === "connected" ? { lastSyncAt: new Date() } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.ssoProviders.id, input.id),
            eq(schema.ssoProviders.organizationId, context.organization.id),
          ),
        )
        .returning();
      return provider;
    }),

  ssoProvidersDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/enterprise/sso-providers/:id",
      summary: "Delete SSO provider",
      tags: ["Enterprise"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      await getDb(context)
        .delete(schema.ssoProviders)
        .where(
          and(
            eq(schema.ssoProviders.id, input.id),
            eq(schema.ssoProviders.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  scimSyncJobsList: orgAuthed
    .route({
      method: "GET",
      path: "/enterprise/scim-sync-jobs",
      summary: "List SCIM sync jobs",
      tags: ["Enterprise"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select({
          id: schema.scimSyncJobs.id,
          providerId: schema.scimSyncJobs.providerId,
          providerName: schema.ssoProviders.providerName,
          status: schema.scimSyncJobs.status,
          direction: schema.scimSyncJobs.direction,
          recordsProcessed: schema.scimSyncJobs.recordsProcessed,
          errorMessage: schema.scimSyncJobs.errorMessage,
          startedAt: schema.scimSyncJobs.startedAt,
          completedAt: schema.scimSyncJobs.completedAt,
          createdAt: schema.scimSyncJobs.createdAt,
        })
        .from(schema.scimSyncJobs)
        .leftJoin(schema.ssoProviders, eq(schema.scimSyncJobs.providerId, schema.ssoProviders.id))
        .where(eq(schema.scimSyncJobs.organizationId, context.organization.id))
        .orderBy(desc(schema.scimSyncJobs.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),
};
