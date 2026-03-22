import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./auth.schema.js";

export const productStatusEnum = pgEnum("product_status", ["active", "inactive", "discontinued"]);
export const stockAlertTypeEnum = pgEnum("stock_alert_type", ["low_stock", "out_of_stock", "overstock", "expiry"]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 100 }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 128 }),
    status: productStatusEnum("status").notNull().default("active"),
    costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
    sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }),
    unit: varchar("unit", { length: 50 }).default("units"),
    minStockLevel: integer("min_stock_level").notNull().default(0),
    maxStockLevel: integer("max_stock_level"),
    currentStock: integer("current_stock").notNull().default(0),
    reservedStock: integer("reserved_stock").notNull().default(0),
    warehouseLocation: varchar("warehouse_location", { length: 255 }),
    barcode: varchar("barcode", { length: 100 }),
    imageUrl: text("image_url"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index("idx_products_org").on(t.organizationId),
    skuIdx: index("idx_products_sku").on(t.sku),
    categoryIdx: index("idx_products_category").on(t.category),
    deletedAtIdx: index("idx_products_deleted_at").on(t.deletedAt),
  }),
);

export const stockAlerts = pgTable(
  "stock_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    type: stockAlertTypeEnum("type").notNull(),
    message: text("message"),
    threshold: integer("threshold"),
    currentLevel: integer("current_level"),
    isResolved: boolean("is_resolved").notNull().default(false),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_stock_alerts_org").on(t.organizationId),
    productIdx: index("idx_stock_alerts_product").on(t.productId),
  }),
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // "in", "out", "transfer", "adjustment"
    quantity: integer("quantity").notNull(),
    reason: varchar("reason", { length: 255 }),
    referenceId: varchar("reference_id", { length: 255 }),
    fromLocation: varchar("from_location", { length: 255 }),
    toLocation: varchar("to_location", { length: 255 }),
    performedById: text("performed_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_stock_movements_org").on(t.organizationId),
    productIdx: index("idx_stock_movements_product").on(t.productId),
  }),
);

// ── Relations ────────────────────────────────────────────────────────────────

export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [products.createdById],
    references: [users.id],
  }),
  stockAlerts: many(stockAlerts),
  stockMovements: many(stockMovements),
}));

export const stockAlertsRelations = relations(stockAlerts, ({ one }) => ({
  organization: one(organizations, {
    fields: [stockAlerts.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [stockAlerts.productId],
    references: [products.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  organization: one(organizations, {
    fields: [stockMovements.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  performedBy: one(users, {
    fields: [stockMovements.performedById],
    references: [users.id],
  }),
}));
