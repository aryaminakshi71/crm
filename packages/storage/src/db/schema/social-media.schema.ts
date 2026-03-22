/**
 * Social Media Schema (Fanbean API)
 *
 * Social accounts, posts, analytics, listening, and campaigns.
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

// Platform Types
export const SocialPlatform = [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "tiktok",
  "youtube",
  "pinterest",
] as const;
export type SocialPlatform = (typeof SocialPlatform)[number];

// Post Status
export const PostStatus = ["draft", "scheduled", "published", "failed"] as const;
export type PostStatus = (typeof PostStatus)[number];

// Social Accounts
export const socialAccounts = pgTable("social_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  platform: varchar("platform", { length: 20 }).notNull(),
  platformAccountId: varchar("platform_account_id", { length: 100 }),

  username: varchar("username", { length: 100 }),
  displayName: varchar("display_name", { length: 255 }),
  profileUrl: varchar("profile_url", { length: 500 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),

  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),

  profileData: jsonb("profile_data").$type<{
    bio?: string;
    website?: string;
    followers?: number;
    following?: number;
    posts?: number;
  }>(),

  permissions: jsonb("permissions").$type<string[]>().default([]),

  status: varchar("status", { length: 20 }).notNull().default("active"),

  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Scheduled Posts
export const scheduledPosts = pgTable("social_scheduled_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  accountId: uuid("account_id")
    .notNull()
    .references(() => socialAccounts.id, { onDelete: "cascade" }),

  platform: varchar("platform", { length: 20 }).notNull(),

  content: text("content").notNull(),
  mediaUrls: jsonb("media_urls").$type<Array<{
    type: string;
    url: string;
    thumbnailUrl?: string;
  }>>().default([]),

  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),

  status: varchar("status", { length: 20 }).notNull().default("draft"),

  // Platform-specific fields
  platformPostId: varchar("platform_post_id", { length: 100 }),
  platformPostUrl: varchar("platform_post_url", { length: 500 }),

  // Engagement metrics
  engagement: jsonb("engagement").$type<{
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    clicks?: number;
  }>(),

  errorMessage: text("error_message"),

  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Social Analytics
export const socialAnalytics = pgTable("social_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  accountId: uuid("account_id")
    .notNull()
    .references(() => socialAccounts.id, { onDelete: "cascade" }),

  date: timestamp("date", { withTimezone: true }).notNull(),

  // Metrics
  followers: integer("followers").notNull().default(0),
  following: integer("following").notNull().default(0),
  posts: integer("posts").notNull().default(0),

  // Engagement
  engagement: integer("engagement").notNull().default(0),
  reach: integer("reach").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),

  // Platform-specific
  platformData: jsonb("platform_data").$type<Record<string, unknown>>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Social Listening Alerts
export const socialListeningAlerts = pgTable("social_listening_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  keyword: varchar("keyword", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 20 }),

  alertType: varchar("alert_type", { length: 50 }).notNull(), // mention, hashtag, competitor, brand
  content: text("content"),
  sentiment: varchar("sentiment", { length: 20 }), // positive, negative, neutral

  // Source
  authorName: varchar("author_name", { length: 100 }),
  authorUsername: varchar("author_username", { length: 100 }),
  authorUrl: varchar("author_url", { length: 500 }),
  postUrl: varchar("post_url", { length: 500 }),

  detectedAt: timestamp("detected_at", { withTimezone: true }),
  isRead: boolean("is_read").notNull().default(false),
  isIgnored: boolean("is_ignored").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Social Campaigns
export const socialCampaigns = pgTable("social_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  platforms: jsonb("platforms").$type<SocialPlatform[]>().default([]),
  accountIds: jsonb("account_ids").$type<string[]>().default([]),

  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),

  content: text("content"),
  mediaUrls: jsonb("media_urls").$type<string[]>().default([]),

  // Budget tracking
  budget: numeric("budget", { precision: 10, scale: 2 }),
  spent: numeric("spent", { precision: 10, scale: 2 }).default("0"),

  // Goals
  goals: jsonb("goals").$type<{
    impressions?: number;
    engagement?: number;
    clicks?: number;
    conversions?: number;
  }>(),

  status: varchar("status", { length: 20 }).notNull().default("draft"),

  // Results
  results: jsonb("results").$type<{
    impressions?: number;
    engagement?: number;
    clicks?: number;
    conversions?: number;
  }>(),

  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const socialAccountsRelations = relations(socialAccounts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [socialAccounts.organizationId],
    references: [organizations.id],
  }),
  posts: many(scheduledPosts),
  analytics: many(socialAnalytics),
}));

export const scheduledPostsRelations = relations(scheduledPosts, ({ one }) => ({
  organization: one(organizations, {
    fields: [scheduledPosts.organizationId],
    references: [organizations.id],
  }),
  account: one(socialAccounts, {
    fields: [scheduledPosts.accountId],
    references: [socialAccounts.id],
  }),
}));

export const socialAnalyticsRelations = relations(socialAnalytics, ({ one }) => ({
  organization: one(organizations, {
    fields: [socialAnalytics.organizationId],
    references: [organizations.id],
  }),
  account: one(socialAccounts, {
    fields: [socialAnalytics.accountId],
    references: [socialAccounts.id],
  }),
}));

export const socialListeningAlertsRelations = relations(socialListeningAlerts, ({ one }) => ({
  organization: one(organizations, {
    fields: [socialListeningAlerts.organizationId],
    references: [organizations.id],
  }),
}));

export const socialCampaignsRelations = relations(socialCampaigns, ({ one }) => ({
  organization: one(organizations, {
    fields: [socialCampaigns.organizationId],
    references: [organizations.id],
  }),
}));
