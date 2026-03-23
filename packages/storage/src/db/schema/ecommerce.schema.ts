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
} from "drizzle-orm/pg-core";
import { organizations } from "./auth.schema.js";

// ── Enums ────────────────────────────────────────────────────────────────────

export const ecommerceProductStatusEnum = pgEnum("ecommerce_product_status", [
  "active",
  "draft",
  "archived",
]);

export const ecommerceOrderStatusEnum = pgEnum("ecommerce_order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const ecommercePaymentStatusEnum = pgEnum("ecommerce_payment_status", [
  "unpaid",
  "paid",
  "partial",
  "refunded",
]);

export const ecommerceCartStatusEnum = pgEnum("ecommerce_cart_status", [
  "active",
  "abandoned",
  "converted",
]);

export const ecommerceDiscountTypeEnum = pgEnum("ecommerce_discount_type", [
  "percentage",
  "fixed",
  "free_shipping",
]);

export const ecommerceReviewStatusEnum = pgEnum("ecommerce_review_status", [
  "pending",
  "approved",
  "rejected",
]);

// ── Tables ───────────────────────────────────────────────────────────────────

export const ecommerceProducts = pgTable(
  "ecommerce_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sku: text("sku"),
    barcode: text("barcode"),
    category: text("category"),
    price: numeric("price", { precision: 15, scale: 2 }),
    comparePrice: numeric("compare_price", { precision: 15, scale: 2 }),
    costPrice: numeric("cost_price", { precision: 15, scale: 2 }),
    weight: numeric("weight", { precision: 10, scale: 3 }),
    status: ecommerceProductStatusEnum("status").notNull().default("draft"),
    inventory: integer("inventory").notNull().default(0),
    images: jsonb("images").$type<string[]>(),
    tags: jsonb("tags").$type<string[]>(),
    variants: jsonb("variants").$type<Record<string, unknown>[]>(),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index("idx_ecommerce_products_org").on(t.organizationId),
    statusIdx: index("idx_ecommerce_products_status").on(t.status),
    skuIdx: index("idx_ecommerce_products_sku").on(t.sku),
    categoryIdx: index("idx_ecommerce_products_category").on(t.category),
    deletedAtIdx: index("idx_ecommerce_products_deleted_at").on(t.deletedAt),
  }),
);

export const ecommerceOrders = pgTable(
  "ecommerce_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    orderNumber: text("order_number").notNull(),
    customerId: uuid("customer_id"),
    customerName: text("customer_name"),
    customerEmail: text("customer_email"),
    status: ecommerceOrderStatusEnum("status").notNull().default("pending"),
    paymentStatus: ecommercePaymentStatusEnum("payment_status").notNull().default("unpaid"),
    totalAmount: numeric("total_amount", { precision: 15, scale: 2 }),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }),
    taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }),
    shippingAmount: numeric("shipping_amount", { precision: 15, scale: 2 }),
    discount: numeric("discount", { precision: 15, scale: 2 }),
    currency: text("currency").notNull().default("USD"),
    notes: text("notes"),
    shippingAddress: jsonb("shipping_address").$type<Record<string, unknown>>(),
    billingAddress: jsonb("billing_address").$type<Record<string, unknown>>(),
    trackingNumber: text("tracking_number"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_ecommerce_orders_org").on(t.organizationId),
    statusIdx: index("idx_ecommerce_orders_status").on(t.status),
    paymentStatusIdx: index("idx_ecommerce_orders_payment_status").on(t.paymentStatus),
    customerEmailIdx: index("idx_ecommerce_orders_customer_email").on(t.customerEmail),
    orgStatusIdx: index("idx_ecommerce_orders_org_status").on(t.organizationId, t.status),
    createdAtIdx: index("idx_ecommerce_orders_created_at").on(t.createdAt),
  }),
);

export const ecommerceOrderItems = pgTable(
  "ecommerce_order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => ecommerceOrders.id, { onDelete: "cascade" }),
    productId: uuid("product_id"),
    productName: text("product_name"),
    sku: text("sku"),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unit_price", { precision: 15, scale: 2 }),
    totalPrice: numeric("total_price", { precision: 15, scale: 2 }),
    discount: numeric("discount", { precision: 15, scale: 2 }),
  },
  (t) => ({
    orderIdx: index("idx_ecommerce_order_items_order").on(t.orderId),
    productIdx: index("idx_ecommerce_order_items_product").on(t.productId),
  }),
);

