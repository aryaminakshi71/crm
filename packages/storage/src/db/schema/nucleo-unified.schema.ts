import { relations } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./auth.schema.js";
import { contacts, files } from "./crm.schema.js";

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 64 }),
    industry: varchar("industry", { length: 128 }),
    website: text("website"),
    ownerId: text("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_customers_org").on(table.organizationId),
    nameIdx: index("idx_customers_name").on(table.name),
  }),
);

export const customerContacts = pgTable(
  "customer_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdx: index("idx_customer_contacts_customer").on(table.customerId),
    contactIdx: index("idx_customer_contacts_contact").on(table.contactId),
  }),
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 40 }).notNull().default("planning"),
    priority: varchar("priority", { length: 20 }).notNull().default("medium"),
    startDate: timestamp("start_date", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    ownerId: text("owner_id").references(() => users.id, {
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
    orgIdx: index("idx_projects_org").on(table.organizationId),
    customerIdx: index("idx_projects_customer").on(table.customerId),
    statusIdx: index("idx_projects_status").on(table.status),
  }),
);

export const projectTasks = pgTable(
  "project_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 40 }).notNull().default("todo"),
    priority: varchar("priority", { length: 20 }).notNull().default("medium"),
    assigneeId: text("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_project_tasks_org").on(table.organizationId),
    projectIdx: index("idx_project_tasks_project").on(table.projectId),
    statusIdx: index("idx_project_tasks_status").on(table.status),
  }),
);

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    source: varchar("source", { length: 80 }).notNull().default("manual"),
    channel: varchar("channel", { length: 80 }).notNull().default("web"),
    subject: varchar("subject", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 40 }).notNull().default("open"),
    priority: varchar("priority", { length: 20 }).notNull().default("medium"),
    queue: varchar("queue", { length: 80 }).notNull().default("general"),
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_tickets_org").on(table.organizationId),
    statusIdx: index("idx_tickets_status").on(table.status),
    queueIdx: index("idx_tickets_queue").on(table.queue),
  }),
);

export const queueTokens = pgTable(
  "queue_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    ticketId: uuid("ticket_id").references(() => tickets.id, {
      onDelete: "set null",
    }),
    tokenNumber: integer("token_number").notNull(),
    counter: varchar("counter", { length: 80 }),
    serviceType: varchar("service_type", { length: 80 }).notNull(),
    status: varchar("status", { length: 40 }).notNull().default("waiting"),
    calledAt: timestamp("called_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_queue_tokens_org").on(table.organizationId),
    tokenIdx: index("idx_queue_tokens_number").on(table.tokenNumber),
    statusIdx: index("idx_queue_tokens_status").on(table.status),
  }),
);

export const assetFolders = pgTable(
  "asset_folders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    name: varchar("name", { length: 255 }).notNull(),
    color: varchar("color", { length: 20 }).notNull().default("#3b82f6"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_asset_folders_org").on(table.organizationId),
    parentIdx: index("idx_asset_folders_parent").on(table.parentId),
  }),
);

export const digitalAssets = pgTable(
  "digital_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    folderId: uuid("folder_id").references(() => assetFolders.id, {
      onDelete: "set null",
    }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    ticketId: uuid("ticket_id").references(() => tickets.id, {
      onDelete: "set null",
    }),
    fileId: uuid("file_id").references(() => files.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    storageKey: text("storage_key").notNull(),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_digital_assets_org").on(table.organizationId),
    folderIdx: index("idx_digital_assets_folder").on(table.folderId),
    projectIdx: index("idx_digital_assets_project").on(table.projectId),
  }),
);

export const assetTags = pgTable(
  "asset_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    color: varchar("color", { length: 20 }).notNull().default("#3b82f6"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_asset_tags_org").on(table.organizationId),
    nameIdx: index("idx_asset_tags_name").on(table.name),
  }),
);

