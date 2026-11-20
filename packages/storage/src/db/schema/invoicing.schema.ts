import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { organizations } from "./auth.schema.js";

// ── Enums ────────────────────────────────────────────────────────────────────

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "paid",
  "overdue",
  "cancelled",
]);

export const invoiceQuoteStatusEnum = pgEnum("invoice_quote_status", [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
]);

export const invoicePaymentMethodEnum = pgEnum("invoice_payment_method", [
  "cash",
  "card",
  "bank_transfer",
  "check",
  "crypto",
]);

export const invoiceExpenseStatusEnum = pgEnum("invoice_expense_status", [
  "pending",
  "approved",
  "rejected",
]);

export const invoiceRecurringFrequencyEnum = pgEnum("invoice_recurring_frequency", [
  "weekly",
  "monthly",
  "quarterly",
  "annually",
]);

export const invoiceAccountTypeEnum = pgEnum("invoice_account_type", [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
]);

// ── Tables ───────────────────────────────────────────────────────────────────

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceNumber: text("invoice_number"),
    clientName: text("client_name"),
    clientEmail: text("client_email"),
    clientAddress: jsonb("client_address").$type<Record<string, unknown>>(),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    issueDate: date("issue_date"),
    dueDate: date("due_date"),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }),
    taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }),
    discount: numeric("discount", { precision: 15, scale: 2 }),
    total: numeric("total", { precision: 15, scale: 2 }),
    notes: text("notes"),
    terms: text("terms"),
    currency: text("currency").notNull().default("USD"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidAmount: numeric("paid_amount", { precision: 15, scale: 2 }),
    items: jsonb("items").$type<Record<string, unknown>[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index("idx_invoices_org").on(t.organizationId),
    statusIdx: index("idx_invoices_status").on(t.status),
    clientEmailIdx: index("idx_invoices_client_email").on(t.clientEmail),
    orgStatusIdx: index("idx_invoices_org_status").on(t.organizationId, t.status),
    dueDateIdx: index("idx_invoices_due_date").on(t.dueDate),
    deletedAtIdx: index("idx_invoices_deleted_at").on(t.deletedAt),
  }),
);

export const invoiceQuotes = pgTable(
  "invoice_quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    quoteNumber: text("quote_number"),
    clientName: text("client_name"),
    clientEmail: text("client_email"),
    status: invoiceQuoteStatusEnum("status").notNull().default("draft"),
    issueDate: date("issue_date"),
    expiryDate: date("expiry_date"),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }),
    taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }),
    total: numeric("total", { precision: 15, scale: 2 }),
    items: jsonb("items").$type<Record<string, unknown>[]>(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_invoice_quotes_org").on(t.organizationId),
    statusIdx: index("idx_invoice_quotes_status").on(t.status),
    clientEmailIdx: index("idx_invoice_quotes_client_email").on(t.clientEmail),
  }),
);

export const invoicePayments = pgTable(
  "invoice_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    method: invoicePaymentMethodEnum("method").notNull(),
    reference: text("reference"),
    notes: text("notes"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_invoice_payments_org").on(t.organizationId),
    invoiceIdx: index("idx_invoice_payments_invoice").on(t.invoiceId),
    methodIdx: index("idx_invoice_payments_method").on(t.method),
  }),
);

export const invoiceExpenses = pgTable(
  "invoice_expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    category: text("category"),
    description: text("description"),
    amount: numeric("amount", { precision: 15, scale: 2 }),
    currency: text("currency").notNull().default("USD"),
    vendorId: uuid("vendor_id"),
    vendor: text("vendor"),
    receiptUrl: text("receipt_url"),
    status: invoiceExpenseStatusEnum("status").notNull().default("pending"),
    date: date("date"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_invoice_expenses_org").on(t.organizationId),
    statusIdx: index("idx_invoice_expenses_status").on(t.status),
    categoryIdx: index("idx_invoice_expenses_category").on(t.category),
    dateIdx: index("idx_invoice_expenses_date").on(t.date),
  }),
);

export const invoiceVendors = pgTable(
  "invoice_vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: jsonb("address").$type<Record<string, unknown>>(),
    paymentTerms: text("payment_terms"),
    taxId: text("tax_id"),
    bankDetails: jsonb("bank_details").$type<Record<string, unknown>>(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index("idx_invoice_vendors_org").on(t.organizationId),
    emailIdx: index("idx_invoice_vendors_email").on(t.email),
    deletedAtIdx: index("idx_invoice_vendors_deleted_at").on(t.deletedAt),
  }),
);

