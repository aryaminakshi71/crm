import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./auth.schema.js";

// Agent Workflows table
export const agentWorkflows = pgTable(
  "agent_workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).notNull().default("active"), // active/paused/draft
    triggerType: varchar("trigger_type", { length: 100 }), // schedule/event/manual/webhook
    triggerConfig: jsonb("trigger_config").$type<Record<string, unknown>>(),
    steps: jsonb("steps")
      .$type<
        Array<{
          id: string;
          type: string;
          agentId?: string;
          config: Record<string, unknown>;
        }>
      >()
      .default([]),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    runCount: integer("run_count").notNull().default(0),
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
    orgIdx: index("idx_agent_workflows_org").on(table.organizationId),
    statusIdx: index("idx_agent_workflows_status").on(table.status),
  }),
);
