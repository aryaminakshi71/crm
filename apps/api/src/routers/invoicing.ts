/**
 * Invoicing Router
 *
 * Invoices, quotes, payments, expenses, vendors, recurring, purchase orders,
 * chart of accounts, tax rates, and financial reports.
 */

import { and, count, desc, eq, gte, ilike, isNull, lte, sql } from "drizzle-orm";
import {
  invoiceAccounts,
  invoiceExpenses,
  invoicePayments,
  invoiceQuotes,
  invoiceRecurring,
  invoices,
  invoiceTaxRates,
  invoiceVendors,
} from "@crm/storage/schema";
import { z } from "zod";
import type { OrgContext } from "../context";
import { getDb, orgAuthed } from "../procedures";

// Helper: resolve date boundaries for a given dateRange token
function getDateBounds(dateRange: string): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  switch (dateRange) {
    case "q1":
      return { start: new Date(year, 0, 1), end: new Date(year, 2, 31, 23, 59, 59) };
    case "q2":
      return { start: new Date(year, 3, 1), end: new Date(year, 5, 30, 23, 59, 59) };
    case "q3":
      return { start: new Date(year, 6, 1), end: new Date(year, 8, 30, 23, 59, 59) };
    case "q4":
      return { start: new Date(year, 9, 1), end: new Date(year, 11, 31, 23, 59, 59) };
    case "fy":
      return { start: new Date(year - 1, 6, 1), end: new Date(year, 5, 30, 23, 59, 59) };
    case "ytd":
    default:
      return { start: new Date(year, 0, 1), end: now };
  }
}

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
          eq(invoices.organizationId, orgId),
          isNull(invoices.deletedAt),
        ];

        if (input.status) {
          conditions.push(
            eq(
              invoices.status,
              input.status as "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled",
            ),
          );
        }
        if (input.search) {
          conditions.push(ilike(invoices.clientEmail, `%${input.search}%`));
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(invoices)
            .where(where)
            .orderBy(desc(invoices.createdAt))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ total: count() })
            .from(invoices)
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
          .insert(invoices)
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
          .from(invoices)
          .where(
            and(
              eq(invoices.id, input.id),
              eq(invoices.organizationId, orgId),
              isNull(invoices.deletedAt),
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
        status: z.enum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"]).optional(),
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
          status?: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";
          client?: string;
          clientEmail?: string;
          amount?: number;
          dueDate?: string;
          notes?: string;
        };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const updates: Record<string, unknown> = {
          updatedAt: new Date(),
        };

        if (input.status !== undefined) {
          updates.status = input.status;
          if (input.status === "paid") {
            updates.paidAt = new Date();
          }
        }
        if (input.client !== undefined) updates.clientName = input.client;
        if (input.clientEmail !== undefined) updates.clientEmail = input.clientEmail;
        if (input.amount !== undefined) {
          updates.subtotal = input.amount.toString();
          updates.total = input.amount.toString();
        }
        if (input.dueDate !== undefined) updates.dueDate = input.dueDate;
        if (input.notes !== undefined) updates.notes = input.notes;

        const [updated] = await db
          .update(invoices)
          .set(updates as any)
          .where(
            and(
              eq(invoices.id, input.id),
              eq(invoices.organizationId, orgId),
              isNull(invoices.deletedAt),
            ),
          )
          .returning();

        return updated ?? null;
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
        const db = getDb(context);
        const orgId = context.organization.id;

        await db
          .update(invoices)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(invoices.id, input.id),
              eq(invoices.organizationId, orgId),
              isNull(invoices.deletedAt),
            ),
          );

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
    .output(z.object({ data: z.array(z.any()), total: z.number(), page: z.number(), limit: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; status?: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const conditions = [eq(invoiceQuotes.organizationId, orgId)];

        if (input.status) {
          conditions.push(
            eq(
              invoiceQuotes.status,
              input.status as "draft" | "sent" | "accepted" | "rejected" | "expired",
            ),
          );
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(invoiceQuotes)
            .where(where)
            .orderBy(desc(invoiceQuotes.createdAt))
            .limit(input.limit)
            .offset(offset),
          db.select({ total: count() }).from(invoiceQuotes).where(where),
        ]);

        return { data, total, page: input.page, limit: input.limit };
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
        const db = getDb(context);
        const orgId = context.organization.id;

        const now = new Date();
        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + input.validForDays);
        const year = now.getFullYear();
        const num = String(Math.floor(Math.random() * 9000) + 1000);

        const [quote] = await db
          .insert(invoiceQuotes)
          .values({
            organizationId: orgId,
            quoteNumber: `QT-${year}-${num}`,
            clientName: input.client,
            clientEmail: input.clientEmail,
            subtotal: input.amount.toString(),
            total: input.amount.toString(),
            status: "draft",
            issueDate: now.toISOString().split("T")[0],
            expiryDate: expiryDate.toISOString().split("T")[0],
            notes: input.notes,
          })
          .returning();

        return quote;
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
    .output(z.object({ data: z.array(z.any()), total: z.number(), page: z.number(), limit: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; status?: string; method?: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const conditions = [eq(invoicePayments.organizationId, orgId)];

        if (input.method) {
          conditions.push(
            eq(
              invoicePayments.method,
              input.method as "cash" | "card" | "bank_transfer" | "check" | "crypto",
            ),
          );
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(invoicePayments)
            .where(where)
            .orderBy(desc(invoicePayments.createdAt))
            .limit(input.limit)
            .offset(offset),
          db.select({ total: count() }).from(invoicePayments).where(where),
        ]);

        return { data, total, page: input.page, limit: input.limit };
      },
    ),

  createPayment: orgAuthed
    .route({
      method: "POST",
      path: "/invoicing/payments",
      summary: "Record a payment against an invoice",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        invoiceId: z.string().uuid(),
        amount: z.number().min(0),
        method: z.enum(["cash", "card", "bank_transfer", "check", "crypto"]),
        reference: z.string().optional(),
        notes: z.string().optional(),
        paidAt: z.string().optional(),
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
          invoiceId: string;
          amount: number;
          method: "cash" | "card" | "bank_transfer" | "check" | "crypto";
          reference?: string;
          notes?: string;
          paidAt?: string;
        };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const [payment] = await db
          .insert(invoicePayments)
          .values({
            organizationId: orgId,
            invoiceId: input.invoiceId,
            amount: input.amount.toString(),
            method: input.method,
            reference: input.reference,
            notes: input.notes,
            paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
          })
          .returning();

        // Mark the linked invoice as paid
        await db
          .update(invoices)
          .set({ status: "paid", paidAt: new Date(), paidAmount: input.amount.toString() })
          .where(
            and(
              eq(invoices.id, input.invoiceId),
              eq(invoices.organizationId, orgId),
            ),
          );

        return payment;
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

        const conditions = [eq(invoiceExpenses.organizationId, orgId)];

        if (input.category) {
          conditions.push(eq(invoiceExpenses.category, input.category));
        }
        if (input.status) {
          conditions.push(
            eq(
              invoiceExpenses.status,
              input.status as "pending" | "approved" | "rejected",
            ),
          );
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(invoiceExpenses)
            .where(where)
            .orderBy(desc(invoiceExpenses.createdAt))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ total: count() })
            .from(invoiceExpenses)
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
        const db = getDb(context);
        const orgId = context.organization.id;

        const [expense] = await db
          .insert(invoiceExpenses)
          .values({
            organizationId: orgId,
            description: input.description,
            category: input.category,
            amount: input.amount.toString(),
            vendor: input.vendor,
            date: input.date ?? new Date().toISOString().split("T")[0],
            status: "pending",
          })
          .returning();

        return expense;
      },
    ),

  updateExpense: orgAuthed
    .route({
      method: "PUT",
      path: "/invoicing/expenses/:id",
      summary: "Update expense",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        amount: z.number().min(0).optional(),
        vendor: z.string().optional(),
        date: z.string().optional(),
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
          status?: "pending" | "approved" | "rejected";
          description?: string;
          category?: string;
          amount?: number;
          vendor?: string;
          date?: string;
        };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (input.status !== undefined) updates.status = input.status;
        if (input.description !== undefined) updates.description = input.description;
        if (input.category !== undefined) updates.category = input.category;
        if (input.amount !== undefined) updates.amount = input.amount.toString();
        if (input.vendor !== undefined) updates.vendor = input.vendor;
        if (input.date !== undefined) updates.date = input.date;

        const [updated] = await db
          .update(invoiceExpenses)
          .set(updates as any)
          .where(
            and(
              eq(invoiceExpenses.id, input.id),
              eq(invoiceExpenses.organizationId, orgId),
            ),
          )
          .returning();

        return updated ?? null;
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
          eq(invoiceVendors.organizationId, orgId),
          isNull(invoiceVendors.deletedAt),
        ];

        if (input.search) {
          conditions.push(ilike(invoiceVendors.name, `%${input.search}%`));
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(invoiceVendors)
            .where(where)
            .orderBy(desc(invoiceVendors.createdAt))
            .limit(input.limit)
            .offset(offset),
          db
            .select({ total: count() })
            .from(invoiceVendors)
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
        address: z.string().optional(),
        paymentTerms: z.string().optional(),
        taxId: z.string().optional(),
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
          name: string;
          email?: string;
          phone?: string;
          address?: string;
          paymentTerms?: string;
          taxId?: string;
          notes?: string;
        };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const [vendor] = await db
          .insert(invoiceVendors)
          .values({
            organizationId: orgId,
            name: input.name,
            email: input.email,
            phone: input.phone,
            address: input.address ? { raw: input.address } : undefined,
            paymentTerms: input.paymentTerms,
            taxId: input.taxId,
            notes: input.notes,
          })
          .returning();

        return vendor;
      },
    ),

  updateVendor: orgAuthed
    .route({
      method: "PUT",
      path: "/invoicing/vendors/:id",
      summary: "Update vendor",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        paymentTerms: z.string().optional(),
        taxId: z.string().optional(),
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
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          paymentTerms?: string;
          taxId?: string;
          notes?: string;
        };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (input.name !== undefined) updates.name = input.name;
        if (input.email !== undefined) updates.email = input.email;
        if (input.phone !== undefined) updates.phone = input.phone;
        if (input.address !== undefined) updates.address = { raw: input.address };
        if (input.paymentTerms !== undefined) updates.paymentTerms = input.paymentTerms;
        if (input.taxId !== undefined) updates.taxId = input.taxId;
        if (input.notes !== undefined) updates.notes = input.notes;

        const [updated] = await db
          .update(invoiceVendors)
          .set(updates as any)
          .where(
            and(
              eq(invoiceVendors.id, input.id),
              eq(invoiceVendors.organizationId, orgId),
              isNull(invoiceVendors.deletedAt),
            ),
          )
          .returning();

        return updated ?? null;
      },
    ),

  deleteVendor: orgAuthed
    .route({
      method: "DELETE",
      path: "/invoicing/vendors/:id",
      summary: "Delete vendor",
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
        const db = getDb(context);
        const orgId = context.organization.id;

        await db
          .update(invoiceVendors)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(invoiceVendors.id, input.id),
              eq(invoiceVendors.organizationId, orgId),
              isNull(invoiceVendors.deletedAt),
            ),
          );

        return { success: true };
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
    .output(z.object({ data: z.array(z.any()), total: z.number(), page: z.number(), limit: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; status?: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const conditions = [eq(invoiceRecurring.organizationId, orgId)];

        // status filter: "active" | "inactive" maps to isActive boolean
        if (input.status === "active") {
          conditions.push(eq(invoiceRecurring.isActive, true));
        } else if (input.status === "inactive") {
          conditions.push(eq(invoiceRecurring.isActive, false));
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(invoiceRecurring)
            .where(where)
            .orderBy(desc(invoiceRecurring.createdAt))
            .limit(input.limit)
            .offset(offset),
          db.select({ total: count() }).from(invoiceRecurring).where(where),
        ]);

        return { data, total, page: input.page, limit: input.limit };
      },
    ),

  updateRecurring: orgAuthed
    .route({
      method: "PUT",
      path: "/invoicing/recurring/:id",
      summary: "Update recurring invoice",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional(),
        frequency: z.enum(["weekly", "monthly", "quarterly", "annually"]).optional(),
        nextIssueDate: z.string().optional(),
        isActive: z.boolean().optional(),
        items: z.array(z.any()).optional(),
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
          clientName?: string;
          clientEmail?: string;
          frequency?: "weekly" | "monthly" | "quarterly" | "annually";
          nextIssueDate?: string;
          isActive?: boolean;
          items?: Record<string, unknown>[];
        };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (input.name !== undefined) updates.name = input.name;
        if (input.clientName !== undefined) updates.clientName = input.clientName;
        if (input.clientEmail !== undefined) updates.clientEmail = input.clientEmail;
        if (input.frequency !== undefined) updates.frequency = input.frequency;
        if (input.nextIssueDate !== undefined) updates.nextIssueDate = input.nextIssueDate;
        if (input.isActive !== undefined) updates.isActive = input.isActive;
        if (input.items !== undefined) updates.items = input.items;

        const [updated] = await db
          .update(invoiceRecurring)
          .set(updates as any)
          .where(
            and(
              eq(invoiceRecurring.id, input.id),
              eq(invoiceRecurring.organizationId, orgId),
            ),
          )
          .returning();

        return updated ?? null;
      },
    ),

  // ── Purchase Orders ───────────────────────────────────────────────────────────
  // No dedicated purchase_orders table exists; surface expenses filtered by
  // category = 'purchase' as a best-effort purchase-order view.

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
    .output(z.object({ data: z.array(z.any()), total: z.number(), page: z.number(), limit: z.number() }))
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
          eq(invoiceExpenses.organizationId, orgId),
          eq(invoiceExpenses.category, "purchase"),
        ];

        if (input.status) {
          conditions.push(
            eq(
              invoiceExpenses.status,
              input.status as "pending" | "approved" | "rejected",
            ),
          );
        }
        if (input.search) {
          conditions.push(ilike(invoiceExpenses.description, `%${input.search}%`));
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(invoiceExpenses)
            .where(where)
            .orderBy(desc(invoiceExpenses.createdAt))
            .limit(input.limit)
            .offset(offset),
          db.select({ total: count() }).from(invoiceExpenses).where(where),
        ]);

        return { data, total, page: input.page, limit: input.limit };
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
    .output(z.object({ data: z.array(z.any()), total: z.number(), page: z.number(), limit: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; type?: string; search?: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const conditions = [
          eq(invoiceAccounts.organizationId, orgId),
          eq(invoiceAccounts.isActive, true),
        ];

        if (input.type) {
          conditions.push(
            eq(
              invoiceAccounts.type,
              input.type as "asset" | "liability" | "equity" | "revenue" | "expense",
            ),
          );
        }
        if (input.search) {
          conditions.push(ilike(invoiceAccounts.name, `%${input.search}%`));
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(invoiceAccounts)
            .where(where)
            .orderBy(desc(invoiceAccounts.createdAt))
            .limit(input.limit)
            .offset(offset),
          db.select({ total: count() }).from(invoiceAccounts).where(where),
        ]);

        return { data, total, page: input.page, limit: input.limit };
      },
    ),

  createAccount: orgAuthed
    .route({
      method: "POST",
      path: "/invoicing/accounts",
      summary: "Create chart-of-accounts entry",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
        code: z.string().optional(),
        description: z.string().optional(),
        balance: z.number().default(0),
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
          type: "asset" | "liability" | "equity" | "revenue" | "expense";
          code?: string;
          description?: string;
          balance: number;
        };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const [account] = await db
          .insert(invoiceAccounts)
          .values({
            organizationId: orgId,
            name: input.name,
            type: input.type,
            code: input.code,
            description: input.description,
            balance: input.balance.toString(),
            isActive: true,
          })
          .returning();

        return account;
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
    .output(z.object({ data: z.array(z.any()), total: z.number(), page: z.number(), limit: z.number() }))
    .handler(
      async ({
        context,
        input,
      }: {
        context: OrgContext;
        input: { page: number; limit: number; status?: string };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const conditions = [eq(invoiceTaxRates.organizationId, orgId)];

        // "active" / "inactive" maps to isActive
        if (input.status === "active") {
          conditions.push(eq(invoiceTaxRates.isActive, true));
        } else if (input.status === "inactive") {
          conditions.push(eq(invoiceTaxRates.isActive, false));
        }

        const where = and(...conditions);
        const offset = (input.page - 1) * input.limit;

        const [data, [{ total }]] = await Promise.all([
          db
            .select()
            .from(invoiceTaxRates)
            .where(where)
            .orderBy(desc(invoiceTaxRates.createdAt))
            .limit(input.limit)
            .offset(offset),
          db.select({ total: count() }).from(invoiceTaxRates).where(where),
        ]);

        return { data, total, page: input.page, limit: input.limit };
      },
    ),

  createTaxRate: orgAuthed
    .route({
      method: "POST",
      path: "/invoicing/taxes",
      summary: "Create tax rate",
      tags: ["Invoicing"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(255),
        rate: z.number().min(0).max(100),
        description: z.string().optional(),
        isDefault: z.boolean().default(false),
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
          rate: number;
          description?: string;
          isDefault: boolean;
        };
      }) => {
        const db = getDb(context);
        const orgId = context.organization.id;

        const [taxRate] = await db
          .insert(invoiceTaxRates)
          .values({
            organizationId: orgId,
            name: input.name,
            rate: input.rate.toString(),
            description: input.description,
            isDefault: input.isDefault,
            isActive: true,
          })
          .returning();

        return taxRate;
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
            totalRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.total} ELSE 0 END), 0)`,
            outstanding: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} IN ('sent', 'viewed') THEN ${invoices.total} ELSE 0 END), 0)`,
            overdue: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'overdue' THEN ${invoices.total} ELSE 0 END), 0)`,
            paidInvoices: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'paid' THEN 1 END)`,
            draftInvoices: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'draft' THEN 1 END)`,
            sentInvoices: sql<number>`COUNT(CASE WHEN ${invoices.status} IN ('sent', 'viewed') THEN 1 END)`,
            overdueInvoices: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'overdue' THEN 1 END)`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.organizationId, orgId),
              isNull(invoices.deletedAt),
            ),
          ),
        db
          .select({
            total: sql<string>`COALESCE(SUM(${invoiceExpenses.amount}), 0)`,
          })
          .from(invoiceExpenses)
          .where(eq(invoiceExpenses.organizationId, orgId)),
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
        const db = getDb(context);
        const orgId = context.organization.id;
        const { start, end } = getDateBounds(input.dateRange);

        const [revenueResult, expenseResult] = await Promise.all([
          db
            .select({
              total: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS NUMERIC)), 0)`,
            })
            .from(invoices)
            .where(
              and(
                eq(invoices.organizationId, orgId),
                eq(invoices.status, "paid"),
                isNull(invoices.deletedAt),
                gte(invoices.paidAt, start),
                lte(invoices.paidAt, end),
              ),
            ),
          db
            .select({
              total: sql<string>`COALESCE(SUM(CAST(${invoiceExpenses.amount} AS NUMERIC)), 0)`,
              byCategory: sql<string>`json_agg(json_build_object('category', ${invoiceExpenses.category}, 'total', SUM(CAST(${invoiceExpenses.amount} AS NUMERIC))))`,
            })
            .from(invoiceExpenses)
            .where(
              and(
                eq(invoiceExpenses.organizationId, orgId),
                eq(invoiceExpenses.status, "approved"),
                gte(invoiceExpenses.createdAt, start),
                lte(invoiceExpenses.createdAt, end),
              ),
            ),
        ]);

        const revenue = Number(revenueResult[0]?.total ?? 0);
        const expenses = Number(expenseResult[0]?.total ?? 0);
        const grossProfit = revenue - expenses;
        const netProfit = grossProfit;
        const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        // Monthly breakdown for the period
        const monthlyRevenue = await db
          .select({
            month: sql<string>`TO_CHAR(${invoices.paidAt}, 'YYYY-MM')`,
            revenue: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS NUMERIC)), 0)`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.organizationId, orgId),
              eq(invoices.status, "paid"),
              isNull(invoices.deletedAt),
              gte(invoices.paidAt, start),
              lte(invoices.paidAt, end),
            ),
          )
          .groupBy(sql`TO_CHAR(${invoices.paidAt}, 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(${invoices.paidAt}, 'YYYY-MM')`);

        const monthlyExpenses = await db
          .select({
            month: sql<string>`TO_CHAR(${invoiceExpenses.createdAt}, 'YYYY-MM')`,
            expenses: sql<string>`COALESCE(SUM(CAST(${invoiceExpenses.amount} AS NUMERIC)), 0)`,
          })
          .from(invoiceExpenses)
          .where(
            and(
              eq(invoiceExpenses.organizationId, orgId),
              eq(invoiceExpenses.status, "approved"),
              gte(invoiceExpenses.createdAt, start),
              lte(invoiceExpenses.createdAt, end),
            ),
          )
          .groupBy(sql`TO_CHAR(${invoiceExpenses.createdAt}, 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(${invoiceExpenses.createdAt}, 'YYYY-MM')`);

        // Merge monthly data
        const monthMap: Record<string, { month: string; revenue: number; expenses: number; profit: number }> = {};
        for (const row of monthlyRevenue) {
          const m = row.month ?? "unknown";
          monthMap[m] = { month: m, revenue: Number(row.revenue), expenses: 0, profit: 0 };
        }
        for (const row of monthlyExpenses) {
          const m = row.month ?? "unknown";
          if (!monthMap[m]) monthMap[m] = { month: m, revenue: 0, expenses: 0, profit: 0 };
          monthMap[m].expenses = Number(row.expenses);
        }
        const monthlyData = Object.values(monthMap)
          .sort((a, b) => a.month.localeCompare(b.month))
          .map((m) => ({ ...m, profit: m.revenue - m.expenses }));

        return {
          dateRange: input.dateRange,
          periodStart: start.toISOString(),
          periodEnd: end.toISOString(),
          totalRevenue: revenue,
          totalExpenses: expenses,
          grossProfit,
          netProfit,
          profitMargin: Math.round(profitMargin * 100) / 100,
          revenueBreakdown: [],
          expenseBreakdown: [],
          monthlyData,
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
        const db = getDb(context);
        const orgId = context.organization.id;
        const { start, end } = getDateBounds(input.dateRange);

        // Inflows: payments received (paid invoices) grouped by month
        const inflowRows = await db
          .select({
            month: sql<string>`TO_CHAR(${invoicePayments.paidAt}, 'YYYY-MM')`,
            inflow: sql<string>`COALESCE(SUM(CAST(${invoicePayments.amount} AS NUMERIC)), 0)`,
          })
          .from(invoicePayments)
          .where(
            and(
              eq(invoicePayments.organizationId, orgId),
              gte(invoicePayments.paidAt, start),
              lte(invoicePayments.paidAt, end),
            ),
          )
          .groupBy(sql`TO_CHAR(${invoicePayments.paidAt}, 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(${invoicePayments.paidAt}, 'YYYY-MM')`);

        // Outflows: approved expenses grouped by month
        const outflowRows = await db
          .select({
            month: sql<string>`TO_CHAR(${invoiceExpenses.createdAt}, 'YYYY-MM')`,
            outflow: sql<string>`COALESCE(SUM(CAST(${invoiceExpenses.amount} AS NUMERIC)), 0)`,
          })
          .from(invoiceExpenses)
          .where(
            and(
              eq(invoiceExpenses.organizationId, orgId),
              eq(invoiceExpenses.status, "approved"),
              gte(invoiceExpenses.createdAt, start),
              lte(invoiceExpenses.createdAt, end),
            ),
          )
          .groupBy(sql`TO_CHAR(${invoiceExpenses.createdAt}, 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(${invoiceExpenses.createdAt}, 'YYYY-MM')`);

        // Merge
        const monthMap: Record<string, { month: string; inflow: number; outflow: number; net: number }> = {};
        for (const row of inflowRows) {
          const m = row.month ?? "unknown";
          monthMap[m] = { month: m, inflow: Number(row.inflow), outflow: 0, net: 0 };
        }
        for (const row of outflowRows) {
          const m = row.month ?? "unknown";
          if (!monthMap[m]) monthMap[m] = { month: m, inflow: 0, outflow: 0, net: 0 };
          monthMap[m].outflow = Number(row.outflow);
        }
        const monthlyData = Object.values(monthMap)
          .sort((a, b) => a.month.localeCompare(b.month))
          .map((m) => ({ ...m, net: m.inflow - m.outflow }));

        const totalInflow = monthlyData.reduce((s, m) => s + m.inflow, 0);
        const totalOutflow = monthlyData.reduce((s, m) => s + m.outflow, 0);
        const netCashFlow = totalInflow - totalOutflow;

        return {
          dateRange: input.dateRange,
          periodStart: start.toISOString(),
          periodEnd: end.toISOString(),
          operatingCashFlow: netCashFlow,
          investingCashFlow: 0,
          financingCashFlow: 0,
          netCashFlow,
          beginningCash: 0,
          endingCash: netCashFlow,
          totalInflow,
          totalOutflow,
          monthlyData,
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
        const db = getDb(context);
        const orgId = context.organization.id;
        const asOfDate = input.asOf ? new Date(input.asOf) : new Date();

        // Assets: accounts of type 'asset' + outstanding invoices (receivables)
        const [assetAccounts, liabilityAccounts, equityAccounts, receivables, payables] =
          await Promise.all([
            db
              .select()
              .from(invoiceAccounts)
              .where(
                and(
                  eq(invoiceAccounts.organizationId, orgId),
                  eq(invoiceAccounts.type, "asset"),
                  eq(invoiceAccounts.isActive, true),
                ),
              ),
            db
              .select()
              .from(invoiceAccounts)
              .where(
                and(
                  eq(invoiceAccounts.organizationId, orgId),
                  eq(invoiceAccounts.type, "liability"),
                  eq(invoiceAccounts.isActive, true),
                ),
              ),
            db
              .select()
              .from(invoiceAccounts)
              .where(
                and(
                  eq(invoiceAccounts.organizationId, orgId),
                  eq(invoiceAccounts.type, "equity"),
                  eq(invoiceAccounts.isActive, true),
                ),
              ),
            // Accounts receivable: outstanding invoices as of date
            db
              .select({
                total: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS NUMERIC)), 0)`,
              })
              .from(invoices)
              .where(
                and(
                  eq(invoices.organizationId, orgId),
                  isNull(invoices.deletedAt),
                  sql`${invoices.status} IN ('sent', 'viewed', 'overdue')`,
                  lte(invoices.createdAt, asOfDate),
                ),
              ),
            // Accounts payable: pending/approved expenses as of date
            db
              .select({
                total: sql<string>`COALESCE(SUM(CAST(${invoiceExpenses.amount} AS NUMERIC)), 0)`,
              })
              .from(invoiceExpenses)
              .where(
                and(
                  eq(invoiceExpenses.organizationId, orgId),
                  sql`${invoiceExpenses.status} IN ('pending', 'approved')`,
                  lte(invoiceExpenses.createdAt, asOfDate),
                ),
              ),
          ]);

        type AccountRow = { name: string; code: string | null; balance: string | null };
        const accountBalance = (acc: AccountRow) => Number(acc.balance ?? 0);

        const assetAccountsTotal = (assetAccounts as AccountRow[]).reduce(
          (s: number, a: AccountRow) => s + accountBalance(a),
          0,
        );
        const receivablesTotal = Number(receivables[0]?.total ?? 0);
        const totalAssets = assetAccountsTotal + receivablesTotal;

        const liabilityAccountsTotal = (liabilityAccounts as AccountRow[]).reduce(
          (s: number, a: AccountRow) => s + accountBalance(a),
          0,
        );
        const payablesTotal = Number(payables[0]?.total ?? 0);
        const totalLiabilities = liabilityAccountsTotal + payablesTotal;

        const equityTotal = (equityAccounts as AccountRow[]).reduce(
          (s: number, a: AccountRow) => s + accountBalance(a),
          0,
        );
        const totalEquity = equityTotal + (totalAssets - totalLiabilities);

        const assets = [
          ...(assetAccounts as AccountRow[]).map((a: AccountRow) => ({
            name: a.name,
            code: a.code,
            balance: accountBalance(a),
          })),
          { name: "Accounts Receivable", code: "AR", balance: receivablesTotal },
        ];
        const liabilities = [
          ...(liabilityAccounts as AccountRow[]).map((a: AccountRow) => ({
            name: a.name,
            code: a.code,
            balance: accountBalance(a),
          })),
          { name: "Accounts Payable", code: "AP", balance: payablesTotal },
        ];
        const equity = (equityAccounts as AccountRow[]).map((a: AccountRow) => ({
          name: a.name,
          code: a.code,
          balance: accountBalance(a),
        }));

        return {
          asOf: asOfDate.toISOString(),
          totalAssets,
          totalLiabilities,
          totalEquity,
          assets,
          liabilities,
          equity,
        };
      },
    ),
};