export const invoiceRecurring = pgTable(
  "invoice_recurring",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    clientName: text("client_name"),
    clientEmail: text("client_email"),
    frequency: invoiceRecurringFrequencyEnum("frequency").notNull(),
    nextIssueDate: date("next_issue_date"),
    items: jsonb("items").$type<Record<string, unknown>[]>(),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }),
    total: numeric("total", { precision: 15, scale: 2 }),
    isActive: boolean("is_active").notNull().default(true),
    lastIssuedAt: timestamp("last_issued_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_invoice_recurring_org").on(t.organizationId),
    isActiveIdx: index("idx_invoice_recurring_is_active").on(t.isActive),
    nextIssueDateIdx: index("idx_invoice_recurring_next_issue_date").on(t.nextIssueDate),
  }),
);

export const invoiceTaxRates = pgTable(
  "invoice_tax_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    rate: numeric("rate", { precision: 8, scale: 4 }).notNull(),
    description: text("description"),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_invoice_tax_rates_org").on(t.organizationId),
    isActiveIdx: index("idx_invoice_tax_rates_is_active").on(t.isActive),
  }),
);

export const invoiceAccounts = pgTable(
  "invoice_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: invoiceAccountTypeEnum("type").notNull(),
    code: text("code"),
    description: text("description"),
    balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_invoice_accounts_org").on(t.organizationId),
    typeIdx: index("idx_invoice_accounts_type").on(t.type),
    codeIdx: index("idx_invoice_accounts_code").on(t.code),
    isActiveIdx: index("idx_invoice_accounts_is_active").on(t.isActive),
  }),
);

// ── Relations ────────────────────────────────────────────────────────────────

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  payments: many(invoicePayments),
}));

export const invoiceQuotesRelations = relations(invoiceQuotes, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoiceQuotes.organizationId],
    references: [organizations.id],
  }),
}));

export const invoicePaymentsRelations = relations(invoicePayments, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoicePayments.organizationId],
    references: [organizations.id],
  }),
  invoice: one(invoices, {
    fields: [invoicePayments.invoiceId],
    references: [invoices.id],
  }),
}));

export const invoiceExpensesRelations = relations(invoiceExpenses, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoiceExpenses.organizationId],
    references: [organizations.id],
  }),
}));

export const invoiceVendorsRelations = relations(invoiceVendors, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoiceVendors.organizationId],
    references: [organizations.id],
  }),
}));

export const invoiceRecurringRelations = relations(invoiceRecurring, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoiceRecurring.organizationId],
    references: [organizations.id],
  }),
}));

export const invoiceTaxRatesRelations = relations(invoiceTaxRates, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoiceTaxRates.organizationId],
    references: [organizations.id],
  }),
}));

export const invoiceAccountsRelations = relations(invoiceAccounts, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoiceAccounts.organizationId],
    references: [organizations.id],
  }),
}));

// ── Type exports ─────────────────────────────────────────────────────────────

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceQuote = typeof invoiceQuotes.$inferSelect;
export type NewInvoiceQuote = typeof invoiceQuotes.$inferInsert;
export type InvoicePayment = typeof invoicePayments.$inferSelect;
export type NewInvoicePayment = typeof invoicePayments.$inferInsert;
export type InvoiceExpense = typeof invoiceExpenses.$inferSelect;
export type NewInvoiceExpense = typeof invoiceExpenses.$inferInsert;
export type InvoiceVendor = typeof invoiceVendors.$inferSelect;
export type NewInvoiceVendor = typeof invoiceVendors.$inferInsert;
export type InvoiceRecurring = typeof invoiceRecurring.$inferSelect;
export type NewInvoiceRecurring = typeof invoiceRecurring.$inferInsert;
export type InvoiceTaxRate = typeof invoiceTaxRates.$inferSelect;
export type NewInvoiceTaxRate = typeof invoiceTaxRates.$inferInsert;
export type InvoiceAccount = typeof invoiceAccounts.$inferSelect;
export type NewInvoiceAccount = typeof invoiceAccounts.$inferInsert;
