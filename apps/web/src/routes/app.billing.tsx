import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/app/billing")({
  component: BillingPage,
});

function BillingPage() {
  const client = useQueryClient();
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [message, setMessage] = useState("");

  const plansQuery = useQuery(orpc.billing.listPlans.queryOptions({ input: {} }));
  const subQuery = useQuery(
    orpc.billing.getSubscription.queryOptions({ input: {} }),
  );

  const checkout = useMutation({
    ...orpc.billing.createCheckoutSession.mutationOptions(),
    onSuccess: (data: any) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setMessage("Stripe is not configured yet. Add STRIPE_SECRET_KEY to enable checkout.");
      }
    },
    onError: (e: any) => setMessage(String(e?.message ?? e)),
  });

  const portal = useMutation({
    ...orpc.billing.portalSession.mutationOptions(),
    onSuccess: (data: any) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (e: any) => setMessage(String(e?.message ?? e)),
  });

  const plans: any[] = (plansQuery.data as any)?.plans ?? [];
  const sub: any = (subQuery.data as any)?.subscription ?? null;
  const isTrial = (subQuery.data as any)?.isTrial ?? false;
  const daysRemaining = (subQuery.data as any)?.daysRemaining ?? 0;

  const price = (p: any) => {
    const monthly = Number(p.basePriceMonthly ?? 0);
    const annual = Number(p.basePriceAnnual ?? 0);
    const value = cycle === "annual" ? annual : monthly;
    if (!value) return "Custom";
    return `₹${value.toLocaleString("en-IN")}`;
  };

  const startCheckout = (planKey: string) => {
    const origin = window.location.origin;
    checkout.mutate({
      planKey,
      billingCycle: cycle,
      successUrl: `${origin}/app/billing?status=success`,
      cancelUrl: `${origin}/app/billing?status=cancelled`,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl text-foreground">Billing & Subscription</h1>
        <p className="mt-1 text-muted-foreground">
          Current plan:{" "}
          <span className="font-semibold capitalize">
            {sub?.plan?.name ?? "Free"}
          </span>{" "}
          · <span className="capitalize">{sub?.status ?? "none"}</span>
          {isTrial && daysRemaining > 0 && ` · trial ends in ${daysRemaining} days`}
          {sub?.currentPeriodEnd &&
            ` · renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`}
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
          {message}
        </div>
      )}

      <div className="inline-flex gap-1 rounded-xl bg-muted p-1">
        {(["monthly", "annual"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={`rounded-lg px-4 py-1.5 font-medium capitalize ${
              cycle === c ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {c}
            {c === "annual" && (
              <span className="ml-1 text-xs text-green-600">save 2 months</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => {
          const active = sub?.planId === p.id && sub?.status === "active";
          return (
            <div
              key={p.id}
              className={`rounded-xl border bg-card p-6 ${
                active ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              <h2 className="text-lg font-semibold text-foreground">{p.name}</h2>
              <p className="mt-2 text-3xl font-bold text-foreground">{price(p)}</p>
              <p className="text-sm text-muted-foreground">
                {Number(p.basePriceMonthly) === 0
                  ? "contact sales"
                  : `per ${cycle === "annual" ? "year" : "month"}`}
              </p>
              {p.description && (
                <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Up to {p.maxUsers} users · {p.maxStorage} GB
              </p>
              <button
                disabled={checkout.isPending || active}
                onClick={() => startCheckout(p.key)}
                className="mt-5 w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {active
                  ? "Current plan"
                  : Number(p.basePriceMonthly) === 0
                    ? "Contact sales"
                    : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>

      {sub?.stripeCustomerId && (
        <button
          disabled={portal.isPending}
          onClick={() =>
            portal.mutate({ returnUrl: `${window.location.origin}/app/billing` })
          }
          className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted"
        >
          Manage billing in Stripe
        </button>
      )}
    </div>
  );
}
