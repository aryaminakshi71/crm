import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./auth.schema.js";

/**
 * Integrations Schema
 * Tables for lead capture forms, app connections, and workflow automation
 */

// Lead capture forms table
export const leadForms = pgTable(
  "lead_forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    isActive: boolean("is_active").default(true),
    submissionCount: integer("submission_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    organizationIdIdx: index("idx_lead_forms_organization").on(
      table.organizationId,
    ),
    tokenIdx: index("idx_lead_forms_token").on(table.token),
  }),
);

// App connections table (for combining apps)
export const appConnections = pgTable(
  "app_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sourceApp: varchar("source_app", { length: 50 }).notNull(),
    targetApp: varchar("target_app", { length: 50 }).notNull(),
    triggerEvent: varchar("trigger_event", { length: 100 }).notNull(),
    actionType: varchar("action_type", { length: 50 }).notNull(),
    actionConfig: jsonb("action_config"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    organizationIdIdx: index("idx_app_connections_organization").on(
      table.organizationId,
    ),
    sourceIdx: index("idx_app_connections_source").on(
      table.sourceApp,
      table.triggerEvent,
    ),
  }),
);

// Integration accounts table (for storing OAuth tokens, API keys, etc.)
export const integrationAccounts = pgTable(
  "integration_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    integrationType: varchar("integration_type", { length: 50 }).notNull(),
    accountName: varchar("account_name", { length: 255 }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at"),
    config: jsonb("config"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    organizationIdIdx: index("idx_integration_accounts_organization").on(
      table.organizationId,
    ),
    typeIdx: index("idx_integration_accounts_type").on(
      table.integrationType,
      table.isActive,
    ),
  }),
);

// Workflow execution log (for tracking app connections)
export const workflowExecutions = pgTable(
  "workflow_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    connectionId: uuid("connection_id"),
    triggerEvent: varchar("trigger_event", { length: 100 }).notNull(),
    sourceData: jsonb("source_data"),
    actionResult: jsonb("action_result"),
    status: varchar("status", { length: 20 }).notNull(),
    errorMessage: text("error_message"),
    executedAt: timestamp("executed_at").defaultNow().notNull(),
  },
  (table) => ({
    organizationIdIdx: index("idx_workflow_executions_organization").on(
      table.organizationId,
    ),
    connectionIdx: index("idx_workflow_executions_connection").on(
      table.connectionId,
    ),
    statusIdx: index("idx_workflow_executions_status").on(
      table.status,
      table.executedAt,
    ),
  }),
);

// API keys table (user-scoped for integrations)
export const integrationApiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    isActive: boolean("is_active").default(true),
    expiresAt: timestamp("expires_at"),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_api_keys_user").on(table.userId),
    keyIdx: index("idx_api_keys_key").on(table.key),
  }),
);

// Type exports
export type LeadForm = typeof leadForms.$inferSelect;
export type NewLeadForm = typeof leadForms.$inferInsert;
export type AppConnection = typeof appConnections.$inferSelect;
export type NewAppConnection = typeof appConnections.$inferInsert;
export type IntegrationAccount = typeof integrationAccounts.$inferSelect;
export type NewIntegrationAccount = typeof integrationAccounts.$inferInsert;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
