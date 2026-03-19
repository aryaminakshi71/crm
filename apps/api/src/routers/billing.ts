/**
 * Billing Router
 *
 * API for subscriptions, plans, invoices, payments, and usage tracking.
 */

import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import type { OrgContext } from "../context";
import { APIError, ErrorCode } from "../lib/errors";
import {
  getDb,
  orgAuthed,
  schema,
  adminOnly,
} from "../procedures";

const {
  organizations,
  users,
  featureFlags,
  plans,
  subscriptions,
  invoices,
  payments,
  usageRecords,
  modulePricing,
} = schema;

// ─── Plan Management (Admin Only) ────────────────────────────────────────────

const planSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  basePriceMonthly: z.number().min(0).default(0),
  basePriceAnnual: z.number().min(0).default(0),
  pricePerUserMonthly: z.number().min(0).default(0),
  pricePerUserAnnual: z.number().min(0).default(0),
  maxUsers: z.number().min(1).default(5),
  maxStorage: z.number().min(1).default(10),
  maxApiCalls: z.number().min(1).default(10000),
  features: z.array(z.string()).default([]),
  moduleAccess: z.array(z.string()).default([]),
  isPublic: z.boolean().default(true),
  trialDays: z.number().min(0).default(14),
});

export const billingRouter = {
  // ─── Public: Get Available Plans ──────────────────────────────────────────

  listPlans: orgAuthed
    .route({
      method: "GET",
      path: "/billing/plans",
      summary: "List available subscription plans",
      tags: ["Billing"],
    })
    .input(z.object({}))
    .handler(async ({ context }) => {
      const db = getDb(context);
      const allPlans = await db.query.plans.findMany({
        where: eq(plans.isPublic, true),
        orderBy: [desc(plans.createdAt)],
      });
      return { plans: allPlans };
    }),

  // ─── Organization Subscription ─────────────────────────────────────────────

  getSubscription: orgAuthed
    .route({
      method: "GET",
      path: "/billing/subscription",
      summary: "Get current organization subscription",
      tags: ["Billing"],
    })
    .input(z.object({}))
    .handler(async ({ context }) => {
      const db = getDb(context);
      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.organizationId, context.organization.id),
        with: {
          plan: true,
        },
      });

      if (!subscription) {
        return {
          subscription: null,
          isTrial: false,
          daysRemaining: 0,
        };
      }

      const now = new Date();
      const isTrial = subscription.status === "trialing" && subscription.trialEnd
        ? subscription.trialEnd > now
        : false;
      const daysRemaining = subscription.trialEnd
        ? Math.ceil((subscription.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        subscription,
        isTrial,
        daysRemaining: Math.max(0, daysRemaining),
      };
    }),

  createCheckoutSession: orgAuthed
    .route({
      method: "POST",
      path: "/billing/checkout",
      summary: "Create Stripe checkout session",
      tags: ["Billing"],
    })
    .input(
      z.object({
        planKey: z.string(),
        billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      }),
    )
    .handler(async ({ input, context }) => {
      // TODO: Implement actual Stripe checkout
      // For now return mock session
      const plan = await getDb(context)
        .query.plans.findFirst({
          where: eq(plans.key, input.planKey),
        });

      if (!plan) {
        throw new APIError(ErrorCode.NOT_FOUND, "Plan not found", 404);
      }

      return {
        sessionId: `cs_mock_${Date.now()}`,
        url: input.successUrl,
        // In real implementation:
        // const session = await stripe.checkout.sessions.create({
        //   mode: 'subscription',
        //   customer: subscription.stripeCustomerId,
        //   line_items: [{ price: input.billingCycle === 'monthly' ? plan.stripePriceIdMonthly : plan.stripePriceIdAnnual }],
        //   success_url: input.successUrl,
        //   cancel_url: input.cancelUrl,
        // });
      };
    }),

  portalSession: orgAuthed
    .route({
      method: "POST",
      path: "/billing/portal",
      summary: "Create Stripe customer portal session",
      tags: ["Billing"],
    })
    .input(
      z.object({
        returnUrl: z.string().url(),
      }),
    )
    .handler(async ({ input, context }) => {
      // TODO: Implement actual Stripe portal
      // const subscription = await getSubscription(context);
      // const session = await stripe.billingPortal.sessions.create({
      //   customer: subscription.stripeCustomerId,
      //   return_url: input.returnUrl,
      // });

      return {
        sessionId: `ps_mock_${Date.now()}`,
        url: input.returnUrl,
      };
    }),

  // ─── Usage Tracking ────────────────────────────────────────────────────────

  getUsage: orgAuthed
    .route({
      method: "GET",
      path: "/billing/usage",
      summary: "Get current billing period usage",
      tags: ["Billing"],
    })
    .input(z.object({}))
    .handler(async ({ context }) => {
      const db = getDb(context);
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.organizationId, context.organization.id),
        with: { plan: true },
      });

      if (!subscription) {
        return {
          usage: { apiCalls: 0, storageMb: 0, users: 0 },
          limits: { maxApiCalls: 10000, maxStorage: 10 * 1024, maxUsers: 5 },
          percentages: { apiCalls: 0, storage: 0, users: 0 },
        };
      }

      const usage = await db.query.usageRecords.findFirst({
        where: and(
          eq(usageRecords.organizationId, context.organization.id),
          gte(usageRecords.periodStart, periodStart),
          lte(usageRecords.periodEnd, periodEnd),
        ),
      });

      const limits = {
        maxApiCalls: subscription.plan.maxApiCalls,
        maxStorage: subscription.plan.maxStorage * 1024, // GB to MB
        maxUsers: subscription.plan.maxUsers,
      };

      const currentUsage = {
        apiCalls: usage?.apiCalls ?? 0,
        storageMb: usage?.storageMb ?? subscription.storageUsed,
        users: usage?.users ?? subscription.userCount,
      };

      return {
        usage: currentUsage,
        limits,
        percentages: {
          apiCalls: Math.round((currentUsage.apiCalls / limits.maxApiCalls) * 100),
          storage: Math.round((currentUsage.storageMb / limits.maxStorage) * 100),
          users: Math.round((currentUsage.users / limits.maxUsers) * 100),
        },
      };
    }),

  // ─── Module Access ─────────────────────────────────────────────────────────

  getModuleAccess: orgAuthed
    .route({
      method: "GET",
      path: "/billing/modules",
      summary: "Get enabled modules for organization",
      tags: ["Billing"],
    })
    .input(z.object({}))
    .handler(async ({ context }) => {
      const db = getDb(context);

      // Get subscription with plan
      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.organizationId, context.organization.id),
        with: { plan: true },
      });

      // Get all module flags
      const flags = await db.query.featureFlags.findMany({
        where: eq(featureFlags.organizationId, context.organization.id),
      });

      // Build module access map
      const moduleAccess: Record<string, { enabled: boolean; source: string }> = {};

      // Base modules (always available)
      const baseModules = ["crm", "notifications", "rbac"];
      for (const mod of baseModules) {
        moduleAccess[mod] = { enabled: true, source: "base" };
      }

      // Plan modules
      if (subscription?.plan?.moduleAccess) {
        for (const mod of subscription.plan.moduleAccess) {
          moduleAccess[mod] = { enabled: true, source: "plan" };
        }
      }

      // Subscription add-ons
      if (subscription?.enabledModules) {
        for (const mod of subscription.enabledModules) {
          moduleAccess[mod] = { enabled: true, source: "addon" };
        }
      }

      // Explicit flags (can disable even if in plan)
      for (const flag of flags) {
        moduleAccess[flag.moduleKey] = {
          enabled: flag.enabled,
          source: flag.enabled ? moduleAccess[flag.moduleKey]?.source ?? "flag" : "disabled",
        };
      }

      return { modules: moduleAccess };
    }),

  // ─── Invoices ──────────────────────────────────────────────────────────────

  listInvoices: orgAuthed
    .route({
      method: "GET",
      path: "/billing/invoices",
      summary: "List organization invoices",
      tags: ["Billing"],
    })
    .input(
      z.object({
        status: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = getDb(context);
      const conditions = [eq(invoices.organizationId, context.organization.id)];

      if (input.status) {
        conditions.push(eq(invoices.status, input.status));
      }

      const [results, total] = await Promise.all([
        db
          .select()
          .from(invoices)
          .where(and(...conditions))
          .orderBy(desc(invoices.createdAt))
          .limit(input.limit)
          .offset((input.page - 1) * input.limit),
        db
          .select({ count: count() })
          .from(invoices)
          .where(and(...conditions)),
      ]);

      return {
        invoices: results,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: total[0]?.count ?? 0,
          pages: Math.ceil((total[0]?.count ?? 0) / input.limit),
        },
      };
    }),

  getInvoice: orgAuthed
    .route({
      method: "GET",
      path: "/billing/invoices/:id",
      summary: "Get invoice by ID",
      tags: ["Billing"],
    })
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const db = getDb(context);
      const invoice = await db.query.invoices.findFirst({
        where: and(
          eq(invoices.id, input.id),
          eq(invoices.organizationId, context.organization.id),
        ),
        with: { payments: true },
      });

      if (!invoice) {
        throw new APIError(ErrorCode.NOT_FOUND, "Invoice not found", 404);
      }

      return { invoice };
    }),

  // ─── Payments ──────────────────────────────────────────────────────────────

  listPayments: orgAuthed
    .route({
      method: "GET",
      path: "/billing/payments",
      summary: "List organization payments",
      tags: ["Billing"],
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = getDb(context);

      const [results, total] = await Promise.all([
        db
          .select()
          .from(payments)
          .where(eq(payments.organizationId, context.organization.id))
          .orderBy(desc(payments.createdAt))
          .limit(input.limit)
          .offset((input.page - 1) * input.limit),
        db
          .select({ count: count() })
          .from(payments)
          .where(eq(payments.organizationId, context.organization.id)),
      ]);

      return {
        payments: results,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: total[0]?.count ?? 0,
          pages: Math.ceil((total[0]?.count ?? 0) / input.limit),
        },
      };
    }),

  // ─── Admin: Plan Management ─────────────────────────────────────────────────

  adminListPlans: adminOnly
    .route({
      method: "GET",
      path: "/admin/billing/plans",
      summary: "Admin: List all plans",
      tags: ["Admin", "Billing"],
    })
    .input(z.object({}))
    .handler(async ({ context }) => {
      const db = getDb(context);
      const allPlans = await db.select().from(plans).orderBy(plans.createdAt);
      return { plans: allPlans };
    }),

  adminCreatePlan: adminOnly
    .route({
      method: "POST",
      path: "/admin/billing/plans",
      summary: "Admin: Create plan",
      tags: ["Admin", "Billing"],
    })
    .input(planSchema)
    .handler(async ({ input, context }) => {
      const db = getDb(context);
      const [plan] = await db.insert(plans).values(input).returning();
      return { plan };
    }),

  adminUpdatePlan: adminOnly
    .route({
      method: "PATCH",
      path: "/admin/billing/plans/:key",
      summary: "Admin: Update plan",
      tags: ["Admin", "Billing"],
    })
    .input(planSchema.extend({ id: z.string().uuid().optional() }))
    .handler(async ({ input, context }) => {
      const db = getDb(context);
      const { id, ...data } = input;
      const [plan] = await db
        .update(plans)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(plans.key, input.key as string))
        .returning();
      return { plan };
    }),

  // ─── Admin: Organization Billing Overview ──────────────────────────────────

  adminListOrgSubscriptions: adminOnly
    .route({
      method: "GET",
      path: "/admin/billing/subscriptions",
      summary: "Admin: List all organization subscriptions",
      tags: ["Admin", "Billing"],
    })
    .input(
      z.object({
        status: z.string().optional(),
        planKey: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = getDb(context);
      const conditions = [];

      if (input.status) {
        conditions.push(eq(subscriptions.status, input.status));
      }
      if (input.planKey) {
        const plan = await db.query.plans.findFirst({
          where: eq(plans.key, input.planKey),
        });
        if (plan) {
          conditions.push(eq(subscriptions.planId, plan.id));
        }
      }

      const [results, total] = await Promise.all([
        db
          .select({
            subscription: subscriptions,
            organization: organizations,
            plan: plans,
          })
          .from(subscriptions)
          .innerJoin(organizations, eq(subscriptions.organizationId, organizations.id))
          .innerJoin(plans, eq(subscriptions.planId, plans.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(subscriptions.createdAt))
          .limit(input.limit)
          .offset((input.page - 1) * input.limit),
        db
          .select({ count: count() })
          .from(subscriptions),
      ]);

      return {
        subscriptions: results,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: total[0]?.count ?? 0,
          pages: Math.ceil((total[0]?.count ?? 0) / input.limit),
        },
      };
    }),

  adminGetOrgBilling: adminOnly
    .route({
      method: "GET",
      path: "/admin/billing/org/:orgId",
      summary: "Admin: Get organization billing details",
      tags: ["Admin", "Billing"],
    })
    .input(z.object({ orgId: z.string() }))
    .handler(async ({ input, context }) => {
      const db = getDb(context);

      const [subscription, orgInvoices, recentPayments, usage] = await Promise.all([
        db.query.subscriptions.findFirst({
          where: eq(subscriptions.organizationId, input.orgId),
          with: { plan: true },
        }),
        db
          .select()
          .from(invoices)
          .where(eq(invoices.organizationId, input.orgId))
          .orderBy(desc(invoices.createdAt))
          .limit(10),
        db
          .select()
          .from(payments)
          .where(eq(payments.organizationId, input.orgId))
          .orderBy(desc(payments.createdAt))
          .limit(10),
        db.query.usageRecords.findFirst({
          where: eq(usageRecords.organizationId, input.orgId),
        }),
      ]);

      const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, input.orgId),
      });

      return {
        organization,
        subscription,
        invoices: orgInvoices,
        payments: recentPayments,
        usage,
      };
    }),

  // ─── Admin: Billing Dashboard Stats ───────────────────────────────────────

  adminBillingStats: adminOnly
    .route({
      method: "GET",
      path: "/admin/billing/stats",
      summary: "Admin: Get billing statistics",
      tags: ["Admin", "Billing"],
    })
    .input(
      z.object({
        periodStart: z.string().optional(),
        periodEnd: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const db = getDb(context);

      const [
        totalOrgs,
        activeSubs,
        pastDueSubs,
        trialingSubs,
        recentInvoices,
        recentPayments,
      ] = await Promise.all([
        db.select({ count: count() }).from(organizations),
        db
          .select({ count: count() })
          .from(subscriptions)
          .where(eq(subscriptions.status, "active")),
        db
          .select({ count: count() })
          .from(subscriptions)
          .where(eq(subscriptions.status, "past_due")),
        db
          .select({ count: count() })
          .from(subscriptions)
          .where(eq(subscriptions.status, "trialing")),
        db
          .select()
          .from(invoices)
          .orderBy(desc(invoices.createdAt))
          .limit(20),
        db
          .select()
          .from(payments)
          .where(eq(payments.status, "completed"))
          .orderBy(desc(payments.createdAt))
          .limit(20),
      ]);

      // Calculate MRR (simplified)
      const subscriptionsList = await db.query.subscriptions.findMany({
        with: { plan: true },
      });

      let mrr = 0;
      for (const sub of subscriptionsList) {
        if (sub.status === "active" && sub.plan) {
          const basePrice = sub.billingCycle === "annual"
            ? Number(sub.plan.basePriceAnnual) / 12
            : Number(sub.plan.basePriceMonthly);
          const perUserPrice = sub.billingCycle === "annual"
            ? Number(sub.plan.pricePerUserAnnual) / 12
            : Number(sub.plan.pricePerUserMonthly);
          mrr += basePrice + (perUserPrice * sub.userCount);
        }
      }

      return {
        stats: {
          totalOrganizations: totalOrgs[0]?.count ?? 0,
          activeSubscriptions: activeSubs[0]?.count ?? 0,
          pastDueSubscriptions: pastDueSubs[0]?.count ?? 0,
          trialingSubscriptions: trialingSubs[0]?.count ?? 0,
          monthlyRecurringRevenue: Math.round(mrr * 100) / 100,
          annualRecurringRevenue: Math.round(mrr * 12 * 100) / 100,
        },
        recentInvoices,
        recentPayments,
      };
    }),
};
