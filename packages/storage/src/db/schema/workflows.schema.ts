import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { organizations, users } from "./nucleo-unified.schema";

export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(), // webhook, schedule, event, manual
  definition: jsonb("definition").notNull().default({}), // workflow steps, conditions, transforms
  status: text("status").notNull().default("draft"), // draft, active, paused, archived
  environment: text("environment").default("production"), // production, staging, development
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  lastRunAt: timestamp("last_run_at"),
  runCount: text("run_count").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workflowRuns = pgTable("workflow_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: "cascade" }).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  triggerData: jsonb("trigger_data").default({}),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed, cancelled
  currentStepId: text("current_step_id"),
  steps: jsonb("steps").default([]),
  result: jsonb("result").default({}),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflowEvents = pgTable("workflow_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  source: text("source"),
  payload: jsonb("payload").default({}),
  metadata: jsonb("metadata").default({}),
  idempotencyKey: text("idempotency_key").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventSubscriptions = pgTable("event_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: "cascade" }).notNull(),
  eventType: text("event_type").notNull(),
  filters: jsonb("filters").default({}),
  active: text("active").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quotaLimits = pgTable("quota_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // api_calls, workflow_runs, events, storage
  scope: text("scope").notNull(), // daily, monthly, yearly, lifetime
  tier: text("tier").notNull().default("free"), // free, pro, enterprise
  limit: text("limit").notNull(),
  window: text("window"), // ISO duration
  used: text("used").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type WorkflowRun = typeof workflowRuns.$inferSelect;
export type NewWorkflowRun = typeof workflowRuns.$inferInsert;
export type WorkflowEvent = typeof workflowEvents.$inferSelect;
export type NewWorkflowEvent = typeof workflowEvents.$inferInsert;
export type EventSubscription = typeof eventSubscriptions.$inferSelect;
export type QuotaLimit = typeof quotaLimits.$inferSelect;
