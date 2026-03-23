/**
 * eCommerce Router
 *
 * Products, orders, customers, discounts, reviews, shipping, taxes,
 * wishlists, upsell rules, and abandoned carts.
 */

import { and, count, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

// ── Helpers ─────────────────────────────────────────────────────────────────

function stubCreated(input: object, orgId: string) {
  return {
    id: crypto.randomUUID(),
    organizationId: orgId,
    ...input,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ── Router ───────────────────────────────────────────────────────────────────

export const ecommerceRouter = {
  // ── Stats ─────────────────────────────────────────────────────────────────

  stats: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/stats",
      summary: "eCommerce stats",
      tags: ["eCommerce"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [orderStats, customerCount] = await Promise.all([
        db
          .select({
            totalOrders: count(),
            totalRevenue: sql<string>`COALESCE(SUM(${schema.ecommerceOrders.totalAmount}), 0)`,
          })
          .from(schema.ecommerceOrders)
          .where(eq(schema.ecommerceOrders.organizationId, orgId)),
        db
          .select({ total: count() })
          .from(schema.ecommerceCustomers)
          .where(
            and(
              eq(schema.ecommerceCustomers.organizationId, orgId),
              isNull(schema.ecommerceCustomers.deletedAt),
            ),
          ),
      ]);

      const stats = orderStats[0] ?? { totalOrders: 0, totalRevenue: "0" };
      return {
        totalRevenue: Number(stats.totalRevenue),
        totalOrders: stats.totalOrders,
        totalCustomers: customerCount[0]?.total ?? 0,
        conversionRate: 0,
        revenueChange: 0,
        ordersChange: 0,
      };
    }),

  // ── Products ──────────────────────────────────────────────────────────────

  listProducts: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/products",
      summary: "List eCommerce products",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        search: z.string().optional(),
        category: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; search?: string; category?: string; status?: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const conditions = [
          eq(schema.ecommerceProducts.organizationId, orgId),
          isNull(schema.ecommerceProducts.deletedAt),
        ];

        if (input.search) {
          conditions.push(ilike(schema.ecommerceProducts.name, `%${input.search}%`));
        }
        if (input.category) {
          conditions.push(eq(schema.ecommerceProducts.category, input.category));
        }
        if (input.status) {
          conditions.push(
            eq(
              schema.ecommerceProducts.status,
              input.status as "active" | "draft" | "archived",
            ),
          );
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(schema.ecommerceProducts)
            .where(where)
            .orderBy(desc(schema.ecommerceProducts.createdAt))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ total: count() })
            .from(schema.ecommerceProducts)
            .where(where),
        ]);

        return { data, total };
      },
    ),

  createProduct: orgAuthed
    .route({
      method: "POST",
      path: "/ecommerce/products",
      summary: "Create eCommerce product",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        sku: z.string().optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        category: z.string().optional(),
        price: z.number().optional(),
        comparePrice: z.number().optional(),
        cost: z.number().optional(),
        stock: z.number().default(0),
        trackInventory: z.boolean().default(true),
        status: z.enum(["active", "draft", "archived"]).default("draft"),
        weight: z.number().optional(),
        dimensions: z.string().optional(),
        barcode: z.string().optional(),
        vendor: z.string().optional(),
        type: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          name: string;
          sku?: string;
          description?: string;
          shortDescription?: string;
          category?: string;
          price?: number;
          comparePrice?: number;
          cost?: number;
          stock: number;
          trackInventory: boolean;
          status: "active" | "draft" | "archived";
          weight?: number;
          dimensions?: string;
          barcode?: string;
          vendor?: string;
          type?: string;
          tags?: string[];
        };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const [product] = await db
          .insert(schema.ecommerceProducts)
          .values({
            organizationId: orgId,
            name: input.name,
            sku: input.sku,
            description: input.description,
            category: input.category,
            price: input.price?.toString(),
            comparePrice: input.comparePrice?.toString(),
            costPrice: input.cost?.toString(),
            weight: input.weight?.toString(),
            barcode: input.barcode,
            status: input.status,
            inventory: input.stock,
            tags: input.tags,
          })
          .returning();

        return product;
      },
    ),

  getProduct: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/products/:id",
      summary: "Get eCommerce product",
      tags: ["eCommerce"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const [product] = await db
          .select()
          .from(schema.ecommerceProducts)
          .where(
            and(
              eq(schema.ecommerceProducts.id, input.id),
              eq(schema.ecommerceProducts.organizationId, orgId),
              isNull(schema.ecommerceProducts.deletedAt),
            ),
          )
          .limit(1);

        return product ?? null;
      },
    ),

  updateProduct: orgAuthed
    .route({
      method: "PUT",
      path: "/ecommerce/products/:id",
      summary: "Update eCommerce product",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        price: z.number().optional(),
        comparePrice: z.number().optional(),
        cost: z.number().optional(),
        stock: z.number().optional(),
        status: z.enum(["active", "draft", "archived"]).optional(),
        weight: z.number().optional(),
        dimensions: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; [key: string]: unknown };
      }) => {
        const { id, ...rest } = input;
        return { id, organizationId: context.organization.id, ...rest, updatedAt: new Date().toISOString() };
      },
    ),

  deleteProduct: orgAuthed
    .route({
      method: "DELETE",
      path: "/ecommerce/products/:id",
      summary: "Delete eCommerce product",
      tags: ["eCommerce"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string };
      }) => {
        return { success: true };
      },
    ),

  // ── Orders ────────────────────────────────────────────────────────────────

  listOrders: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/orders",
      summary: "List eCommerce orders",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        status: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; status?: string; search?: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const conditions = [eq(schema.ecommerceOrders.organizationId, orgId)];

        if (input.status) {
          conditions.push(
            eq(
              schema.ecommerceOrders.status,
              input.status as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded",
            ),
          );
        }
        if (input.search) {
          conditions.push(ilike(schema.ecommerceOrders.customerEmail, `%${input.search}%`));
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(schema.ecommerceOrders)
            .where(where)
            .orderBy(desc(schema.ecommerceOrders.createdAt))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ total: count() })
            .from(schema.ecommerceOrders)
            .where(where),
        ]);

        return { data, total };
      },
    ),

  createOrder: orgAuthed
    .route({
      method: "POST",
      path: "/ecommerce/orders",
      summary: "Create eCommerce order",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        customer: z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
        }),
        items: z.array(
          z.object({
            productId: z.string(),
            name: z.string(),
            sku: z.string().optional(),
            price: z.number(),
            quantity: z.number().min(1),
          }),
        ),
        shippingAddress: z
          .object({
            line1: z.string(),
            line2: z.string().optional(),
            city: z.string(),
            state: z.string(),
            zip: z.string(),
            country: z.string(),
          })
          .optional(),
        shippingMethod: z.string().optional(),
        discountCode: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          customer: { name: string; email: string; phone?: string };
          items: { productId: string; name: string; sku?: string; price: number; quantity: number }[];
          shippingAddress?: object;
          shippingMethod?: string;
          discountCode?: string;
          notes?: string;
        };
      }) => {
        const now = new Date();
        const orderNumber = `ORD-${now.getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
        const subtotal = input.items.reduce((s, i) => s + i.price * i.quantity, 0);
        return {
          id: crypto.randomUUID(),
          orderNumber,
          organizationId: context.organization.id,
          status: "pending",
          customer: input.customer,
          items: input.items,
          subtotal,
          shippingCost: 9.99,
          tax: +(subtotal * 0.08).toFixed(2),
          total: +(subtotal + 9.99 + subtotal * 0.08).toFixed(2),
          createdAt: now.toISOString(),
        };
      },
    ),

  getOrder: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/orders/:id",
      summary: "Get eCommerce order",
      tags: ["eCommerce"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const [order] = await db
          .select()
          .from(schema.ecommerceOrders)
          .where(
            and(
              eq(schema.ecommerceOrders.id, input.id),
              eq(schema.ecommerceOrders.organizationId, orgId),
            ),
          )
          .limit(1);

        return order ?? null;
      },
    ),

  updateOrder: orgAuthed
    .route({
      method: "PUT",
      path: "/ecommerce/orders/:id",
      summary: "Update eCommerce order status",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        id: z.string(),
        status: z
          .enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"])
          .optional(),
        trackingNumber: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; status?: string; trackingNumber?: string; notes?: string };
      }) => {
        const { id, ...rest } = input;
        return { id, organizationId: context.organization.id, ...rest, updatedAt: new Date().toISOString() };
      },
    ),

  // ── Customers ─────────────────────────────────────────────────────────────

  listCustomers: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/customers",
      summary: "List eCommerce customers",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        search: z.string().optional(),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; search?: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const conditions = [
          eq(schema.ecommerceCustomers.organizationId, orgId),
          isNull(schema.ecommerceCustomers.deletedAt),
        ];

        if (input.search) {
          conditions.push(ilike(schema.ecommerceCustomers.email, `%${input.search}%`));
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(schema.ecommerceCustomers)
            .where(where)
            .orderBy(desc(schema.ecommerceCustomers.createdAt))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ total: count() })
            .from(schema.ecommerceCustomers)
            .where(where),
        ]);

        return { data, total };
      },
    ),

  getCustomer: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/customers/:id",
      summary: "Get eCommerce customer",
      tags: ["eCommerce"],
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string };
      }) => {
        return null;
      },
    ),

  // ── Abandoned Carts ───────────────────────────────────────────────────────

  listAbandoned: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/abandoned",
      summary: "List abandoned carts",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        recovered: z.boolean().optional(),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; recovered?: boolean };
      }) => {
        return { data: [], total: 0 };
      },
    ),

  // ── Discounts ─────────────────────────────────────────────────────────────

  listDiscounts: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/discounts",
      summary: "List discount codes",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        search: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; search?: string; status?: string };
      }) => {
        return { data: [], total: 0 };
      },
    ),

  createDiscount: orgAuthed
    .route({
      method: "POST",
      path: "/ecommerce/discounts",
      summary: "Create discount code",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        code: z.string().min(1).max(50),
        name: z.string().min(1).max(255),
        type: z.enum(["percentage", "fixed", "shipping"]),
        value: z.number().min(0),
        minOrder: z.number().default(0),
        maxDiscount: z.number().optional(),
        limit: z.number().optional(),
        expiresAt: z.string().optional(),
        status: z.enum(["active", "disabled"]).default("active"),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          code: string;
          name: string;
          type: "percentage" | "fixed" | "shipping";
          value: number;
          minOrder: number;
          maxDiscount?: number;
          limit?: number;
          expiresAt?: string;
          status: "active" | "disabled";
        };
      }) => {
        return stubCreated({ ...input, usage: 0 }, context.organization.id);
      },
    ),

  // ── Reviews ───────────────────────────────────────────────────────────────

  listReviews: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/reviews",
      summary: "List product reviews",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        status: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; status?: string; search?: string };
      }) => {
        return { data: [], total: 0 };
      },
    ),

  updateReview: orgAuthed
    .route({
      method: "PUT",
      path: "/ecommerce/reviews/:id",
      summary: "Approve/reject review",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["approved", "rejected", "pending"]),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string; status: "approved" | "rejected" | "pending" };
      }) => {
        return { id: input.id, status: input.status, updatedAt: new Date().toISOString() };
      },
    ),

  // ── Shipping ──────────────────────────────────────────────────────────────

  listShipping: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/shipping",
      summary: "List shipping methods",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number };
      }) => {
        return { data: [], total: 0 };
      },
    ),

  createShipping: orgAuthed
    .route({
      method: "POST",
      path: "/ecommerce/shipping",
      summary: "Create shipping method",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        carrier: z.string().optional(),
        days: z.string().optional(),
        rate: z.number().min(0),
        minOrder: z.number().default(0),
        maxOrder: z.number().optional(),
        enabled: z.boolean().default(true),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          name: string;
          carrier?: string;
          days?: string;
          rate: number;
          minOrder: number;
          maxOrder?: number;
          enabled: boolean;
        };
      }) => {
        return stubCreated(input, context.organization.id);
      },
    ),

  // ── Taxes ─────────────────────────────────────────────────────────────────

  listTaxes: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/taxes",
      summary: "List tax rules",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number };
      }) => {
        return { data: [], total: 0 };
      },
    ),

  createTax: orgAuthed
    .route({
      method: "POST",
      path: "/ecommerce/taxes",
      summary: "Create tax rule",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        rate: z.number().min(0).max(100),
        region: z.string().optional(),
        enabled: z.boolean().default(true),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { name: string; rate: number; region?: string; enabled: boolean };
      }) => {
        return stubCreated(input, context.organization.id);
      },
    ),

  // ── Wishlists ─────────────────────────────────────────────────────────────

  listWishlists: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/wishlists",
      summary: "List customer wishlists",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number };
      }) => {
        return { data: [], total: 0 };
      },
    ),

  // ── Upsell ────────────────────────────────────────────────────────────────

  listUpsell: orgAuthed
    .route({
      method: "GET",
      path: "/ecommerce/upsell",
      summary: "Get upsell recommendations",
      tags: ["eCommerce"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number };
      }) => {
        return { data: [], total: 0 };
      },
    ),
};
