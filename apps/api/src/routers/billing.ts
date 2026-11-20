/**
 * Billing Router — plans, subscription, subscribe, cancel.
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { getDb, orgAuthed, pub, schema } from "../procedures";

const PLANS = [
  { id: "starter", name: "Starter", price: 499, interval: "month", limits: "CRM + invoicing, 3 users" },
  { id: "growth", name: "Growth", price: 999, interval: "month", limits: "+ HRM, projects, helpdesk, 10 users" },
  { id: "pro", name: "Pro", price: 1499, interval: "month", limits: "+ marketing, assets, AI copilot" },
  { id: "enterprise", name: "Enterprise", price: 0, interval: "custom", limits: "Unlimited modules, SSO, SLA" },
];

export const billingRouter = {
  getPlans: pub
    .route({ method: "GET", path: "/billing/plans", tags: ["Billing"] })
    .output(z.any())
    .handler(async () => ({ plans: PLANS })),

  getSubscription: orgAuthed
    .route({ method: "GET", path: "/billing/subscription", tags: ["Billing"] })
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      const rows: any = await db.execute(
        sql`select plan, subscription_status, subscription_expires_at from organizations where id = ${context.organization.id} limit 1`,
      );
      const org = (rows as any).rows?.[0] ?? (rows as any)[0] ?? {};
      return {
        plan: org.plan ?? "free",
        status: org.subscription_status ?? "none",
        expiresAt: org.subscription_expires_at ?? null,
      };
    }),

  subscribe: orgAuthed
    .route({ method: "POST", path: "/billing/subscribe", tags: ["Billing"] })
    .input(
      z.object({
        plan: z.string(),
        interval: z.enum(["month", "year"]).optional(),
      }),
    )
    .output(z.any())
    .handler(async ({ context, input }) => {
      const db = getDb(context);
      const expires = new Date();
      expires.setMonth(expires.getMonth() + (input.interval === "year" ? 12 : 1));
      await db.execute(
        sql`update organizations set plan = ${input.plan}, subscription_status = 'active', subscription_expires_at = ${expires.toISOString()} where id = ${context.organization.id}`,
      );
      return { ok: true, plan: input.plan, status: "active", expiresAt: expires };
    }),

  cancel: orgAuthed
    .route({ method: "POST", path: "/billing/cancel", tags: ["Billing"] })
    .output(z.any())
    .handler(async ({ context }) => {
      const db = getDb(context);
      await db.execute(
        sql`update organizations set subscription_status = 'cancelled' where id = ${context.organization.id}`,
      );
      return { ok: true, status: "cancelled" };
    }),
};
