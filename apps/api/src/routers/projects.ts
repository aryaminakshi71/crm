import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, orgAuthed, schema } from "../procedures";

const pageInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(200).default(50),
});

function toOffset(page: number, limit: number) {
  return (page - 1) * limit;
}

export const projectsRouter = {
  // ─── Stats ────────────────────────────────────────────────────────────────

  stats: orgAuthed
    .route({
      method: "GET",
      path: "/projects/stats",
      summary: "Project dashboard statistics",
      tags: ["Projects"],
    })
    .input(z.object({}))
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const allProjects = await db
        .select()
        .from(schema.projects)
        .where(and(eq(schema.projects.organizationId, orgId), isNull(schema.projects.deletedAt)));

      const totalProjects = allProjects.length;
      const activeProjects = allProjects.filter((p) => p.status === "active").length;
      const completedThisMonth = allProjects.filter(
        (p) => p.status === "completed" && p.updatedAt >= firstOfMonth,
      ).length;
      const atRisk = allProjects.filter(
        (p) => p.status === "active" && p.dueDate && new Date(p.dueDate) < now,
      ).length;

      // Aggregate budget/spent from time entries as a proxy for spend
      const [timeResult] = await db
        .select({ totalHours: sql<string>`COALESCE(SUM(CAST(${schema.projectTimeEntries.hours} AS NUMERIC)), 0)` })
        .from(schema.projectTimeEntries)
        .where(eq(schema.projectTimeEntries.organizationId, orgId));

      const totalSpent = Number(timeResult?.totalHours ?? 0);

      return {
        totalProjects,
        activeProjects,
        completedThisMonth,
        atRisk,
        totalBudget: 0,
        totalSpent,
      };
    }),

  // ─── Templates ────────────────────────────────────────────────────────────

  templatesList: orgAuthed
    .route({
      method: "GET",
      path: "/projects/templates",
      summary: "List project templates",
      tags: ["Projects"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const items = await db
        .select()
        .from(schema.projectTemplates)
        .where(eq(schema.projectTemplates.organizationId, orgId))
        .orderBy(desc(schema.projectTemplates.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.projectTemplates)
        .where(eq(schema.projectTemplates.organizationId, orgId));

      return { data: items, total: Number(count), page: input.page, limit: input.limit };
    }),

  templatesCreate: orgAuthed
    .route({
      method: "POST",
      path: "/projects/templates",
      summary: "Create project template",
      tags: ["Projects"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        structure: z.any().optional(),
        isDefault: z.boolean().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [created] = await db
        .insert(schema.projectTemplates)
        .values({
          organizationId: orgId,
          name: input.name,
          description: input.description,
          category: input.category,
          structure: input.structure,
          isDefault: input.isDefault ?? false,
        })
        .returning();

      return created;
    }),

  // ─── All tasks (board view) ───────────────────────────────────────────────

  allTasks: orgAuthed
    .route({
      method: "GET",
      path: "/projects/tasks",
      summary: "List all tasks across projects",
      tags: ["Projects"],
    })
    .input(
      pageInput.extend({
        status: z.string().optional(),
        priority: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const conditions = [
        eq(schema.projectTasks.organizationId, orgId),
        isNull(schema.projectTasks.deletedAt),
      ];

      if (input.status?.trim()) {
        conditions.push(eq(schema.projectTasks.status, input.status));
      }
      if (input.priority?.trim()) {
        conditions.push(eq(schema.projectTasks.priority, input.priority));
      }
      if (input.search?.trim()) {
        conditions.push(ilike(schema.projectTasks.title, `%${input.search.trim()}%`));
      }

      const where = and(...conditions);

      const items = await db
        .select()
        .from(schema.projectTasks)
        .where(where)
        .orderBy(desc(schema.projectTasks.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.projectTasks)
        .where(where);

      return { data: items, total: Number(count), page: input.page, limit: input.limit };
    }),

  allTasksUpdate: orgAuthed
    .route({
      method: "PUT",
      path: "/projects/tasks/:taskId",
      summary: "Update any task by id",
      tags: ["Projects"],
    })
    .input(
      z.object({
        taskId: z.string(),
        status: z.string().optional(),
        priority: z.string().optional(),
        assigneeId: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const { taskId, ...updateData } = input;

      const [updated] = await db
        .update(schema.projectTasks)
        .set({
          ...(updateData.status ? { status: updateData.status } : {}),
          ...(updateData.priority ? { priority: updateData.priority } : {}),
          ...(updateData.assigneeId !== undefined ? { assigneeId: updateData.assigneeId } : {}),
          ...(updateData.title ? { title: updateData.title } : {}),
          ...(updateData.description !== undefined ? { description: updateData.description } : {}),
          ...(updateData.dueDate ? { dueDate: new Date(updateData.dueDate) } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.projectTasks.id, taskId),
            eq(schema.projectTasks.organizationId, orgId),
          ),
        )
        .returning();

      return updated;
    }),

  // ─── Capacity ─────────────────────────────────────────────────────────────

  capacity: orgAuthed
    .route({
      method: "GET",
      path: "/projects/capacity",
      summary: "Team capacity data",
      tags: ["Projects"],
    })
    .input(z.object({}))
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const resources = await db
        .select()
        .from(schema.projectResources)
        .where(eq(schema.projectResources.organizationId, orgId))
        .limit(100);

      return { data: resources, total: resources.length };
    }),

  // ─── Timeline ─────────────────────────────────────────────────────────────

  timeline: orgAuthed
    .route({
      method: "GET",
      path: "/projects/timeline",
      summary: "Timeline data for active projects",
      tags: ["Projects"],
    })
    .input(z.object({}))
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const activeProjects = await db
        .select()
        .from(schema.projects)
        .where(
          and(
            eq(schema.projects.organizationId, orgId),
            eq(schema.projects.status, "active"),
            isNull(schema.projects.deletedAt),
          ),
        )
        .limit(50);

      return { data: activeProjects, total: activeProjects.length };
    }),

  // ─── Projects CRUD ────────────────────────────────────────────────────────

  list: orgAuthed
    .route({
      method: "GET",
      path: "/projects",
      summary: "List projects",
      tags: ["Projects"],
    })
    .input(
      pageInput.extend({
        search: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const conditions = [
        eq(schema.projects.organizationId, orgId),
        isNull(schema.projects.deletedAt),
      ];

      if (input.status?.trim()) {
        conditions.push(eq(schema.projects.status, input.status));
      }
      if (input.priority?.trim()) {
        conditions.push(eq(schema.projects.priority, input.priority));
      }
      if (input.search?.trim()) {
        conditions.push(
          or(
            ilike(schema.projects.name, `%${input.search.trim()}%`),
            ilike(schema.projects.description, `%${input.search.trim()}%`),
          )!,
        );
      }

      const where = and(...conditions);

      const items = await db
        .select()
        .from(schema.projects)
        .where(where)
        .orderBy(desc(schema.projects.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.projects)
        .where(where);

      return { data: items, total: Number(count), page: input.page, limit: input.limit };
    }),

  create: orgAuthed
    .route({
      method: "POST",
      path: "/projects",
      summary: "Create project",
      tags: ["Projects"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        dueDate: z.string().optional(),
        ownerId: z.string().optional(),
        customerId: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [created] = await db
        .insert(schema.projects)
        .values({
          organizationId: orgId,
          name: input.name,
          description: input.description,
          status: input.status ?? "planning",
          priority: input.priority ?? "medium",
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          ownerId: input.ownerId,
          customerId: input.customerId ?? null,
        })
        .returning();

      return created;
    }),

  get: orgAuthed
    .route({
      method: "GET",
      path: "/projects/:id",
      summary: "Get project by id",
      tags: ["Projects"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [project] = await db
        .select()
        .from(schema.projects)
        .where(
          and(
            eq(schema.projects.id, input.id),
            eq(schema.projects.organizationId, orgId),
            isNull(schema.projects.deletedAt),
          ),
        );

      if (!project) return { data: null };

      const [{ taskCount }] = await db
        .select({ taskCount: sql<number>`count(*)` })
        .from(schema.projectTasks)
        .where(
          and(
            eq(schema.projectTasks.projectId, input.id),
            isNull(schema.projectTasks.deletedAt),
          ),
        );

      const members = await db
        .select()
        .from(schema.projectResources)
        .where(eq(schema.projectResources.projectId, input.id));

      return { data: { ...project, taskCount: Number(taskCount), members } };
    }),

  update: orgAuthed
    .route({
      method: "PUT",
      path: "/projects/:id",
      summary: "Update project",
      tags: ["Projects"],
    })
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        dueDate: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const { id, ...updateFields } = input;

      const [updated] = await db
        .update(schema.projects)
        .set({
          ...(updateFields.name ? { name: updateFields.name } : {}),
          ...(updateFields.description !== undefined ? { description: updateFields.description } : {}),
          ...(updateFields.status ? { status: updateFields.status } : {}),
          ...(updateFields.priority ? { priority: updateFields.priority } : {}),
          ...(updateFields.dueDate ? { dueDate: new Date(updateFields.dueDate) } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.projects.id, id),
            eq(schema.projects.organizationId, orgId),
            isNull(schema.projects.deletedAt),
          ),
        )
        .returning();

      return updated;
    }),

  delete: orgAuthed
    .route({
      method: "DELETE",
      path: "/projects/:id",
      summary: "Soft delete project",
      tags: ["Projects"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      await db
        .update(schema.projects)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(schema.projects.id, input.id),
            eq(schema.projects.organizationId, orgId),
          ),
        );

      return { success: true };
    }),

  // ─── Tasks ────────────────────────────────────────────────────────────────

  tasksList: orgAuthed
    .route({
      method: "GET",
      path: "/projects/:id/tasks",
      summary: "List tasks for project",
      tags: ["Projects"],
    })
    .input(
      pageInput.extend({
        id: z.string(),
        status: z.string().optional(),
        priority: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const conditions = [
        eq(schema.projectTasks.organizationId, orgId),
        eq(schema.projectTasks.projectId, input.id),
        isNull(schema.projectTasks.deletedAt),
      ];

      if (input.status?.trim()) {
        conditions.push(eq(schema.projectTasks.status, input.status));
      }
      if (input.priority?.trim()) {
        conditions.push(eq(schema.projectTasks.priority, input.priority));
      }
      if (input.search?.trim()) {
        conditions.push(ilike(schema.projectTasks.title, `%${input.search.trim()}%`));
      }

      const where = and(...conditions);

      const items = await db
        .select()
        .from(schema.projectTasks)
        .where(where)
        .orderBy(desc(schema.projectTasks.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.projectTasks)
        .where(where);

      return { data: items, total: Number(count), page: input.page, limit: input.limit };
    }),

  tasksCreate: orgAuthed
    .route({
      method: "POST",
      path: "/projects/:id/tasks",
      summary: "Create task in project",
      tags: ["Projects"],
    })
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        assigneeId: z.string().optional(),
        dueDate: z.string().optional(),
        estimatedHours: z.number().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [created] = await db
        .insert(schema.projectTasks)
        .values({
          organizationId: orgId,
          projectId: input.id,
          title: input.title,
          description: input.description,
          status: input.status ?? "todo",
          priority: input.priority ?? "medium",
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        })
        .returning();

      return created;
    }),

  tasksGet: orgAuthed
    .route({
      method: "GET",
      path: "/projects/:id/tasks/:taskId",
      summary: "Get task by id",
      tags: ["Projects"],
    })
    .input(z.object({ id: z.string(), taskId: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [task] = await db
        .select()
        .from(schema.projectTasks)
        .where(
          and(
            eq(schema.projectTasks.id, input.taskId),
            eq(schema.projectTasks.projectId, input.id),
            eq(schema.projectTasks.organizationId, orgId),
            isNull(schema.projectTasks.deletedAt),
          ),
        );

      return task ?? null;
    }),

  tasksUpdate: orgAuthed
    .route({
      method: "PUT",
      path: "/projects/:id/tasks/:taskId",
      summary: "Update task",
      tags: ["Projects"],
    })
    .input(
      z.object({
        id: z.string(),
        taskId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        assigneeId: z.string().optional(),
        dueDate: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const { id, taskId, ...updateFields } = input;

      const [updated] = await db
        .update(schema.projectTasks)
        .set({
          ...(updateFields.title ? { title: updateFields.title } : {}),
          ...(updateFields.description !== undefined ? { description: updateFields.description } : {}),
          ...(updateFields.status ? { status: updateFields.status } : {}),
          ...(updateFields.priority ? { priority: updateFields.priority } : {}),
          ...(updateFields.assigneeId !== undefined ? { assigneeId: updateFields.assigneeId } : {}),
          ...(updateFields.dueDate ? { dueDate: new Date(updateFields.dueDate) } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.projectTasks.id, taskId),
            eq(schema.projectTasks.projectId, id),
            eq(schema.projectTasks.organizationId, orgId),
          ),
        )
        .returning();

      return updated;
    }),

  // ─── Milestones ───────────────────────────────────────────────────────────

  milestonesList: orgAuthed
    .route({
      method: "GET",
      path: "/projects/:id/milestones",
      summary: "List milestones for project",
      tags: ["Projects"],
    })
    .input(pageInput.extend({ id: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const items = await db
        .select()
        .from(schema.projectMilestones)
        .where(
          and(
            eq(schema.projectMilestones.organizationId, orgId),
            eq(schema.projectMilestones.projectId, input.id),
          ),
        )
        .orderBy(schema.projectMilestones.targetDate)
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, total: items.length, page: input.page, limit: input.limit };
    }),

  milestonesCreate: orgAuthed
    .route({
      method: "POST",
      path: "/projects/:id/milestones",
      summary: "Create milestone",
      tags: ["Projects"],
    })
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        targetDate: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [created] = await db
        .insert(schema.projectMilestones)
        .values({
          organizationId: orgId,
          projectId: input.id,
          title: input.title,
          status: input.status ?? "in_progress",
          targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        })
        .returning();

      return created;
    }),

  // ─── Sprints ──────────────────────────────────────────────────────────────

  sprintsList: orgAuthed
    .route({
      method: "GET",
      path: "/projects/:id/sprints",
      summary: "List sprints for project",
      tags: ["Projects"],
    })
    .input(pageInput.extend({ id: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const items = await db
        .select()
        .from(schema.projectSprints)
        .where(
          and(
            eq(schema.projectSprints.organizationId, orgId),
            eq(schema.projectSprints.projectId, input.id),
          ),
        )
        .orderBy(desc(schema.projectSprints.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, total: items.length, page: input.page, limit: input.limit };
    }),

  sprintsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/projects/:id/sprints",
      summary: "Create sprint",
      tags: ["Projects"],
    })
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        goal: z.string().optional(),
        status: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        velocity: z.number().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [created] = await db
        .insert(schema.projectSprints)
        .values({
          organizationId: orgId,
          projectId: input.id,
          name: input.name,
          goal: input.goal,
          status: (input.status as "planning" | "active" | "completed") ?? "planning",
          startDate: input.startDate ?? undefined,
          endDate: input.endDate ?? undefined,
          velocity: input.velocity,
        })
        .returning();

      return created;
    }),

  // ─── Members (using projectResources from nucleo-unified) ─────────────────

  membersList: orgAuthed
    .route({
      method: "GET",
      path: "/projects/:id/members",
      summary: "List members for project",
      tags: ["Projects"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const members = await db
        .select()
        .from(schema.projectResources)
        .where(
          and(
            eq(schema.projectResources.organizationId, orgId),
            eq(schema.projectResources.projectId, input.id),
          ),
        );

      return { data: members, total: members.length };
    }),

  membersAdd: orgAuthed
    .route({
      method: "POST",
      path: "/projects/:id/members",
      summary: "Add member to project",
      tags: ["Projects"],
    })
    .input(
      z.object({
        id: z.string(),
        userId: z.string().optional(),
        name: z.string().optional(),
        role: z.string().optional(),
        allocation: z.number().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [created] = await db
        .insert(schema.projectResources)
        .values({
          organizationId: orgId,
          projectId: input.id,
          userId: input.userId,
          name: input.name,
          role: input.role,
          allocation: input.allocation ?? 100,
        })
        .returning();

      return created;
    }),

  // ─── Time Entries ─────────────────────────────────────────────────────────

  timeList: orgAuthed
    .route({
      method: "GET",
      path: "/projects/:id/time",
      summary: "List time entries for project",
      tags: ["Projects"],
    })
    .input(pageInput.extend({ id: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const items = await db
        .select()
        .from(schema.projectTimeEntries)
        .where(
          and(
            eq(schema.projectTimeEntries.organizationId, orgId),
            eq(schema.projectTimeEntries.projectId, input.id),
          ),
        )
        .orderBy(desc(schema.projectTimeEntries.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, total: items.length, page: input.page, limit: input.limit };
    }),

  timeLog: orgAuthed
    .route({
      method: "POST",
      path: "/projects/:id/time",
      summary: "Log time for project",
      tags: ["Projects"],
    })
    .input(
      z.object({
        id: z.string(),
        taskId: z.string().optional(),
        description: z.string().optional(),
        hours: z.number().positive(),
        date: z.string(),
        billable: z.boolean().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;
      const userId = context.session.userId;

      const [created] = await db
        .insert(schema.projectTimeEntries)
        .values({
          organizationId: orgId,
          projectId: input.id,
          taskId: input.taskId,
          userId,
          description: input.description,
          hours: input.hours.toString(),
          date: input.date,
          billable: input.billable ?? true,
        })
        .returning();

      return created;
    }),

  // ─── Risks ────────────────────────────────────────────────────────────────

  risksList: orgAuthed
    .route({
      method: "GET",
      path: "/projects/:id/risks",
      summary: "List risks for project",
      tags: ["Projects"],
    })
    .input(pageInput.extend({ id: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const items = await db
        .select()
        .from(schema.projectRisks)
        .where(
          and(
            eq(schema.projectRisks.organizationId, orgId),
            eq(schema.projectRisks.projectId, input.id),
          ),
        )
        .orderBy(desc(schema.projectRisks.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, total: items.length, page: input.page, limit: input.limit };
    }),

  risksCreate: orgAuthed
    .route({
      method: "POST",
      path: "/projects/:id/risks",
      summary: "Create risk",
      tags: ["Projects"],
    })
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        impact: z.string().optional(),
        probability: z.string().optional(),
        status: z.string().optional(),
        mitigation: z.string().optional(),
        owner: z.string().optional(),
        dueDate: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [created] = await db
        .insert(schema.projectRisks)
        .values({
          organizationId: orgId,
          projectId: input.id,
          title: input.title,
          description: input.description,
          impact: (input.impact as "low" | "medium" | "high" | "critical") ?? "medium",
          probability: (input.probability as "low" | "medium" | "high") ?? "medium",
          status: (input.status as "identified" | "mitigating" | "resolved" | "accepted") ?? "identified",
          mitigation: input.mitigation,
          owner: input.owner,
          dueDate: input.dueDate ?? undefined,
        })
        .returning();

      return created;
    }),
};
