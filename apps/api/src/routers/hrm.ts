import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { orgAuthed, getDb, schema } from "../procedures";

const pageInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(200).default(50),
});

function toOffset(page: number, limit: number) {
  return (page - 1) * limit;
}

export const hrmRouter = {
  summary: orgAuthed
    .route({
      method: "GET",
      path: "/hrm/summary",
      summary: "Get HRM summary",
      tags: ["HRM"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [employees, attendance, leaves, reviews, requisitions, candidates, trainingPrograms, trainingRecords, payrollRuns] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.employees)
          .where(eq(schema.employees.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.attendanceLogs)
          .where(
            and(
              eq(schema.attendanceLogs.organizationId, orgId),
              eq(schema.attendanceLogs.status, "present"),
            ),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.leaveRequests)
          .where(
            and(
              eq(schema.leaveRequests.organizationId, orgId),
              eq(schema.leaveRequests.status, "pending"),
            ),
          ),
        db
          .select({ avg: sql<number>`coalesce(avg(${schema.performanceReviews.goalsProgress}), 0)` })
          .from(schema.performanceReviews)
          .where(eq(schema.performanceReviews.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.recruitmentRequisitions)
          .where(eq(schema.recruitmentRequisitions.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.recruitmentCandidates)
          .where(eq(schema.recruitmentCandidates.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.trainingPrograms)
          .where(eq(schema.trainingPrograms.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.employeeTrainingRecords)
          .where(eq(schema.employeeTrainingRecords.organizationId, orgId)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(schema.payrollRuns)
          .where(eq(schema.payrollRuns.organizationId, orgId)),
      ]);

      return {
        headcount: Number(employees[0]?.count || 0),
        presentToday: Number(attendance[0]?.count || 0),
        pendingLeave: Number(leaves[0]?.count || 0),
        avgGoalProgress: Math.round(Number(reviews[0]?.avg || 0)),
        requisitions: Number(requisitions[0]?.count || 0),
        candidates: Number(candidates[0]?.count || 0),
        trainingPrograms: Number(trainingPrograms[0]?.count || 0),
        trainingAssignments: Number(trainingRecords[0]?.count || 0),
        payrollRuns: Number(payrollRuns[0]?.count || 0),
      };
    }),

  employeesList: orgAuthed
    .route({
      method: "GET",
      path: "/hrm/employees",
      summary: "List employees",
      tags: ["HRM"],
    })
    .input(pageInput.extend({ search: z.string().optional(), department: z.string().optional() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const conditions = [eq(schema.employees.organizationId, context.organization.id)];

      if (input.search?.trim()) {
        const pattern = `%${input.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.employees.fullName, pattern),
            ilike(schema.employees.workEmail, pattern),
            ilike(schema.employees.jobTitle, pattern),
            ilike(schema.employees.department, pattern),
          )!,
        );
      }

      if (input.department?.trim()) {
        conditions.push(eq(schema.employees.department, input.department.trim()));
      }

      const where = conditions.length > 1 ? and(...conditions) : conditions[0];

      const items = await db
        .select()
        .from(schema.employees)
        .where(where)
        .orderBy(desc(schema.employees.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  employeesCreate: orgAuthed
    .route({
      method: "POST",
      path: "/hrm/employees",
      summary: "Create employee",
      tags: ["HRM"],
    })
    .input(
      z.object({
        fullName: z.string().min(1),
        workEmail: z.string().email(),
        department: z.string().default("General"),
        jobTitle: z.string().optional(),
        managerName: z.string().optional(),
        location: z.string().optional(),
        employmentType: z.string().default("full_time"),
        joinDate: z.string().datetime().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [employee] = await db
        .insert(schema.employees)
        .values({
          organizationId: context.organization.id,
          fullName: input.fullName,
          workEmail: input.workEmail,
          department: input.department,
          jobTitle: input.jobTitle || null,
          managerName: input.managerName || null,
          location: input.location || null,
          employmentType: input.employmentType,
          joinDate: input.joinDate ? new Date(input.joinDate) : null,
          createdBy: context.user.id,
        })
        .returning();

      return employee;
    }),

  employeesUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/hrm/employees/:id",
      summary: "Update employee",
      tags: ["HRM"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        fullName: z.string().min(1).optional(),
        workEmail: z.string().email().optional(),
        department: z.string().optional(),
        jobTitle: z.string().optional(),
        managerName: z.string().optional(),
        location: z.string().optional(),
        employmentType: z.string().optional(),
        status: z.string().optional(),
        joinDate: z.string().datetime().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [employee] = await db
        .update(schema.employees)
        .set({
          ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
          ...(input.workEmail !== undefined ? { workEmail: input.workEmail } : {}),
          ...(input.department !== undefined ? { department: input.department } : {}),
          ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle } : {}),
          ...(input.managerName !== undefined ? { managerName: input.managerName } : {}),
          ...(input.location !== undefined ? { location: input.location } : {}),
          ...(input.employmentType !== undefined ? { employmentType: input.employmentType } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.joinDate !== undefined ? { joinDate: new Date(input.joinDate) } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.employees.id, input.id),
            eq(schema.employees.organizationId, context.organization.id),
          ),
        )
        .returning();

      return employee;
    }),

  employeesDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/hrm/employees/:id",
      summary: "Delete employee",
      tags: ["HRM"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.employees)
        .where(
          and(
            eq(schema.employees.id, input.id),
            eq(schema.employees.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  attendanceList: orgAuthed
    .route({
      method: "GET",
      path: "/hrm/attendance",
      summary: "List attendance logs",
      tags: ["HRM"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select({
          id: schema.attendanceLogs.id,
          employeeId: schema.attendanceLogs.employeeId,
          employee: schema.employees.fullName,
          date: schema.attendanceLogs.attendanceDate,
          status: schema.attendanceLogs.status,
          hours: schema.attendanceLogs.hours,
          createdAt: schema.attendanceLogs.createdAt,
        })
        .from(schema.attendanceLogs)
        .leftJoin(
          schema.employees,
          eq(schema.attendanceLogs.employeeId, schema.employees.id),
        )
        .where(eq(schema.attendanceLogs.organizationId, context.organization.id))
        .orderBy(desc(schema.attendanceLogs.attendanceDate))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  attendanceCreate: orgAuthed
    .route({
      method: "POST",
      path: "/hrm/attendance",
      summary: "Create attendance log",
      tags: ["HRM"],
    })
    .input(
      z.object({
        employeeId: z.string().uuid(),
        attendanceDate: z.string().datetime(),
        status: z.string().default("present"),
        hours: z.number().min(0).max(24).default(8),
        checkInAt: z.string().datetime().optional(),
        checkOutAt: z.string().datetime().optional(),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [row] = await db
        .insert(schema.attendanceLogs)
        .values({
          organizationId: context.organization.id,
          employeeId: input.employeeId,
          attendanceDate: new Date(input.attendanceDate),
          status: input.status,
          hours: String(input.hours),
          checkInAt: input.checkInAt ? new Date(input.checkInAt) : null,
          checkOutAt: input.checkOutAt ? new Date(input.checkOutAt) : null,
          notes: input.notes || null,
        })
        .returning();
      return row;
    }),

  attendanceUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/hrm/attendance/:id",
      summary: "Update attendance log",
      tags: ["HRM"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.string().optional(),
        hours: z.number().min(0).max(24).optional(),
        checkInAt: z.string().datetime().optional(),
        checkOutAt: z.string().datetime().optional(),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [row] = await db
        .update(schema.attendanceLogs)
        .set({
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.hours !== undefined ? { hours: String(input.hours) } : {}),
          ...(input.checkInAt !== undefined ? { checkInAt: new Date(input.checkInAt) } : {}),
          ...(input.checkOutAt !== undefined ? { checkOutAt: new Date(input.checkOutAt) } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        })
        .where(
          and(
            eq(schema.attendanceLogs.id, input.id),
            eq(schema.attendanceLogs.organizationId, context.organization.id),
          ),
        )
        .returning();
      return row;
    }),

  attendanceDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/hrm/attendance/:id",
      summary: "Delete attendance log",
      tags: ["HRM"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.attendanceLogs)
        .where(
          and(
            eq(schema.attendanceLogs.id, input.id),
            eq(schema.attendanceLogs.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  leaveList: orgAuthed
    .route({
      method: "GET",
      path: "/hrm/leave-requests",
      summary: "List leave requests",
      tags: ["HRM"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select({
          id: schema.leaveRequests.id,
          employeeId: schema.leaveRequests.employeeId,
          employee: schema.employees.fullName,
          leaveType: schema.leaveRequests.leaveType,
          startDate: schema.leaveRequests.startDate,
          endDate: schema.leaveRequests.endDate,
          reason: schema.leaveRequests.reason,
          status: schema.leaveRequests.status,
          createdAt: schema.leaveRequests.createdAt,
        })
        .from(schema.leaveRequests)
        .leftJoin(schema.employees, eq(schema.leaveRequests.employeeId, schema.employees.id))
        .where(eq(schema.leaveRequests.organizationId, context.organization.id))
        .orderBy(desc(schema.leaveRequests.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  leaveCreate: orgAuthed
    .route({
      method: "POST",
      path: "/hrm/leave-requests",
      summary: "Create leave request",
      tags: ["HRM"],
    })
    .input(
      z.object({
        employeeId: z.string().uuid(),
        leaveType: z.string().default("annual"),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        reason: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [request] = await db
        .insert(schema.leaveRequests)
        .values({
          organizationId: context.organization.id,
          employeeId: input.employeeId,
          leaveType: input.leaveType,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          reason: input.reason || null,
        })
        .returning();

      return request;
    }),

  leaveUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/hrm/leave-requests/:id",
      summary: "Update leave request",
      tags: ["HRM"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        leaveType: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        reason: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [request] = await db
        .update(schema.leaveRequests)
        .set({
          ...(input.leaveType !== undefined ? { leaveType: input.leaveType } : {}),
          ...(input.startDate !== undefined ? { startDate: new Date(input.startDate) } : {}),
          ...(input.endDate !== undefined ? { endDate: new Date(input.endDate) } : {}),
          ...(input.reason !== undefined ? { reason: input.reason } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.status !== undefined ? { approverId: context.user.id, decidedAt: new Date() } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.leaveRequests.id, input.id),
            eq(schema.leaveRequests.organizationId, context.organization.id),
          ),
        )
        .returning();
      return request;
    }),

  leaveUpdateStatus: orgAuthed
    .route({
      method: "PATCH",
      path: "/hrm/leave-requests/:id/status",
      summary: "Update leave request status",
      tags: ["HRM"],
    })
    .input(z.object({ id: z.string().uuid(), status: z.string() }))
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [request] = await db
        .update(schema.leaveRequests)
        .set({
          status: input.status,
          approverId: context.user.id,
          decidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.leaveRequests.id, input.id),
            eq(schema.leaveRequests.organizationId, context.organization.id),
          ),
        )
        .returning();

      return request;
    }),

  leaveDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/hrm/leave-requests/:id",
      summary: "Delete leave request",
      tags: ["HRM"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.leaveRequests)
        .where(
          and(
            eq(schema.leaveRequests.id, input.id),
            eq(schema.leaveRequests.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  reviewsList: orgAuthed
    .route({
      method: "GET",
      path: "/hrm/reviews",
      summary: "List performance reviews",
      tags: ["HRM"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select({
          id: schema.performanceReviews.id,
          employeeId: schema.performanceReviews.employeeId,
          employee: schema.employees.fullName,
          reviewCycle: schema.performanceReviews.reviewCycle,
          rating: schema.performanceReviews.rating,
          goalsProgress: schema.performanceReviews.goalsProgress,
          status: schema.performanceReviews.status,
          createdAt: schema.performanceReviews.createdAt,
        })
        .from(schema.performanceReviews)
        .leftJoin(
          schema.employees,
          eq(schema.performanceReviews.employeeId, schema.employees.id),
        )
        .where(eq(schema.performanceReviews.organizationId, context.organization.id))
        .orderBy(desc(schema.performanceReviews.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));

      return { data: items, page: input.page, limit: input.limit };
    }),

  reviewsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/hrm/reviews",
      summary: "Create performance review",
      tags: ["HRM"],
    })
    .input(
      z.object({
        employeeId: z.string().uuid(),
        reviewCycle: z.string().min(1),
        rating: z.string().default("not_rated"),
        goalsProgress: z.number().min(0).max(100).default(0),
        summary: z.string().optional(),
        status: z.string().default("draft"),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [review] = await db
        .insert(schema.performanceReviews)
        .values({
          organizationId: context.organization.id,
          employeeId: input.employeeId,
          reviewCycle: input.reviewCycle,
          rating: input.rating,
          goalsProgress: input.goalsProgress,
          summary: input.summary || null,
          reviewerId: context.user.id,
          status: input.status,
          reviewedAt: input.status === "completed" ? new Date() : null,
        })
        .returning();

      return review;
    }),

  reviewsUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/hrm/reviews/:id",
      summary: "Update performance review",
      tags: ["HRM"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        reviewCycle: z.string().optional(),
        rating: z.string().optional(),
        goalsProgress: z.number().min(0).max(100).optional(),
        summary: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [review] = await db
        .update(schema.performanceReviews)
        .set({
          ...(input.reviewCycle !== undefined ? { reviewCycle: input.reviewCycle } : {}),
          ...(input.rating !== undefined ? { rating: input.rating } : {}),
          ...(input.goalsProgress !== undefined ? { goalsProgress: input.goalsProgress } : {}),
          ...(input.summary !== undefined ? { summary: input.summary } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.status === "completed"
            ? { reviewedAt: new Date(), reviewerId: context.user.id }
            : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.performanceReviews.id, input.id),
            eq(schema.performanceReviews.organizationId, context.organization.id),
          ),
        )
        .returning();
      return review;
    }),

  reviewsDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/hrm/reviews/:id",
      summary: "Delete performance review",
      tags: ["HRM"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.performanceReviews)
        .where(
          and(
            eq(schema.performanceReviews.id, input.id),
            eq(schema.performanceReviews.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  requisitionsList: orgAuthed
    .route({
      method: "GET",
      path: "/hrm/recruitment/requisitions",
      summary: "List recruitment requisitions",
      tags: ["HRM"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.recruitmentRequisitions)
        .where(eq(schema.recruitmentRequisitions.organizationId, context.organization.id))
        .orderBy(desc(schema.recruitmentRequisitions.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data: items, page: input.page, limit: input.limit };
    }),

  requisitionsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/hrm/recruitment/requisitions",
      summary: "Create recruitment requisition",
      tags: ["HRM"],
    })
    .input(
      z.object({
        title: z.string().min(1),
        department: z.string().default("General"),
        employmentType: z.string().default("full_time"),
        openings: z.number().int().min(1).default(1),
        status: z.string().default("open"),
        hiringManager: z.string().optional(),
        budget: z.number().nonnegative().optional(),
        targetHireDate: z.string().datetime().optional(),
        description: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [row] = await db
        .insert(schema.recruitmentRequisitions)
        .values({
          organizationId: context.organization.id,
          title: input.title,
          department: input.department,
          employmentType: input.employmentType,
          openings: input.openings,
          status: input.status,
          hiringManager: input.hiringManager || null,
          budget: input.budget !== undefined ? String(input.budget) : null,
          targetHireDate: input.targetHireDate ? new Date(input.targetHireDate) : null,
          description: input.description || null,
          createdBy: context.user.id,
        })
        .returning();
      return row;
    }),

  requisitionsUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/hrm/recruitment/requisitions/:id",
      summary: "Update recruitment requisition",
      tags: ["HRM"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        department: z.string().optional(),
        employmentType: z.string().optional(),
        openings: z.number().int().min(1).optional(),
        status: z.string().optional(),
        hiringManager: z.string().optional(),
        budget: z.number().nonnegative().optional(),
        targetHireDate: z.string().datetime().optional(),
        description: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [row] = await db
        .update(schema.recruitmentRequisitions)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.department !== undefined ? { department: input.department } : {}),
          ...(input.employmentType !== undefined ? { employmentType: input.employmentType } : {}),
          ...(input.openings !== undefined ? { openings: input.openings } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.hiringManager !== undefined ? { hiringManager: input.hiringManager } : {}),
          ...(input.budget !== undefined ? { budget: String(input.budget) } : {}),
          ...(input.targetHireDate !== undefined ? { targetHireDate: new Date(input.targetHireDate) } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.recruitmentRequisitions.id, input.id),
            eq(schema.recruitmentRequisitions.organizationId, context.organization.id),
          ),
        )
        .returning();
      return row;
    }),

  requisitionsDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/hrm/recruitment/requisitions/:id",
      summary: "Delete recruitment requisition",
      tags: ["HRM"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.recruitmentRequisitions)
        .where(
          and(
            eq(schema.recruitmentRequisitions.id, input.id),
            eq(schema.recruitmentRequisitions.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  candidatesList: orgAuthed
    .route({
      method: "GET",
      path: "/hrm/recruitment/candidates",
      summary: "List recruitment candidates",
      tags: ["HRM"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select({
          id: schema.recruitmentCandidates.id,
          requisitionId: schema.recruitmentCandidates.requisitionId,
          requisitionTitle: schema.recruitmentRequisitions.title,
          fullName: schema.recruitmentCandidates.fullName,
          email: schema.recruitmentCandidates.email,
          phone: schema.recruitmentCandidates.phone,
          stage: schema.recruitmentCandidates.stage,
          score: schema.recruitmentCandidates.score,
          source: schema.recruitmentCandidates.source,
          resumeUrl: schema.recruitmentCandidates.resumeUrl,
          notes: schema.recruitmentCandidates.notes,
          createdAt: schema.recruitmentCandidates.createdAt,
          updatedAt: schema.recruitmentCandidates.updatedAt,
        })
        .from(schema.recruitmentCandidates)
        .leftJoin(
          schema.recruitmentRequisitions,
          eq(schema.recruitmentCandidates.requisitionId, schema.recruitmentRequisitions.id),
        )
        .where(eq(schema.recruitmentCandidates.organizationId, context.organization.id))
        .orderBy(desc(schema.recruitmentCandidates.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data: items, page: input.page, limit: input.limit };
    }),

  candidatesCreate: orgAuthed
    .route({
      method: "POST",
      path: "/hrm/recruitment/candidates",
      summary: "Create recruitment candidate",
      tags: ["HRM"],
    })
    .input(
      z.object({
        requisitionId: z.string().uuid().optional(),
        fullName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        stage: z.string().default("sourced"),
        score: z.number().int().min(0).max(100).default(0),
        source: z.string().default("application"),
        resumeUrl: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [row] = await db
        .insert(schema.recruitmentCandidates)
        .values({
          organizationId: context.organization.id,
          requisitionId: input.requisitionId || null,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone || null,
          stage: input.stage,
          score: input.score,
          source: input.source,
          resumeUrl: input.resumeUrl || null,
          notes: input.notes || null,
          createdBy: context.user.id,
        })
        .returning();
      return row;
    }),

  candidatesUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/hrm/recruitment/candidates/:id",
      summary: "Update recruitment candidate",
      tags: ["HRM"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        requisitionId: z.string().uuid().optional(),
        fullName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        stage: z.string().optional(),
        score: z.number().int().min(0).max(100).optional(),
        source: z.string().optional(),
        resumeUrl: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [row] = await db
        .update(schema.recruitmentCandidates)
        .set({
          ...(input.requisitionId !== undefined ? { requisitionId: input.requisitionId } : {}),
          ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.stage !== undefined ? { stage: input.stage } : {}),
          ...(input.score !== undefined ? { score: input.score } : {}),
          ...(input.source !== undefined ? { source: input.source } : {}),
          ...(input.resumeUrl !== undefined ? { resumeUrl: input.resumeUrl } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.recruitmentCandidates.id, input.id),
            eq(schema.recruitmentCandidates.organizationId, context.organization.id),
          ),
        )
        .returning();
      return row;
    }),

  candidatesDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/hrm/recruitment/candidates/:id",
      summary: "Delete recruitment candidate",
      tags: ["HRM"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.recruitmentCandidates)
        .where(
          and(
            eq(schema.recruitmentCandidates.id, input.id),
            eq(schema.recruitmentCandidates.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  trainingProgramsList: orgAuthed
    .route({
      method: "GET",
      path: "/hrm/training/programs",
      summary: "List training programs",
      tags: ["HRM"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select()
        .from(schema.trainingPrograms)
        .where(eq(schema.trainingPrograms.organizationId, context.organization.id))
        .orderBy(desc(schema.trainingPrograms.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data: items, page: input.page, limit: input.limit };
    }),

  trainingProgramsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/hrm/training/programs",
      summary: "Create training program",
      tags: ["HRM"],
    })
    .input(
      z.object({
        title: z.string().min(1),
        category: z.string().default("General"),
        provider: z.string().optional(),
        durationHours: z.number().int().min(1).default(1),
        status: z.string().default("active"),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        description: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [row] = await db
        .insert(schema.trainingPrograms)
        .values({
          organizationId: context.organization.id,
          title: input.title,
          category: input.category,
          provider: input.provider || null,
          durationHours: input.durationHours,
          status: input.status,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          description: input.description || null,
          createdBy: context.user.id,
        })
        .returning();
      return row;
    }),

  trainingProgramsUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/hrm/training/programs/:id",
      summary: "Update training program",
      tags: ["HRM"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        category: z.string().optional(),
        provider: z.string().optional(),
        durationHours: z.number().int().min(1).optional(),
        status: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        description: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [row] = await db
        .update(schema.trainingPrograms)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.provider !== undefined ? { provider: input.provider } : {}),
          ...(input.durationHours !== undefined ? { durationHours: input.durationHours } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.startDate !== undefined ? { startDate: new Date(input.startDate) } : {}),
          ...(input.endDate !== undefined ? { endDate: new Date(input.endDate) } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.trainingPrograms.id, input.id),
            eq(schema.trainingPrograms.organizationId, context.organization.id),
          ),
        )
        .returning();
      return row;
    }),

  trainingProgramsDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/hrm/training/programs/:id",
      summary: "Delete training program",
      tags: ["HRM"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.trainingPrograms)
        .where(
          and(
            eq(schema.trainingPrograms.id, input.id),
            eq(schema.trainingPrograms.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),

  trainingRecordsList: orgAuthed
    .route({
      method: "GET",
      path: "/hrm/training/records",
      summary: "List employee training records",
      tags: ["HRM"],
    })
    .input(pageInput)
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const items = await db
        .select({
          id: schema.employeeTrainingRecords.id,
          employeeId: schema.employeeTrainingRecords.employeeId,
          employee: schema.employees.fullName,
          programId: schema.employeeTrainingRecords.programId,
          program: schema.trainingPrograms.title,
          completionStatus: schema.employeeTrainingRecords.completionStatus,
          progress: schema.employeeTrainingRecords.progress,
          score: schema.employeeTrainingRecords.score,
          assignedAt: schema.employeeTrainingRecords.assignedAt,
          completedAt: schema.employeeTrainingRecords.completedAt,
          notes: schema.employeeTrainingRecords.notes,
          createdAt: schema.employeeTrainingRecords.createdAt,
          updatedAt: schema.employeeTrainingRecords.updatedAt,
        })
        .from(schema.employeeTrainingRecords)
        .leftJoin(schema.employees, eq(schema.employeeTrainingRecords.employeeId, schema.employees.id))
        .leftJoin(schema.trainingPrograms, eq(schema.employeeTrainingRecords.programId, schema.trainingPrograms.id))
        .where(eq(schema.employeeTrainingRecords.organizationId, context.organization.id))
        .orderBy(desc(schema.employeeTrainingRecords.createdAt))
        .limit(input.limit)
        .offset(toOffset(input.page, input.limit));
      return { data: items, page: input.page, limit: input.limit };
    }),

  trainingRecordsCreate: orgAuthed
    .route({
      method: "POST",
      path: "/hrm/training/records",
      summary: "Create employee training record",
      tags: ["HRM"],
    })
    .input(
      z.object({
        employeeId: z.string().uuid(),
        programId: z.string().uuid(),
        completionStatus: z.string().default("assigned"),
        progress: z.number().int().min(0).max(100).default(0),
        score: z.number().int().min(0).max(100).optional(),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [row] = await db
        .insert(schema.employeeTrainingRecords)
        .values({
          organizationId: context.organization.id,
          employeeId: input.employeeId,
          programId: input.programId,
          completionStatus: input.completionStatus,
          progress: input.progress,
          score: input.score || null,
          notes: input.notes || null,
          completedAt: input.completionStatus === "completed" ? new Date() : null,
        })
        .returning();
      return row;
    }),

  trainingRecordsUpdate: orgAuthed
    .route({
      method: "PATCH",
      path: "/hrm/training/records/:id",
      summary: "Update employee training record",
      tags: ["HRM"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        completionStatus: z.string().optional(),
        progress: z.number().int().min(0).max(100).optional(),
        score: z.number().int().min(0).max(100).optional(),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const [row] = await db
        .update(schema.employeeTrainingRecords)
        .set({
          ...(input.completionStatus !== undefined ? { completionStatus: input.completionStatus } : {}),
          ...(input.progress !== undefined ? { progress: input.progress } : {}),
          ...(input.score !== undefined ? { score: input.score } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.completionStatus === "completed" ? { completedAt: new Date() } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.employeeTrainingRecords.id, input.id),
            eq(schema.employeeTrainingRecords.organizationId, context.organization.id),
          ),
        )
        .returning();
      return row;
    }),

  trainingRecordsDelete: orgAuthed
    .route({
      method: "DELETE",
      path: "/hrm/training/records/:id",
      summary: "Delete employee training record",
      tags: ["HRM"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      await db
        .delete(schema.employeeTrainingRecords)
        .where(
          and(
            eq(schema.employeeTrainingRecords.id, input.id),
            eq(schema.employeeTrainingRecords.organizationId, context.organization.id),
          ),
        );
      return { success: true };
    }),
};
