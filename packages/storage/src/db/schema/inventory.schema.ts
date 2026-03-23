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

// ── Suppliers ────────────────────────────────────────────────────────────────

export const inventorySuppliers = pgTable(
  "inventory_suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: jsonb("address"),
    contactPerson: text("contact_person"),
    paymentTerms: text("payment_terms"),
    currency: text("currency").default("USD"),
    taxId: text("tax_id"),
    notes: text("notes"),
    status: text("status").default("active"), // active | inactive
    rating: integer("rating"), // 1-5
    leadTimeDays: integer("lead_time_days"),
    minimumOrderValue: numeric("minimum_order_value"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => ({
    orgIdx: index("idx_inventory_suppliers_org").on(t.organizationId),
    statusIdx: index("idx_inventory_suppliers_status").on(t.status),
    deletedAtIdx: index("idx_inventory_suppliers_deleted_at").on(t.deletedAt),
  }),
);

// ── Warehouses ───────────────────────────────────────────────────────────────

export const inventoryWarehouses = pgTable(
  "inventory_warehouses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    name: text("name").notNull(),
    code: text("code"),
    address: jsonb("address"),
    manager: text("manager"),
    phone: text("phone"),
    capacity: integer("capacity"), // total capacity in units
    used: integer("used").default(0),
    type: text("type").default("main"), // main | satellite | 3pl
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("idx_inventory_warehouses_org").on(t.organizationId),
    isActiveIdx: index("idx_inventory_warehouses_active").on(t.isActive),
  }),
);

// ── Storage Locations (zones/aisles within warehouses) ───────────────────────

export const inventoryLocations = pgTable(
  "inventory_locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    warehouseId: uuid("warehouse_id").references(() => inventoryWarehouses.id),
    name: text("name").notNull(),
    code: text("code"),
    zone: text("zone"),
    aisle: text("aisle"),
    shelf: text("shelf"),
    type: text("type").default("storage"), // storage | picking | receiving | shipping
    capacity: integer("capacity"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index("idx_inventory_locations_org").on(t.organizationId),
    warehouseIdx: index("idx_inventory_locations_warehouse").on(t.warehouseId),
  }),
);

// ── Purchase Orders ──────────────────────────────────────────────────────────

export const inventoryPurchaseOrders = pgTable(
  "inventory_purchase_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    poNumber: text("po_number").notNull(),
    supplierId: uuid("supplier_id").references(() => inventorySuppliers.id),
    supplierName: text("supplier_name"),
    status: text("status").default("draft"), // draft | sent | confirmed | received | cancelled
    orderDate: timestamp("order_date"),
    expectedDate: timestamp("expected_date"),
    receivedDate: timestamp("received_date"),
    subtotal: numeric("subtotal").default("0"),
    taxAmount: numeric("tax_amount").default("0"),
    total: numeric("total").default("0"),
    currency: text("currency").default("USD"),
    notes: text("notes"),
    items: jsonb("items").default([]), // [{productId, productName, sku, quantity, unitCost, total}]
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => ({
    orgIdx: index("idx_inventory_purchase_orders_org").on(t.organizationId),
    statusIdx: index("idx_inventory_purchase_orders_status").on(t.status),
    supplierIdx: index("idx_inventory_purchase_orders_supplier").on(t.supplierId),
    deletedAtIdx: index("idx_inventory_purchase_orders_deleted_at").on(t.deletedAt),
  }),
);

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

export const inventorySuppliersRelations = relations(inventorySuppliers, ({ many }) => ({
  purchaseOrders: many(inventoryPurchaseOrders),
}));

export const inventoryWarehousesRelations = relations(inventoryWarehouses, ({ many }) => ({
  locations: many(inventoryLocations),
}));

export const inventoryLocationsRelations = relations(inventoryLocations, ({ one }) => ({
  warehouse: one(inventoryWarehouses, {
    fields: [inventoryLocations.warehouseId],
    references: [inventoryWarehouses.id],
  }),
}));

export const inventoryPurchaseOrdersRelations = relations(inventoryPurchaseOrders, ({ one }) => ({
  supplier: one(inventorySuppliers, {
    fields: [inventoryPurchaseOrders.supplierId],
    references: [inventorySuppliers.id],
  }),
}));

// ── Inferred types ───────────────────────────────────────────────────────────

export type InventorySupplier = typeof inventorySuppliers.$inferSelect;
export type NewInventorySupplier = typeof inventorySuppliers.$inferInsert;
export type InventoryWarehouse = typeof inventoryWarehouses.$inferSelect;
export type NewInventoryWarehouse = typeof inventoryWarehouses.$inferInsert;
export type InventoryLocation = typeof inventoryLocations.$inferSelect;
export type NewInventoryLocation = typeof inventoryLocations.$inferInsert;
export type InventoryPurchaseOrder = typeof inventoryPurchaseOrders.$inferSelect;
export type NewInventoryPurchaseOrder = typeof inventoryPurchaseOrders.$inferInsert;
