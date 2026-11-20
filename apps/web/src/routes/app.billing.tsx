import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/app/billing")({
  component: BillingPage,
});

function BillingPage() {
  const client = useQueryClient();
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [message, setMessage] = useState("");

  const plansQuery = useQuery(orpc.billing.getPlans.queryOptions({ input: {} }));
  const subQuery = useQuery(orpc.billing.getSubscription.queryOptions({ input: {} }));

  const subscribe = useMutation({
    ...orpc.billing.subscribe.mutationOptions(),
    onSuccess: () => {
      setMessage("Subscription activated.");
      client.invalidateQueries();
    },
    onError: (e: any) => setMessage(String(e?.message ?? e)),
  });

  const cancel = useMutation({
    ...orpc.billing.cancel.mutationOptions(),
    onSuccess: () => {
      setMessage("Subscription cancelled.");
      client.invalidateQueries();
    },
  });

  const plans: any[] = (plansQuery.data as any)?.plans ?? [];
  const current: any = subQuery.data ?? { plan: "free", status: "none" };

  const price = (p: any) =>
    p.price === 0
      ? "Custom"
      : `₹${(interval === "year" ? p.price * 10 : p.price).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl text-foreground">Billing & Subscription</h1>
        <p className="mt-1 text-muted-foreground">
          Current plan: <span className="font-semibold capitalize">{current.plan}</span> ·{" "}
          <span className="capitalize">{current.status}</span>
          {current.expiresAt && ` · renews ${new Date(current.expiresAt).toLocaleDateString()}`}
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
          {message}
        </div>
      )}

      <div className="inline-flex gap-1 rounded-xl bg-muted p-1">
        {(["month", "year"] as const).map((i) => (
          <button
            key={i}
            onClick={() => setInterval(i)}
            className={`rounded-lg px-4 py-1.5 font-medium capitalize ${
              interval === i ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {i}ly {i === "year" && <span className="text-xs text-green-600">save 2 months</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => {
          const active = current.plan === p.id && current.status === "active";
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
                {p.price === 0 ? "contact sales" : `per ${interval}`}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{p.limits}</p>
              <button
                disabled={subscribe.isPending || active}
                onClick={() => subscribe.mutate({ plan: p.id, interval })}
                className="mt-5 w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {active ? "Current plan" : p.price === 0 ? "Contact sales" : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>

      {current.status === "active" && current.plan !== "free" && (
        <button
          disabled={cancel.isPending}
          onClick={() => cancel.mutate({})}
          className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50"
        >
          Cancel subscription
        </button>
      )}
    </div>
  );
}
