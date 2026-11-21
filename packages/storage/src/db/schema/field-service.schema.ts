/**
 * Field Service Schema
 *
 * Technicians, service jobs, route plans, and job timeline.
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
import { organizations } from "./auth.schema.js";

// Job Priority
export const JobPriority = ["low", "medium", "high", "urgent"] as const;
export type JobPriority = (typeof JobPriority)[number];

// Job Status
export const JobStatus = [
  "scheduled",
  "in_progress",
  "completed",
  "canceled",
  "on_hold",
] as const;
export type JobStatus = (typeof JobStatus)[number];

// Technician Status
export const TechnicianStatus = ["available", "busy", "offline"] as const;
export type TechnicianStatus = (typeof TechnicianStatus)[number];

// Technicians
export const technicians = pgTable("field_service_technicians", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  userId: text("user_id").references(() => organizations.id),

  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),

  specialization: varchar("specialization", { length: 100 }),
  skills: jsonb("skills").$type<string[]>().default([]),

  status: varchar("status", { length: 20 })
    .notNull()
    .default("available"),
  currentLocation: jsonb("current_location").$type<{
    lat: number;
    lng: number;
    address?: string;
    updatedAt: string;
  }>(),

  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  jobsCompleted: integer("jobs_completed").notNull().default(0),

  maxJobsPerDay: integer("max_jobs_per_day").notNull().default(5),
  workingHours: jsonb("working_hours").$type<{
    start: string;
    end: string;
    days: string[];
  }>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Service Jobs
export const serviceJobs = pgTable("field_service_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  jobNumber: varchar("job_number", { length: 50 }).notNull(),

  customerId: text("customer_id"),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  customerAddress: text("customer_address"),

  technicianId: uuid("technician_id").references(() => technicians.id),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),

  scheduledStart: timestamp("scheduled_start", { withTimezone: true }),
  scheduledEnd: timestamp("scheduled_end", { withTimezone: true }),
  actualStart: timestamp("actual_start", { withTimezone: true }),
  actualEnd: timestamp("actual_end", { withTimezone: true }),

  location: jsonb("location").$type<{
    lat: number;
    lng: number;
    address: string;
  }>(),

  slaDeadline: timestamp("sla_deadline", { withTimezone: true }),
  slaBreached: boolean("sla_breached").notNull().default(false),

  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),

  estimatedDuration: integer("estimated_duration"), // minutes
  travelTime: integer("travel_time"), // minutes

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Route Plans
export const routePlans = pgTable("field_service_route_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  technicianId: uuid("technician_id")
    .notNull()
    .references(() => technicians.id),

  date: timestamp("date", { withTimezone: true }).notNull(),

  stops: jsonb("stops").$type<{
    jobId: string;
    sequence: number;
    estimatedArrival: string;
    estimatedDeparture: string;
    actualArrival?: string;
    actualDeparture?: string;
  }[]>().default([]),

  optimizedOrder: jsonb("optimized_order").$type<string[]>().default([]), // job IDs

  totalDistance: numeric("total_distance", { precision: 10, scale: 2 }), // km
  estimatedDuration: integer("estimated_duration"), // minutes
  actualDuration: integer("actual_duration"),

  status: varchar("status", { length: 20 }).notNull().default("planned"),
  optimizationScore: numeric("optimization_score", { precision: 5, scale: 2 }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Job Timeline
export const jobTimeline = pgTable("field_service_job_timeline", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  jobId: uuid("job_id")
    .notNull()
    .references(() => serviceJobs.id, { onDelete: "cascade" }),

  event: varchar("event", { length: 100 }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes"),
  createdBy: text("created_by"),
});

// Parts Used
export const partsUsed = pgTable("field_service_parts_used", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  jobId: uuid("job_id")
    .notNull()
    .references(() => serviceJobs.id, { onDelete: "cascade" }),

  partId: text("part_id"),
  partName: varchar("part_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Field Service Subscriptions
export const fieldServiceSubscriptions = pgTable("field_service_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  tier: varchar("tier", { length: 50 }).notNull().default("basic"),
  maxTechnicians: integer("max_technicians").notNull().default(5),
  maxJobsPerMonth: integer("max_jobs_per_month").notNull().default(100),

  priceMonthly: numeric("price_monthly", { precision: 10, scale: 2 }).notNull().default("0"),

  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const techniciansRelations = relations(technicians, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [technicians.organizationId],
    references: [organizations.id],
  }),
  jobs: many(serviceJobs),
  routePlans: many(routePlans),
}));

export const serviceJobsRelations = relations(serviceJobs, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [serviceJobs.organizationId],
    references: [organizations.id],
  }),
  technician: one(technicians, {
    fields: [serviceJobs.technicianId],
    references: [technicians.id],
  }),
  timeline: many(jobTimeline),
  partsUsed: many(partsUsed),
}));

export const routePlansRelations = relations(routePlans, ({ one }) => ({
  organization: one(organizations, {
    fields: [routePlans.organizationId],
    references: [organizations.id],
  }),
  technician: one(technicians, {
    fields: [routePlans.technicianId],
    references: [technicians.id],
  }),
}));

export const jobTimelineRelations = relations(jobTimeline, ({ one }) => ({
  organization: one(organizations, {
    fields: [jobTimeline.organizationId],
    references: [organizations.id],
  }),
  job: one(serviceJobs, {
    fields: [jobTimeline.jobId],
    references: [serviceJobs.id],
  }),
}));

export const partsUsedRelations = relations(partsUsed, ({ one }) => ({
  organization: one(organizations, {
    fields: [partsUsed.organizationId],
    references: [organizations.id],
  }),
  job: one(serviceJobs, {
    fields: [partsUsed.jobId],
    references: [serviceJobs.id],
  }),
}));
