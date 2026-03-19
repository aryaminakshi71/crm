import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Progress } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, AlertCircle, Clock, CreditCard, Zap, Users, HardDrive, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/app/settings/billing")({
  component: SettingsBillingPage,
});

function SettingsBillingPage() {
  // Mock data - would come from API in real app
  const subscription = {
    plan: "growth",
    status: "active",
    billingCycle: "monthly",
    currentPeriodEnd: "2026-04-19",
    trialEnd: null,
    userCount: 8,
  };

  const usage = {
    apiCalls: { used: 8450, limit: 50000, percent: 17 },
    storage: { used: 3.2, limit: 100, percent: 3 },
    users: { used: 8, limit: 25, percent: 32 },
  };

  const modules = [
    { key: "crm", name: "CRM", enabled: true, source: "base", description: "Contacts, deals, activities" },
    { key: "notifications", name: "Notifications", enabled: true, source: "base", description: "Email and in-app notifications" },
    { key: "rbac", name: "Access Control", enabled: true, source: "base", description: "Roles and permissions" },
    { key: "projects", name: "Projects", enabled: true, source: "plan", description: "Project management" },
    { key: "invoicing", name: "Invoicing", enabled: true, source: "plan", description: "Billing and payments" },
    { key: "helpdesk", name: "Helpdesk", enabled: true, source: "plan", description: "Support tickets" },
    { key: "ai_agents", name: "AI Agents", enabled: false, source: "addon", description: "Autonomous AI agents" },
    { key: "monitoring", name: "Monitoring", enabled: false, source: "addon", description: "Platform observability" },
    { key: "integrations", name: "Integrations", enabled: true, source: "plan", description: "Workflow automation" },
    { key: "campaign_pro", name: "Marketing", enabled: false, source: "addon", description: "Campaign management" },
  ];

  const plans = [
    { key: "starter", name: "Starter", price: 15, features: ["5 users", "10GB storage", "10K API calls"] },
    { key: "growth", name: "Growth", price: 29, popular: true, features: ["25 users", "100GB storage", "50K API calls"] },
    { key: "business", name: "Business", price: 49, features: ["100 users", "500GB storage", "200K API calls"] },
    { key: "enterprise", name: "Enterprise", price: null, features: ["Unlimited users", "Unlimited storage", "Unlimited API calls"] },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
