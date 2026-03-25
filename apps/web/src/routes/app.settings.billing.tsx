import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Progress } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, AlertCircle, Clock, CreditCard, Zap, Users, HardDrive, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/app/settings/billing")({
  component: SettingsBillingPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
}

const EMPTY_SUBSCRIPTION = {
  plan: "growth" as const,
  status: "active" as const,
  billingCycle: "monthly" as const,
  currentPeriodEnd: "—",
  trialEnd: null as null | string,
  userCount: 0,
};

const EMPTY_USAGE = {
  apiCalls: { used: 0, limit: 50000, percent: 0 },
  storage: { used: 0, limit: 50, percent: 0 },
  users: { used: 0, limit: 25, percent: 0 },
};

function SettingsBillingPage() {
  const subscriptionQuery = useQuery({
    queryKey: ["billing", "subscription"],
    retry: false,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/billing/subscription`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch subscription");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });
  if (subscriptionQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => subscriptionQuery.refetch()}>Retry</Button>
    </div>
  );

  const usageQuery = useQuery({
    queryKey: ["billing", "usage"],
    retry: false,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/billing/usage`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch usage");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const apiSub = (subscriptionQuery as any).data?.subscription;
  const subscription = apiSub
    ? {
        plan: apiSub.plan?.key ?? "growth",
        status: apiSub.status ?? "active",
        billingCycle: apiSub.billingCycle ?? "monthly",
        currentPeriodEnd: apiSub.currentPeriodEnd
          ? new Date(apiSub.currentPeriodEnd).toISOString().slice(0, 10)
          : "—",
        trialEnd: apiSub.trialEnd ?? null,
        userCount: apiSub.userCount ?? 0,
      }
    : EMPTY_SUBSCRIPTION;

  const apiUsage = usageQuery.data;
  const usage = apiUsage
    ? {
        apiCalls: {
          used: (apiUsage as any).usage?.apiCalls ?? 0,
          limit: (apiUsage as any).limits?.maxApiCalls ?? 50000,
          percent: (apiUsage as any).percentages?.apiCalls ?? 0,
        },
        storage: {
          used: Math.round((((apiUsage as any).usage?.storageMb ?? 0) / 1024) * 10) / 10,
          limit: Math.round(((apiUsage as any).limits?.maxStorage ?? 102400) / 1024),
          percent: (apiUsage as any).percentages?.storage ?? 0,
        },
        users: {
          used: (apiUsage as any).usage?.users ?? 0,
          limit: (apiUsage as any).limits?.maxUsers ?? 25,
          percent: (apiUsage as any).percentages?.users ?? 0,
        },
      }
    : EMPTY_USAGE;

  const isLoading = subscriptionQuery.isLoading || usageQuery.isLoading;

  const modules = [
    { key: "crm", name: "CRM", enabled: true, source: "base", description: "Contacts, deals, activities" },
    { key: "notifications", name: "Notifications", enabled: true, source: "base", description: "Email and in-app notifications" },
    { key: "rbac", name: "Access Control", enabled: true, source: "base", description: "Roles and permissions" },
    { key: "projects", name: "Projects", enabled: true, source: "plan", description: "Task boards and kanban" },
    { key: "helpdesk", name: "Helpdesk", enabled: true, source: "plan", description: "Support tickets and SLA" },
    { key: "invoicing", name: "Invoicing", enabled: true, source: "plan", description: "Invoices and expenses" },
    { key: "hrm", name: "HRM", enabled: true, source: "plan", description: "Employees and leave" },
    { key: "marketing", name: "Marketing", enabled: true, source: "plan", description: "Campaigns and analytics" },
    { key: "ai", name: "AI & BI", enabled: false, source: "business", description: "Intelligence and forecasting" },
    { key: "integrations", name: "Integrations", enabled: true, source: "plan", description: "Workflow automation" },
  ];

  const plans = [
    { key: "free", name: "Free", price: 0, features: ["1 user", "100MB storage", "Core CRM only"] },
    { key: "solo", name: "Solo", price: 5, features: ["3 users", "1GB storage", "Core modules"] },
    { key: "starter", name: "Starter", price: 12, popular: true, features: ["25 users", "50GB storage", "All modules"] },
    { key: "business", name: "Business", price: 25, features: ["200 users", "500GB storage", "All modules + BI"] },
    { key: "enterprise", name: "Enterprise", price: null, features: ["Unlimited users", "Unlimited storage", "Everything + SLA"] },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-48 bg-muted rounded-lg" />
        <div className="h-48 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground text-sm">
          Manage your subscription, usage, and billing.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Current Plan</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Your subscription details
            </p>
          </div>
          <Badge className={subscription.status === "active" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
            {subscription.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Plan</span>
              </div>
              <p className="font-bold text-lg capitalize">{subscription.plan}</p>
              <p className="text-sm text-muted-foreground">${plans.find(p => p.key === subscription.plan)?.price || 0}/user/mo</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Billing</span>
              </div>
              <p className="font-bold text-lg capitalize">{subscription.billingCycle}</p>
              <p className="text-sm text-muted-foreground">Next: {subscription.currentPeriodEnd}</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Users</span>
              </div>
              <p className="font-bold text-lg">{subscription.userCount}</p>
              <p className="text-sm text-muted-foreground">of {plans.find(p => p.key === subscription.plan)?.features[0]?.replace(" users", "") || "unlimited"}</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Monthly</span>
              </div>
              <p className="font-bold text-lg">${(plans.find(p => p.key === subscription.plan)?.price || 0) * subscription.userCount}</p>
              <p className="text-sm text-muted-foreground">per month</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline">Manage Subscription</Button>
            <Button variant="primary">Upgrade Plan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2"><HardDrive className="h-4 w-4" /> API Calls</span>
              <span>{usage.apiCalls.used.toLocaleString()} / {usage.apiCalls.limit.toLocaleString()}</span>
            </div>
            <Progress value={usage.apiCalls.percent} className="h-2" />
            <p className="text-xs text-muted-foreground">{usage.apiCalls.percent}% used</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2"><HardDrive className="h-4 w-4" /> Storage</span>
              <span>{usage.storage.used}GB / {usage.storage.limit}GB</span>
            </div>
            <Progress value={usage.storage.percent} className="h-2" />
            <p className="text-xs text-muted-foreground">{usage.storage.percent}% used</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Users</span>
              <span>{usage.users.used} / {usage.users.limit}</span>
            </div>
            <Progress value={usage.users.percent} className="h-2" />
            <p className="text-xs text-muted-foreground">{usage.users.percent}% used</p>
          </div>
        </CardContent>
      </Card>

      {/* Module Access */}
      <Card>
        <CardHeader>
          <CardTitle>Module Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modules.map((mod) => (
              <div key={mod.key} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  {mod.enabled ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{mod.name}</p>
                    <p className="text-xs text-muted-foreground">{mod.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={mod.source === "base" ? "default" : mod.source === "plan" ? "secondary" : "outline"}>
                    {mod.source}
                  </Badge>
                  {!mod.enabled && mod.source !== "base" && (
                    <Button size="sm" variant="ghost">Enable</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`p-4 rounded-lg border-2 ${
                  plan.key === subscription.plan
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{plan.name}</h3>
                  {plan.popular && <Badge>Popular</Badge>}
                  {plan.key === subscription.plan && <Badge variant="secondary">Current</Badge>}
                </div>
                <p className="text-2xl font-black mb-1">
                  {plan.price ? `$${plan.price}` : "Custom"}
                  {plan.price && <span className="text-sm font-normal text-muted-foreground">/user/mo</span>}
                </p>
                <ul className="space-y-1 mt-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-4"
                  variant={plan.key === subscription.plan ? "outline" : "primary"}
                  disabled={plan.key === subscription.plan}
                >
                  {plan.key === subscription.plan ? "Current Plan" : `Switch to ${plan.name}`}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