export const digitalAssetTags = pgTable(
  "digital_asset_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => digitalAssets.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => assetTags.id, { onDelete: "cascade" }),
    isAiGenerated: integer("is_ai_generated").notNull().default(0),
    confidence: numeric("confidence", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    assetIdx: index("idx_digital_asset_tags_asset").on(table.assetId),
    tagIdx: index("idx_digital_asset_tags_tag").on(table.tagId),
  }),
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    ticketId: uuid("ticket_id").references(() => tickets.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    status: varchar("status", { length: 40 }).notNull().default("draft"),
    currentVersion: integer("current_version").notNull().default(1),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_documents_org").on(table.organizationId),
    statusIdx: index("idx_documents_status").on(table.status),
  }),
);

export const documentVersions = pgTable(
  "document_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    content: text("content"),
    storageKey: text("storage_key"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    documentIdx: index("idx_document_versions_document").on(table.documentId),
    versionIdx: index("idx_document_versions_version").on(table.version),
  }),
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    invoiceNumber: varchar("invoice_number", { length: 64 }).notNull(),
    status: varchar("status", { length: 40 }).notNull().default("draft"),
    currency: varchar("currency", { length: 12 }).notNull().default("USD"),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    tax: numeric("tax", { precision: 15, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_invoices_org").on(table.organizationId),
    numberIdx: index("idx_invoices_number").on(table.invoiceNumber),
    statusIdx: index("idx_invoices_status").on(table.status),
  }),
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 2 })
      .notNull()
      .default("1"),
    unitPrice: numeric("unit_price", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    lineTotal: numeric("line_total", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    invoiceIdx: index("idx_invoice_items_invoice").on(table.invoiceId),
  }),
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 80 }).notNull().default("multi_channel"),
    channel: varchar("channel", { length: 80 }).notNull().default("email"),
    status: varchar("status", { length: 40 }).notNull().default("draft"),
    goal: text("goal"),
    budget: numeric("budget", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    ownerId: text("owner_id").references(() => users.id, {
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
    orgIdx: index("idx_campaigns_org").on(table.organizationId),
    statusIdx: index("idx_campaigns_status").on(table.status),
    channelIdx: index("idx_campaigns_channel").on(table.channel),
  }),
);

export const campaignContacts = pgTable(
  "campaign_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    stage: varchar("stage", { length: 40 }).notNull().default("targeted"),
    lastTouchAt: timestamp("last_touch_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    campaignIdx: index("idx_campaign_contacts_campaign").on(table.campaignId),
    contactIdx: index("idx_campaign_contacts_contact").on(table.contactId),
    stageIdx: index("idx_campaign_contacts_stage").on(table.stage),
  }),
);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeCode: varchar("employee_code", { length: 64 }),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    workEmail: varchar("work_email", { length: 255 }).notNull(),
    department: varchar("department", { length: 120 }).notNull().default("General"),
    jobTitle: varchar("job_title", { length: 160 }),
    managerName: varchar("manager_name", { length: 255 }),
    employmentType: varchar("employment_type", { length: 60 }).notNull().default("full_time"),
    status: varchar("status", { length: 40 }).notNull().default("active"),
    location: varchar("location", { length: 120 }),
    joinDate: timestamp("join_date", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_employees_org").on(table.organizationId),
    emailIdx: index("idx_employees_email").on(table.workEmail),
    departmentIdx: index("idx_employees_department").on(table.department),
    statusIdx: index("idx_employees_status").on(table.status),
  }),
);

export const attendanceLogs = pgTable(
  "attendance_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    attendanceDate: timestamp("attendance_date", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 40 }).notNull().default("present"),
    hours: numeric("hours", { precision: 5, scale: 2 }).notNull().default("0"),
    checkInAt: timestamp("check_in_at", { withTimezone: true }),
    checkOutAt: timestamp("check_out_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_attendance_logs_org").on(table.organizationId),
    employeeIdx: index("idx_attendance_logs_employee").on(table.employeeId),
    dateIdx: index("idx_attendance_logs_date").on(table.attendanceDate),
  }),
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    leaveType: varchar("leave_type", { length: 60 }).notNull().default("annual"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    reason: text("reason"),
    status: varchar("status", { length: 40 }).notNull().default("pending"),
    approverId: text("approver_id").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_leave_requests_org").on(table.organizationId),
    employeeIdx: index("idx_leave_requests_employee").on(table.employeeId),
    statusIdx: index("idx_leave_requests_status").on(table.status),
    startDateIdx: index("idx_leave_requests_start_date").on(table.startDate),
  }),
);

