import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { APIError, ErrorCode } from "../lib/errors";
import {
  MODULE_CATALOG,
  MODULE_KEYS,
  type NucleoModuleKey,
} from "../lib/nucleo-modules";
import { adminOnly, getDb, orgAuthed, schema } from "../procedures";

const moduleKeyEnum = z.enum(
  MODULE_KEYS as [NucleoModuleKey, ...NucleoModuleKey[]],
);

export const modulesRouter = {
  list: orgAuthed
    .route({
      method: "GET",
      path: "/modules",
      summary: "List module status for organization",
      tags: ["Modules"],
    })
    .input(z.object({}).optional())
    .output(
      z.object({
        modules: z.array(
          z.object({
            key: z.string(),
            name: z.string(),
            description: z.string(),
            phase: z.enum(["core", "ops", "growth", "ai", "platform", "marketing"]),
            enabled: z.boolean(),
            limits: z.record(z.string(), z.any()).nullable(),
            updatedAt: z.date().nullable(),
          }),
        ),
      }),
    )
    .handler(async ({ context }) => {
      const db = getDb(context);
      const flags = await db
        .select()
        .from(schema.featureFlags)
        .where(eq(schema.featureFlags.organizationId, context.organization.id));

      const map = new Map<string, any>(
        flags.map((flag: any) => [String(flag.moduleKey), flag]),
      );
      const modules = MODULE_CATALOG.map((moduleDef) => {
        const row = map.get(moduleDef.key);
        return {
          key: moduleDef.key,
          name: moduleDef.name,
          description: moduleDef.description,
          phase: moduleDef.phase,
          enabled: row?.enabled ?? moduleDef.defaultEnabled,
          limits: row?.limits ?? null,
          updatedAt: row?.updatedAt ?? null,
        };
      });

      return { modules };
    }),

  setEnabled: adminOnly
    .route({
      method: "PATCH",
      path: "/modules/{key}",
      summary: "Enable or disable a module",
      tags: ["Modules"],
    })
    .input(
      z.object({
        key: moduleKeyEnum,
        enabled: z.boolean(),
        limits: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
          .optional(),
      }),
    )
    .output(
      z.object({
        ok: z.boolean(),
        key: moduleKeyEnum,
        enabled: z.boolean(),
      }),
    )
    .handler(async ({ context, input }) => {
      const db = getDb(context);

      if (input.key === "crm" && input.enabled === false) {
        throw new APIError(ErrorCode.BAD_REQUEST, "Core workspace cannot be disabled", 400);
      }

      const [existing] = await db
        .select()
        .from(schema.featureFlags)
        .where(
          and(
            eq(schema.featureFlags.organizationId, context.organization.id),
            eq(schema.featureFlags.moduleKey, input.key),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(schema.featureFlags).values({
          organizationId: context.organization.id,
          moduleKey: input.key,
          enabled: input.enabled,
          limits: input.limits ?? null,
          configuredBy: context.user.id,
        });
      } else {
        await db
          .update(schema.featureFlags)
          .set({
            enabled: input.enabled,
            limits: input.limits ?? existing.limits,
            configuredBy: context.user.id,
            updatedAt: new Date(),
          })
          .where(eq(schema.featureFlags.id, existing.id));
      }

      return {
        ok: true,
        key: input.key,
        enabled: input.enabled,
      };
    }),
};
