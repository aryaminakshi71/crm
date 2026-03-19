/**
 * Stripe Integration
 *
 * Handles Stripe checkout sessions, customer portal, webhooks,
 * and subscription management.
 */

import Stripe from "stripe";
import { env } from "@crm/env/server";
import { APIError, ErrorCode } from "./errors";
import { getDb, schema } from "./db";
import { eq } from "drizzle-orm";

// Initialize Stripe with secret key
const stripe = new Stripe(env.STRIPE_SECRET_KEY || "sk_test_mock", {
  typescript: true,
});

// Create or get Stripe customer for organization
export async function getOrCreateStripeCustomer(
  organizationId: string,
  organizationName: string,
  email: string
): Promise<string> {
  const db = getDb({} as any);

  // Check if org already has a stripe customer ID
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.organizationId, organizationId),
  });

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    name: organizationName,
    email: email,
    metadata: {
      organizationId,
    },
  });

  return customer.id;
}

// Create Stripe checkout session for subscription
export async function createCheckoutSession({
  customerId,
  planKey,
  billingCycle,
  successUrl,
  cancelUrl,
  organizationId,
}: {
  customerId: string;
  planKey: string;
  billingCycle: "monthly" | "annual";
  successUrl: string;
  cancelUrl: string;
  organizationId: string;
}): Promise<{ sessionId: string; url: string }> {
  const db = getDb({} as any);

  // Get plan details
  const plan = await db.query.plans.findFirst({
    where: eq(schema.plans.key, planKey),
  });

  if (!plan) {
    throw new APIError(ErrorCode.NOT_FOUND, "Plan not found", 404);
  }

  // Get or create Stripe price for this plan
  let priceId: string;
  if (billingCycle === "monthly") {
    priceId = plan.stripePriceIdMonthly || "";
  } else {
    priceId = plan.stripePriceIdAnnual || "";
  }

  // If no Stripe price exists, create one
  if (!priceId) {
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description || undefined,
      metadata: { planKey: plan.key },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(Number(billingCycle === "monthly" ? plan.basePriceMonthly : plan.basePriceAnnual) * 100),
      currency: "usd",
      recurring: {
        interval: billingCycle === "monthly" ? "month" : "year",
      },
    });

    priceId = price.id;

    // Update plan with new price IDs
    if (billingCycle === "monthly") {
      await db.update(schema.plans).set({ stripePriceIdMonthly: priceId }).where(eq(schema.plans.id, plan.id));
    } else {
      await db.update(schema.plans).set({ stripePriceIdAnnual: priceId }).where(eq(schema.plans.id, plan.id));
    }
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organizationId,
      planKey,
      billingCycle,
    },
    subscription_data: {
      metadata: {
        organizationId,
        planKey,
      },
    },
  });

  return { sessionId: session.id, url: session.url! };
}

// Create Stripe customer portal session
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { sessionId: session.id, url: session.url };
}

// Handle Stripe webhook events
export async function handleStripeWebhook(
  payload: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    return { success: false, error: `Webhook signature verification failed` };
  }

  const db = getDb({} as any);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      const planKey = session.metadata?.planKey;

      if (organizationId && planKey) {
        const plan = await db.query.plans.findFirst({
          where: eq(schema.plans.key, planKey),
        });

        if (plan) {
          // Create or update subscription
          const existingSub = await db.query.subscriptions.findFirst({
            where: eq(schema.subscriptions.organizationId, organizationId),
          });

          if (existingSub) {
            await db
              .update(schema.subscriptions)
              .set({
                planId: plan.id,
                status: "active",
                stripeSubscriptionId: (session as any).subscription as string,
                updatedAt: new Date(),
              })
              .where(eq(schema.subscriptions.id, existingSub.id));
          } else {
            await db.insert(schema.subscriptions).values({
              organizationId,
              planId: plan.id,
              status: "active",
              stripeSubscriptionId: (session as any).subscription as string,
              stripeCustomerId: session.customer as string,
              billingCycle: (session.metadata?.billingCycle as "monthly" | "annual") || "monthly",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
          }
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata?.organizationId;

      if (organizationId) {
        // Cast to any to access properties that may not be in TypeScript types
        const subAny = subscription as any;
        await db
          .update(schema.subscriptions)
          .set({
            status: subscription.status === "active" ? "active" : "past_due",
            currentPeriodStart: subAny.current_period_start ? new Date(subAny.current_period_start * 1000) : new Date(),
            currentPeriodEnd: subAny.current_period_end ? new Date(subAny.current_period_end * 1000) : new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.subscriptions.stripeSubscriptionId, subscription.id));
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata?.organizationId;

      if (organizationId) {
        await db
          .update(schema.subscriptions)
          .set({
            status: "canceled",
            updatedAt: new Date(),
          })
          .where(eq(schema.subscriptions.stripeSubscriptionId, subscription.id));
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // Cast to any to access subscription property
      const subscriptionId = (invoice as any).subscription as string;

      if (subscriptionId) {
        await db
          .update(schema.subscriptions)
          .set({
            status: "past_due",
            updatedAt: new Date(),
          })
          .where(eq(schema.subscriptions.stripeSubscriptionId, subscriptionId));
      }
      break;
    }
  }

  return { success: true };
}

// Export stripe instance for direct use in other modules
export { stripe };