export const performanceReviews = pgTable(
  "performance_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    reviewCycle: varchar("review_cycle", { length: 80 }).notNull(),
    rating: varchar("rating", { length: 40 }).notNull().default("not_rated"),
    goalsProgress: integer("goals_progress").notNull().default(0),
    summary: text("summary"),
    reviewerId: text("reviewer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: varchar("status", { length: 40 }).notNull().default("draft"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_performance_reviews_org").on(table.organizationId),
    employeeIdx: index("idx_performance_reviews_employee").on(table.employeeId),
    cycleIdx: index("idx_performance_reviews_cycle").on(table.reviewCycle),
    statusIdx: index("idx_performance_reviews_status").on(table.status),
  }),
);

export const enterpriseRoles = pgTable(
  "enterprise_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    scope: text("scope").notNull(),
    riskLevel: varchar("risk_level", { length: 40 }).notNull().default("low"),
    assignedUsers: integer("assigned_users").notNull().default(0),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_enterprise_roles_org").on(table.organizationId),
    nameIdx: index("idx_enterprise_roles_name").on(table.name),
    riskIdx: index("idx_enterprise_roles_risk").on(table.riskLevel),
  }),
);

export const approvalWorkflows = pgTable(
  "approval_workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    ownerTeam: varchar("owner_team", { length: 120 }).notNull().default("operations"),
    stageCount: integer("stage_count").notNull().default(1),
    status: varchar("status", { length: 40 }).notNull().default("draft"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_approval_workflows_org").on(table.organizationId),
    ownerIdx: index("idx_approval_workflows_owner").on(table.ownerTeam),
    statusIdx: index("idx_approval_workflows_status").on(table.status),
  }),
);

export const approvalStages = pgTable(
  "approval_stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => approvalWorkflows.id, { onDelete: "cascade" }),
    stageOrder: integer("stage_order").notNull(),
    approverRole: varchar("approver_role", { length: 120 }).notNull(),
    slaHours: integer("sla_hours"),
    isRequired: integer("is_required").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workflowIdx: index("idx_approval_stages_workflow").on(table.workflowId),
    orderIdx: index("idx_approval_stages_order").on(table.stageOrder),
  }),
);

export const ssoProviders = pgTable(
  "sso_providers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    providerName: varchar("provider_name", { length: 120 }).notNull(),
    providerType: varchar("provider_type", { length: 60 }).notNull().default("oidc"),
    status: varchar("status", { length: 40 }).notNull().default("connected"),
    config: jsonb("config").$type<Record<string, unknown>>(),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_sso_providers_org").on(table.organizationId),
    nameIdx: index("idx_sso_providers_name").on(table.providerName),
    statusIdx: index("idx_sso_providers_status").on(table.status),
  }),
);

export const scimSyncJobs = pgTable(
  "scim_sync_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id").references(() => ssoProviders.id, {
      onDelete: "set null",
    }),
    status: varchar("status", { length: 40 }).notNull().default("queued"),
    direction: varchar("direction", { length: 40 }).notNull().default("inbound"),
    recordsProcessed: integer("records_processed").notNull().default(0),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    triggeredBy: text("triggered_by").references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_scim_sync_jobs_org").on(table.organizationId),
    statusIdx: index("idx_scim_sync_jobs_status").on(table.status),
    providerIdx: index("idx_scim_sync_jobs_provider").on(table.providerId),
    createdIdx: index("idx_scim_sync_jobs_created").on(table.createdAt),
  }),
);

