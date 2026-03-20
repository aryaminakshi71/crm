/**
 * API Rate Limit Settings
 *
 * Configure rate limiting for API requests.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  Shield,
  Search,
  Plus,
  Trash2,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integrations/rate-limits")({
  component: RateLimitsPage,
});

function RateLimitsPage() {
  const [rateLimits, setRateLimits] = useState([
    {
      id: "rl1",
      name: "Default API Rate Limit",
      endpoint: "/api/*",
      requests: 1000,
      period: "minute",
      currentUsage: 342,
      status: "active",
      tier: "standard",
    },
    {
      id: "rl2",
      name: "Webhook Delivery",
      endpoint: "/webhooks/*",
      requests: 500,
      period: "minute",
      currentUsage: 89,
      status: "active",
      tier: "standard",
    },
    {
      id: "rl3",
      name: "Bulk Operations",
      endpoint: "/api/bulk/*",
      requests: 10,
      period: "minute",
      currentUsage: 3,
      status: "active",
      tier: "standard",
    },
    {
      id: "rl4",
      name: "Connector Sync",
      endpoint: "/api/sync/*",
      requests: 100,
      period: "minute",
      currentUsage: 67,
      status: "active",
      tier: "standard",
    },
    {
      id: "rl5",
      name: "Legacy Integration",
      endpoint: "/api/legacy/*",
      requests: 50,
      period: "minute",
      currentUsage: 23,
      status: "warning",
      tier: "legacy",
    },
  ]);

  const tiers = [
    { id: "free", name: "Free", requests: "100/min", price: "$0" },
    { id: "standard", name: "Standard", requests: "1,000/min", price: "$49/mo" },
    { id: "pro", name: "Pro", requests: "5,000/min", price: "$199/mo" },
    { id: "enterprise", name: "Enterprise", requests: "Unlimited", price: "Custom" },
  ];

  const currentTier = tiers[1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">API Rate Limits</h2>
          <p className="text-sm text-muted-foreground">
            Configure and monitor API rate limiting
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Create Rule
        </Button>
      </div>

      {/* Current Plan */}
      <Card className="border-border/60 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/20 p-3">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <h3 className="text-2xl font-bold text-foreground">{currentTier.name}</h3>
                <p className="text-sm text-muted-foreground">{currentTier.requests} requests per minute</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{currentTier.price}</p>
              <Button variant="outline" size="sm" className="mt-2">
                Upgrade Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">98.2%</p>
                <p className="text-xs text-muted-foreground">Requests within limits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">1.4%</p>
                <p className="text-xs text-muted-foreground">Rate limited (retryable)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0.4%</p>
                <p className="text-xs text-muted-foreground">Hard errors (4xx)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limit Rules */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Rate Limit Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rateLimits.map((rule) => {
              const usagePercent = (rule.currentUsage / rule.requests) * 100;
              const isWarning = usagePercent > 80;
              const isDanger = usagePercent > 95;

              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-lg border ${
                    rule.status === "warning"
                      ? "border-yellow-500/50 bg-yellow-50/50"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium text-foreground">{rule.name}</h4>
                        <code className="text-xs text-muted-foreground">{rule.endpoint}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isDanger ? "danger" : isWarning ? "warning" : "success"}
                        size="sm"
                      >
                        {rule.requests}/{rule.period}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {rule.currentUsage} / {rule.requests} requests
                      </span>
                      <span
                        className={`font-medium ${
                          isDanger ? "text-red-600" : isWarning ? "text-yellow-600" : "text-green-600"
                        }`}
                      >
                        {usagePercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isDanger ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limit Headers Reference */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Rate Limit Headers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm">
              <code>{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 658
X-RateLimit-Reset: 1710921600
Retry-After: 30  # Only present when rate limited`}</code>
            </pre>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            All API responses include rate limit information in headers. Use Retry-After to know when to retry.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
