/**
 * DevOps CI/CD Schema
 *
 * Pipelines, pipeline runs, deployments, infrastructure, and environments.
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  numeric,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./auth.schema";

// Pipeline Status
export const PipelineStatus = [
  "active",
  "inactive",
  "error",
] as const;
export type PipelineStatus = (typeof PipelineStatus)[number];

// Run Status
export const RunStatus = [
  "pending",
  "running",
  "success",
  "failed",
  "canceled",
] as const;
export type RunStatus = (typeof RunStatus)[number];

// Deployment Status
export const DeploymentStatus = [
  "pending",
  "in_progress",
  "success",
  "failed",
  "rolled_back",
] as const;
export type DeploymentStatus = (typeof DeploymentStatus)[number];

// Environment Type
export const EnvironmentType = ["development", "staging", "production"] as const;
export type EnvironmentType = (typeof EnvironmentType)[number];

// Pipelines
export const pipelines = pgTable("devops_pipelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),

  repo: varchar("repo", { length: 500 }), // e.g., "github.com/org/repo"
  branch: varchar("branch", { length: 100 }).notNull().default("main"),
  config: jsonb("config").$type<{
    yaml?: string;
    steps?: Array<{
      name: string;
      command: string;
      env?: Record<string, string>;
    }>;
    triggers?: {
      push?: boolean;
      pullRequest?: boolean;
      schedule?: string;
    };
  }>(),

  environment: varchar("environment", { length: 50 }), // development, staging, production

  status: varchar("status", { length: 20 }).notNull().default("active"),

  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunStatus: varchar("last_run_status", { length: 20 }),
  lastCommitSha: varchar("last_commit_sha", { length: 40 }),

  runCount: integer("run_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failureCount: integer("failure_count").notNull().default(0),

  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Pipeline Runs
export const pipelineRuns = pgTable("devops_pipeline_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  pipelineId: uuid("pipeline_id")
    .notNull()
    .references(() => pipelines.id, { onDelete: "cascade" }),

  runNumber: integer("run_number").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),

  commitSha: varchar("commit_sha", { length: 40 }),
  commitMessage: text("commit_message"),
  branch: varchar("branch", { length: 100 }),

  triggeredBy: varchar("triggered_by", { length: 100 }), // user, schedule, webhook
  triggerSource: varchar("trigger_source", { length: 100 }), // github, gitlab, manual, etc.

  stages: jsonb("stages").$type<Array<{
    name: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    duration?: number;
    logs?: string;
  }>>().default([]),

  artifacts: jsonb("artifacts").$type<Array<{
    name: string;
    url: string;
    size: number;
  }>>().default([]),

  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  duration: integer("duration"), // seconds

  logs: text("logs"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Deployments
export const deployments = pgTable("devops_deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  pipelineRunId: uuid("pipeline_run_id").references(() => pipelineRuns.id),

  environment: varchar("environment", { length: 50 }).notNull(),

  version: varchar("version", { length: 100 }).notNull(),
  previousVersion: varchar("previous_version", { length: 100 }),

  status: varchar("status", { length: 20 }).notNull().default("pending"),

  url: varchar("url", { length: 500 }),
  rolloutStrategy: varchar("rollout_strategy", { length: 50 }).default("immediate"),

  rollbackFrom: uuid("rollback_from"),
  rolledBackAt: timestamp("rolled_back_at", { withTimezone: true }),

  deployedBy: text("deployed_by"),
  deployedAt: timestamp("deployed_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Infrastructure
export const infrastructure = pgTable("devops_infrastructure", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // server, container, function, database

  provider: varchar("provider", { length: 50 }), // aws, gcp, azure, digitalocean
  region: varchar("region", { length: 50 }),

  config: jsonb("config").$type<{
    instanceType?: string;
    image?: string;
    size?: string;
    scaling?: {
      min: number;
      max: number;
    };
    storage?: {
      size: number;
      type: string;
    };
  }>(),

  status: varchar("status", { length: 20 }).notNull().default("running"),

  lastDeployedAt: timestamp("last_deployed_at", { withTimezone: true }),
  lastDeploymentId: uuid("last_deployment_id").references(() => deployments.id),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Environments
export const environments = pgTable("devops_environments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 50 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // development, staging, production

  variables: jsonb("variables").$type<Record<string, string>>().default({}),

  isDefault: boolean("is_default").notNull().default(false),
  autoDeploy: boolean("auto_deploy").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const pipelinesRelations = relations(pipelines, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [pipelines.organizationId],
    references: [organizations.id],
  }),
  runs: many(pipelineRuns),
}));

export const pipelineRunsRelations = relations(pipelineRuns, ({ one }) => ({
  organization: one(organizations, {
    fields: [pipelineRuns.organizationId],
    references: [organizations.id],
  }),
  pipeline: one(pipelines, {
    fields: [pipelineRuns.pipelineId],
    references: [pipelines.id],
  }),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  organization: one(organizations, {
    fields: [deployments.organizationId],
    references: [organizations.id],
  }),
  pipelineRun: one(pipelineRuns, {
    fields: [deployments.pipelineRunId],
    references: [pipelineRuns.id],
  }),
}));

export const infrastructureRelations = relations(infrastructure, ({ one }) => ({
  organization: one(organizations, {
    fields: [infrastructure.organizationId],
    references: [organizations.id],
  }),
}));

export const environmentsRelations = relations(environments, ({ one }) => ({
  organization: one(organizations, {
    fields: [environments.organizationId],
    references: [organizations.id],
  }),
}));
