import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./nucleo-unified.schema.js";

export const organizationSettings = pgTable("organization_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  branding: jsonb("branding").default({}), // logo, colors, favicon
  theming: jsonb("theming").default({}), // darkMode, primaryColor, etc.
  localization: jsonb("localization").default({}), // timezone, language, dateFormat
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  events: jsonb("events").default([]), // event types to subscribe to
  secret: text("secret"), // for signature verification
  active: text("active").notNull().default("true"),
  headers: jsonb("headers").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type OrganizationSetting = typeof organizationSettings.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
