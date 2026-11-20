"use client";

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

function orgHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  if (localStorage.getItem("demo_mode") === "true") {
    return { "x-demo-mode": "true", "x-organization-id": "demo-org" };
  }
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.companyId) return { "x-organization-id": user.companyId };
  } catch {}
  return {};
}

/**
 * Blocks the app when the tenant has no active subscription.
 * Shows a paywall with a link to the billing page.
 */
export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    loading: boolean;
    active: boolean;
    expired: boolean;
  }>({ loading: true, active: false, expired: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/rpc/billing/getSubscription", {
          credentials: "include",
          headers: orgHeaders(),
        });
        const data: any = await res.json();
        const sub = data?.json ?? data ?? {};
        const expired =
          sub.expiresAt && new Date(sub.expiresAt).getTime() < Date.now();
        if (!cancelled) {
          setState({
            loading: false,
            active: sub.status === "active" && !expired,
            expired: Boolean(expired),
          });
        }
      } catch {
        if (!cancelled) setState({ loading: false, active: false, expired: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Checking subscription…
      </div>
    );
  }

  if (state.active) return <>{children}</>;

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="font-bold text-2xl text-foreground">
          Subscription required
        </h1>
        <p className="mt-2 text-muted-foreground">
          {state.expired
            ? "Your subscription has expired. Renew to keep using NucleoAI."
            : "Your subscription is not active. Choose a plan to continue."}
        </p>
        <Link
          to="/app/billing"
          className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
        >
          View plans & subscribe
        </Link>
      </div>
    </div>
  );
}
