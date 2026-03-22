/**
 * Inventory Router
 * Products, stock levels, alerts, and movements.
 */

import { and, asc, count, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

const { products, stockAlerts, stockMovements } = schema;

export const inventoryRouter = {
  // ── Products ────────────────────────────────────────────────────────────────

  listProducts: orgAuthed
    .route({
      method: "GET",
      path: "/inventory/products",
      summary: "List products",
      tags: ["Inventory"],
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
    .output(
      z.object({
        data: z.array(z.any()),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
      }),
    )
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: {
          page: number;
          limit: number;
          search?: string;
          category?: string;
          status?: string;
        };
      }) => {
        const db = getDb(context);
        const offset = (input.page - 1) * input.limit;
        const conditions: any[] = [
          eq(products.organizationId, context.organization.id),
          isNull(products.deletedAt),
        ];
        if (input.search) conditions.push(ilike(products.name, `%${input.search}%`));
        if (input.category) conditions.push(eq(products.category, input.category));
        if (input.status) conditions.push(eq(products.status, input.status as any));
        const where = and(...conditions);
        const [{ total }] = await db
          .select({ total: count() })
          .from(products)
          .where(where);
        const data = await db
          .select()
          .from(products)
          .where(where)
          .orderBy(asc(products.name))
          .limit(input.limit)
          .offset(offset);
        return { data, total: total ?? 0, page: input.page, limit: input.limit };
      },
    ),

  createProduct: orgAuthed
    .route({
      method: "POST",
      path: "/inventory/products",
      summary: "Create product",
      tags: ["Inventory"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        sku: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        costPrice: z.number().optional(),
        sellingPrice: z.number().optional(),
        unit: z.string().optional(),
        minStockLevel: z.number().optional(),
        currentStock: z.number().optional(),
        barcode: z.string().optional(),
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
          category?: string;
          costPrice?: number;
          sellingPrice?: number;
          unit?: string;
          minStockLevel?: number;
          currentStock?: number;
          barcode?: string;
        };
      }) => {
        const db = getDb(context);
        const [product] = await db
          .insert(products)
          .values({
            organizationId: context.organization.id,
            name: input.name,
            sku: input.sku,
            description: input.description,
            category: input.category,
            costPrice: input.costPrice ? String(input.costPrice) : null,
            sellingPrice: input.sellingPrice ? String(input.sellingPrice) : null,
            unit: input.unit ?? "units",
            minStockLevel: input.minStockLevel ?? 0,
            currentStock: input.currentStock ?? 0,
            barcode: input.barcode,
            createdById: context.user.id,
          })
          .returning();
        return product;
      },
    ),

  updateProduct: orgAuthed
    .route({
      method: "PATCH",
      path: "/inventory/products/:id",
      summary: "Update product",
      tags: ["Inventory"],
    })
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["active", "inactive", "discontinued"]).optional(),
        costPrice: z.number().optional(),
        sellingPrice: z.number().optional(),
        currentStock: z.number().optional(),
        minStockLevel: z.number().optional(),
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
          id: string;
          name?: string;
          description?: string;
          status?: "active" | "inactive" | "discontinued";
          costPrice?: number;
          sellingPrice?: number;
          currentStock?: number;
          minStockLevel?: number;
        };
      }) => {
        const db = getDb(context);
        const { id, costPrice, sellingPrice, ...rest } = input;
        const [product] = await db
          .update(products)
          .set({
            ...rest,
            ...(costPrice !== undefined ? { costPrice: String(costPrice) } : {}),
            ...(sellingPrice !== undefined ? { sellingPrice: String(sellingPrice) } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(products.id, id),
              eq(products.organizationId, context.organization.id),
            ),
          )
          .returning();
        return product;
      },
    ),

  deleteProduct: orgAuthed
    .route({
      method: "DELETE",
      path: "/inventory/products/:id",
      summary: "Delete product",
      tags: ["Inventory"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { id: string };
      }) => {
        const db = getDb(context);
        await db
          .update(products)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(products.id, input.id),
              eq(products.organizationId, context.organization.id),
            ),
          );
        return { success: true };
      },
    ),

  // ── Stats ───────────────────────────────────────────────────────────────────

  stats: orgAuthed
    .route({
      method: "GET",
      path: "/inventory/stats",
      summary: "Inventory stats",
      tags: ["Inventory"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const orgWhere = and(
        eq(products.organizationId, context.organization.id),
        isNull(products.deletedAt),
      );
      const [totalResult] = await db
        .select({ total: count() })
        .from(products)
        .where(orgWhere);
      const [lowStockResult] = await db
        .select({ total: count() })
        .from(products)
        .where(and(orgWhere, sql`${products.currentStock} <= ${products.minStockLevel}`));
      const [outOfStockResult] = await db
        .select({ total: count() })
        .from(products)
        .where(and(orgWhere, sql`${products.currentStock} = 0`));
      return {
        totalProducts: totalResult?.total ?? 0,
        lowStockCount: lowStockResult?.total ?? 0,
        outOfStockCount: outOfStockResult?.total ?? 0,
      };
    }),

  // ── Alerts ──────────────────────────────────────────────────────────────────

  listAlerts: orgAuthed
    .route({
      method: "GET",
      path: "/inventory/alerts",
      summary: "List stock alerts",
      tags: ["Inventory"],
    })
    .input(
      z.object({
        limit: z.number().default(20),
        resolved: z.boolean().optional(),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { limit: number; resolved?: boolean };
      }) => {
        const db = getDb(context);
        const conditions: any[] = [
          eq(stockAlerts.organizationId, context.organization.id),
        ];
        if (input.resolved !== undefined) {
          conditions.push(eq(stockAlerts.isResolved, input.resolved));
        }
        const where = and(...conditions);
        const [{ total }] = await db
          .select({ total: count() })
          .from(stockAlerts)
          .where(where);
        const data = await db
          .select()
          .from(stockAlerts)
          .where(where)
          .orderBy(desc(stockAlerts.createdAt))
          .limit(input.limit);
        return { data, total: total ?? 0 };
      },
    ),

  // ── Suppliers ────────────────────────────────────────────────────────────────

  listSuppliers: orgAuthed
    .route({
      method: "GET",
      path: "/inventory/suppliers",
      summary: "List suppliers",
      tags: ["Inventory"],
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
        // Suppliers table not yet in schema – return empty list with correct shape
        return { data: [], total: 0 };
      },
    ),

  createSupplier: orgAuthed
    .route({
      method: "POST",
      path: "/inventory/suppliers",
      summary: "Create supplier",
      tags: ["Inventory"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        contact: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(["active", "inactive"]).default("active"),
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
          contact?: string;
          email?: string;
          phone?: string;
          address?: string;
          category?: string;
          status: "active" | "inactive";
        };
      }) => {
        // Suppliers table not yet in schema – return mock created record
        return {
          id: crypto.randomUUID(),
          organizationId: context.organization.id,
          ...input,
          rating: 0,
          orders: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
        };
      },
    ),

  // ── Warehouses ───────────────────────────────────────────────────────────────

  listWarehouses: orgAuthed
    .route({
      method: "GET",
      path: "/inventory/warehouses",
      summary: "List warehouses",
      tags: ["Inventory"],
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
        // Warehouses table not yet in schema – return empty list with correct shape
        return { data: [], total: 0 };
      },
    ),

  createWarehouse: orgAuthed
    .route({
      method: "POST",
      path: "/inventory/warehouses",
      summary: "Create warehouse",
      tags: ["Inventory"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        code: z.string().min(1).max(20),
        address: z.string().optional(),
        manager: z.string().optional(),
        type: z.string().optional(),
        capacity: z.number().optional(),
        status: z.enum(["active", "inactive"]).default("active"),
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
          code: string;
          address?: string;
          manager?: string;
          type?: string;
          capacity?: number;
          status: "active" | "inactive";
        };
      }) => {
        return {
          id: crypto.randomUUID(),
          organizationId: context.organization.id,
          ...input,
          used: 0,
          products: 0,
          createdAt: new Date().toISOString(),
        };
      },
    ),

  // ── Purchase Orders ──────────────────────────────────────────────────────────

  listPurchaseOrders: orgAuthed
    .route({
      method: "GET",
      path: "/inventory/purchase-orders",
      summary: "List purchase orders",
      tags: ["Inventory"],
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
        // Purchase orders table not yet in schema – return empty list with correct shape
        return { data: [], total: 0 };
      },
    ),

  createPurchaseOrder: orgAuthed
    .route({
      method: "POST",
      path: "/inventory/purchase-orders",
      summary: "Create purchase order",
      tags: ["Inventory"],
    })
    .input(
      z.object({
        supplier: z.string().min(1),
        items: z.number().min(1),
        total: z.number().optional(),
        expectedAt: z.string().optional(),
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
          supplier: string;
          items: number;
          total?: number;
          expectedAt?: string;
          notes?: string;
        };
      }) => {
        const now = new Date();
        return {
          id: `PO-${now.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          organizationId: context.organization.id,
          ...input,
          status: "draft",
          createdAt: now.toISOString(),
        };
      },
    ),

  // ── Storage Locations ────────────────────────────────────────────────────────

  listLocations: orgAuthed
    .route({
      method: "GET",
      path: "/inventory/locations",
      summary: "List storage locations",
      tags: ["Inventory"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        warehouse: z.string().optional(),
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
        input: { page: number; limit: number; warehouse?: string; search?: string };
      }) => {
        // Locations table not yet in schema – return empty list with correct shape
        return { data: [], total: 0 };
      },
    ),

  // ── Stock Transfers ──────────────────────────────────────────────────────────

  listTransfers: orgAuthed
    .route({
      method: "GET",
      path: "/inventory/transfers",
      summary: "List stock transfers",
      tags: ["Inventory"],
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
        const db = getDb(context);
        const conditions: any[] = [
          eq(stockMovements.organizationId, context.organization.id),
          sql`${stockMovements.type} = 'transfer'`,
        ];
        if (input.status) {
          conditions.push(eq(stockMovements.reason, input.status));
        }
        const where = and(...conditions);
        const [{ total }] = await db
          .select({ total: count() })
          .from(stockMovements)
          .where(where);
        const offset = (input.page - 1) * input.limit;
        const data = await db
          .select()
          .from(stockMovements)
          .where(where)
          .orderBy(desc(stockMovements.createdAt))
          .limit(input.limit)
          .offset(offset);
        return { data, total: total ?? 0 };
      },
    ),

  createTransfer: orgAuthed
    .route({
      method: "POST",
      path: "/inventory/transfers",
      summary: "Create stock transfer",
      tags: ["Inventory"],
    })
    .input(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().min(1),
        fromLocation: z.string().optional(),
        toLocation: z.string().optional(),
        reason: z.string().optional(),
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
          productId: string;
          quantity: number;
          fromLocation?: string;
          toLocation?: string;
          reason?: string;
        };
      }) => {
        const db = getDb(context);
        const [movement] = await db
          .insert(stockMovements)
          .values({
            organizationId: context.organization.id,
            productId: input.productId,
            type: "transfer",
            quantity: input.quantity,
            fromLocation: input.fromLocation,
            toLocation: input.toLocation,
            reason: input.reason ?? "transfer",
            performedById: context.user.id,
          })
          .returning();
        return movement;
      },
    ),

  // ── Valuation Report ─────────────────────────────────────────────────────────

  valuation: orgAuthed
    .route({
      method: "GET",
      path: "/inventory/valuation",
      summary: "Stock valuation report",
      tags: ["Inventory"],
    })
    .input(
      z.object({
        method: z.enum(["fifo", "lifo", "average"]).default("average"),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number(), totalValue: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { method: "fifo" | "lifo" | "average" };
      }) => {
        const db = getDb(context);
        const orgWhere = and(
          eq(products.organizationId, context.organization.id),
          isNull(products.deletedAt),
          sql`${products.currentStock} > 0`,
        );
        const [{ total }] = await db
          .select({ total: count() })
          .from(products)
          .where(orgWhere);
        const productRows = await db
          .select()
          .from(products)
          .where(orgWhere)
          .orderBy(asc(products.name));

        const data = productRows.map((p: typeof productRows[0]) => {
          const costPrice = p.costPrice ? parseFloat(String(p.costPrice)) : 0;
          const totalValue = costPrice * p.currentStock;
          return {
            id: p.id,
            sku: p.sku ?? "",
            name: p.name,
            quantity: p.currentStock,
            avgCost: costPrice,
            lastCost: costPrice,
            totalValue,
          };
        });

        const totalValue = data.reduce(
          (sum: number, item: { totalValue: number }) => sum + item.totalValue,
          0,
        );
        return { data, total: total ?? 0, totalValue };
      },
    ),

  // ── Serial Number Tracking ───────────────────────────────────────────────────

  listSerial: orgAuthed
    .route({
      method: "GET",
      path: "/inventory/serial",
      summary: "Serial number tracking",
      tags: ["Inventory"],
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
        // Serial number table not yet in schema – return empty list with correct shape
        return { data: [], total: 0 };
      },
    ),

  // ── Batch / Lot Tracking ─────────────────────────────────────────────────────

  listBatch: orgAuthed
    .route({
      method: "GET",
      path: "/inventory/batch",
      summary: "Batch/lot tracking",
      tags: ["Inventory"],
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
        // Batch/lot table not yet in schema – return empty list with correct shape
        return { data: [], total: 0 };
      },
    ),
};
