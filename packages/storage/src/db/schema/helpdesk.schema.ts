import { relations } from "drizzle-orm";
// Helpdesk Schema - tickets, knowledge base, SLA, canned responses, surveys, forums, widgets
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./auth.schema.js";

// Enums
export const helpdeskTicketStatusEnum = pgEnum("helpdesk_ticket_status", [
  "open",
  "pending",
  "resolved",
  "closed",
]);

export const helpdeskTicketPriorityEnum = pgEnum("helpdesk_ticket_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const helpdeskTicketSourceEnum = pgEnum("helpdesk_ticket_source", [
  "email",
  "chat",
  "phone",
  "web",
]);

export const helpdeskArticleStatusEnum = pgEnum("helpdesk_article_status", [
  "draft",
  "published",
]);

export const helpdeskForumStatusEnum = pgEnum("helpdesk_forum_status", [
  "open",
  "answered",
  "closed",
]);

export const helpdeskWidgetPositionEnum = pgEnum("helpdesk_widget_position", [
  "bottom-right",
  "bottom-left",
]);

// Tickets
export const helpdeskTickets = pgTable(
  "helpdesk_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    description: text("description"),
    status: helpdeskTicketStatusEnum("status").notNull().default("open"),
    priority: helpdeskTicketPriorityEnum("priority").notNull().default("medium"),
    category: text("category"),
    assigneeId: text("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),
    contactEmail: text("contact_email"),
    contactName: text("contact_name"),
    tags: jsonb("tags").$type<string[]>(),
    source: helpdeskTicketSourceEnum("source").notNull().default("web"),
    firstResponseAt: timestamp("first_response_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    slaBreached: boolean("sla_breached").notNull().default(false),
    satisfaction: integer("satisfaction"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    organizationIdIdx: index("idx_hd_tickets_org_id").on(table.organizationId),
    statusIdx: index("idx_hd_tickets_status").on(table.status),
    priorityIdx: index("idx_hd_tickets_priority").on(table.priority),
    assigneeIdx: index("idx_hd_tickets_assignee").on(table.assigneeId),
    orgStatusIdx: index("idx_hd_tickets_org_status").on(
      table.organizationId,
      table.status,
    ),
    deletedAtIdx: index("idx_hd_tickets_deleted_at").on(table.deletedAt),
  }),
);

// Ticket Comments
export const helpdeskTicketComments = pgTable(
  "helpdesk_ticket_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => helpdeskTickets.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    isInternal: boolean("is_internal").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    ticketIdIdx: index("idx_hd_comments_ticket_id").on(table.ticketId),
    authorIdIdx: index("idx_hd_comments_author_id").on(table.authorId),
  }),
);

// Knowledge Base Categories
export const helpdeskKnowledgeCategories = pgTable(
  "helpdesk_knowledge_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    parentId: uuid("parent_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    organizationIdIdx: index("idx_hd_kb_cats_org_id").on(table.organizationId),
  }),
);

// Knowledge Base Articles
export const helpdeskKnowledgeArticles = pgTable(
  "helpdesk_knowledge_articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    body: text("body").notNull(),
    categoryId: uuid("category_id").references(
      () => helpdeskKnowledgeCategories.id,
      { onDelete: "set null" },
    ),
    status: helpdeskArticleStatusEnum("status").notNull().default("draft"),
    views: integer("views").notNull().default(0),
    helpful: integer("helpful").notNull().default(0),
    notHelpful: integer("not_helpful").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    organizationIdIdx: index("idx_hd_kb_articles_org_id").on(
      table.organizationId,
    ),
    statusIdx: index("idx_hd_kb_articles_status").on(table.status),
    categoryIdIdx: index("idx_hd_kb_articles_category_id").on(table.categoryId),
    deletedAtIdx: index("idx_hd_kb_articles_deleted_at").on(table.deletedAt),
  }),
);

// SLA Policies
export const helpdeskSlaPolicies = pgTable(
  "helpdesk_sla_policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    priority: helpdeskTicketPriorityEnum("priority").notNull(),
    firstResponseHours: integer("first_response_hours").notNull().default(4),
    resolutionHours: integer("resolution_hours").notNull().default(24),
    businessHoursOnly: boolean("business_hours_only").notNull().default(false),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    organizationIdIdx: index("idx_hd_sla_org_id").on(table.organizationId),
  }),
);

// Canned Responses
export const helpdeskCannedResponses = pgTable(
  "helpdesk_canned_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("General"),
    body: text("body").notNull(),
    shortcut: text("shortcut"),
    usageCount: integer("usage_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    organizationIdIdx: index("idx_hd_canned_org_id").on(table.organizationId),
  }),
);

// Satisfaction Surveys
export const helpdeskSurveys = pgTable(
  "helpdesk_surveys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    ticketId: uuid("ticket_id").references(() => helpdeskTickets.id, {
      onDelete: "cascade",
    }),
    rating: integer("rating"),
    comment: text("comment"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    organizationIdIdx: index("idx_hd_surveys_org_id").on(table.organizationId),
    ticketIdIdx: index("idx_hd_surveys_ticket_id").on(table.ticketId),
  }),
);

