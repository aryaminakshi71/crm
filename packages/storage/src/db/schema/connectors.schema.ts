import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./nucleo-unified.schema";

export const connectors = pgTable("connectors", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // crm, invoicing, helpdesk, airtable, linear, notion, oauth2
  name: text("name").notNull(),
  status: text("status").notNull().default("inactive"), // active, inactive, error
  config: jsonb("config").default({}),
  credentials: jsonb("credentials").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Connector = typeof connectors.$inferSelect;
export type NewConnector = typeof connectors.$inferInsert;
