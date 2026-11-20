// Projects Extended Schema - sprints, members, time entries, risks, documents, templates, comments
// NOTE: projects, projectTasks, projectMilestones, projectResources are defined in nucleo-unified.schema.ts
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./auth.schema.js";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const projectSprintStatusEnum = pgEnum("project_sprint_status", [
  "planning",
  "active",
  "completed",
]);

export const projectMemberRoleEnum = pgEnum("project_member_role", [
  "owner",
  "manager",
  "member",
  "viewer",
]);

export const projectRiskImpactEnum = pgEnum("project_risk_impact", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const projectRiskProbabilityEnum = pgEnum("project_risk_probability", [
  "low",
  "medium",
  "high",
]);

export const projectRiskStatusEnum = pgEnum("project_risk_status", [
  "identified",
  "mitigating",
  "resolved",
  "accepted",
]);

// ─── New Tables ───────────────────────────────────────────────────────────────

export const projectSprints = pgTable(
  "project_sprints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    goal: text("goal"),
    status: projectSprintStatusEnum("status").notNull().default("planning"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    velocity: integer("velocity"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("idx_project_sprints_organization_id").on(table.organizationId),
    projectIdx: index("idx_project_sprints_project_id").on(table.projectId),
  }),
);

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: projectMemberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("idx_project_members_project_id").on(table.projectId),
    userIdx: index("idx_project_members_user_id").on(table.userId),
  }),
);

export const projectTimeEntries = pgTable(
  "project_time_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    taskId: uuid("task_id"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    description: text("description"),
    hours: numeric("hours", { precision: 6, scale: 2 }).notNull(),
    date: date("date").notNull(),
    billable: boolean("billable").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("idx_project_time_entries_organization_id").on(table.organizationId),
    projectIdx: index("idx_project_time_entries_project_id").on(table.projectId),
    userIdx: index("idx_project_time_entries_user_id").on(table.userId),
  }),
);

export const projectRisks = pgTable(
  "project_risks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    impact: projectRiskImpactEnum("impact").notNull().default("medium"),
    probability: projectRiskProbabilityEnum("probability").notNull().default("medium"),
    status: projectRiskStatusEnum("status").notNull().default("identified"),
    mitigation: text("mitigation"),
    owner: varchar("owner", { length: 255 }),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("idx_project_risks_organization_id").on(table.organizationId),
    projectIdx: index("idx_project_risks_project_id").on(table.projectId),
  }),
);

export const projectDocuments = pgTable(
  "project_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }),
    url: text("url"),
    size: integer("size"),
    uploadedById: text("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    orgIdx: index("idx_project_documents_organization_id").on(table.organizationId),
    projectIdx: index("idx_project_documents_project_id").on(table.projectId),
  }),
);

export const projectTemplates = pgTable(
  "project_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    structure: jsonb("structure").$type<Record<string, any>>(),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("idx_project_templates_organization_id").on(table.organizationId),
  }),
);

export const projectComments = pgTable(
  "project_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    taskId: uuid("task_id"),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("idx_project_comments_organization_id").on(table.organizationId),
    projectIdx: index("idx_project_comments_project_id").on(table.projectId),
  }),
);
