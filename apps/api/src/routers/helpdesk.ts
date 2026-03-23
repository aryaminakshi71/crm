import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, orgAuthed, schema } from "../procedures";

const pageInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(200).default(50),
});

function toOffset(page: number, limit: number) {
  return (page - 1) * limit;
}

export const helpdeskRouter = {
  // ─── Tickets ─────────────────────────────────────────────────────────────

  ticketsList: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/tickets",
      summary: "List helpdesk tickets",
      tags: ["Helpdesk"],
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
        eq(schema.helpdeskTickets.organizationId, orgId),
        isNull(schema.helpdeskTickets.deletedAt),
      ];

      if (input.status?.trim()) {
        conditions.push(
          eq(schema.helpdeskTickets.status, input.status as any),
        );
      }

      if (input.priority?.trim()) {
        conditions.push(
          eq(schema.helpdeskTickets.priority, input.priority as any),
        );
      }

      if (input.search?.trim()) {
        const pattern = `%${input.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.helpdeskTickets.subject, pattern),
            ilike(schema.helpdeskTickets.description, pattern),
            ilike(schema.helpdeskTickets.contactEmail, pattern),
          )!,
        );
      }

      const where = and(...conditions);

      const items = await db
        .select()
        .from(schema.helpdeskTickets)
        .where(where)
        .orderBy(desc(schema.helpdeskTickets.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.helpdeskTickets)
        .where(where);

      return { data: items, total: Number(count), page: input.page, limit: input.limit };
    }),

  ticketsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/helpdesk/tickets",
      summary: "Create a helpdesk ticket",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        subject: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["open", "pending", "resolved", "closed"]).default("open"),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        category: z.string().optional(),
        assigneeId: z.string().optional(),
        contactEmail: z.string().optional(),
        contactName: z.string().optional(),
        tags: z.array(z.string()).optional(),
        source: z.enum(["email", "chat", "phone", "web"]).default("web"),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [ticket] = await db
        .insert(schema.helpdeskTickets)
        .values({
          organizationId: context.organization.id,
          subject: input.subject,
          description: input.description ?? null,
          status: input.status,
          priority: input.priority,
          category: input.category ?? null,
          assigneeId: input.assigneeId ?? null,
          contactEmail: input.contactEmail ?? null,
          contactName: input.contactName ?? null,
          tags: input.tags ?? null,
          source: input.source,
        })
        .returning();
      return ticket;
    }),

  ticketsGet: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/tickets/:id",
      summary: "Get a helpdesk ticket",
      tags: ["Helpdesk"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [ticket] = await db
        .select()
        .from(schema.helpdeskTickets)
        .where(
          and(
            eq(schema.helpdeskTickets.id, input.id),
            eq(schema.helpdeskTickets.organizationId, context.organization.id),
            isNull(schema.helpdeskTickets.deletedAt),
          ),
        )
        .limit(1);
      return ticket ?? null;
    }),

  ticketsUpdate: orgAuthed
    .route({
      method: "PUT",
      path: "/helpdesk/tickets/:id",
      summary: "Update a helpdesk ticket",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        subject: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        category: z.string().optional(),
        assigneeId: z.string().optional(),
        contactEmail: z.string().optional(),
        contactName: z.string().optional(),
        tags: z.array(z.string()).optional(),
        slaBreached: z.boolean().optional(),
        satisfaction: z.number().min(1).max(5).optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const { id, ...rest } = input;

      const updates: Record<string, any> = { updatedAt: new Date() };
      if (rest.subject !== undefined) updates.subject = rest.subject;
      if (rest.description !== undefined) updates.description = rest.description;
      if (rest.status !== undefined) {
        updates.status = rest.status;
        if (rest.status === "resolved") updates.resolvedAt = new Date();
        if (rest.status === "closed") updates.closedAt = new Date();
      }
      if (rest.priority !== undefined) updates.priority = rest.priority;
      if (rest.category !== undefined) updates.category = rest.category;
      if (rest.assigneeId !== undefined) updates.assigneeId = rest.assigneeId;
      if (rest.contactEmail !== undefined) updates.contactEmail = rest.contactEmail;
      if (rest.contactName !== undefined) updates.contactName = rest.contactName;
      if (rest.tags !== undefined) updates.tags = rest.tags;
      if (rest.slaBreached !== undefined) updates.slaBreached = rest.slaBreached;
      if (rest.satisfaction !== undefined) updates.satisfaction = rest.satisfaction;

      const [ticket] = await db
        .update(schema.helpdeskTickets)
        .set(updates)
        .where(
          and(
            eq(schema.helpdeskTickets.id, id),
            eq(schema.helpdeskTickets.organizationId, context.organization.id),
          ),
        )
        .returning();
      return ticket;
    }),

  ticketsDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/helpdesk/tickets/:id",
      summary: "Delete a helpdesk ticket",
      tags: ["Helpdesk"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .update(schema.helpdeskTickets)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(schema.helpdeskTickets.id, input.id),
            eq(schema.helpdeskTickets.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  // ─── Ticket Comments ──────────────────────────────────────────────────────

  ticketCommentsList: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/tickets/:id/comments",
      summary: "List comments for a ticket",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(100),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.helpdeskTicketComments)
        .where(eq(schema.helpdeskTicketComments.ticketId, input.id))
        .orderBy(asc(schema.helpdeskTicketComments.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data: items, page: input.page, limit: input.limit };
    }),

  ticketCommentsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/helpdesk/tickets/:id/comments",
      summary: "Add a comment to a ticket",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        body: z.string().min(1),
        isInternal: z.boolean().default(false),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);

      // Set firstResponseAt on ticket if not set
      await db
        .update(schema.helpdeskTickets)
        .set({ firstResponseAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(schema.helpdeskTickets.id, input.id),
            eq(schema.helpdeskTickets.organizationId, context.organization.id),
            isNull(schema.helpdeskTickets.firstResponseAt),
          ),
        );

      const [comment] = await db
        .insert(schema.helpdeskTicketComments)
        .values({
          ticketId: input.id,
          authorId: context.user.id,
          body: input.body,
          isInternal: input.isInternal,
        })
        .returning();
      return comment;
    }),

  // ─── Stats ────────────────────────────────────────────────────────────────

  stats: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/stats",
      summary: "Get helpdesk stats",
      tags: ["Helpdesk"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [openCount, pendingCount, resolvedCount, slaBreachedCount, surveyAvg] =
        await Promise.all([
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.helpdeskTickets)
            .where(
              and(
                eq(schema.helpdeskTickets.organizationId, orgId),
                eq(schema.helpdeskTickets.status, "open"),
                isNull(schema.helpdeskTickets.deletedAt),
              ),
            ),
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.helpdeskTickets)
            .where(
              and(
                eq(schema.helpdeskTickets.organizationId, orgId),
                eq(schema.helpdeskTickets.status, "pending"),
                isNull(schema.helpdeskTickets.deletedAt),
              ),
            ),
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.helpdeskTickets)
            .where(
              and(
                eq(schema.helpdeskTickets.organizationId, orgId),
                eq(schema.helpdeskTickets.status, "resolved"),
                isNull(schema.helpdeskTickets.deletedAt),
              ),
            ),
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.helpdeskTickets)
            .where(
              and(
                eq(schema.helpdeskTickets.organizationId, orgId),
                eq(schema.helpdeskTickets.slaBreached, true),
                isNull(schema.helpdeskTickets.deletedAt),
              ),
            ),
          db
            .select({
              avg: sql<number>`coalesce(avg(${schema.helpdeskSurveys.rating}), 0)`,
            })
            .from(schema.helpdeskSurveys)
            .where(eq(schema.helpdeskSurveys.organizationId, orgId)),
        ]);

      // Avg response time from firstResponseAt - createdAt for resolved tickets
      const [responseTime] = await db
        .select({
          avgMs: sql<number>`coalesce(avg(extract(epoch from (${schema.helpdeskTickets.firstResponseAt} - ${schema.helpdeskTickets.createdAt}))), 0)`,
        })
        .from(schema.helpdeskTickets)
        .where(
          and(
            eq(schema.helpdeskTickets.organizationId, orgId),
            isNull(schema.helpdeskTickets.deletedAt),
          ),
        );

      return {
        open: Number(openCount[0]?.count || 0),
        pending: Number(pendingCount[0]?.count || 0),
        resolved: Number(resolvedCount[0]?.count || 0),
        slaBreached: Number(slaBreachedCount[0]?.count || 0),
        avgResponseTimeHours: Math.round(
          Number(responseTime?.avgMs || 0) / 3600,
        ),
        satisfactionScore: Number(
          Number(surveyAvg[0]?.avg || 0).toFixed(1),
        ),
      };
    }),

  // ─── Queue (priority-ordered tickets) ────────────────────────────────────

  queue: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/queue",
      summary: "Get priority-ordered ticket queue",
      tags: ["Helpdesk"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const priorityOrder = sql`CASE
        WHEN ${schema.helpdeskTickets.priority} = 'urgent' THEN 1
        WHEN ${schema.helpdeskTickets.priority} = 'high' THEN 2
        WHEN ${schema.helpdeskTickets.priority} = 'medium' THEN 3
        ELSE 4
      END`;

      const items = await db
        .select()
        .from(schema.helpdeskTickets)
        .where(
          and(
            eq(schema.helpdeskTickets.organizationId, orgId),
            or(
              eq(schema.helpdeskTickets.status, "open"),
              eq(schema.helpdeskTickets.status, "pending"),
            ),
            isNull(schema.helpdeskTickets.deletedAt),
          ),
        )
        .orderBy(asc(priorityOrder), asc(schema.helpdeskTickets.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  // ─── Knowledge Articles ───────────────────────────────────────────────────

  knowledgeList: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/knowledge",
      summary: "List knowledge articles",
      tags: ["Helpdesk"],
    })
    .input(
      pageInput.extend({
        status: z.string().optional(),
        categoryId: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const conditions = [
        eq(schema.helpdeskKnowledgeArticles.organizationId, orgId),
        isNull(schema.helpdeskKnowledgeArticles.deletedAt),
      ];

      if (input.status?.trim()) {
        conditions.push(
          eq(schema.helpdeskKnowledgeArticles.status, input.status as any),
        );
      }

      if (input.categoryId?.trim()) {
        conditions.push(
          eq(schema.helpdeskKnowledgeArticles.categoryId, input.categoryId),
        );
      }

      if (input.search?.trim()) {
        const pattern = `%${input.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.helpdeskKnowledgeArticles.title, pattern),
            ilike(schema.helpdeskKnowledgeArticles.body, pattern),
          )!,
        );
      }

      const where = and(...conditions);

      const items = await db
        .select()
        .from(schema.helpdeskKnowledgeArticles)
        .where(where)
        .orderBy(desc(schema.helpdeskKnowledgeArticles.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  knowledgeCreate: orgAuthed
    .route({
      method: "POST",
      path: "/helpdesk/knowledge",
      summary: "Create a knowledge article",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().optional(),
        body: z.string().min(1),
        categoryId: z.string().uuid().optional(),
        status: z.enum(["draft", "published"]).default("draft"),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const slug =
        input.slug ??
        input.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      const [article] = await db
        .insert(schema.helpdeskKnowledgeArticles)
        .values({
          organizationId: context.organization.id,
          title: input.title,
          slug,
          body: input.body,
          categoryId: input.categoryId ?? null,
          status: input.status,
          publishedAt: input.status === "published" ? new Date() : null,
        })
        .returning();
      return article;
    }),

  knowledgeGet: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/knowledge/:id",
      summary: "Get a knowledge article",
      tags: ["Helpdesk"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [article] = await db
        .select()
        .from(schema.helpdeskKnowledgeArticles)
        .where(
          and(
            eq(schema.helpdeskKnowledgeArticles.id, input.id),
            eq(
              schema.helpdeskKnowledgeArticles.organizationId,
              context.organization.id,
            ),
            isNull(schema.helpdeskKnowledgeArticles.deletedAt),
          ),
        )
        .limit(1);
      return article ?? null;
    }),

  knowledgeUpdate: orgAuthed
    .route({
      method: "PUT",
      path: "/helpdesk/knowledge/:id",
      summary: "Update a knowledge article",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        body: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        status: z.enum(["draft", "published"]).optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const { id, ...rest } = input;
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (rest.title !== undefined) updates.title = rest.title;
      if (rest.body !== undefined) updates.body = rest.body;
      if (rest.categoryId !== undefined) updates.categoryId = rest.categoryId;
      if (rest.status !== undefined) {
        updates.status = rest.status;
        if (rest.status === "published") updates.publishedAt = new Date();
      }
      const [article] = await db
        .update(schema.helpdeskKnowledgeArticles)
        .set(updates)
        .where(
          and(
            eq(schema.helpdeskKnowledgeArticles.id, id),
            eq(
              schema.helpdeskKnowledgeArticles.organizationId,
              context.organization.id,
            ),
          ),
        )
        .returning();
      return article;
    }),

  knowledgeDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/helpdesk/knowledge/:id",
      summary: "Delete a knowledge article",
      tags: ["Helpdesk"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .update(schema.helpdeskKnowledgeArticles)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(schema.helpdeskKnowledgeArticles.id, input.id),
            eq(
              schema.helpdeskKnowledgeArticles.organizationId,
              context.organization.id,
            ),
          ),
        );
      return { success: true };
    }),

  // ─── Knowledge Categories ─────────────────────────────────────────────────

  knowledgeCategoriesList: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/knowledge/categories",
      summary: "List knowledge categories",
      tags: ["Helpdesk"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.helpdeskKnowledgeCategories)
        .where(
          eq(
            schema.helpdeskKnowledgeCategories.organizationId,
            context.organization.id,
          ),
        )
        .orderBy(
          asc(schema.helpdeskKnowledgeCategories.sortOrder),
          asc(schema.helpdeskKnowledgeCategories.name),
        )
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data: items, page: input.page, limit: input.limit };
    }),

  knowledgeCategoriesCreate: orgAuthed
    .route({
      method: "POST",
      path: "/helpdesk/knowledge/categories",
      summary: "Create a knowledge category",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().optional(),
        parentId: z.string().uuid().optional(),
        sortOrder: z.number().default(0),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const slug =
        input.slug ??
        input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      const [category] = await db
        .insert(schema.helpdeskKnowledgeCategories)
        .values({
          organizationId: context.organization.id,
          name: input.name,
          slug,
          parentId: input.parentId ?? null,
          sortOrder: input.sortOrder,
        })
        .returning();
      return category;
    }),

  // ─── SLA Policies ─────────────────────────────────────────────────────────

  slaList: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/sla",
      summary: "List SLA policies",
      tags: ["Helpdesk"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.helpdeskSlaPolicies)
        .where(
          eq(schema.helpdeskSlaPolicies.organizationId, context.organization.id),
        )
        .orderBy(asc(schema.helpdeskSlaPolicies.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data: items, page: input.page, limit: input.limit };
    }),

  slaCreate: orgAuthed
    .route({
      method: "POST",
      path: "/helpdesk/sla",
      summary: "Create an SLA policy",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        priority: z.enum(["low", "medium", "high", "urgent"]),
        firstResponseHours: z.number().min(1).default(4),
        resolutionHours: z.number().min(1).default(24),
        businessHoursOnly: z.boolean().default(false),
        isDefault: z.boolean().default(false),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [policy] = await db
        .insert(schema.helpdeskSlaPolicies)
        .values({
          organizationId: context.organization.id,
          name: input.name,
          priority: input.priority,
          firstResponseHours: input.firstResponseHours,
          resolutionHours: input.resolutionHours,
          businessHoursOnly: input.businessHoursOnly,
          isDefault: input.isDefault,
        })
        .returning();
      return policy;
    }),

  slaUpdate: orgAuthed
    .route({
      method: "PUT",
      path: "/helpdesk/sla/:id",
      summary: "Update an SLA policy",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        firstResponseHours: z.number().min(1).optional(),
        resolutionHours: z.number().min(1).optional(),
        businessHoursOnly: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const { id, ...rest } = input;
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (rest.name !== undefined) updates.name = rest.name;
      if (rest.firstResponseHours !== undefined)
        updates.firstResponseHours = rest.firstResponseHours;
      if (rest.resolutionHours !== undefined)
        updates.resolutionHours = rest.resolutionHours;
      if (rest.businessHoursOnly !== undefined)
        updates.businessHoursOnly = rest.businessHoursOnly;
      if (rest.isDefault !== undefined) updates.isDefault = rest.isDefault;
      const [policy] = await db
        .update(schema.helpdeskSlaPolicies)
        .set(updates)
        .where(
          and(
            eq(schema.helpdeskSlaPolicies.id, id),
            eq(
              schema.helpdeskSlaPolicies.organizationId,
              context.organization.id,
            ),
          ),
        )
        .returning();
      return policy;
    }),

  // ─── Canned Responses ─────────────────────────────────────────────────────

  cannedList: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/canned",
      summary: "List canned responses",
      tags: ["Helpdesk"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.helpdeskCannedResponses)
        .where(
          eq(
            schema.helpdeskCannedResponses.organizationId,
            context.organization.id,
          ),
        )
        .orderBy(desc(schema.helpdeskCannedResponses.usageCount))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data: items, page: input.page, limit: input.limit };
    }),

  cannedCreate: orgAuthed
    .route({
      method: "POST",
      path: "/helpdesk/canned",
      summary: "Create a canned response",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        category: z.string().default("General"),
        body: z.string().min(1),
        shortcut: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [response] = await db
        .insert(schema.helpdeskCannedResponses)
        .values({
          organizationId: context.organization.id,
          name: input.name,
          category: input.category,
          body: input.body,
          shortcut: input.shortcut ?? null,
        })
        .returning();
      return response;
    }),

  cannedUpdate: orgAuthed
    .route({
      method: "PUT",
      path: "/helpdesk/canned/:id",
      summary: "Update a canned response",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        category: z.string().optional(),
        body: z.string().optional(),
        shortcut: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const { id, ...rest } = input;
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (rest.name !== undefined) updates.name = rest.name;
      if (rest.category !== undefined) updates.category = rest.category;
      if (rest.body !== undefined) updates.body = rest.body;
      if (rest.shortcut !== undefined) updates.shortcut = rest.shortcut;
      const [response] = await db
        .update(schema.helpdeskCannedResponses)
        .set(updates)
        .where(
          and(
            eq(schema.helpdeskCannedResponses.id, id),
            eq(
              schema.helpdeskCannedResponses.organizationId,
              context.organization.id,
            ),
          ),
        )
        .returning();
      return response;
    }),

  cannedDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/helpdesk/canned/:id",
      summary: "Delete a canned response",
      tags: ["Helpdesk"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.helpdeskCannedResponses)
        .where(
          and(
            eq(schema.helpdeskCannedResponses.id, input.id),
            eq(
              schema.helpdeskCannedResponses.organizationId,
              context.organization.id,
            ),
          ),
        );
      return { success: true };
    }),

  // ─── Surveys ──────────────────────────────────────────────────────────────

  surveysList: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/surveys",
      summary: "List satisfaction surveys",
      tags: ["Helpdesk"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.helpdeskSurveys)
        .where(
          eq(schema.helpdeskSurveys.organizationId, context.organization.id),
        )
        .orderBy(desc(schema.helpdeskSurveys.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data: items, page: input.page, limit: input.limit };
    }),

  surveysCreate: orgAuthed
    .route({
      method: "POST",
      path: "/helpdesk/surveys",
      summary: "Submit a satisfaction survey",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        ticketId: z.string().uuid().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [survey] = await db
        .insert(schema.helpdeskSurveys)
        .values({
          organizationId: context.organization.id,
          ticketId: input.ticketId ?? null,
          rating: input.rating,
          comment: input.comment ?? null,
          respondedAt: new Date(),
        })
        .returning();

      // Update ticket satisfaction score if ticketId provided
      if (input.ticketId) {
        await db
          .update(schema.helpdeskTickets)
          .set({ satisfaction: input.rating, updatedAt: new Date() })
          .where(
            and(
              eq(schema.helpdeskTickets.id, input.ticketId),
              eq(
                schema.helpdeskTickets.organizationId,
                context.organization.id,
              ),
            ),
          );
      }

      return survey;
    }),

  // ─── Forums ───────────────────────────────────────────────────────────────

  forumsList: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/forums",
      summary: "List forum posts",
      tags: ["Helpdesk"],
    })
    .input(
      pageInput.extend({
        status: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const conditions = [
        eq(schema.helpdeskForums.organizationId, orgId),
        isNull(schema.helpdeskForums.deletedAt),
      ];

      if (input.status?.trim()) {
        conditions.push(
          eq(schema.helpdeskForums.status, input.status as any),
        );
      }

      if (input.search?.trim()) {
        const pattern = `%${input.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.helpdeskForums.title, pattern),
            ilike(schema.helpdeskForums.body, pattern),
          )!,
        );
      }

      const items = await db
        .select()
        .from(schema.helpdeskForums)
        .where(and(...conditions))
        .orderBy(
          desc(schema.helpdeskForums.isPinned),
          desc(schema.helpdeskForums.createdAt),
        )
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  forumsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/helpdesk/forums",
      summary: "Create a forum post",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        tags: z.array(z.string()).optional(),
        isPinned: z.boolean().default(false),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [forum] = await db
        .insert(schema.helpdeskForums)
        .values({
          organizationId: context.organization.id,
          title: input.title,
          body: input.body,
          authorId: context.user.id,
          tags: input.tags ?? null,
          isPinned: input.isPinned,
        })
        .returning();
      return forum;
    }),

  forumsGet: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/forums/:id",
      summary: "Get a forum post",
      tags: ["Helpdesk"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [forum] = await db
        .select()
        .from(schema.helpdeskForums)
        .where(
          and(
            eq(schema.helpdeskForums.id, input.id),
            eq(schema.helpdeskForums.organizationId, context.organization.id),
            isNull(schema.helpdeskForums.deletedAt),
          ),
        )
        .limit(1);

      if (forum) {
        // Increment view count
        await db
          .update(schema.helpdeskForums)
          .set({ views: sql`${schema.helpdeskForums.views} + 1` })
          .where(eq(schema.helpdeskForums.id, input.id));
      }

      return forum ?? null;
    }),

  forumsUpdate: orgAuthed
    .route({
      method: "PUT",
      path: "/helpdesk/forums/:id",
      summary: "Update a forum post",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        body: z.string().optional(),
        status: z.enum(["open", "answered", "closed"]).optional(),
        isPinned: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const { id, ...rest } = input;
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (rest.title !== undefined) updates.title = rest.title;
      if (rest.body !== undefined) updates.body = rest.body;
      if (rest.status !== undefined) {
        updates.status = rest.status;
        if (rest.status === "answered") updates.answeredAt = new Date();
      }
      if (rest.isPinned !== undefined) updates.isPinned = rest.isPinned;
      if (rest.tags !== undefined) updates.tags = rest.tags;
      const [forum] = await db
        .update(schema.helpdeskForums)
        .set(updates)
        .where(
          and(
            eq(schema.helpdeskForums.id, id),
            eq(schema.helpdeskForums.organizationId, context.organization.id),
          ),
        )
        .returning();
      return forum;
    }),

  // ─── Widgets ──────────────────────────────────────────────────────────────

  widgetGet: orgAuthed
    .route({
      method: "GET",
      path: "/helpdesk/widgets",
      summary: "Get widget config for organization",
      tags: ["Helpdesk"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      const [widget] = await db
        .select()
        .from(schema.helpdeskWidgets)
        .where(
          eq(schema.helpdeskWidgets.organizationId, context.organization.id),
        )
        .orderBy(asc(schema.helpdeskWidgets.createdAt))
        .limit(1);
      return widget ?? null;
    }),

  widgetUpdate: orgAuthed
    .route({
      method: "PUT",
      path: "/helpdesk/widgets",
      summary: "Create or update widget config",
      tags: ["Helpdesk"],
    })
    .input(
      z.object({
        name: z.string().optional(),
        color: z.string().optional(),
        position: z.enum(["bottom-right", "bottom-left"]).optional(),
        greeting: z.string().optional(),
        isActive: z.boolean().optional(),
        allowedDomains: z.array(z.string()).optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      // Upsert: find existing or create
      const [existing] = await db
        .select({ id: schema.helpdeskWidgets.id })
        .from(schema.helpdeskWidgets)
        .where(eq(schema.helpdeskWidgets.organizationId, orgId))
        .limit(1);

      if (existing) {
        const updates: Record<string, any> = { updatedAt: new Date() };
        if (input.name !== undefined) updates.name = input.name;
        if (input.color !== undefined) updates.color = input.color;
        if (input.position !== undefined) updates.position = input.position;
        if (input.greeting !== undefined) updates.greeting = input.greeting;
        if (input.isActive !== undefined) updates.isActive = input.isActive;
        if (input.allowedDomains !== undefined)
          updates.allowedDomains = input.allowedDomains;
        const [widget] = await db
          .update(schema.helpdeskWidgets)
          .set(updates)
          .where(eq(schema.helpdeskWidgets.id, existing.id))
          .returning();
        return widget;
      }

      const [widget] = await db
        .insert(schema.helpdeskWidgets)
        .values({
          organizationId: orgId,
          name: input.name ?? "Support Widget",
          color: input.color ?? "#6366f1",
          position: input.position ?? "bottom-right",
          greeting: input.greeting ?? "Hi! How can we help you?",
          isActive: input.isActive ?? true,
          allowedDomains: input.allowedDomains ?? null,
        })
        .returning();
      return widget;
    }),
};