export const enterpriseAuditEvents = pgTable(
  "enterprise_audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    source: varchar("source", { length: 80 }).notNull().default("manual"),
    actor: varchar("actor", { length: 255 }),
    action: text("action").notNull(),
    severity: varchar("severity", { length: 20 }).notNull().default("low"),
    eventTime: timestamp("event_time", { withTimezone: true })
      .notNull()
      .defaultNow(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_enterprise_audit_events_org").on(table.organizationId),
    eventTimeIdx: index("idx_enterprise_audit_events_time").on(table.eventTime),
    severityIdx: index("idx_enterprise_audit_events_severity").on(table.severity),
  }),
);

export const aiAgentRuns = pgTable(
  "ai_agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    agentName: varchar("agent_name", { length: 120 }).notNull(),
    prompt: text("prompt").notNull(),
    status: varchar("status", { length: 40 }).notNull().default("completed"),
    output: text("output"),
    confidence: numeric("confidence", { precision: 5, scale: 2 }),
    model: varchar("model", { length: 80 }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_ai_agent_runs_org").on(table.organizationId),
    agentIdx: index("idx_ai_agent_runs_agent").on(table.agentName),
    statusIdx: index("idx_ai_agent_runs_status").on(table.status),
    createdIdx: index("idx_ai_agent_runs_created").on(table.createdAt),
  }),
);

export const forecastSnapshots = pgTable(
  "forecast_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    pipelineAmount: numeric("pipeline_amount", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    winRate: numeric("win_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    avgSalesCycleDays: integer("avg_sales_cycle_days").notNull().default(0),
    projectedRevenue: numeric("projected_revenue", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    riskBand: varchar("risk_band", { length: 20 }).notNull().default("medium"),
    confidence: numeric("confidence", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    recommendations: jsonb("recommendations").$type<string[]>(),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_forecast_snapshots_org").on(table.organizationId),
    riskIdx: index("idx_forecast_snapshots_risk").on(table.riskBand),
    createdIdx: index("idx_forecast_snapshots_created").on(table.createdAt),
  }),
);

export const executiveKpiSnapshots = pgTable(
  "executive_kpi_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    metricKey: varchar("metric_key", { length: 120 }).notNull(),
    metricLabel: varchar("metric_label", { length: 255 }).notNull(),
    metricValue: numeric("metric_value", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    metricText: text("metric_text"),
    periodLabel: varchar("period_label", { length: 80 }),
    observedAt: timestamp("observed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_executive_kpi_snapshots_org").on(table.organizationId),
    keyIdx: index("idx_executive_kpi_snapshots_key").on(table.metricKey),
    observedIdx: index("idx_executive_kpi_snapshots_observed").on(table.observedAt),
  }),
);

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 120 }).notNull().default("Services"),
    slaTier: varchar("sla_tier", { length: 80 }).notNull().default("Standard"),
    risk: varchar("risk", { length: 40 }).notNull().default("low"),
    onTimeRate: integer("on_time_rate").notNull().default(95),
    status: varchar("status", { length: 40 }).notNull().default("active"),
    contactEmail: varchar("contact_email", { length: 255 }),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_vendors_org").on(table.organizationId),
    nameIdx: index("idx_vendors_name").on(table.name),
    statusIdx: index("idx_vendors_status").on(table.status),
    riskIdx: index("idx_vendors_risk").on(table.risk),
  }),
);

export const purchaseRequests = pgTable(
  "purchase_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    department: varchar("department", { length: 120 }).notNull().default("Operations"),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull().default("0"),
    currency: varchar("currency", { length: 12 }).notNull().default("USD"),
    vendorId: uuid("vendor_id").references(() => vendors.id, {
      onDelete: "set null",
    }),
    status: varchar("status", { length: 40 }).notNull().default("pending"),
    requestedBy: text("requested_by").references(() => users.id, {
      onDelete: "set null",
    }),
    approvedBy: text("approved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_purchase_requests_org").on(table.organizationId),
    statusIdx: index("idx_purchase_requests_status").on(table.status),
    vendorIdx: index("idx_purchase_requests_vendor").on(table.vendorId),
    departmentIdx: index("idx_purchase_requests_department").on(table.department),
  }),
);

