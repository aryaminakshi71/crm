import {
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

// Social Influencers table
export const socialInfluencers = pgTable(
  "social_influencers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    handle: varchar("handle", { length: 255 }).notNull(),
    platform: varchar("platform", { length: 50 }).notNull(), // instagram/tiktok/youtube/twitter/linkedin
    followersCount: integer("followers_count").notNull().default(0),
    engagementRate: numeric("engagement_rate", { precision: 5, scale: 2 }),
    status: varchar("status", { length: 50 }).notNull().default("prospect"), // prospect/active/inactive
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    orgIdx: index("idx_social_influencers_org").on(table.organizationId),
    platformIdx: index("idx_social_influencers_platform").on(table.platform),
  }),
);

// Social Competitors table
export const socialCompetitors = pgTable(
  "social_competitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    handle: varchar("handle", { length: 255 }),
    platform: varchar("platform", { length: 50 }).notNull(), // instagram/tiktok/youtube/twitter/linkedin
    followersCount: integer("followers_count").notNull().default(0),
    engagementRate: numeric("engagement_rate", { precision: 5, scale: 2 }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    orgIdx: index("idx_social_competitors_org").on(table.organizationId),
    platformIdx: index("idx_social_competitors_platform").on(table.platform),
  }),
);