export const ecommerceCustomers = pgTable(
  "ecommerce_customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    totalOrders: integer("total_orders").notNull().default(0),
    totalSpent: numeric("total_spent", { precision: 15, scale: 2 }).notNull().default("0"),
    lastOrderAt: timestamp("last_order_at", { withTimezone: true }),
    tags: jsonb("tags").$type<string[]>(),
    notes: text("notes"),
    address: jsonb("address").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index("idx_ecommerce_customers_org").on(t.organizationId),
    emailIdx: index("idx_ecommerce_customers_email").on(t.email),
    orgEmailIdx: index("idx_ecommerce_customers_org_email").on(t.organizationId, t.email),
    deletedAtIdx: index("idx_ecommerce_customers_deleted_at").on(t.deletedAt),
  }),
);

export const ecommerceCarts = pgTable(
  "ecommerce_carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id"),
    customerEmail: text("customer_email"),
    status: ecommerceCartStatusEnum("status").notNull().default("active"),
    items: jsonb("items").$type<Record<string, unknown>[]>(),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
    recoveryEmailSent: boolean("recovery_email_sent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_ecommerce_carts_org").on(t.organizationId),
    statusIdx: index("idx_ecommerce_carts_status").on(t.status),
    customerEmailIdx: index("idx_ecommerce_carts_customer_email").on(t.customerEmail),
  }),
);

export const ecommerceDiscounts = pgTable(
  "ecommerce_discounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    code: text("code"),
    type: ecommerceDiscountTypeEnum("type").notNull(),
    value: numeric("value", { precision: 15, scale: 2 }),
    minOrderAmount: numeric("min_order_amount", { precision: 15, scale: 2 }),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_ecommerce_discounts_org").on(t.organizationId),
    codeIdx: index("idx_ecommerce_discounts_code").on(t.code),
    orgCodeIdx: index("idx_ecommerce_discounts_org_code").on(t.organizationId, t.code),
    isActiveIdx: index("idx_ecommerce_discounts_is_active").on(t.isActive),
  }),
);

export const ecommerceReviews = pgTable(
  "ecommerce_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => ecommerceProducts.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id"),
    customerName: text("customer_name"),
    rating: integer("rating"),
    title: text("title"),
    body: text("body"),
    status: ecommerceReviewStatusEnum("status").notNull().default("pending"),
    helpfulCount: integer("helpful_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_ecommerce_reviews_org").on(t.organizationId),
    productIdx: index("idx_ecommerce_reviews_product").on(t.productId),
    statusIdx: index("idx_ecommerce_reviews_status").on(t.status),
  }),
);

export const ecommerceShippingMethods = pgTable(
  "ecommerce_shipping_methods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    carrier: text("carrier"),
    estimatedDays: integer("estimated_days"),
    price: numeric("price", { precision: 15, scale: 2 }),
    freeThreshold: numeric("free_threshold", { precision: 15, scale: 2 }),
    isActive: boolean("is_active").notNull().default(true),
    zones: jsonb("zones").$type<Record<string, unknown>[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_ecommerce_shipping_methods_org").on(t.organizationId),
    isActiveIdx: index("idx_ecommerce_shipping_methods_is_active").on(t.isActive),
  }),
);

export const ecommerceTaxRules = pgTable(
  "ecommerce_tax_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    country: text("country"),
    state: text("state"),
    rate: numeric("rate", { precision: 8, scale: 4 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_ecommerce_tax_rules_org").on(t.organizationId),
    countryIdx: index("idx_ecommerce_tax_rules_country").on(t.country),
  }),
);

export const ecommerceWishlists = pgTable(
  "ecommerce_wishlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id"),
    customerName: text("customer_name"),
    customerEmail: text("customer_email"),
    items: jsonb("items").$type<Record<string, unknown>[]>(),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("idx_ecommerce_wishlists_org").on(t.organizationId),
    customerIdx: index("idx_ecommerce_wishlists_customer").on(t.customerId),
  }),
);

