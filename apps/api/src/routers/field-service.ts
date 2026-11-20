/**
 * Field Service Router
 *
 * Technicians, jobs, dispatch, and route planning.
 */

import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError, ErrorCode } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";

const {
  technicians,
  serviceJobs,
  routePlans,
  jobTimeline,
  partsUsed,
} = schema;

// Field-service scoped procedure
const fieldServiceAuthed = orgAuthed;

// ─── Types ─────────────────────────────────────────────────────────────────

const jobStatusSchema = z.enum([
  "scheduled",
  "in_progress",
  "completed",
  "canceled",
  "on_hold",
]);

const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);

// ─── Technicians ─────────────────────────────────────────────────────────────

export const fieldServiceRouter = {
  // List Technicians
  listTechnicians: fieldServiceAuthed
    .route({
      method: "GET",
      path: "/field-service/technicians",
      summary: "List technicians",
      tags: ["Field Service"],
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

        const conditions = [eq(technicians.organizationId, context.organization.id)];
        if (input.status) conditions.push(eq(technicians.status, input.status));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(technicians)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(technicians)
          .where(whereConditions)
          .orderBy(desc(technicians.createdAt))
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

  // Create Technician
  createTechnician: fieldServiceAuthed
    .route({
      method: "POST",
      path: "/field-service/technicians",
      summary: "Create technician",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        specialization: z.string().optional(),
        skills: z.array(z.string()).optional(),
        maxJobsPerDay: z.number().optional(),
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
          email?: string;
          phone?: string;
          specialization?: string;
          skills?: string[];
          maxJobsPerDay?: number;
        };
      }) => {
        const db = getDb(context);

        const [technician] = await db
          .insert(technicians)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            email: input.email,
            phone: input.phone,
            specialization: input.specialization,
            skills: input.skills || [],
            maxJobsPerDay: input.maxJobsPerDay || 5,
          })
          .returning();

        return technician;
      },
    ),

  // Get Technician
  getTechnician: fieldServiceAuthed
    .route({
      method: "GET",
      path: "/field-service/technicians/:id",
      summary: "Get technician",
      tags: ["Field Service"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [technician] = await db
          .select()
          .from(technicians)
          .where(
            and(
              eq(technicians.id, input.id),
              eq(technicians.organizationId, context.organization.id),
            ),
          );

        if (!technician) {
          throw new APIError(ErrorCode.NOT_FOUND, "Technician not found", 404);
        }

        return technician;
      },
    ),

  // Update Technician
  updateTechnician: fieldServiceAuthed
    .route({
      method: "PATCH",
      path: "/field-service/technicians/:id",
      summary: "Update technician",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        specialization: z.string().optional(),
        skills: z.array(z.string()).optional(),
        status: z.string().optional(),
        maxJobsPerDay: z.number().optional(),
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
          email?: string;
          phone?: string;
          specialization?: string;
          skills?: string[];
          status?: string;
          maxJobsPerDay?: number;
        };
      }) => {
        const db = getDb(context);

        const [technician] = await db
          .update(technicians)
          .set({
            ...(input.name && { name: input.name }),
            ...(input.email !== undefined && { email: input.email }),
            ...(input.phone !== undefined && { phone: input.phone }),
            ...(input.specialization !== undefined && { specialization: input.specialization }),
            ...(input.skills !== undefined && { skills: input.skills }),
            ...(input.status && { status: input.status }),
            ...(input.maxJobsPerDay !== undefined && { maxJobsPerDay: input.maxJobsPerDay }),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(technicians.id, input.id),
              eq(technicians.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!technician) {
          throw new APIError(ErrorCode.NOT_FOUND, "Technician not found", 404);
        }

        return technician;
      },
    ),

  // Delete Technician
  deleteTechnician: fieldServiceAuthed
    .route({
      method: "DELETE",
      path: "/field-service/technicians/:id",
      summary: "Delete technician",
      tags: ["Field Service"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [deleted] = await db
          .delete(technicians)
          .where(
            and(
              eq(technicians.id, input.id),
              eq(technicians.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!deleted) {
          throw new APIError(ErrorCode.NOT_FOUND, "Technician not found", 404);
        }

        return { success: true };
      },
    ),

  // Update Technician Location
  updateTechnicianLocation: fieldServiceAuthed
    .route({
      method: "PATCH",
      path: "/field-service/technicians/:id/location",
      summary: "Update technician location",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; lat: number; lng: number; address?: string };
      }) => {
        const db = getDb(context);

        const [technician] = await db
          .update(technicians)
          .set({
            currentLocation: {
              lat: input.lat,
              lng: input.lng,
              address: input.address,
              updatedAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(technicians.id, input.id),
              eq(technicians.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!technician) {
          throw new APIError(ErrorCode.NOT_FOUND, "Technician not found", 404);
        }

        return technician;
      },
    ),

  // ─── Jobs ─────────────────────────────────────────────────────────────────

  // List Jobs
  listJobs: fieldServiceAuthed
    .route({
      method: "GET",
      path: "/field-service/jobs",
      summary: "List jobs",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        status: jobStatusSchema.optional(),
        priority: prioritySchema.optional(),
        technicianId: z.string().uuid().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
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
        input: {
          page: number;
          limit: number;
          status?: string;
          priority?: string;
          technicianId?: string;
          dateFrom?: string;
          dateTo?: string;
        };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(serviceJobs.organizationId, context.organization.id)];
        if (input.status) conditions.push(eq(serviceJobs.status, input.status));
        if (input.priority) conditions.push(eq(serviceJobs.priority, input.priority));
        if (input.technicianId) conditions.push(eq(serviceJobs.technicianId, input.technicianId));
        if (input.dateFrom) conditions.push(gte(serviceJobs.scheduledStart, new Date(input.dateFrom)));
        if (input.dateTo) conditions.push(lte(serviceJobs.scheduledEnd, new Date(input.dateTo)));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(serviceJobs)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(serviceJobs)
          .where(whereConditions)
          .orderBy(desc(serviceJobs.scheduledStart))
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

  // Create Job
  createJob: fieldServiceAuthed
    .route({
      method: "POST",
      path: "/field-service/jobs",
      summary: "Create job",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        customerEmail: z.string().email().optional(),
        customerAddress: z.string().optional(),
        technicianId: z.string().uuid().optional(),
        priority: prioritySchema.default("medium"),
        scheduledStart: z.string().datetime().optional(),
        scheduledEnd: z.string().datetime().optional(),
        location: z.object({
          lat: z.number(),
          lng: z.number(),
          address: z.string(),
        }).optional(),
        estimatedDuration: z.number().optional(),
        tags: z.array(z.string()).optional(),
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
          title: string;
          description?: string;
          customerName?: string;
          customerPhone?: string;
          customerEmail?: string;
          customerAddress?: string;
          technicianId?: string;
          priority?: string;
          scheduledStart?: string;
          scheduledEnd?: string;
          location?: { lat: number; lng: number; address: string };
          estimatedDuration?: number;
          tags?: string[];
        };
      }) => {
        const db = getDb(context);

        // Generate job number
        const countResult = await db
          .select({ count: count() })
          .from(serviceJobs);
        const jobCount = (countResult[0]?.count ?? 0) + 1;
        const jobNumber = `JOB-${Date.now().toString(36).toUpperCase()}-${jobCount}`;

        const [job] = await db
          .insert(serviceJobs)
          .values({
            organizationId: context.organization.id,
            jobNumber,
            title: input.title,
            description: input.description,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerEmail: input.customerEmail,
            customerAddress: input.customerAddress,
            technicianId: input.technicianId,
            priority: input.priority || "medium",
            scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : null,
            scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : null,
            location: input.location,
            estimatedDuration: input.estimatedDuration,
            tags: input.tags || [],
          })
          .returning();

        return job;
      },
    ),

  // Get Job
  getJob: fieldServiceAuthed
    .route({
      method: "GET",
      path: "/field-service/jobs/:id",
      summary: "Get job",
      tags: ["Field Service"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [job] = await db
          .select()
          .from(serviceJobs)
          .where(
            and(
              eq(serviceJobs.id, input.id),
              eq(serviceJobs.organizationId, context.organization.id),
            ),
          );

        if (!job) {
          throw new APIError(ErrorCode.NOT_FOUND, "Job not found", 404);
        }

        return job;
      },
    ),

  // Update Job
  updateJob: fieldServiceAuthed
    .route({
      method: "PATCH",
      path: "/field-service/jobs/:id",
      summary: "Update job",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        description: z.string().optional(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        customerEmail: z.string().email().optional(),
        customerAddress: z.string().optional(),
        technicianId: z.string().uuid().optional(),
        priority: prioritySchema.optional(),
        status: jobStatusSchema.optional(),
        scheduledStart: z.string().datetime().optional(),
        scheduledEnd: z.string().datetime().optional(),
        notes: z.string().optional(),
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
          title?: string;
          description?: string;
          customerName?: string;
          customerPhone?: string;
          customerEmail?: string;
          customerAddress?: string;
          technicianId?: string;
          priority?: string;
          status?: string;
          scheduledStart?: string;
          scheduledEnd?: string;
          notes?: string;
        };
      }) => {
        const db = getDb(context);

        const [job] = await db
          .update(serviceJobs)
          .set({
            ...(input.title && { title: input.title }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.customerName !== undefined && { customerName: input.customerName }),
            ...(input.customerPhone !== undefined && { customerPhone: input.customerPhone }),
            ...(input.customerEmail !== undefined && { customerEmail: input.customerEmail }),
            ...(input.customerAddress !== undefined && { customerAddress: input.customerAddress }),
            ...(input.technicianId !== undefined && { technicianId: input.technicianId }),
            ...(input.priority && { priority: input.priority }),
            ...(input.status && { status: input.status }),
            ...(input.scheduledStart && { scheduledStart: new Date(input.scheduledStart) }),
            ...(input.scheduledEnd && { scheduledEnd: new Date(input.scheduledEnd) }),
            ...(input.notes !== undefined && { notes: input.notes }),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(serviceJobs.id, input.id),
              eq(serviceJobs.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!job) {
          throw new APIError(ErrorCode.NOT_FOUND, "Job not found", 404);
        }

        return job;
      },
    ),

  // Assign Technician to Job
  assignJob: fieldServiceAuthed
    .route({
      method: "POST",
      path: "/field-service/jobs/:id/assign",
      summary: "Assign technician to job",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        technicianId: z.string().uuid(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; technicianId: string };
      }) => {
        const db = getDb(context);

        const [job] = await db
          .update(serviceJobs)
          .set({
            technicianId: input.technicianId,
            status: "scheduled",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(serviceJobs.id, input.id),
              eq(serviceJobs.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!job) {
          throw new APIError(ErrorCode.NOT_FOUND, "Job not found", 404);
        }

        // Add timeline event
        await db.insert(jobTimeline).values({
          organizationId: context.organization.id,
          jobId: input.id,
          event: "assigned",
          notes: `Assigned to technician ${input.technicianId}`,
          createdBy: context.user.id,
        });

        return job;
      },
    ),

  // Start Job
  startJob: fieldServiceAuthed
    .route({
      method: "POST",
      path: "/field-service/jobs/:id/start",
      summary: "Start job",
      tags: ["Field Service"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [job] = await db
          .update(serviceJobs)
          .set({
            status: "in_progress",
            actualStart: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(serviceJobs.id, input.id),
              eq(serviceJobs.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!job) {
          throw new APIError(ErrorCode.NOT_FOUND, "Job not found", 404);
        }

        // Add timeline event
        await db.insert(jobTimeline).values({
          organizationId: context.organization.id,
          jobId: input.id,
          event: "started",
          notes: "Job started",
          createdBy: context.user.id,
        });

        return job;
      },
    ),

  // Complete Job
  completeJob: fieldServiceAuthed
    .route({
      method: "POST",
      path: "/field-service/jobs/:id/complete",
      summary: "Complete job",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        notes: z.string().optional(),
        partsUsed: z.array(z.object({
          partName: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
        })).optional(),
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
          notes?: string;
          partsUsed?: Array<{ partName: string; quantity: number; unitPrice: number }>;
        };
      }) => {
        const db = getDb(context);

        const [job] = await db
          .update(serviceJobs)
          .set({
            status: "completed",
            actualEnd: new Date(),
            notes: input.notes,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(serviceJobs.id, input.id),
              eq(serviceJobs.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!job) {
          throw new APIError(ErrorCode.NOT_FOUND, "Job not found", 404);
        }

        // Update technician job count
        if (job.technicianId) {
          await db
            .update(technicians)
            .set({
              jobsCompleted: sql`${technicians.jobsCompleted} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(technicians.id, job.technicianId));
        }

        // Add timeline event
        await db.insert(jobTimeline).values({
          organizationId: context.organization.id,
          jobId: input.id,
          event: "completed",
          notes: input.notes || "Job completed",
          createdBy: context.user.id,
        });

        // Add parts used
        if (input.partsUsed && input.partsUsed.length > 0) {
          for (const part of input.partsUsed) {
            await db.insert(partsUsed).values({
              organizationId: context.organization.id,
              jobId: input.id,
              partName: part.partName,
              quantity: part.quantity,
              unitPrice: part.unitPrice,
              totalPrice: part.quantity * part.unitPrice,
            });
          }
        }

        return job;
      },
    ),

  // Cancel Job
  cancelJob: fieldServiceAuthed
    .route({
      method: "POST",
      path: "/field-service/jobs/:id/cancel",
      summary: "Cancel job",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; reason?: string };
      }) => {
        const db = getDb(context);

        const [job] = await db
          .update(serviceJobs)
          .set({
            status: "canceled",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(serviceJobs.id, input.id),
              eq(serviceJobs.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!job) {
          throw new APIError(ErrorCode.NOT_FOUND, "Job not found", 404);
        }

        // Add timeline event
        await db.insert(jobTimeline).values({
          organizationId: context.organization.id,
          jobId: input.id,
          event: "canceled",
          notes: input.reason || "Job canceled",
          createdBy: context.user.id,
        });

        return job;
      },
    ),

  // ─── Dispatch Board ─────────────────────────────────────────────────────────

  // Get Dispatch Board
  getDispatchBoard: fieldServiceAuthed
    .route({
      method: "GET",
      path: "/field-service/dispatch",
      summary: "Get dispatch board",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        date: z.string().optional(), // YYYY-MM-DD
      }),
    )
    .output(
      z.object({
        date: z.string(),
        jobs: z.array(z.any()),
        technicians: z.array(z.any()),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { date?: string };
      }) => {
        const db = getDb(context);
        const targetDate = input.date || new Date().toISOString().split("T")[0];

        // Get jobs for the date
        const jobs = await db
          .select()
          .from(serviceJobs)
          .where(
            and(
              eq(serviceJobs.organizationId, context.organization.id),
              gte(serviceJobs.scheduledStart, new Date(targetDate)),
              lte(serviceJobs.scheduledStart, new Date(targetDate + "T23:59:59")),
            ),
          )
          .orderBy(serviceJobs.scheduledStart);

        // Get technicians
        const techs = await db
          .select()
          .from(technicians)
          .where(eq(technicians.organizationId, context.organization.id));

        return {
          date: targetDate,
          jobs,
          technicians: techs,
        };
      },
    ),

  // ─── Routes ────────────────────────────────────────────────────────────────

  // List Route Plans
  listRoutes: fieldServiceAuthed
    .route({
      method: "GET",
      path: "/field-service/routes",
      summary: "List route plans",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        technicianId: z.string().uuid().optional(),
        date: z.string().optional(),
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
        input: { page: number; limit: number; technicianId?: string; date?: string };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(routePlans.organizationId, context.organization.id)];
        if (input.technicianId) conditions.push(eq(routePlans.technicianId, input.technicianId));
        if (input.date) conditions.push(eq(routePlans.date, new Date(input.date)));

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(routePlans)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(routePlans)
          .where(whereConditions)
          .orderBy(desc(routePlans.date))
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

  // Create Route Plan
  createRoute: fieldServiceAuthed
    .route({
      method: "POST",
      path: "/field-service/routes",
      summary: "Create route plan",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        technicianId: z.string().uuid(),
        date: z.string().datetime(),
        stops: z.array(z.object({
          jobId: z.string().uuid(),
          sequence: z.number(),
          estimatedArrival: z.string(),
          estimatedDeparture: z.string(),
        })).optional(),
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
          technicianId: string;
          date: string;
          stops?: Array<{ jobId: string; sequence: number; estimatedArrival: string; estimatedDeparture: string }>;
        };
      }) => {
        const db = getDb(context);

        const [route] = await db
          .insert(routePlans)
          .values({
            organizationId: context.organization.id,
            technicianId: input.technicianId,
            date: new Date(input.date),
            stops: input.stops || [],
          })
          .returning();

        return route;
      },
    ),

  // Get Route
  getRoute: fieldServiceAuthed
    .route({
      method: "GET",
      path: "/field-service/routes/:id",
      summary: "Get route plan",
      tags: ["Field Service"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        const [route] = await db
          .select()
          .from(routePlans)
          .where(
            and(
              eq(routePlans.id, input.id),
              eq(routePlans.organizationId, context.organization.id),
            ),
          );

        if (!route) {
          throw new APIError(ErrorCode.NOT_FOUND, "Route not found", 404);
        }

        return route;
      },
    ),

  // Update Route
  updateRoute: fieldServiceAuthed
    .route({
      method: "PATCH",
      path: "/field-service/routes/:id",
      summary: "Update route plan",
      tags: ["Field Service"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        stops: z.array(z.object({
          jobId: z.string().uuid(),
          sequence: z.number(),
          estimatedArrival: z.string(),
          estimatedDeparture: z.string(),
          actualArrival: z.string().optional(),
          actualDeparture: z.string().optional(),
        })).optional(),
        optimizedOrder: z.array(z.string()).optional(),
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
          stops?: Array<{
            jobId: string;
            sequence: number;
            estimatedArrival: string;
            estimatedDeparture: string;
            actualArrival?: string;
            actualDeparture?: string;
          }>;
          optimizedOrder?: string[];
          status?: string;
        };
      }) => {
        const db = getDb(context);

        const [route] = await db
          .update(routePlans)
          .set({
            ...(input.stops && { stops: input.stops }),
            ...(input.optimizedOrder && { optimizedOrder: input.optimizedOrder }),
            ...(input.status && { status: input.status }),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(routePlans.id, input.id),
              eq(routePlans.organizationId, context.organization.id),
            ),
          )
          .returning();

        if (!route) {
          throw new APIError(ErrorCode.NOT_FOUND, "Route not found", 404);
        }

        return route;
      },
    ),
};
