import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./auth.schema.js";

/**
 * Ads Schema
 *
 * Tables for programmatic advertising conversion tracking.
 * Stores ad network connections, conversions, and UTM data.
 */

// Ad conversions table - tracks all ad-driven conversions
export const adConversions = pgTable(
  "ad_conversions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id"),
    contactId: uuid("contact_id"),

    // Ad network identifiers
    adNetwork: varchar("ad_network", { length: 50 }).notNull(), // "google_ads", "microsoft_ads", "facebook_ads"
    externalConversionId: varchar("external_conversion_id", { length: 255 }),
    campaignId: varchar("campaign_id", { length: 255 }),
    adGroupId: varchar("ad_group_id", { length: 255 }),
    creativeId: varchar("creative_id", { length: 255 }),

    // UTM data captured
    utmSource: varchar("utm_source", { length: 255 }),
    utmMedium: varchar("utm_medium", { length: 255 }),
    utmCampaign: varchar("utm_campaign", { length: 255 }),
    utmTerm: varchar("utm_term", { length: 255 }),
    utmContent: varchar("utm_content", { length: 255 }),

    // Click IDs
    gclid: varchar("gclid", { length: 255 }), // Google Click ID
    msclkid: varchar("msclkid", { length: 255 }), // Microsoft Click ID
    fbclid: varchar("fbclid", { length: 255 }), // Facebook Click ID

    // Conversion details
    conversionType: varchar("conversion_type", { length: 50 }).notNull(), // "form_submission", "page_view", "purchase", "signup"
    conversionValue: numeric("conversion_value", { precision: 15, scale: 2 }),
    conversionTimestamp: timestamp("conversion_timestamp").defaultNow().notNull(),

    // Sync status
    syncedToAdNetwork: boolean("synced_to_ad_network").default(false),
    syncedAt: timestamp("synced_at"),
    syncError: text("sync_error"),

    // Form/submission reference
    formId: uuid("form_id"),
    formName: varchar("form_name", { length: 255 }),

    // Page where conversion happened
    pageUrl: text("page_url"),
    pagePath: varchar("page_path", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("idx_ad_conversions_org").on(table.organizationId),
    leadIdIdx: index("idx_ad_conversions_lead").on(table.leadId),
    contactIdIdx: index("idx_ad_conversions_contact").on(table.contactId),
    conversionIdIdx: index("idx_ad_conversions_external").on(table.externalConversionId),
    gclidIdx: index("idx_ad_conversions_gclid").on(table.gclid),
    syncedIdx: index("idx_ad_conversions_synced").on(table.syncedToAdNetwork),
    campaignIdx: index("idx_ad_conversions_campaign").on(table.campaignId),
    utmCampaignIdx: index("idx_ad_conversions_utm_campaign").on(table.utmCampaign),
    conversionTimestampIdx: index("idx_ad_conversions_timestamp").on(table.conversionTimestamp),
  }),
);

// Type exports
export type AdConversion = typeof adConversions.$inferSelect;
export type NewAdConversion = typeof adConversions.$inferInsert;
