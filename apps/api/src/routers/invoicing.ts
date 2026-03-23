/**
 * Invoicing Router
 *
 * Invoices, quotes, payments, expenses, vendors, recurring, purchase orders,
 * chart of accounts, tax rates, and financial reports.
 */

import { and, count, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed, schema } from "../procedures";

export const invoicingRouter = {
  // ── Invoices ─────────────────────────────────────────────────────────────────

  listInvoices: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/invoices",
      summary: "List invoices (paginated)",
      tags: ["Invoicing"],
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

        const conditions = [
          eq(schema.invoices.organizationId, orgId),
          isNull(schema.invoices.deletedAt),
        ];

        if (input.status) {
          conditions.push(
            eq(
              schema.invoices.status,
              input.status as "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled",
            ),
          );
        }
        if (input.search) {
          conditions.push(ilike(schema.invoices.clientEmail, `%${input.search}%`));
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(schema.invoices)
            .where(where)
            .orderBy(desc(schema.invoices.createdAt))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ total: count() })
            .from(schema.invoices)
            .where(where),
        ]);

        return { data, total };
      },
    ),

  createInvoice: orgAuthed
    .route({
      method: "POST",
      path: "/invoicing/invoices",
      summary: "Create invoice",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        client: z.string().min(1),
        clientEmail: z.string().email(),
        amount: z.number().min(0),
        taxRate: z.number().min(0).default(0),
        dueDate: z.string().optional(),
        items: z
          .array(
            z.object({
              description: z.string(),
              quantity: z.number(),
              rate: z.number(),
            }),
          )
          .optional(),
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
          client: string;
          clientEmail: string;
          amount: number;
          taxRate: number;
          dueDate?: string;
          items?: Array<{ description: string; quantity: number; rate: number }>;
          notes?: string;
        };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const now = new Date();
        const year = now.getFullYear();
        const num = String(Math.floor(Math.random() * 9000) + 1000);
        const tax = (input.amount * input.taxRate) / 100;
        const total = input.amount + tax;

        const [invoice] = await db
          .insert(schema.invoices)
          .values({
            organizationId: orgId,
            invoiceNumber: `INV-${year}-${num}`,
            clientName: input.client,
            clientEmail: input.clientEmail,
            subtotal: input.amount.toString(),
            taxAmount: tax.toString(),
            total: total.toString(),
            dueDate: input.dueDate ?? null,
            notes: input.notes,
            items: input.items ?? [],
            status: "draft",
            issueDate: now.toISOString().split("T")[0],
          })
          .returning();

        return invoice;
      },
    ),

  getInvoice: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/invoices/:id",
      summary: "Get invoice by id",
      tags: ["Invoicing"],
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

        const [invoice] = await db
          .select()
          .from(schema.invoices)
          .where(
            and(
              eq(schema.invoices.id, input.id),
              eq(schema.invoices.organizationId, orgId),
              isNull(schema.invoices.deletedAt),
            ),
          )
          .limit(1);

        return invoice ?? null;
      },
    ),

  updateInvoice: orgAuthed
    .route({
      method: "PUT",
      path: "/invoicing/invoices/:id",
      summary: "Update invoice",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["draft", "sent", "paid", "overdue", "void"]).optional(),
        client: z.string().optional(),
        clientEmail: z.string().email().optional(),
        amount: z.number().min(0).optional(),
        dueDate: z.string().optional(),
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
          id: string;
          status?: "draft" | "sent" | "paid" | "overdue" | "void";
          client?: string;
          clientEmail?: string;
          amount?: number;
          dueDate?: string;
          notes?: string;
        };
      }) => {
        return { id: input.id, ...input, updatedAt: new Date().toISOString() };
      },
    ),

  deleteInvoice: orgAuthed
    .route({
      method: "DELETE",
      path: "/invoicing/invoices/:id",
      summary: "Delete invoice",
      tags: ["Invoicing"],
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

  // ── Quotes ───────────────────────────────────────────────────────────────────

  listQuotes: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/quotes",
      summary: "List quotes",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
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
        input: { page: number; limit: number; status?: string };
      }) => {
        return { data: [], total: 0 };
      },
    ),

  createQuote: orgAuthed
    .route({
      method: "POST",
      path: "/invoicing/quotes",
      summary: "Create quote",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        client: z.string().min(1),
        clientEmail: z.string().email(),
        amount: z.number().min(0),
        validForDays: z.number().default(30),
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
          client: string;
          clientEmail: string;
          amount: number;
          validForDays: number;
          notes?: string;
        };
      }) => {
        const now = new Date();
        const validUntil = new Date(now);
        validUntil.setDate(validUntil.getDate() + input.validForDays);
        const year = now.getFullYear();
        const num = String(Math.floor(Math.random() * 9000) + 1000);
        return {
          id: crypto.randomUUID(),
          organizationId: context.organization.id,
          quoteNumber: `QT-${year}-${num}`,
          ...input,
          status: "draft",
          validUntil: validUntil.toISOString(),
          createdById: context.user.id,
          createdAt: now.toISOString(),
        };
      },
    ),

  // ── Payments ─────────────────────────────────────────────────────────────────

  listPayments: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/payments",
      summary: "List payments",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        status: z.string().optional(),
        method: z.string().optional(),
      }),
    )
    .output(z.object({ data: z.array(z.any()), total: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; status?: string; method?: string };
      }) => {
        return { data: [], total: 0 };
      },
    ),

  // ── Expenses ─────────────────────────────────────────────────────────────────

  listExpenses: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/expenses",
      summary: "List expenses",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
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
        input: { page: number; limit: number; category?: string; status?: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const conditions = [eq(schema.invoiceExpenses.organizationId, orgId)];

        if (input.category) {
          conditions.push(eq(schema.invoiceExpenses.category, input.category));
        }
        if (input.status) {
          conditions.push(
            eq(
              schema.invoiceExpenses.status,
              input.status as "pending" | "approved" | "rejected",
            ),
          );
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(schema.invoiceExpenses)
            .where(where)
            .orderBy(desc(schema.invoiceExpenses.createdAt))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ total: count() })
            .from(schema.invoiceExpenses)
            .where(where),
        ]);

        return { data, total };
      },
    ),

  createExpense: orgAuthed
    .route({
      method: "POST",
      path: "/invoicing/expenses",
      summary: "Create expense",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        description: z.string().min(1),
        category: z.string().min(1),
        amount: z.number().min(0),
        vendor: z.string().optional(),
        date: z.string().optional(),
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
          description: string;
          category: string;
          amount: number;
          vendor?: string;
          date?: string;
          notes?: string;
        };
      }) => {
        const now = new Date();
        return {
          id: crypto.randomUUID(),
          organizationId: context.organization.id,
          ...input,
          date: input.date ?? now.toISOString(),
          status: "pending",
          receipt: false,
          createdById: context.user.id,
          createdAt: now.toISOString(),
        };
      },
    ),

  // ── Vendors ──────────────────────────────────────────────────────────────────

  listVendors: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/vendors",
      summary: "List vendors",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
        category: z.string().optional(),
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
        input: { page: number; limit: number; category?: string; search?: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const conditions = [
          eq(schema.invoiceVendors.organizationId, orgId),
          isNull(schema.invoiceVendors.deletedAt),
        ];

        if (input.search) {
          conditions.push(ilike(schema.invoiceVendors.name, `%${input.search}%`));
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(schema.invoiceVendors)
            .where(where)
            .orderBy(desc(schema.invoiceVendors.createdAt))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ total: count() })
            .from(schema.invoiceVendors)
            .where(where),
        ]);

        return { data, total };
      },
    ),

  createVendor: orgAuthed
    .route({
      method: "POST",
      path: "/invoicing/vendors",
      summary: "Create vendor",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        category: z.string().optional(),
        address: z.string().optional(),
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
          email?: string;
          phone?: string;
          category?: string;
          address?: string;
          status: "active" | "inactive";
        };
      }) => {
        return {
          id: crypto.randomUUID(),
          organizationId: context.organization.id,
          ...input,
          totalPaid: 0,
          pendingPayments: 0,
          createdAt: new Date().toISOString(),
        };
      },
    ),

  // ── Recurring Invoices ───────────────────────────────────────────────────────

  listRecurring: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/recurring",
      summary: "List recurring invoices",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
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
        input: { page: number; limit: number; status?: string };
      }) => {
        return { data: [], total: 0 };
      },
    ),

  // ── Purchase Orders ───────────────────────────────────────────────────────────

  listPurchaseOrders: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/purchase-orders",
      summary: "List purchase orders",
      tags: ["Invoicing"],
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

  // ── Chart of Accounts ─────────────────────────────────────────────────────────

  listAccounts: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/accounts",
      summary: "List chart of accounts",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(200),
        type: z.string().optional(),
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
        input: { page: number; limit: number; type?: string; search?: string };
      }) => {
        return { data: [], total: 0 };
      },
    ),

  // ── Tax Rates ─────────────────────────────────────────────────────────────────

  listTaxes: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/taxes",
      summary: "List tax rates",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
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
        input: { page: number; limit: number; status?: string };
      }) => {
        return { data: [], total: 0 };
      },
    ),

  // ── Stats ─────────────────────────────────────────────────────────────────────

  stats: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/stats",
      summary: "Revenue and AR summary stats",
      tags: ["Invoicing"],
    })
    .input(z.object({}).optional())
    .output(z.any())
    .handler(async ({ context }: { context: OrgContext }) => {
      const db = getDb(context);
      const orgId = context.organization.id;

      const [invoiceStats, expenseStats] = await Promise.all([
        db
          .select({
            totalRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${schema.invoices.status} = 'paid' THEN ${schema.invoices.total} ELSE 0 END), 0)`,
            outstanding: sql<string>`COALESCE(SUM(CASE WHEN ${schema.invoices.status} IN ('sent', 'viewed') THEN ${schema.invoices.total} ELSE 0 END), 0)`,
            overdue: sql<string>`COALESCE(SUM(CASE WHEN ${schema.invoices.status} = 'overdue' THEN ${schema.invoices.total} ELSE 0 END), 0)`,
            paidInvoices: sql<number>`COUNT(CASE WHEN ${schema.invoices.status} = 'paid' THEN 1 END)`,
            draftInvoices: sql<number>`COUNT(CASE WHEN ${schema.invoices.status} = 'draft' THEN 1 END)`,
            sentInvoices: sql<number>`COUNT(CASE WHEN ${schema.invoices.status} IN ('sent', 'viewed') THEN 1 END)`,
            overdueInvoices: sql<number>`COUNT(CASE WHEN ${schema.invoices.status} = 'overdue' THEN 1 END)`,
          })
          .from(schema.invoices)
          .where(
            and(
              eq(schema.invoices.organizationId, orgId),
              isNull(schema.invoices.deletedAt),
            ),
          ),
        db
          .select({
            total: sql<string>`COALESCE(SUM(${schema.invoiceExpenses.amount}), 0)`,
          })
          .from(schema.invoiceExpenses)
          .where(eq(schema.invoiceExpenses.organizationId, orgId)),
      ]);

      const inv = invoiceStats[0] ?? {
        totalRevenue: "0",
        outstanding: "0",
        overdue: "0",
        paidInvoices: 0,
        draftInvoices: 0,
        sentInvoices: 0,
        overdueInvoices: 0,
      };

      return {
        totalRevenue: Number(inv.totalRevenue),
        outstanding: Number(inv.outstanding),
        overdue: Number(inv.overdue),
        expenses: Number(expenseStats[0]?.total ?? 0),
        paidInvoices: Number(inv.paidInvoices),
        draftInvoices: Number(inv.draftInvoices),
        sentInvoices: Number(inv.sentInvoices),
        overdueInvoices: Number(inv.overdueInvoices),
      };
    }),

  // ── Reports ───────────────────────────────────────────────────────────────────

  reportPL: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/reports/pl",
      summary: "Profit & loss report",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        dateRange: z.enum(["q1", "q2", "q3", "q4", "ytd", "fy"]).default("ytd"),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { dateRange: string };
      }) => {
        return {
          dateRange: input.dateRange,
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0,
          revenueBreakdown: [],
          expenseBreakdown: [],
          monthlyData: [],
        };
      },
    ),

  reportCashflow: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/reports/cashflow",
      summary: "Cash flow report",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        dateRange: z.enum(["q1", "q2", "q3", "q4", "ytd"]).default("ytd"),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { dateRange: string };
      }) => {
        return {
          dateRange: input.dateRange,
          operatingCashFlow: 0,
          investingCashFlow: 0,
          financingCashFlow: 0,
          netCashFlow: 0,
          beginningCash: 0,
          endingCash: 0,
          monthlyData: [],
        };
      },
    ),

  reportBalance: orgAuthed
    .route({
      method: "GET",
      path: "/invoicing/reports/balance",
      summary: "Balance sheet report",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        asOf: z.string().optional(),
      }),
    )
    .output(z.any())
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { asOf?: string };
      }) => {
        return {
          asOf: input.asOf ?? new Date().toISOString(),
          totalAssets: 0,
          totalLiabilities: 0,
          totalEquity: 0,
          assets: [],
          liabilities: [],
          equity: [],
        };
      },
    ),
};