export const contractsRegister = pgTable(
  "contracts_register",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    counterparty: varchar("counterparty", { length: 255 }).notNull(),
    ownerTeam: varchar("owner_team", { length: 120 }).notNull().default("Legal"),
    status: varchar("status", { length: 40 }).notNull().default("draft"),
    renewalDate: timestamp("renewal_date", { withTimezone: true }),
    complianceNotes: text("compliance_notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_contracts_register_org").on(table.organizationId),
    statusIdx: index("idx_contracts_register_status").on(table.status),
    ownerIdx: index("idx_contracts_register_owner").on(table.ownerTeam),
    renewalIdx: index("idx_contracts_register_renewal").on(table.renewalDate),
  }),
);

export const complianceControls = pgTable(
  "compliance_controls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    framework: varchar("framework", { length: 80 }).notNull().default("SOC2"),
    control: text("control").notNull(),
    owner: varchar("owner", { length: 120 }).notNull().default("Security"),
    status: varchar("status", { length: 40 }).notNull().default("planned"),
    evidenceDue: timestamp("evidence_due", { withTimezone: true }),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_compliance_controls_org").on(table.organizationId),
    frameworkIdx: index("idx_compliance_controls_framework").on(table.framework),
    statusIdx: index("idx_compliance_controls_status").on(table.status),
  }),
);

export const complianceRisks = pgTable(
  "compliance_risks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    severity: varchar("severity", { length: 20 }).notNull().default("medium"),
    owner: varchar("owner", { length: 120 }).notNull().default("Security"),
    mitigation: text("mitigation"),
    status: varchar("status", { length: 40 }).notNull().default("open"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_compliance_risks_org").on(table.organizationId),
    severityIdx: index("idx_compliance_risks_severity").on(table.severity),
    statusIdx: index("idx_compliance_risks_status").on(table.status),
  }),
);

export const retentionPolicies = pgTable(
  "retention_policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dataClass: varchar("data_class", { length: 160 }).notNull(),
    retentionPeriod: varchar("retention_period", { length: 120 }).notNull(),
    backupFrequency: varchar("backup_frequency", { length: 80 }).notNull().default("Daily"),
    archivePolicy: text("archive_policy"),
    status: varchar("status", { length: 40 }).notNull().default("active"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_retention_policies_org").on(table.organizationId),
    statusIdx: index("idx_retention_policies_status").on(table.status),
    classIdx: index("idx_retention_policies_class").on(table.dataClass),
  }),
);

export const drDrills = pgTable(
  "dr_drills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    scenario: text("scenario").notNull(),
    rto: varchar("rto", { length: 40 }).notNull(),
    rpo: varchar("rpo", { length: 40 }).notNull(),
    drillDate: timestamp("drill_date", { withTimezone: true }),
    status: varchar("status", { length: 40 }).notNull().default("planned"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_dr_drills_org").on(table.organizationId),
    statusIdx: index("idx_dr_drills_status").on(table.status),
    dateIdx: index("idx_dr_drills_date").on(table.drillDate),
  }),
);

export const financeTransactions = pgTable(
  "finance_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    transactionDate: timestamp("transaction_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    type: varchar("type", { length: 60 }).notNull().default("expense"),
    category: varchar("category", { length: 120 }).notNull().default("general"),
    reference: varchar("reference", { length: 120 }),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull().default("0"),
    currency: varchar("currency", { length: 12 }).notNull().default("USD"),
    status: varchar("status", { length: 40 }).notNull().default("posted"),
    counterparty: varchar("counterparty", { length: 255 }),
    description: text("description"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_finance_transactions_org").on(table.organizationId),
    typeIdx: index("idx_finance_transactions_type").on(table.type),
    statusIdx: index("idx_finance_transactions_status").on(table.status),
    dateIdx: index("idx_finance_transactions_date").on(table.transactionDate),
  }),
);

