/**
 * Communications Schema (Samva API)
 *
 * SMS, Voice, Video, Chat, Phone Numbers, and Templates.
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

// Message Direction
export const MessageDirection = ["inbound", "outbound"] as const;
export type MessageDirection = (typeof MessageDirection)[number];

// SMS Status
export const SmsStatus = ["queued", "sent", "delivered", "failed"] as const;
export type SmsStatus = (typeof SmsStatus)[number];

// Call Status
export const CallStatus = ["initiated", "ringing", "answered", "completed", "missed", "failed"] as const;
export type CallStatus = (typeof CallStatus)[number];

// SMS Messages
export const smsMessages = pgTable("comm_sms_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  direction: varchar("direction", { length: 20 }).notNull(),
  from: varchar("from", { length: 50 }).notNull(),
  to: varchar("to", { length: 50 }).notNull(),
  body: text("body").notNull(),

  status: varchar("status", { length: 20 }).notNull().default("queued"),
  twilioSid: varchar("twilio_sid", { length: 100 }),

  cost: numeric("cost", { precision: 10, scale: 4 }),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),

  metadata: jsonb("metadata").$type<Record<string, string>>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Voice Calls
export const voiceCalls = pgTable("comm_voice_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  direction: varchar("direction", { length: 20 }).notNull(),
  from: varchar("from", { length: 50 }).notNull(),
  to: varchar("to", { length: 50 }).notNull(),

  status: varchar("status", { length: 20 }).notNull().default("initiated"),
  duration: integer("duration"), // seconds

  recordingUrl: varchar("recording_url", { length: 500 }),
  transcription: text("transcription"),

  twilioSid: varchar("twilio_sid", { length: 100 }),

  cost: numeric("cost", { precision: 10, scale: 4 }),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),

  ivrFlow: jsonb("ivr_flow").$type<{
    steps: Array<{
      action: string;
      destination?: string;
      prompt?: string;
    }>;
  }>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Video Sessions
export const videoSessions = pgTable("comm_video_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  roomName: varchar("room_name", { length: 100 }).notNull(),
  roomSid: varchar("room_sid", { length: 100 }),

  participants: jsonb("participants").$type<Array<{
    identity: string;
    name: string;
    joinedAt: string;
    leftAt?: string;
  }>>().default([]),

  duration: integer("duration"), // seconds
  recordingUrl: varchar("recording_url", { length: 500 }),

  status: varchar("status", { length: 20 }).notNull().default("active"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

// Chat Conversations
export const chatConversations = pgTable("comm_chat_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  type: varchar("type", { length: 20 }).notNull().default("direct"), // direct, group, channel

  participants: jsonb("participants").$type<Array<{
    id: string;
    name: string;
    role?: string;
  }>>().default([]),

  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  lastMessage: text("last_message"),
  lastMessageBy: text("last_message_by"),

  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").$type<Record<string, string>>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Chat Messages
export const chatMessages = pgTable("comm_chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => chatConversations.id, { onDelete: "cascade" }),

  senderId: text("sender_id").notNull(),
  senderName: varchar("sender_name", { length: 100 }),

  content: text("content").notNull(),

  attachments: jsonb("attachments").$type<Array<{
    type: string;
    url: string;
    name: string;
    size: number;
  }>>().default([]),

  readAt: timestamp("read_at", { withTimezone: true }),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Phone Numbers
export const phoneNumbers = pgTable("comm_phone_numbers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  number: varchar("number", { length: 50 }).notNull().unique(),
  formattedNumber: varchar("formatted_number", { length: 50 }),

  type: varchar("type", { length: 20 }).notNull().default("local"), // local, toll_free, short_code

  provider: varchar("provider", { length: 50 }).notNull().default("twilio"),
  providerSid: varchar("provider_sid", { length: 100 }),

  status: varchar("status", { length: 20 }).notNull().default("active"),

  capabilities: jsonb("capabilities").$type<string[]>().default(["sms", "voice"]),

  monthlyCost: numeric("monthly_cost", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),

  assignedTo: text("assigned_to"),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Communication Templates
export const communicationTemplates = pgTable("comm_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // sms, voice, email, chat

  content: text("content").notNull(),
  variables: jsonb("variables").$type<string[]>().default([]),

  category: varchar("category", { length: 50 }),
  tags: jsonb("tags").$type<string[]>().default([]),

  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),

  usageCount: integer("usage_count").notNull().default(0),

  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const smsMessagesRelations = relations(smsMessages, ({ one }) => ({
  organization: one(organizations, {
    fields: [smsMessages.organizationId],
    references: [organizations.id],
  }),
}));

export const voiceCallsRelations = relations(voiceCalls, ({ one }) => ({
  organization: one(organizations, {
    fields: [voiceCalls.organizationId],
    references: [organizations.id],
  }),
}));

export const videoSessionsRelations = relations(videoSessions, ({ one }) => ({
  organization: one(organizations, {
    fields: [videoSessions.organizationId],
    references: [organizations.id],
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [chatConversations.organizationId],
    references: [organizations.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  organization: one(organizations, {
    fields: [chatMessages.organizationId],
    references: [organizations.id],
  }),
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
}));

export const phoneNumbersRelations = relations(phoneNumbers, ({ one }) => ({
  organization: one(organizations, {
    fields: [phoneNumbers.organizationId],
    references: [organizations.id],
  }),
}));

export const communicationTemplatesRelations = relations(communicationTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [communicationTemplates.organizationId],
    references: [organizations.id],
  }),
}));
