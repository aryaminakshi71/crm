import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./auth.schema.js";

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    moduleKey: text("module_key").notNull(),
    enabled: boolean("enabled").notNull().default(false),
    limits: jsonb("limits").$type<Record<string, number | string | boolean>>(),
    configuredBy: text("configured_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    organizationIdIdx: index("idx_feature_flags_organization_id").on(
      table.organizationId,
    ),
    moduleKeyIdx: index("idx_feature_flags_module_key").on(table.moduleKey),
    orgModuleUnique: uniqueIndex("uq_feature_flags_org_module").on(
      table.organizationId,
      table.moduleKey,
    ),
  }),
);

export const featureFlagsRelations = relations(featureFlags, ({ one }) => ({
  organization: one(organizations, {
    fields: [featureFlags.organizationId],
    references: [organizations.id],
  }),
  configuredByUser: one(users, {
    fields: [featureFlags.configuredBy],
    references: [users.id],
  }),
}));