export const payrollRuns = pgTable(
  "payroll_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    periodLabel: varchar("period_label", { length: 80 }).notNull(),
    payDate: timestamp("pay_date", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 40 }).notNull().default("draft"),
    totalGross: numeric("total_gross", { precision: 15, scale: 2 }).notNull().default("0"),
    totalDeductions: numeric("total_deductions", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    totalNet: numeric("total_net", { precision: 15, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_payroll_runs_org").on(table.organizationId),
    statusIdx: index("idx_payroll_runs_status").on(table.status),
    payDateIdx: index("idx_payroll_runs_pay_date").on(table.payDate),
  }),
);

export const payrollEntries = pgTable(
  "payroll_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    payrollRunId: uuid("payroll_run_id")
      .notNull()
      .references(() => payrollRuns.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    grossPay: numeric("gross_pay", { precision: 15, scale: 2 }).notNull().default("0"),
    deductions: numeric("deductions", { precision: 15, scale: 2 }).notNull().default("0"),
    netPay: numeric("net_pay", { precision: 15, scale: 2 }).notNull().default("0"),
    status: varchar("status", { length: 40 }).notNull().default("draft"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    runIdx: index("idx_payroll_entries_run").on(table.payrollRunId),
    employeeIdx: index("idx_payroll_entries_employee").on(table.employeeId),
    statusIdx: index("idx_payroll_entries_status").on(table.status),
  }),
);

export const ticketComments = pgTable(
  "ticket_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    message: text("message").notNull(),
    isInternal: integer("is_internal").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_ticket_comments_org").on(table.organizationId),
    ticketIdx: index("idx_ticket_comments_ticket").on(table.ticketId),
    createdIdx: index("idx_ticket_comments_created").on(table.createdAt),
  }),
);

export const knowledgeArticles = pgTable(
  "knowledge_articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    category: varchar("category", { length: 120 }).notNull().default("General"),
    content: text("content").notNull(),
    status: varchar("status", { length: 40 }).notNull().default("draft"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => users.id, {
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
    orgIdx: index("idx_knowledge_articles_org").on(table.organizationId),
    statusIdx: index("idx_knowledge_articles_status").on(table.status),
    categoryIdx: index("idx_knowledge_articles_category").on(table.category),
  }),
);

export const recruitmentRequisitions = pgTable(
  "recruitment_requisitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    department: varchar("department", { length: 120 })
      .notNull()
      .default("General"),
    employmentType: varchar("employment_type", { length: 60 })
      .notNull()
      .default("full_time"),
    openings: integer("openings").notNull().default(1),
    status: varchar("status", { length: 40 }).notNull().default("open"),
    hiringManager: varchar("hiring_manager", { length: 255 }),
    budget: numeric("budget", { precision: 12, scale: 2 }),
    targetHireDate: timestamp("target_hire_date", { withTimezone: true }),
    description: text("description"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_recruitment_requisitions_org").on(table.organizationId),
    statusIdx: index("idx_recruitment_requisitions_status").on(table.status),
    deptIdx: index("idx_recruitment_requisitions_department").on(table.department),
  }),
);

export const recruitmentCandidates = pgTable(
  "recruitment_candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    requisitionId: uuid("requisition_id").references(() => recruitmentRequisitions.id, {
      onDelete: "set null",
    }),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }),
    stage: varchar("stage", { length: 40 }).notNull().default("sourced"),
    score: integer("score").notNull().default(0),
    source: varchar("source", { length: 80 }).notNull().default("application"),
    resumeUrl: text("resume_url"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_recruitment_candidates_org").on(table.organizationId),
    requisitionIdx: index("idx_recruitment_candidates_requisition").on(table.requisitionId),
    stageIdx: index("idx_recruitment_candidates_stage").on(table.stage),
  }),
);

