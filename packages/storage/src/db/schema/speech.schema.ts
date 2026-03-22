/**
 * Speech-to-Text Schema (Avaan API)
 *
 * Transcriptions, voice commands, meeting notes, and custom language models.
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

// Transcription Status
export const TranscriptionStatus = ["pending", "processing", "completed", "failed"] as const;
export type TranscriptionStatus = (typeof TranscriptionStatus)[number];

// Transcription Jobs
export const transcriptions = pgTable("speech_transcriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),

  // Source
  sourceType: varchar("source_type", { length: 20 }).notNull(), // audio_file, streaming, recording
  sourceUrl: varchar("source_url", { length: 500 }),
  audioDuration: integer("audio_duration"), // seconds

  // Results
  transcript: text("transcript"),
  rawResult: jsonb("raw_result").$type<Record<string, unknown>>(),

  // Speaker identification
  speakers: jsonb("speakers").$type<Array<{
    speakerId: string;
    name?: string;
    segments: Array<{
      start: number;
      end: number;
    }>;
  }>>().default([]),
  speakerCount: integer("speaker_count"),

  // Analysis
  sentiment: varchar("sentiment", { length: 20 }), // positive, negative, neutral
  language: varchar("language", { length: 10 }).default("en"),
  confidence: numeric("confidence", { precision: 5, scale: 4 }),

  // Timestamps
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),

  // Custom vocabulary
  customVocabulary: jsonb("custom_vocabulary").$type<string[]>().default([]),

  // Error handling
  errorMessage: text("error_message"),

  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Voice Speakers (custom speaker profiles)
export const voiceSpeakers = pgTable("speech_speakers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  language: varchar("language", { length: 10 }).default("en"),

  // Voice sample metadata
  sampleCount: integer("sample_count").notNull().default(0),
  isEnrolled: boolean("is_enrolled").notNull().default(false),

  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Voice Commands
export const voiceCommands = pgTable("speech_voice_commands", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),

  // Command pattern
  phrase: varchar("phrase", { length: 255 }).notNull(),
  alternatives: jsonb("alternatives").$type<string[]>().default([]),

  // Action
  action: jsonb("action").$type<{
    type: string;
    endpoint?: string;
    params?: Record<string, string>;
  }>(),

  isActive: boolean("is_active").notNull().default(true),

  usageCount: integer("usage_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failureCount: integer("failure_count").notNull().default(0),

  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Meeting Notes
export const meetingNotes = pgTable("speech_meeting_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  transcriptionId: uuid("transcription_id").references(() => transcriptions.id),

  // Participants
  participants: jsonb("participants").$type<Array<{
    name: string;
    email?: string;
    role?: string;
  }>>().default([]),

  // Content
  summary: text("summary"),
  actionItems: jsonb("action_items").$type<Array<{
    text: string;
    assignee?: string;
    dueDate?: string;
    completed: boolean;
  }>>().default([]),
  decisions: jsonb("decisions").$type<string[]>().default([]),
  topics: jsonb("topics").$type<string[]>().default([]),

  // Meeting metadata
  scheduledStart: timestamp("scheduled_start", { withTimezone: true }),
  scheduledEnd: timestamp("scheduled_end", { withTimezone: true }),
  actualStart: timestamp("actual_start", { withTimezone: true }),
  actualEnd: timestamp("actual_end", { withTimezone: true }),

  meetingUrl: varchar("meeting_url", { length: 500 }),
  recordingUrl: varchar("recording_url", { length: 500 }),

  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Custom Vocabulary
export const customVocabulary = pgTable("speech_vocabulary", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  term: varchar("term", { length: 255 }).notNull(),
  soundsLike: jsonb("sounds_like").$type<string[]>().default([]),
  displayAs: varchar("display_as", { length: 255 }),
  language: varchar("language", { length: 10 }).default("en"),
  weight: integer("weight").default(1), // boost weight for recognition

  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Custom Language Models
export const customLanguageModels = pgTable("speech_language_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),

  // Model configuration
  baseModel: varchar("base_model", { length: 50 }).notNull().default("whisper"),
  language: varchar("language", { length: 10 }).default("en"),

  // Custom vocabulary
  vocabulary: jsonb("vocabulary").$type<string[]>().default([]),
  phrases: jsonb("phrases").$type<Array<{
    text: string;
    soundsLike?: string[];
    weight?: number;
  }>>().default([]),

  // Training data
  trainingDataSize: integer("training_data_size"), // hours
  isTrained: boolean("is_trained").notNull().default(false),
  trainingStatus: varchar("training_status", { length: 20 }),

  accuracy: numeric("accuracy", { precision: 5, scale: 4 }),

  isActive: boolean("is_active").notNull().default(true),

  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const transcriptionsRelations = relations(transcriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [transcriptions.organizationId],
    references: [organizations.id],
  }),
}));

export const voiceSpeakersRelations = relations(voiceSpeakers, ({ one }) => ({
  organization: one(organizations, {
    fields: [voiceSpeakers.organizationId],
    references: [organizations.id],
  }),
}));

export const voiceCommandsRelations = relations(voiceCommands, ({ one }) => ({
  organization: one(organizations, {
    fields: [voiceCommands.organizationId],
    references: [organizations.id],
  }),
}));

export const meetingNotesRelations = relations(meetingNotes, ({ one }) => ({
  organization: one(organizations, {
    fields: [meetingNotes.organizationId],
    references: [organizations.id],
  }),
  transcription: one(transcriptions, {
    fields: [meetingNotes.transcriptionId],
    references: [transcriptions.id],
  }),
}));

export const customVocabularyRelations = relations(customVocabulary, ({ one }) => ({
  organization: one(organizations, {
    fields: [customVocabulary.organizationId],
    references: [organizations.id],
  }),
}));

export const customLanguageModelsRelations = relations(customLanguageModels, ({ one }) => ({
  organization: one(organizations, {
    fields: [customLanguageModels.organizationId],
    references: [organizations.id],
  }),
}));
