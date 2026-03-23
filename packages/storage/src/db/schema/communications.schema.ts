/**
 * Communications Schema
 *
 * Voice calls, call recordings, IVR flows, video rooms, and routing rules.
 */

import { relations } from "drizzle-orm";
import {
  boolean,
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
import { organizations } from "./auth.schema.js";

// ─── Voice Calls ──────────────────────────────────────────────────────────────

export const commVoiceCalls = pgTable(
  "comm_voice_calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    direction: varchar("direction", { length: 20 }).notNull().default("outbound"),
    from: varchar("from", { length: 50 }).notNull(),
    to: varchar("to", { length: 50 }).notNull(),
    contactName: varchar("contact_name", { length: 200 }),
    status: varchar("status", { length: 20 }).notNull().default("initiated"),
    // status: initiated | ringing | answered | completed | missed | failed
    durationSeconds: integer("duration_seconds"),
    recordingUrl: varchar("recording_url", { length: 500 }),
    transcription: text("transcription"),
    providerSid: varchar("provider_sid", { length: 100 }),
    cost: numeric("cost", { precision: 10, scale: 4 }),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index("idx_comm_voice_calls_org").on(t.organizationId),
    statusIdx: index("idx_comm_voice_calls_status").on(t.status),
  }),
);

// ─── Call Recordings ──────────────────────────────────────────────────────────

export const commCallRecordings = pgTable(
  "comm_call_recordings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    callId: uuid("call_id").references(() => commVoiceCalls.id, { onDelete: "set null" }),
    contactName: varchar("contact_name", { length: 200 }),
    phone: varchar("phone", { length: 50 }),
    durationSeconds: integer("duration_seconds"),
    fileSizeBytes: integer("file_size_bytes"),
    storageUrl: varchar("storage_url", { length: 500 }),
    transcription: text("transcription"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index("idx_comm_recordings_org").on(t.organizationId),
    callIdx: index("idx_comm_recordings_call").on(t.callId),
  }),
);

// ─── IVR Flows ────────────────────────────────────────────────────────────────

export const commIvrFlows = pgTable(
  "comm_ivr_flows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    // status: draft | active | inactive
    nodes: jsonb("nodes")
      .$type<
        Array<{
          id: string;
          type: "greeting" | "menu" | "action" | "transfer" | "voicemail";
          label: string;
          config: Record<string, unknown>;
          children?: string[];
        }>
      >()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index("idx_comm_ivr_flows_org").on(t.organizationId),
  }),
);

// ─── Video Rooms ──────────────────────────────────────────────────────────────

export const commVideoRooms = pgTable(
  "comm_video_rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    maxParticipants: integer("max_participants").notNull().default(10),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    // status: active | scheduled | ended
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    participants: jsonb("participants")
      .$type<
        Array<{
          identity: string;
          name: string;
          joinedAt: string;
          leftAt?: string;
        }>
      >()
      .default([]),
    recordingUrl: varchar("recording_url", { length: 500 }),
    providerRoomSid: varchar("provider_room_sid", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_comm_video_rooms_org").on(t.organizationId),
    statusIdx: index("idx_comm_video_rooms_status").on(t.status),
  }),
);

// ─── Routing Rules ────────────────────────────────────────────────────────────

export const commRoutingRules = pgTable(
  "comm_routing_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    priority: integer("priority").notNull().default(1),
    conditions: jsonb("conditions").$type<string[]>().default([]),
    destination: varchar("destination", { length: 200 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    // status: active | paused
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index("idx_comm_routing_rules_org").on(t.organizationId),
    priorityIdx: index("idx_comm_routing_rules_priority").on(t.priority),
  }),
);

// ─── SMS Messages ─────────────────────────────────────────────────────────────

export const commSmsMessages = pgTable(
  "comm_sms_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    from: varchar("from", { length: 50 }).notNull(),
    to: varchar("to", { length: 50 }).notNull(),
    body: text("body").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("queued"),
    // status: queued | sent | delivered | failed
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    providerSid: varchar("provider_sid", { length: 100 }),
    cost: numeric("cost", { precision: 10, scale: 4 }),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_comm_sms_messages_org").on(t.organizationId),
    statusIdx: index("idx_comm_sms_messages_status").on(t.status),
  }),
);

// ─── Conversations ────────────────────────────────────────────────────────────

export const commConversations = pgTable(
  "comm_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    channel: varchar("channel", { length: 30 }).notNull().default("sms"),
    // channel: sms | chat | email | whatsapp
    participantPhone: varchar("participant_phone", { length: 50 }),
    participantEmail: varchar("participant_email", { length: 200 }),
    participantName: varchar("participant_name", { length: 200 }),
    status: varchar("status", { length: 20 }).notNull().default("open"),
    // status: open | closed | pending
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index("idx_comm_conversations_org").on(t.organizationId),
    statusIdx: index("idx_comm_conversations_status").on(t.status),
  }),
);

// ─── Conversation Messages ────────────────────────────────────────────────────

export const commConversationMessages = pgTable(
  "comm_conversation_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => commConversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull().default("outbound"),
    // role: inbound | outbound | system
    content: text("content").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("sent"),
    // status: sent | delivered | read | failed
    providerSid: varchar("provider_sid", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_comm_conv_messages_org").on(t.organizationId),
    convIdx: index("idx_comm_conv_messages_conv").on(t.conversationId),
  }),
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const commVoiceCallsRelations = relations(commVoiceCalls, ({ one }) => ({
  organization: one(organizations, {
    fields: [commVoiceCalls.organizationId],
    references: [organizations.id],
  }),
}));

export const commCallRecordingsRelations = relations(commCallRecordings, ({ one }) => ({
  organization: one(organizations, {
    fields: [commCallRecordings.organizationId],
    references: [organizations.id],
  }),
  call: one(commVoiceCalls, {
    fields: [commCallRecordings.callId],
    references: [commVoiceCalls.id],
  }),
}));

export const commIvrFlowsRelations = relations(commIvrFlows, ({ one }) => ({
  organization: one(organizations, {
    fields: [commIvrFlows.organizationId],
    references: [organizations.id],
  }),
}));

export const commVideoRoomsRelations = relations(commVideoRooms, ({ one }) => ({
  organization: one(organizations, {
    fields: [commVideoRooms.organizationId],
    references: [organizations.id],
  }),
}));

export const commRoutingRulesRelations = relations(commRoutingRules, ({ one }) => ({
  organization: one(organizations, {
    fields: [commRoutingRules.organizationId],
    references: [organizations.id],
  }),
}));

export const commSmsMessagesRelations = relations(commSmsMessages, ({ one }) => ({
  organization: one(organizations, {
    fields: [commSmsMessages.organizationId],
    references: [organizations.id],
  }),
}));

export const commConversationsRelations = relations(commConversations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [commConversations.organizationId],
    references: [organizations.id],
  }),
  messages: many(commConversationMessages),
}));

export const commConversationMessagesRelations = relations(commConversationMessages, ({ one }) => ({
  organization: one(organizations, {
    fields: [commConversationMessages.organizationId],
    references: [organizations.id],
  }),
  conversation: one(commConversations, {
    fields: [commConversationMessages.conversationId],
    references: [commConversations.id],
  }),
}));
