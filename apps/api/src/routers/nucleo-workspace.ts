import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError, ErrorCode } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";
import { cacheKeys, getCache, invalidateOrgCache, setCache } from "../lib/cache";

const pageInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(200).default(50),
});

function toOffset(page: number, limit: number) {
  return (page - 1) * limit;
}

export const nucleoWorkspaceRouter = {
  summary: orgAuthed
    .route({
      method: "GET",
      path: "/nucleo/summary",
      summary: "Get unified workspace summary",
      tags: ["Nucleo"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      // Try cache first (5 minute TTL for summary)
      const cacheKey = cacheKeys.summary(orgId);
      const cached = getCache<{
        customers: number;
        projects: number;
        tickets: number;
        assets: number;
        documents: number;
        invoices: number;
        campaigns: number;
        queueTokens: number;
        hrmEmployees: number;
        enterpriseRoles: number;
        intelligenceKpis: number;
      }>(cacheKey);
      if (cached) {
        return cached;
      }

      const [
        customers,
        projects,
        tickets,
        assets,
        documents,
        invoices,
        campaigns,
        queue,
        hrmEmployees,
        enterpriseRoles,
        intelligenceKpis,
      ] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.customers)
          .where(eq(schema.customers.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.projects)
          .where(eq(schema.projects.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.tickets)
          .where(eq(schema.tickets.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.digitalAssets)
          .where(eq(schema.digitalAssets.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.documents)
          .where(eq(schema.documents.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.invoices)
          .where(eq(schema.invoices.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.campaigns)
          .where(eq(schema.campaigns.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.queueTokens)
          .where(eq(schema.queueTokens.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.employees)
          .where(eq(schema.employees.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.enterpriseRoles)
          .where(eq(schema.enterpriseRoles.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.executiveKpiSnapshots)
          .where(eq(schema.executiveKpiSnapshots.organizationId, orgId)),
      ]);

      const result = {
        customers: Number(customers[0]?.count || 0),
        projects: Number(projects[0]?.count || 0),
        tickets: Number(tickets[0]?.count || 0),
        assets: Number(assets[0]?.count || 0),
        documents: Number(documents[0]?.count || 0),
        invoices: Number(invoices[0]?.count || 0),
        campaigns: Number(campaigns[0]?.count || 0),
        queueTokens: Number(queue[0]?.count || 0),
        hrmEmployees: Number(hrmEmployees[0]?.count || 0),
        enterpriseRoles: Number(enterpriseRoles[0]?.count || 0),
        intelligenceKpis: Number(intelligenceKpis[0]?.count || 0),
      };

      // Cache for 5 minutes
      setCache(cacheKey, result, { ttl: 300_000 });

      return result;
    }),

  customersList: orgAuthed
    .route({
      method: "GET",
      path: "/nucleo/customers",
      summary: "List customers",
      tags: ["Nucleo"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: { context: OrgContext; input: { page: number; limit: number } }) => {
        const db = getDb(context);
        const items = await db
          .select()
          .from(schema.customers)
          .where(eq(schema.customers.organizationId, context.organization.id))
          .orderBy(desc(schema.customers.createdAt))
          .limit(input.limit)
          .offset(toOffset(input.page, input.limit));

        return { data: items, page: input.page, limit: input.limit };
      },
    ),

  customersCreate: orgAuthed
    .route({
      method: "POST",
      path: "/nucleo/customers",
      summary: "Create customer",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        industry: z.string().optional(),
        website: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [customer] = await db
        .insert(schema.customers)
        .values({
          organizationId: context.organization.id,
          name: input.name,
          code: input.code || null,
          industry: input.industry || null,
          website: input.website || null,
          ownerId: context.user.id,
        })
        .returning();

      // Invalidate summary cache
      invalidateOrgCache(context.organization.id);

      return customer;
    }),

  projectsList: orgAuthed
    .route({
      method: "GET",
      path: "/nucleo/projects",
      summary: "List projects",
      tags: ["Nucleo"],
    })
    .input(pageInput.extend({ status: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const base = eq(schema.projects.organizationId, context.organization.id);
      const where = input.status
        ? and(base, eq(schema.projects.status, input.status))
        : base;

      const items = await db
        .select()
        .from(schema.projects)
        .where(where)
        .orderBy(desc(schema.projects.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  projectsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/nucleo/projects",
      summary: "Create project",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        customerId: z.string().uuid().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [project] = await db
        .insert(schema.projects)
        .values({
          organizationId: context.organization.id,
          name: input.name,
          description: input.description || null,
          customerId: input.customerId || null,
          dueDate: input.dueDate && input.dueDate !== '' ? new Date(input.dueDate) : null,
          priority: input.priority,
          ownerId: context.user.id,
        })
        .returning();

      return project;
    }),

  projectsUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/nucleo/projects/:id",
      summary: "Update project",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        dueDate: z.string().datetime().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [project] = await db
        .update(schema.projects)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.dueDate !== undefined
            ? { dueDate: new Date(input.dueDate) }
            : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.projects.id, input.id),
            eq(schema.projects.organizationId, context.organization.id),
          ),
        )
        .returning();

      return project;
    }),

  projectsDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/nucleo/projects/:id",
      summary: "Delete project",
      tags: ["Nucleo"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.projects)
        .where(
          and(
            eq(schema.projects.id, input.id),
            eq(schema.projects.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  projectTasksList: orgAuthed
    .route({
      method: "GET",
      path: "/nucleo/projects/:projectId/tasks",
      summary: "List project tasks",
      tags: ["Nucleo"],
    })
    .input(z.object({ projectId: z.string().uuid() }).extend(pageInput.shape))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.projectTasks)
        .where(
          and(
            eq(schema.projectTasks.organizationId, context.organization.id),
            eq(schema.projectTasks.projectId, input.projectId),
          ),
        )
        .orderBy(desc(schema.projectTasks.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data: items, page: input.page, limit: input.limit };
    }),

  projectTasksCreate: orgAuthed
    .route({
      method: "POST",
      path: "/nucleo/projects/:projectId/tasks",
      summary: "Create project task",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        projectId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.string().default("todo"),
        priority: z.string().default("medium"),
        assigneeId: z.string().optional(),
        dueDate: z.string().datetime().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [task] = await db
        .insert(schema.projectTasks)
        .values({
          organizationId: context.organization.id,
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        })
        .returning();
      return task;
    }),

  projectTasksUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/nucleo/projects/:projectId/tasks/:id",
      summary: "Update project task",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        projectId: z.string().uuid(),
        id: z.string().uuid(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        assigneeId: z.string().optional(),
        dueDate: z.string().datetime().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [task] = await db
        .update(schema.projectTasks)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.projectTasks.id, input.id),
            eq(schema.projectTasks.organizationId, context.organization.id),
          ),
        )
        .returning();
      return task;
    }),

  projectTasksDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/nucleo/projects/:projectId/tasks/:id",
      summary: "Delete project task",
      tags: ["Nucleo"],
    })
    .input(z.object({ projectId: z.string().uuid(), id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.projectTasks)
        .where(
          and(
            eq(schema.projectTasks.id, input.id),
            eq(schema.projectTasks.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  projectMilestonesList: orgAuthed
    .route({
      method: "GET",
      path: "/nucleo/projects/:projectId/milestones",
      summary: "List project milestones",
      tags: ["Nucleo"],
    })
    .input(z.object({ projectId: z.string().uuid() }).extend(pageInput.shape))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.projectMilestones)
        .where(
          and(
            eq(schema.projectMilestones.organizationId, context.organization.id),
            eq(schema.projectMilestones.projectId, input.projectId),
          ),
        )
        .orderBy(desc(schema.projectMilestones.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data: items, page: input.page, limit: input.limit };
    }),

  projectMilestonesCreate: orgAuthed
    .route({
      method: "POST",
      path: "/nucleo/projects/:projectId/milestones",
      summary: "Create project milestone",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        projectId: z.string().uuid(),
        title: z.string().min(1),
        status: z.string().default("in_progress"),
        targetDate: z.string().datetime().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [milestone] = await db
        .insert(schema.projectMilestones)
        .values({
          organizationId: context.organization.id,
          projectId: input.projectId,
          title: input.title,
          status: input.status,
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
        })
        .returning();
      return milestone;
    }),

  projectMilestonesUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/nucleo/projects/:projectId/milestones/:id",
      summary: "Update project milestone",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        projectId: z.string().uuid(),
        id: z.string().uuid(),
        title: z.string().optional(),
        status: z.string().optional(),
        targetDate: z.string().datetime().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [milestone] = await db
        .update(schema.projectMilestones)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.targetDate !== undefined ? { targetDate: input.targetDate ? new Date(input.targetDate) : null } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.projectMilestones.id, input.id),
            eq(schema.projectMilestones.organizationId, context.organization.id),
          ),
        )
        .returning();
      return milestone;
    }),

  projectMilestonesDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/nucleo/projects/:projectId/milestones/:id",
      summary: "Delete project milestone",
      tags: ["Nucleo"],
    })
    .input(z.object({ projectId: z.string().uuid(), id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.projectMilestones)
        .where(
          and(
            eq(schema.projectMilestones.id, input.id),
            eq(schema.projectMilestones.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  projectResourcesList: orgAuthed
    .route({
      method: "GET",
      path: "/nucleo/projects/:projectId/resources",
      summary: "List project resources",
      tags: ["Nucleo"],
    })
    .input(z.object({ projectId: z.string().uuid() }).extend(pageInput.shape))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.projectResources)
        .where(
          and(
            eq(schema.projectResources.organizationId, context.organization.id),
            eq(schema.projectResources.projectId, input.projectId),
          ),
        )
        .orderBy(desc(schema.projectResources.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data: items, page: input.page, limit: input.limit };
    }),

  projectResourcesCreate: orgAuthed
    .route({
      method: "POST",
      path: "/nucleo/projects/:projectId/resources",
      summary: "Create project resource",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        projectId: z.string().uuid(),
        userId: z.string().optional(),
        name: z.string(),
        role: z.string().optional(),
        allocation: z.number().int().min(0).max(100).default(100),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [resource] = await db
        .insert(schema.projectResources)
        .values({
          organizationId: context.organization.id,
          projectId: input.projectId,
          userId: input.userId || null,
          name: input.name,
          role: input.role,
          allocation: input.allocation,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
        })
        .returning();
      return resource;
    }),

  projectResourcesUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/nucleo/projects/:projectId/resources/:id",
      summary: "Update project resource",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        projectId: z.string().uuid(),
        id: z.string().uuid(),
        userId: z.string().optional(),
        name: z.string().optional(),
        role: z.string().optional(),
        allocation: z.number().int().min(0).max(100).optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [resource] = await db
        .update(schema.projectResources)
        .set({
          ...(input.userId !== undefined ? { userId: input.userId } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.role !== undefined ? { role: input.role } : {}),
          ...(input.allocation !== undefined ? { allocation: input.allocation } : {}),
          ...(input.startDate !== undefined ? { startDate: input.startDate ? new Date(input.startDate) : null } : {}),
          ...(input.endDate !== undefined ? { endDate: input.endDate ? new Date(input.endDate) : null } : {}),
        })
        .where(
          and(
            eq(schema.projectResources.id, input.id),
            eq(schema.projectResources.organizationId, context.organization.id),
          ),
        )
        .returning();
      return resource;
    }),

  projectResourcesDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/nucleo/projects/:projectId/resources/:id",
      summary: "Delete project resource",
      tags: ["Nucleo"],
    })
    .input(z.object({ projectId: z.string().uuid(), id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.projectResources)
        .where(
          and(
            eq(schema.projectResources.id, input.id),
            eq(schema.projectResources.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  ticketsList: orgAuthed
    .route({
      method: "GET",
      path: "/nucleo/tickets",
      summary: "List tickets",
      tags: ["Nucleo"],
    })
    .input(
      pageInput.extend({
        status: z.string().optional(),
        queue: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const conditions = [
        eq(schema.tickets.organizationId, context.organization.id),
      ];
      if (input.status)
        conditions.push(eq(schema.tickets.status, input.status));
      if (input.queue) conditions.push(eq(schema.tickets.queue, input.queue));

      const where = conditions.length > 1 ? and(...conditions) : conditions[0];

      const items = await db
        .select()
        .from(schema.tickets)
        .where(where)
        .orderBy(desc(schema.tickets.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  ticketsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/nucleo/tickets",
      summary: "Create ticket",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        subject: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        queue: z.string().default("general"),
        customerId: z.string().uuid().optional(),
        contactId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [ticket] = await db
        .insert(schema.tickets)
        .values({
          organizationId: context.organization.id,
          subject: input.subject,
          description: input.description || null,
          priority: input.priority,
          queue: input.queue,
          customerId: input.customerId || null,
          contactId: input.contactId || null,
          projectId: input.projectId || null,
          assignedToId: context.user.id,
        })
        .returning();

      return ticket;
    }),

  ticketsUpdateStatus: orgAuthed
    .route({
      method: "PATCH",
      path: "/nucleo/tickets/:id/status",
      summary: "Update ticket status",
      tags: ["Nucleo"],
    })
    .input(z.object({ id: z.string().uuid(), status: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [ticket] = await db
        .update(schema.tickets)
        .set({
          status: input.status,
          closedAt: input.status === "closed" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.tickets.id, input.id),
            eq(schema.tickets.organizationId, context.organization.id),
          ),
        )
        .returning();

      return ticket;
    }),

  ticketsUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/nucleo/tickets/:id",
      summary: "Update ticket",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        subject: z.string().optional(),
        description: z.string().optional(),
        priority: z.string().optional(),
        queue: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [ticket] = await db
        .update(schema.tickets)
        .set({
          ...(input.subject !== undefined ? { subject: input.subject } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.queue !== undefined ? { queue: input.queue } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.status === "closed" ? { closedAt: new Date() } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.tickets.id, input.id),
            eq(schema.tickets.organizationId, context.organization.id),
          ),
        )
        .returning();
      return ticket;
    }),

  ticketsDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/nucleo/tickets/:id",
      summary: "Delete ticket",
      tags: ["Nucleo"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.tickets)
        .where(
          and(
            eq(schema.tickets.id, input.id),
            eq(schema.tickets.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  queueList: orgAuthed
    .route({
      method: "GET",
      path: "/nucleo/queue",
      summary: "List queue tokens",
      tags: ["Nucleo"],
    })
    .input(pageInput.extend({ status: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const base = eq(
        schema.queueTokens.organizationId,
        context.organization.id,
      );
      const where = input.status
        ? and(base, eq(schema.queueTokens.status, input.status))
        : base;

      const items = await db
        .select()
        .from(schema.queueTokens)
        .where(where)
        .orderBy(desc(schema.queueTokens.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  queueCreate: orgAuthed
    .route({
      method: "POST",
      path: "/nucleo/queue",
      summary: "Create queue token",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        serviceType: z.string().min(1),
        ticketId: z.string().uuid().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);

      const [nextNumberRow] = await db
        .select({
          nextNumber: sql<number>`coalesce(max(${schema.queueTokens.tokenNumber}), 0) + 1`,
        })
        .from(schema.queueTokens)
        .where(eq(schema.queueTokens.organizationId, context.organization.id));

      const [token] = await db
        .insert(schema.queueTokens)
        .values({
          organizationId: context.organization.id,
          ticketId: input.ticketId || null,
          serviceType: input.serviceType,
          tokenNumber: Number(nextNumberRow?.nextNumber || 1),
        })
        .returning();

      return token;
    }),

  queueUpdateStatus: orgAuthed
    .route({
      method: "PATCH",
      path: "/nucleo/queue/:id/status",
      summary: "Update queue token status",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.string(),
        counter: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const status = input.status;

      const [token] = await db
        .update(schema.queueTokens)
        .set({
          status,
          counter: input.counter || null,
          calledAt: status === "called" ? new Date() : null,
          completedAt: status === "completed" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.queueTokens.id, input.id),
            eq(schema.queueTokens.organizationId, context.organization.id),
          ),
        )
        .returning();

      return token;
    }),

  queueDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/nucleo/queue/:id",
      summary: "Delete queue token",
      tags: ["Nucleo"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.queueTokens)
        .where(
          and(
            eq(schema.queueTokens.id, input.id),
            eq(schema.queueTokens.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  assetsList: orgAuthed
    .route({
      method: "GET",
      path: "/nucleo/assets",
      summary: "List digital assets",
      tags: ["Nucleo"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.digitalAssets)
        .where(eq(schema.digitalAssets.organizationId, context.organization.id))
        .orderBy(desc(schema.digitalAssets.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  assetsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/nucleo/assets",
      summary: "Create digital asset record",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        mimeType: z.string().min(1),
        size: z.number().nonnegative(),
        storageKey: z.string().min(1),
        folderId: z.string().uuid().optional(),
        customerId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
        ticketId: z.string().uuid().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [asset] = await db
        .insert(schema.digitalAssets)
        .values({
          organizationId: context.organization.id,
          name: input.name,
          mimeType: input.mimeType,
          size: input.size,
          storageKey: input.storageKey,
          folderId: input.folderId || null,
          customerId: input.customerId || null,
          projectId: input.projectId || null,
          ticketId: input.ticketId || null,
          createdBy: context.user.id,
        })
        .returning();

      return asset;
    }),

  documentsList: orgAuthed
    .route({
      method: "GET",
      path: "/nucleo/documents",
      summary: "List documents",
      tags: ["Nucleo"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.documents)
        .where(eq(schema.documents.organizationId, context.organization.id))
        .orderBy(desc(schema.documents.updatedAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  documentsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/nucleo/documents",
      summary: "Create document",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().optional(),
        customerId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
        ticketId: z.string().uuid().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);

      const [document] = await db
        .insert(schema.documents)
        .values({
          organizationId: context.organization.id,
          title: input.title,
          customerId: input.customerId || null,
          projectId: input.projectId || null,
          ticketId: input.ticketId || null,
          createdBy: context.user.id,
        })
        .returning();

      await db.insert(schema.documentVersions).values({
        documentId: document.id,
        version: 1,
        content: input.content || "",
        createdBy: context.user.id,
      });

      return document;
    }),

  documentsUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/nucleo/documents/:id",
      summary: "Update document",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        status: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [document] = await db
        .update(schema.documents)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.documents.id, input.id),
            eq(schema.documents.organizationId, context.organization.id),
          ),
        )
        .returning();

      return document;
    }),

  documentsDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/nucleo/documents/:id",
      summary: "Delete document",
      tags: ["Nucleo"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.documents)
        .where(
          and(
            eq(schema.documents.id, input.id),
            eq(schema.documents.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  documentsAddVersion: orgAuthed
    .route({
      method: "POST",
      path: "/nucleo/documents/:id/versions",
      summary: "Create document version",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.string().optional(),
        storageKey: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);

      const [doc] = await db
        .select()
        .from(schema.documents)
        .where(
          and(
            eq(schema.documents.id, input.id),
            eq(schema.documents.organizationId, context.organization.id),
          ),
        )
        .limit(1);

      if (!doc) {
        throw new APIError(ErrorCode.NOT_FOUND, "Document not found", 404);
      }

      const nextVersion = (doc.currentVersion || 1) + 1;

      const [version] = await db
        .insert(schema.documentVersions)
        .values({
          documentId: doc.id,
          version: nextVersion,
          content: input.content || null,
          storageKey: input.storageKey || null,
          createdBy: context.user.id,
        })
        .returning();

      await db
        .update(schema.documents)
        .set({ currentVersion: nextVersion, updatedAt: new Date() })
        .where(eq(schema.documents.id, doc.id));

      return version;
    }),

  invoicesList: orgAuthed
    .route({
      method: "GET",
      path: "/nucleo/invoices",
      summary: "List invoices",
      tags: ["Nucleo"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.invoices)
        .where(eq(schema.invoices.organizationId, context.organization.id))
        .orderBy(desc(schema.invoices.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  invoicesCreate: orgAuthed
    .route({
      method: "POST",
      path: "/nucleo/invoices",
      summary: "Create invoice",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        invoiceNumber: z.string().min(1),
        customerId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
        currency: z.string().default("USD"),
        subtotal: z.number().nonnegative().default(0),
        tax: z.number().nonnegative().default(0),
        total: z.number().nonnegative().default(0),
        dueAt: z.string().datetime().optional(),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [invoice] = await db
        .insert(schema.invoices)
        .values({
          organizationId: context.organization.id,
          invoiceNumber: input.invoiceNumber,
          customerId: input.customerId || null,
          projectId: input.projectId || null,
          currency: input.currency,
          subtotal: String(input.subtotal),
          tax: String(input.tax),
          total: String(input.total),
          dueAt: input.dueAt ? new Date(input.dueAt) : null,
          notes: input.notes || null,
          createdBy: context.user.id,
        })
        .returning();

      return invoice;
    }),

  invoicesUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/nucleo/invoices/:id",
      summary: "Update invoice",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.string().optional(),
        subtotal: z.number().nonnegative().optional(),
        tax: z.number().nonnegative().optional(),
        total: z.number().nonnegative().optional(),
        dueAt: z.string().datetime().optional(),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [invoice] = await db
        .update(schema.invoices)
        .set({
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.subtotal !== undefined
            ? { subtotal: String(input.subtotal) }
            : {}),
          ...(input.tax !== undefined ? { tax: String(input.tax) } : {}),
          ...(input.total !== undefined ? { total: String(input.total) } : {}),
          ...(input.dueAt !== undefined
            ? { dueAt: new Date(input.dueAt) }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.status === "paid" ? { paidAt: new Date() } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.invoices.id, input.id),
            eq(schema.invoices.organizationId, context.organization.id),
          ),
        )
        .returning();
      return invoice;
    }),

  invoicesDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/nucleo/invoices/:id",
      summary: "Delete invoice",
      tags: ["Nucleo"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.invoices)
        .where(
          and(
            eq(schema.invoices.id, input.id),
            eq(schema.invoices.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  campaignsList: orgAuthed
    .route({
      method: "GET",
      path: "/nucleo/campaigns",
      summary: "List campaigns",
      tags: ["Nucleo"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.campaigns)
        .where(eq(schema.campaigns.organizationId, context.organization.id))
        .orderBy(desc(schema.campaigns.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  campaignsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/nucleo/campaigns",
      summary: "Create campaign",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        type: z.string().default("multi_channel"),
        channel: z.string().default("email"),
        goal: z.string().optional(),
        budget: z.number().nonnegative().default(0),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [campaign] = await db
        .insert(schema.campaigns)
        .values({
          organizationId: context.organization.id,
          name: input.name,
          type: input.type,
          channel: input.channel,
          goal: input.goal || null,
          budget: String(input.budget),
          ownerId: context.user.id,
        })
        .returning();

      return campaign;
    }),

  campaignsUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/nucleo/campaigns/:id",
      summary: "Update campaign",
      tags: ["Nucleo"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        type: z.string().optional(),
        channel: z.string().optional(),
        status: z.string().optional(),
        goal: z.string().optional(),
        budget: z.number().nonnegative().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [campaign] = await db
        .update(schema.campaigns)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.channel !== undefined ? { channel: input.channel } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.goal !== undefined ? { goal: input.goal } : {}),
          ...(input.budget !== undefined
            ? { budget: String(input.budget) }
            : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.campaigns.id, input.id),
            eq(schema.campaigns.organizationId, context.organization.id),
          ),
        )
        .returning();
      return campaign;
    }),

  campaignsDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/nucleo/campaigns/:id",
      summary: "Delete campaign",
      tags: ["Nucleo"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.campaigns)
        .where(
          and(
            eq(schema.campaigns.id, input.id),
            eq(schema.campaigns.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),
};