// ── Relations ────────────────────────────────────────────────────────────────

export const ecommerceProductsRelations = relations(ecommerceProducts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [ecommerceProducts.organizationId],
    references: [organizations.id],
  }),
  reviews: many(ecommerceReviews),
}));

export const ecommerceOrdersRelations = relations(ecommerceOrders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [ecommerceOrders.organizationId],
    references: [organizations.id],
  }),
  items: many(ecommerceOrderItems),
}));

export const ecommerceOrderItemsRelations = relations(ecommerceOrderItems, ({ one }) => ({
  order: one(ecommerceOrders, {
    fields: [ecommerceOrderItems.orderId],
    references: [ecommerceOrders.id],
  }),
}));

export const ecommerceCustomersRelations = relations(ecommerceCustomers, ({ one }) => ({
  organization: one(organizations, {
    fields: [ecommerceCustomers.organizationId],
    references: [organizations.id],
  }),
}));

export const ecommerceCartsRelations = relations(ecommerceCarts, ({ one }) => ({
  organization: one(organizations, {
    fields: [ecommerceCarts.organizationId],
    references: [organizations.id],
  }),
}));

export const ecommerceDiscountsRelations = relations(ecommerceDiscounts, ({ one }) => ({
  organization: one(organizations, {
    fields: [ecommerceDiscounts.organizationId],
    references: [organizations.id],
  }),
}));

export const ecommerceReviewsRelations = relations(ecommerceReviews, ({ one }) => ({
  organization: one(organizations, {
    fields: [ecommerceReviews.organizationId],
    references: [organizations.id],
  }),
  product: one(ecommerceProducts, {
    fields: [ecommerceReviews.productId],
    references: [ecommerceProducts.id],
  }),
}));

export const ecommerceShippingMethodsRelations = relations(ecommerceShippingMethods, ({ one }) => ({
  organization: one(organizations, {
    fields: [ecommerceShippingMethods.organizationId],
    references: [organizations.id],
  }),
}));

export const ecommerceTaxRulesRelations = relations(ecommerceTaxRules, ({ one }) => ({
  organization: one(organizations, {
    fields: [ecommerceTaxRules.organizationId],
    references: [organizations.id],
  }),
}));

export const ecommerceWishlistsRelations = relations(ecommerceWishlists, ({ one }) => ({
  organization: one(organizations, {
    fields: [ecommerceWishlists.organizationId],
    references: [organizations.id],
  }),
}));

// ── Type exports ─────────────────────────────────────────────────────────────

export type EcommerceProduct = typeof ecommerceProducts.$inferSelect;
export type NewEcommerceProduct = typeof ecommerceProducts.$inferInsert;
export type EcommerceOrder = typeof ecommerceOrders.$inferSelect;
export type NewEcommerceOrder = typeof ecommerceOrders.$inferInsert;
export type EcommerceOrderItem = typeof ecommerceOrderItems.$inferSelect;
export type NewEcommerceOrderItem = typeof ecommerceOrderItems.$inferInsert;
export type EcommerceCustomer = typeof ecommerceCustomers.$inferSelect;
export type NewEcommerceCustomer = typeof ecommerceCustomers.$inferInsert;
export type EcommerceCart = typeof ecommerceCarts.$inferSelect;
export type NewEcommerceCart = typeof ecommerceCarts.$inferInsert;
export type EcommerceDiscount = typeof ecommerceDiscounts.$inferSelect;
export type NewEcommerceDiscount = typeof ecommerceDiscounts.$inferInsert;
export type EcommerceReview = typeof ecommerceReviews.$inferSelect;
export type NewEcommerceReview = typeof ecommerceReviews.$inferInsert;
export type EcommerceShippingMethod = typeof ecommerceShippingMethods.$inferSelect;
export type NewEcommerceShippingMethod = typeof ecommerceShippingMethods.$inferInsert;
export type EcommerceTaxRule = typeof ecommerceTaxRules.$inferSelect;
export type NewEcommerceTaxRule = typeof ecommerceTaxRules.$inferInsert;
export type EcommerceWishlist = typeof ecommerceWishlists.$inferSelect;
export type NewEcommerceWishlist = typeof ecommerceWishlists.$inferInsert;
