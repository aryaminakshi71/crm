/**
 * RBAC Router
 *
 * Role-based access control: roles, permissions, departments, teams.
 */

import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError, ErrorCode } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";

const { roles, permissions, roleAssignments, departments, teams } = schema;

// ─── Roles ──────────────────────────────────────────────────────────────────

const roleSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  permissions: z.array(z.string()),
  isSystem: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const rbacRouter = {
  // ─── Roles ────────────────────────────────────────────────────────────────

  listRoles: orgAuthed
    .route({
      method: "GET",
      path: "/rbac/roles",
      summary: "List roles",
      tags: ["RBAC"],
    })
    .output(z.object({ data: z.array(roleSchema) }))
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const data = await db
        .select()
        .from(roles)
        .where(eq(roles.organizationId, context.organization.id))
        .orderBy(desc(roles.createdAt));
      return { data };
    }),

  createRole: orgAuthed
    .route({
      method: "POST",
      path: "/rbac/roles",
      summary: "Create role",
      tags: ["RBAC"],
    })
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        permissions: z.array(z.string()).default([]),
      }),
    )
    .output(roleSchema)
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { name: string; description?: string; permissions?: string[] };
      }) => {
        const db = getDb(context);
        const [role] = await db
          .insert(roles)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description || null,
            permissions: input.permissions || [],
            isSystem: "false",
          })
          .returning();
        return role;
      },
    ),

  getRole: orgAuthed
    .route({
      method: "GET",
      path: "/rbac/roles/:id",
      summary: "Get role",
      tags: ["RBAC"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(roleSchema)
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        const [role] = await db
          .select()
          .from(roles)
          .where(
            and(eq(roles.id, input.id), eq(roles.organizationId, context.organization.id)),
          )
          .limit(1);

        if (!role) {
          throw new APIError(ErrorCode.NOT_FOUND, "Role not found", 404);
        }
        return role;
      },
    ),

  updateRole: orgAuthed
    .route({
      method: "PATCH",
      path: "/rbac/roles/:id",
      summary: "Update role",
      tags: ["RBAC"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        permissions: z.array(z.string()).optional(),
      }),
    )
    .output(roleSchema)
    .handler(async ({ context, input }: { context: OrgContext; input: any }) => {
      const db = getDb(context);

      // Check if system role
      const [existing] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, input.id))
        .limit(1);

      if (existing?.isSystem === "true") {
        throw new APIError(ErrorCode.BAD_REQUEST, "Cannot modify system role", 400);
      }

      const [role] = await db
        .update(roles)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.permissions !== undefined ? { permissions: input.permissions } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(roles.id, input.id), eq(roles.organizationId, context.organization.id)))
        .returning();

      if (!role) {
        throw new APIError(ErrorCode.NOT_FOUND, "Role not found", 404);
      }
      return role;
    }),

  deleteRole: orgAuthed
    .route({
      method: "DELETE",
      path: "/rbac/roles/:id",
      summary: "Delete role",
      tags: ["RBAC"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);

        // Check if system role
        const [existing] = await db
          .select()
          .from(roles)
          .where(eq(roles.id, input.id))
          .limit(1);

        if (existing?.isSystem === "true") {
          throw new APIError(ErrorCode.BAD_REQUEST, "Cannot delete system role", 400);
        }

        await db
          .delete(roles)
          .where(and(eq(roles.id, input.id), eq(roles.organizationId, context.organization.id)));
        return { success: true };
      },
    ),

  // ─── Role Assignments ───────────────────────────────────────────────────

  listAssignments: orgAuthed
    .route({
      method: "GET",
      path: "/rbac/assignments",
      summary: "List role assignments",
      tags: ["RBAC"],
    })
    .output(z.object({ data: z.array(z.any()) }))
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const data = await db
        .select()
        .from(roleAssignments)
        .where(eq(roleAssignments.organizationId, context.organization.id));
      return { data };
    }),

  assignRole: orgAuthed
    .route({
      method: "POST",
      path: "/rbac/assignments",
      summary: "Assign role to user",
      tags: ["RBAC"],
    })
    .input(
      z.object({
        userId: z.string().uuid(),
        roleId: z.string().uuid(),
        departmentId: z.string().uuid().optional(),
        teamId: z.string().uuid().optional(),
      }),
    )
    .output(z.object({ id: z.string().uuid(), success: z.boolean() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { userId: string; roleId: string; departmentId?: string; teamId?: string };
      }) => {
        const db = getDb(context);

        // Check if assignment already exists
        const [existing] = await db
          .select()
          .from(roleAssignments)
          .where(
            and(
              eq(roleAssignments.userId, input.userId),
              eq(roleAssignments.roleId, input.roleId),
              eq(roleAssignments.organizationId, context.organization.id),
            ),
          )
          .limit(1);

        if (existing) {
          return { id: existing.id, success: true };
        }

        const [assignment] = await db
          .insert(roleAssignments)
          .values({
            organizationId: context.organization.id,
            userId: input.userId,
            roleId: input.roleId,
            departmentId: input.departmentId || null,
            teamId: input.teamId || null,
          })
          .returning();

        return { id: assignment.id, success: true };
      },
    ),

  removeAssignment: orgAuthed
    .route({
      method: "DELETE",
      path: "/rbac/assignments/:id",
      summary: "Remove role assignment",
      tags: ["RBAC"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({ context, input }: { context: OrgContext; input: { id: string } }) => {
        const db = getDb(context);
        await db
          .delete(roleAssignments)
          .where(
            and(
              eq(roleAssignments.id, input.id),
              eq(roleAssignments.organizationId, context.organization.id),
            ),
          );
        return { success: true };
      },
    ),

  // ─── Departments ────────────────────────────────────────────────────────

  listDepartments: orgAuthed
    .route({
      method: "GET",
      path: "/rbac/departments",
      summary: "List departments",
      tags: ["RBAC"],
    })
    .output(z.object({ data: z.array(z.any()) }))
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const data = await db
        .select()
        .from(departments)
        .where(eq(departments.organizationId, context.organization.id))
        .orderBy(desc(departments.createdAt));
      return { data };
    }),

  createDepartment: orgAuthed
    .route({
      method: "POST",
      path: "/rbac/departments",
      summary: "Create department",
      tags: ["RBAC"],
    })
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        parentId: z.string().uuid().optional(),
        headId: z.string().uuid().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { name: string; description?: string; parentId?: string; headId?: string };
      }) => {
        const db = getDb(context);
        const [department] = await db
          .insert(departments)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description || null,
            parentId: input.parentId || null,
            headId: input.headId || null,
          })
          .returning();
        return department;
      },
    ),

  // ─── Teams ──────────────────────────────────────────────────────────────

  listTeams: orgAuthed
    .route({
      method: "GET",
      path: "/rbac/teams",
      summary: "List teams",
      tags: ["RBAC"],
    })
    .output(z.object({ data: z.array(z.any()) }))
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const data = await db
        .select()
        .from(teams)
        .where(eq(teams.organizationId, context.organization.id))
        .orderBy(desc(teams.createdAt));
      return { data };
    }),

  createTeam: orgAuthed
    .route({
      method: "POST",
      path: "/rbac/teams",
      summary: "Create team",
      tags: ["RBAC"],
    })
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        departmentId: z.string().uuid().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { name: string; description?: string; departmentId?: string };
      }) => {
        const db = getDb(context);
        const [team] = await db
          .insert(teams)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            description: input.description || null,
            departmentId: input.departmentId || null,
          })
          .returning();
        return team;
      },
    ),
};
