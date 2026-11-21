import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { organizations, users } from "./nucleo-unified.schema.js";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // email, sms, push, in_app
  category: text("category").notNull(), // billing, support, workflow, agent, system
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data").default({}), // additional payload
  read: text("read").notNull().default("false"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  email: jsonb("email").default({ enabled: true }),
  sms: jsonb("sms").default({ enabled: false }),
  push: jsonb("push").default({ enabled: true }),
  inApp: jsonb("in_app").default({ enabled: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
