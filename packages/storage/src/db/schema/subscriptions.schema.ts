/**
 * Subscriptions Schema
 *
 * Tracks organization subscriptions, plans, billing, and payments.
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

// Plan Types
export const PlanType = [
  "starter",
  "growth",
  "business",
  "enterprise",
] as const;
export type PlanType = (typeof PlanType)[number];

// Subscription Status
export const SubscriptionStatus = [
  "active",
  "past_due",
  "canceled",
  "trialing",
  "paused",
] as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[number];

// Billing Cycle
export const BillingCycle = ["monthly", "annual"] as const;
export type BillingCycle = (typeof BillingCycle)[number];

// Plans Definition
export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 50 }).notNull().unique(), // starter, growth, business, enterprise
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  basePriceMonthly: numeric("base_price_monthly", { precision: 10, scale: 2 }).notNull().default("0"),
  basePriceAnnual: numeric("base_price_annual", { precision: 10, scale: 2 }).notNull().default("0"),
  pricePerUserMonthly: numeric("price_per_user_monthly", { precision: 10, scale: 2 }).notNull().default("0"),
  pricePerUserAnnual: numeric("price_per_user_annual", { precision: 10, scale: 2 }).notNull().default("0"),
  maxUsers: integer("max_users").notNull().default(5),
  maxStorage: integer("max_storage").notNull().default(10), // GB
  maxApiCalls: integer("max_api_calls").notNull().default(10000), // per month
  features: jsonb("features").$type<string[]>().notNull().default([]),
  moduleAccess: jsonb("module_access").$type<string[]>().notNull().default([]), // which modules are included
  isPublic: boolean("is_public").notNull().default(true),
  stripePriceIdMonthly: varchar("stripe_price_id_monthly", { length: 100 }),
  stripePriceIdAnnual: varchar("stripe_price_id_annual", { length: 100 }),
  trialDays: integer("trial_days").notNull().default(14),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Organization Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" })
    .unique(),

  planId: uuid("plan_id").notNull().references(() => plans.id),

  status: varchar("status", { length: 20 }).notNull().default("trialing"),

  // Stripe References
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }).unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),

  // Billing
  billingCycle: varchar("billing_cycle", { length: 20 }).notNull().default("monthly"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),

  // Usage
  userCount: integer("user_count").notNull().default(1),
  storageUsed: integer("storage_used").notNull().default(0), // MB

  // Module Overrides (add-ons beyond plan)
  enabledModules: jsonb("enabled_modules").$type<string[]>().notNull().default([]),

  // Metadata
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  pauseReason: text("pause_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Module Pricing (for add-ons and module-specific billing)
export const modulePricing = pgTable("module_pricing", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleKey: varchar("module_key", { length: 50 }).notNull(),
  planKey: varchar("plan_key", { length: 50 }).references(() => plans.key),

  // Pricing
  monthlyPrice: numeric("monthly_price", { precision: 10, scale: 2 }).notNull().default("0"),
  annualPrice: numeric("annual_price", { precision: 10, scale: 2 }).notNull().default("0"),
  pricePerUser: numeric("price_per_user", { precision: 10, scale: 2 }).notNull().default("0"),

  // Usage limits for this module
  includedUnits: integer("included_units").notNull().default(0),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 4 }),

  isAddon: boolean("is_addon").notNull().default(false),
  isEnabled: boolean("is_enabled").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),

  // Line Items
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),

  // Status
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, sent, paid, overdue, void

  // Billing Period
  periodStart: timestamp("period_start", { withTimezone: true }),
  periodEnd: timestamp("period_end", { withTimezone: true }),

  // Payment
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 100 }).unique(),

  // Due
  dueDate: timestamp("due_date", { withTimezone: true }),

  // Line items stored as JSON
  lineItems: jsonb("line_items").$type<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    moduleKey?: string;
  }[]>().notNull().default([]),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Payments
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").references(() => invoices.id),

  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, failed, refunded

  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }).unique(),
  stripeChargeId: varchar("stripe_charge_id", { length: 100 }),

  paymentMethod: varchar("payment_method", { length: 50 }),

  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Usage Tracking (for metered billing)
export const usageRecords = pgTable("usage_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  moduleKey: varchar("module_key", { length: 50 }).notNull(),

  // Usage metrics
  apiCalls: integer("api_calls").notNull().default(0),
  storageMb: integer("storage_mb").notNull().default(0),
  users: integer("users").notNull().default(0),

  // Period
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Billing Alerts
export const billingAlerts = pgTable("billing_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  type: varchar("type", { length: 30 }).notNull(), // approaching_limit, over_limit, payment_due, payment_failed
  threshold: varchar("threshold", { length: 20 }), // e.g., "80%", "100%"

  message: text("message").notNull(),
  isSent: boolean("is_sent").notNull().default(false),
  sentAt: timestamp("sent_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  organization: one(organizations, {
    fields: [payments.organizationId],
    references: [organizations.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));