// Forum Posts
export const helpdeskForums = pgTable(
  "helpdesk_forums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    authorId: text("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: helpdeskForumStatusEnum("status").notNull().default("open"),
    views: integer("views").notNull().default(0),
    replies: integer("replies").notNull().default(0),
    isPinned: boolean("is_pinned").notNull().default(false),
    tags: jsonb("tags").$type<string[]>(),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    organizationIdIdx: index("idx_hd_forums_org_id").on(table.organizationId),
    statusIdx: index("idx_hd_forums_status").on(table.status),
    deletedAtIdx: index("idx_hd_forums_deleted_at").on(table.deletedAt),
  }),
);

// Chat Widgets
export const helpdeskWidgets = pgTable(
  "helpdesk_widgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Support Widget"),
    color: text("color").notNull().default("#6366f1"),
    position: helpdeskWidgetPositionEnum("position")
      .notNull()
      .default("bottom-right"),
    greeting: text("greeting").notNull().default("Hi! How can we help you?"),
    isActive: boolean("is_active").notNull().default(true),
    allowedDomains: text("allowed_domains").array(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    organizationIdIdx: index("idx_hd_widgets_org_id").on(table.organizationId),
  }),
);

// Relations
export const helpdeskTicketsRelations = relations(
  helpdeskTickets,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [helpdeskTickets.organizationId],
      references: [organizations.id],
    }),
    assignee: one(users, {
      fields: [helpdeskTickets.assigneeId],
      references: [users.id],
    }),
    comments: many(helpdeskTicketComments),
    surveys: many(helpdeskSurveys),
  }),
);

export const helpdeskTicketCommentsRelations = relations(
  helpdeskTicketComments,
  ({ one }) => ({
    ticket: one(helpdeskTickets, {
      fields: [helpdeskTicketComments.ticketId],
      references: [helpdeskTickets.id],
    }),
    author: one(users, {
      fields: [helpdeskTicketComments.authorId],
      references: [users.id],
    }),
  }),
);

export const helpdeskKnowledgeCategoriesRelations = relations(
  helpdeskKnowledgeCategories,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [helpdeskKnowledgeCategories.organizationId],
      references: [organizations.id],
    }),
    articles: many(helpdeskKnowledgeArticles),
  }),
);

export const helpdeskKnowledgeArticlesRelations = relations(
  helpdeskKnowledgeArticles,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [helpdeskKnowledgeArticles.organizationId],
      references: [organizations.id],
    }),
    category: one(helpdeskKnowledgeCategories, {
      fields: [helpdeskKnowledgeArticles.categoryId],
      references: [helpdeskKnowledgeCategories.id],
    }),
  }),
);

export const helpdeskSlaPoliciesRelations = relations(
  helpdeskSlaPolicies,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [helpdeskSlaPolicies.organizationId],
      references: [organizations.id],
    }),
  }),
);

export const helpdeskCannedResponsesRelations = relations(
  helpdeskCannedResponses,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [helpdeskCannedResponses.organizationId],
      references: [organizations.id],
    }),
  }),
);

export const helpdeskSurveysRelations = relations(
  helpdeskSurveys,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [helpdeskSurveys.organizationId],
      references: [organizations.id],
    }),
    ticket: one(helpdeskTickets, {
      fields: [helpdeskSurveys.ticketId],
      references: [helpdeskTickets.id],
    }),
  }),
);

export const helpdeskForumsRelations = relations(
  helpdeskForums,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [helpdeskForums.organizationId],
      references: [organizations.id],
    }),
    author: one(users, {
      fields: [helpdeskForums.authorId],
      references: [users.id],
    }),
  }),
);

export const helpdeskWidgetsRelations = relations(
  helpdeskWidgets,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [helpdeskWidgets.organizationId],
      references: [organizations.id],
    }),
  }),
);

// Type exports
export type HelpdeskTicket = typeof helpdeskTickets.$inferSelect;
export type NewHelpdeskTicket = typeof helpdeskTickets.$inferInsert;
export type HelpdeskTicketComment = typeof helpdeskTicketComments.$inferSelect;
export type NewHelpdeskTicketComment =
  typeof helpdeskTicketComments.$inferInsert;
export type HelpdeskKnowledgeArticle =
  typeof helpdeskKnowledgeArticles.$inferSelect;
export type NewHelpdeskKnowledgeArticle =
  typeof helpdeskKnowledgeArticles.$inferInsert;
export type HelpdeskKnowledgeCategory =
  typeof helpdeskKnowledgeCategories.$inferSelect;
export type NewHelpdeskKnowledgeCategory =
  typeof helpdeskKnowledgeCategories.$inferInsert;
export type HelpdeskSlaPolicy = typeof helpdeskSlaPolicies.$inferSelect;
export type NewHelpdeskSlaPolicy = typeof helpdeskSlaPolicies.$inferInsert;
export type HelpdeskCannedResponse = typeof helpdeskCannedResponses.$inferSelect;
export type NewHelpdeskCannedResponse =
  typeof helpdeskCannedResponses.$inferInsert;
export type HelpdeskSurvey = typeof helpdeskSurveys.$inferSelect;
export type NewHelpdeskSurvey = typeof helpdeskSurveys.$inferInsert;
export type HelpdeskForum = typeof helpdeskForums.$inferSelect;
export type NewHelpdeskForum = typeof helpdeskForums.$inferInsert;
export type HelpdeskWidget = typeof helpdeskWidgets.$inferSelect;
export type NewHelpdeskWidget = typeof helpdeskWidgets.$inferInsert;
