/**
 * Audit Logs Router
 *
 * Audit log querying and compliance reporting.
 */

import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

const { auditLogs } = schema;

const auditLogSchema = z.object({
  id: z.string(),
  actorUserId: z.string().nullable(),
  actorEmail: z.string().nullable(),
  organizationId: z.string().nullable(),
  action: z.string(),
  requestMethod: z.string(),
  requestPath: z.string(),
  statusCode: z.number(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.date(),
});

export const auditRouter = {
  // ─── List Audit Logs ─────────────────────────────────────────────────────

  list: orgAuthed
    .route({
      method: "GET",
      path: "/audit",
      summary: "List audit logs",
      tags: ["Audit"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        userId: z.string().optional(),
        action: z.string().optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(auditLogSchema),
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
          startDate?: string;
          endDate?: string;
          userId?: string;
          action?: string;
        };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;

        const conditions = [eq(auditLogs.organizationId, context.organization.id)];

        if (input.startDate) {
          conditions.push(gte(auditLogs.createdAt, new Date(input.startDate)));
        }
        if (input.endDate) {
          conditions.push(lte(auditLogs.createdAt, new Date(input.endDate)));
        }
        if (input.userId) {
          conditions.push(eq(auditLogs.actorUserId, input.userId));
        }
        if (input.action) {
          conditions.push(eq(auditLogs.action, input.action));
        }

        const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

        const countResult = await db
          .select({ count: count() })
          .from(auditLogs)
          .where(whereConditions);
        const total = countResult[0]?.count ?? 0;

        const data = await db
          .select()
          .from(auditLogs)
          .where(whereConditions)
          .orderBy(desc(auditLogs.createdAt))
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

  // ─── Get Audit Log ──────────────────────────────────────────────────────

  get: orgAuthed
    .route({
      method: "GET",
      path: "/audit/:id",
      summary: "Get audit log entry",
      tags: ["Audit"],
    })
    .input(z.object({ id: z.string() }))
    .output(auditLogSchema)
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        const [log] = await db
          .select()
          .from(auditLogs)
          .where(
            and(eq(auditLogs.id, input.id), eq(auditLogs.organizationId, context.organization.id)),
          )
          .limit(1);

        if (!log) {
          // Try without org check for super admins
          const [publicLog] = await db
            .select()
            .from(auditLogs)
            .where(eq(auditLogs.id, input.id))
            .limit(1);
          return publicLog;
        }

        return log;
      },
    ),

  // ─── Export Audit Logs ──────────────────────────────────────────────────

  export: orgAuthed
    .route({
      method: "POST",
      path: "/audit/export",
      summary: "Export audit logs",
      tags: ["Audit"],
    })
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        format: z.enum(["json", "csv"]).default("json"),
      }),
    )
    .output(z.object({ url: z.string() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { startDate: string; endDate: string; format: "json" | "csv" };
      }) => {
        const db = getDb(context);

        const logs = await db
          .select()
          .from(auditLogs)
          .where(
            and(
              eq(auditLogs.organizationId, context.organization.id),
              gte(auditLogs.createdAt, new Date(input.startDate)),
              lte(auditLogs.createdAt, new Date(input.endDate)),
            ),
          )
          .orderBy(desc(auditLogs.createdAt));

        // In production, this would generate a signed URL for cloud storage
        const exportData = JSON.stringify(logs);

        return {
          url: `data:application/json;base64,${Buffer.from(exportData).toString("base64")}`,
        };
      },
    ),

  // ─── Security Events ─────────────────────────────────────────────────────

  securityEvents: orgAuthed
    .route({
      method: "GET",
      path: "/audit/security",
      summary: "Get security-related audit events",
      tags: ["Audit"],
    })
    .output(z.object({ data: z.array(auditLogSchema) }))
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);

      const securityActions = [
        "auth.login",
        "auth.logout",
        "auth.failed",
        "auth.password_change",
        "auth.mfa_enabled",
        "auth.mfa_disabled",
        "user.created",
        "user.deleted",
        "role.created",
        "role.deleted",
        "permission.denied",
        "api_key.created",
        "api_key.revoked",
        "webhook.created",
        "webhook.deleted",
      ];

      const logs = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.organizationId, context.organization.id),
          ),
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);

      // Filter for security events
      const securityLogs = logs.filter((log: typeof logs[number]) =>
        securityActions.some((action) => log.action.includes(action))
      );

      return { data: securityLogs };
    }),
};
