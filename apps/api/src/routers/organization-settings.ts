/**
 * Organization Settings Router
 *
 * Organization branding, theming, localization, and preferences.
 */

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError } from "../lib/errors";
import { getDb, orgAuthed, schema } from "../procedures";

const { organizationSettings } = schema;

const settingsSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  branding: z.record(z.string(), z.unknown()),
  theming: z.record(z.string(), z.unknown()),
  localization: z.record(z.string(), z.unknown()),
  preferences: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const organizationSettingsRouter = {
  // ─── Get Settings ───────────────────────────────────────────────────────────

  get: orgAuthed
    .route({
      method: "GET",
      path: "/settings/organization",
      summary: "Get organization settings",
      tags: ["Organization"],
    })
    .output(settingsSchema)
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const [settings] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, context.organization.id))
        .limit(1);

      if (!settings) {
        // Create default settings if not exists
        const [newSettings] = await db
          .insert(organizationSettings)
          .values({
            organizationId: context.organization.id,
            branding: {},
            theming: {},
            localization: {},
            preferences: {},
          })
          .returning();
        return newSettings;
      }

      return settings;
    }),

  // ─── Update Settings ────────────────────────────────────────────────────────

  update: orgAuthed
    .route({
      method: "PATCH",
      path: "/settings/organization",
      summary: "Update organization settings",
      tags: ["Organization"],
    })
    .input(
      z.object({
        branding: z.record(z.string(), z.unknown()).optional(),
        theming: z.record(z.string(), z.unknown()).optional(),
        localization: z.record(z.string(), z.unknown()).optional(),
        preferences: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .output(settingsSchema)
    .handler(async ({ context, input }: { context: OrgContext; input: any }) => {
      const db = getDb(context);

      // Get existing settings
      const [existing] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, context.organization.id))
        .limit(1);

      if (!existing) {
        // Create settings with provided values
        const [settings] = await db
          .insert(organizationSettings)
          .values({
            organizationId: context.organization.id,
            branding: input.branding || {},
            theming: input.theming || {},
            localization: input.localization || {},
            preferences: input.preferences || {},
          })
          .returning();
        return settings;
      }

      // Update existing settings
      const [settings] = await db
        .update(organizationSettings)
        .set({
          ...(input.branding !== undefined ? { branding: input.branding } : {}),
          ...(input.theming !== undefined ? { theming: input.theming } : {}),
          ...(input.localization !== undefined ? { localization: input.localization } : {}),
          ...(input.preferences !== undefined ? { preferences: input.preferences } : {}),
          updatedAt: new Date(),
        })
        .where(eq(organizationSettings.organizationId, context.organization.id))
        .returning();

      return settings;
    }),

  // ─── Branding ───────────────────────────────────────────────────────────────

  updateBranding: orgAuthed
    .route({
      method: "PATCH",
      path: "/settings/organization/branding",
      summary: "Update organization branding",
      tags: ["Organization"],
    })
    .input(
      z.object({
        logo: z.string().optional(),
        favicon: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        companyName: z.string().optional(),
      }),
    )
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }: { context: OrgContext; input: any }) => {
      const db = getDb(context);

      const [existing] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, context.organization.id))
        .limit(1);

      const branding = {
        ...(existing?.branding || {}),
        ...input,
      };

      if (!existing) {
        await db.insert(organizationSettings).values({
          organizationId: context.organization.id,
          branding,
          theming: {},
          localization: {},
          preferences: {},
        });
      } else {
        await db
          .update(organizationSettings)
          .set({ branding, updatedAt: new Date() })
          .where(eq(organizationSettings.organizationId, context.organization.id));
      }

      return { success: true };
    }),

  // ─── Theming ───────────────────────────────────────────────────────────────

  updateTheming: orgAuthed
    .route({
      method: "PATCH",
      path: "/settings/organization/theming",
      summary: "Update organization theming",
      tags: ["Organization"],
    })
    .input(
      z.object({
        darkMode: z.boolean().optional(),
        primaryColor: z.string().optional(),
        borderRadius: z.number().optional(),
        fontFamily: z.string().optional(),
      }),
    )
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }: { context: OrgContext; input: any }) => {
      const db = getDb(context);

      const [existing] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, context.organization.id))
        .limit(1);

      const theming = {
        ...(existing?.theming || {}),
        ...input,
      };

      if (!existing) {
        await db.insert(organizationSettings).values({
          organizationId: context.organization.id,
          branding: {},
          theming,
          localization: {},
          preferences: {},
        });
      } else {
        await db
          .update(organizationSettings)
          .set({ theming, updatedAt: new Date() })
          .where(eq(organizationSettings.organizationId, context.organization.id));
      }

      return { success: true };
    }),
};
