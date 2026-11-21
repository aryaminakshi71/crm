import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./nucleo-unified.schema.js";

export const monitoringSnapshots = pgTable("monitoring_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  agent: text("agent").notNull(), // analytics, billing, error, support, uptime, performance, marketing, catalog
  metrics: jsonb("metrics").default({}),
  alerts: jsonb("alerts").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appCatalog = pgTable("app_catalog", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  appId: text("app_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  status: text("status").notNull().default("active"), // active, inactive, error
  metadata: jsonb("metadata").default({}),
  healthCheckAt: timestamp("health_check_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MonitoringSnapshot = typeof monitoringSnapshots.$inferSelect;
export type AppCatalogEntry = typeof appCatalog.$inferSelect;
