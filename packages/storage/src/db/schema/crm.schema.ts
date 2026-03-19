import { relations } from "drizzle-orm";
// CRM Schema - contacts, deals, leads, activities
import {
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./auth.schema.js";

// Soft delete mixin - can be used with .extends()
export const softDelete = {
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

// Contacts table
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    companyName: varchar("company_name", { length: 255 }),
    jobTitle: varchar("job_title", { length: 100 }),
    notes: text("notes"),
    tags: text("tags").array(),
    metadata: jsonb("metadata").$type<{
      linkedin?: string;
      twitter?: string;
      avatar?: string;
    }>(),
    ownerId: text("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    organizationIdIdx: index("idx_contacts_organization_id").on(
      table.organizationId,
    ),
    emailIdx: index("idx_contacts_email").on(table.email),
    ownerIdIdx: index("idx_contacts_owner_id").on(table.ownerId),
    // Composite index for common query pattern
    orgEmailIdx: index("idx_contacts_org_email").on(
      table.organizationId,
      table.email,
    ),
    // Index for soft delete queries
    deletedAtIdx: index("idx_contacts_deleted_at").on(table.deletedAt),
  }),
);

// Deals table
export const deals = pgTable(
  "deals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    value: numeric("value", { precision: 15, scale: 2 }).notNull(),
    stage: varchar("stage", { length: 50 }).notNull().default("lead"),
    probability: numeric("probability", { precision: 5, scale: 2 }).default(
      "0",
    ),
    contactId: uuid("contact_id"),
    expectedCloseDate: timestamp("expected_close_date", { withTimezone: true }),
    notes: text("notes"),
    ownerId: text("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    organizationIdIdx: index("idx_deals_organization_id").on(
      table.organizationId,
    ),
    contactIdIdx: index("idx_deals_contact_id").on(table.contactId),
    stageIdx: index("idx_deals_stage").on(table.stage),
    // Composite indexes for common queries
    orgStageIdx: index("idx_deals_org_stage").on(
      table.organizationId,
      table.stage,
    ),
    orgValueIdx: index("idx_deals_org_value").on(
      table.organizationId,
      table.value,
    ),
    deletedAtIdx: index("idx_deals_deleted_at").on(table.deletedAt),
  }),
);

// Leads table
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    companyName: varchar("company_name", { length: 255 }),
    jobTitle: varchar("job_title", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    source: varchar("source", { length: 100 }).notNull().default("website"),
    status: varchar("status", { length: 50 }).notNull().default("new"),
    score: numeric("score", { precision: 5, scale: 2 }).default("0"),
    notes: text("notes"),
    convertedContactId: uuid("converted_contact_id"),
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    organizationIdIdx: index("idx_leads_organization_id").on(
      table.organizationId,
    ),
    emailIdx: index("idx_leads_email").on(table.email),
    statusIdx: index("idx_leads_status").on(table.status),
    // Composite indexes for common queries
    orgStatusIdx: index("idx_leads_org_status").on(
      table.organizationId,
      table.status,
    ),
    orgSourceIdx: index("idx_leads_org_source").on(
      table.organizationId,
      table.source,
    ),
    deletedAtIdx: index("idx_leads_deleted_at").on(table.deletedAt),
  }),
);

// Activities table
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    description: text("description"),
    contactId: uuid("contact_id"),
    dealId: uuid("deal_id"),
    leadId: uuid("lead_id"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<{
      duration?: number;
      attendees?: string[];
      location?: string;
      meetingLink?: string;
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    organizationIdIdx: index("idx_activities_organization_id").on(
      table.organizationId,
    ),
    contactIdIdx: index("idx_activities_contact_id").on(table.contactId),
    dealIdIdx: index("idx_activities_deal_id").on(table.dealId),
    typeIdx: index("idx_activities_type").on(table.type),
    // Composite indexes
    orgTypeIdx: index("idx_activities_org_type").on(
      table.organizationId,
      table.type,
    ),
    orgDueDateIdx: index("idx_activities_org_due_date").on(
      table.organizationId,
      table.dueDate,
    ),
    deletedAtIdx: index("idx_activities_deleted_at").on(table.deletedAt),
  }),
);

// Files/Attachments table
export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    size: varchar("size", { length: 50 }).notNull(),
    r2Key: text("r2_key").notNull(),
    contactId: uuid("contact_id"),
    dealId: uuid("deal_id"),
    leadId: uuid("lead_id"),
    uploadedById: text("uploaded_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    organizationIdIdx: index("idx_files_organization_id").on(
      table.organizationId,
    ),
    contactIdIdx: index("idx_files_contact_id").on(table.contactId),
    dealIdIdx: index("idx_files_deal_id").on(table.dealId),
    leadIdIdx: index("idx_files_lead_id").on(table.leadId),
    mimeTypeIdx: index("idx_files_mime_type").on(table.mimeType),
    deletedAtIdx: index("idx_files_deleted_at").on(table.deletedAt),
  }),
);

// Relations
export const contactsRelations = relations(contacts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contacts.organizationId],
    references: [organizations.id],
  }),
  owner: one(users, {
    fields: [contacts.ownerId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [contacts.createdBy],
    references: [users.id],
  }),
  deals: many(deals),
  activities: many(activities),
  files: many(files),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [deals.organizationId],
    references: [organizations.id],
  }),
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
  owner: one(users, {
    fields: [deals.ownerId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [deals.createdBy],
    references: [users.id],
  }),
  activities: many(activities),
  files: many(files),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [leads.organizationId],
    references: [organizations.id],
  }),
  convertedContact: one(contacts, {
    fields: [leads.convertedContactId],
    references: [contacts.id],
  }),
  assignedTo: one(users, {
    fields: [leads.assignedToId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [leads.createdBy],
    references: [users.id],
  }),
  activities: many(activities),
  files: many(files),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  organization: one(organizations, {
    fields: [activities.organizationId],
    references: [organizations.id],
  }),
  contact: one(contacts, {
    fields: [activities.contactId],
    references: [contacts.id],
  }),
  deal: one(deals, {
    fields: [activities.dealId],
    references: [deals.id],
  }),
  lead: one(leads, {
    fields: [activities.leadId],
    references: [leads.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  organization: one(organizations, {
    fields: [files.organizationId],
    references: [organizations.id],
  }),
  contact: one(contacts, {
    fields: [files.contactId],
    references: [contacts.id],
  }),
  deal: one(deals, {
    fields: [files.dealId],
    references: [deals.id],
  }),
  lead: one(leads, {
    fields: [files.leadId],
    references: [leads.id],
  }),
  uploadedBy: one(users, {
    fields: [files.uploadedById],
    references: [users.id],
  }),
}));

// Type exports
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