export const trainingPrograms = pgTable(
  "training_programs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    category: varchar("category", { length: 120 }).notNull().default("General"),
    provider: varchar("provider", { length: 255 }),
    durationHours: integer("duration_hours").notNull().default(1),
    status: varchar("status", { length: 40 }).notNull().default("active"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    description: text("description"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIdx: index("idx_training_programs_org").on(table.organizationId),
    statusIdx: index("idx_training_programs_status").on(table.status),
    categoryIdx: index("idx_training_programs_category").on(table.category),
  }),
);

export const employeeTrainingRecords = pgTable(
  "employee_training_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    programId: uuid("program_id")
      .notNull()
      .references(() => trainingPrograms.id, { onDelete: "cascade" }),
    completionStatus: varchar("completion_status", { length: 40 })
      .notNull()
      .default("assigned"),
    progress: integer("progress").notNull().default(0),
    score: integer("score"),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdx: index("idx_employee_training_records_org").on(table.organizationId),
    employeeIdx: index("idx_employee_training_records_employee").on(table.employeeId),
    programIdx: index("idx_employee_training_records_program").on(table.programId),
    statusIdx: index("idx_employee_training_records_status").on(table.completionStatus),
  }),
);

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  owner: one(users, {
    fields: [customers.ownerId],
    references: [users.id],
  }),
  projects: many(projects),
  tickets: many(tickets),
  invoices: many(invoices),
  assets: many(digitalAssets),
  documents: many(documents),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [projects.customerId],
    references: [customers.id],
  }),
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  tasks: many(projectTasks),
  tickets: many(tickets),
  assets: many(digitalAssets),
  documents: many(documents),
  invoices: many(invoices),
}));

export const projectTasksRelations = relations(projectTasks, ({ one }) => ({
  project: one(projects, {
    fields: [projectTasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [projectTasks.assigneeId],
    references: [users.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tickets.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [tickets.customerId],
    references: [customers.id],
  }),
  contact: one(contacts, {
    fields: [tickets.contactId],
    references: [contacts.id],
  }),
  project: one(projects, {
    fields: [tickets.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tickets.assignedToId],
    references: [users.id],
  }),
  queueTokens: many(queueTokens),
  assets: many(digitalAssets),
  documents: many(documents),
}));

export const queueTokensRelations = relations(queueTokens, ({ one }) => ({
  organization: one(organizations, {
    fields: [queueTokens.organizationId],
    references: [organizations.id],
  }),
  ticket: one(tickets, {
    fields: [queueTokens.ticketId],
    references: [tickets.id],
  }),
}));

export const digitalAssetsRelations = relations(digitalAssets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [digitalAssets.organizationId],
    references: [organizations.id],
  }),
  folder: one(assetFolders, {
    fields: [digitalAssets.folderId],
    references: [assetFolders.id],
  }),
  customer: one(customers, {
    fields: [digitalAssets.customerId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [digitalAssets.projectId],
    references: [projects.id],
  }),
  ticket: one(tickets, {
    fields: [digitalAssets.ticketId],
    references: [tickets.id],
  }),
  file: one(files, {
    fields: [digitalAssets.fileId],
    references: [files.id],
  }),
  tags: many(digitalAssetTags),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [documents.customerId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  ticket: one(tickets, {
    fields: [documents.ticketId],
    references: [tickets.id],
  }),
  author: one(users, {
    fields: [documents.createdBy],
    references: [users.id],
  }),
  versions: many(documentVersions),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id],
  }),
  author: one(users, {
    fields: [documentVersions.createdBy],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  author: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [campaigns.organizationId],
    references: [organizations.id],
  }),
  owner: one(users, {
    fields: [campaigns.ownerId],
    references: [users.id],
  }),
  contacts: many(campaignContacts),
}));

export const campaignContactsRelations = relations(campaignContacts, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignContacts.campaignId],
    references: [campaigns.id],
  }),
  contact: one(contacts, {
    fields: [campaignContacts.contactId],
    references: [contacts.id],
  }),
}));
