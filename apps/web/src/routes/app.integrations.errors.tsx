/**
 * Error Handling Configuration
 *
 * Configure retry policies and fallback behavior for integration errors.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  Settings,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  Webhook,
  Database,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integrations/errors")({
  component: ErrorHandlingPage,
});

function ErrorHandlingPage() {
  const [retryPolicies, setRetryPolicies] = useState([
    {
      id: "rp1",
      name: "Connection Timeout",
      errorCodes: ["ETIMEDOUT", "ECONNRESET", "ENOTFOUND"],
      maxRetries: 3,
      backoffType: "exponential",
      initialDelay: 1000,
      status: "active",
    },
    {
      id: "rp2",
      name: "Rate Limit Exceeded",
      errorCodes: ["429"],
      maxRetries: 5,
      backoffType: "linear",
      initialDelay: 5000,
      status: "active",
    },
    {
      id: "rp3",
      name: "Server Errors",
      errorCodes: ["500", "502", "503", "504"],
      maxRetries: 3,
      backoffType: "exponential",
      initialDelay: 2000,
      status: "active",
    },
    {
      id: "rp4",
      name: "Authentication Failure",
      errorCodes: ["401", "403"],
      maxRetries: 1,
      backoffType: "fixed",
      initialDelay: 1000,
      status: "active",
    },
  ]);

  const [fallbackConfigs] = useState([
    {
      id: "fb1",
      name: "Email Notification",
      trigger: "After 3 consecutive failures",
      action: "Send email to admin@example.com",
      status: "active",
    },
    {
      id: "fb2",
      name: "Slack Alert",
      trigger: "After 5 consecutive failures",
      action: "Post to #integration-alerts channel",
      status: "active",
    },
    {
      id: "fb3",
      name: "Dead Letter Queue",
      trigger: "After max retries exceeded",
      action: "Store failed events for manual review",
      status: "active",
    },
    {
      id: "fb4",
      name: "Fallback Connector",
      trigger: "Primary connector unavailable",
      action: "Route to backup Salesforce instance",
      status: "inactive",
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Error Handling</h2>
          <p className="text-sm text-muted-foreground">
            Configure retry policies and fallback behavior
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Add Policy
        </Button>
      </div>

      {/* Retry Policies */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Retry Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {retryPolicies.map((policy) => (
              <div key={policy.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium text-foreground">{policy.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Error codes: {policy.errorCodes.join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">Active</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-4 bg-muted/50 rounded-lg p-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Max Retries</label>
                    <p className="font-medium">{policy.maxRetries}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Backoff Type</label>
                    <p className="font-medium capitalize">{policy.backoffType}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Initial Delay</label>
                    <p className="font-medium">{policy.initialDelay}ms</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Delay</label>
                    <p className="font-medium">{(policy.initialDelay * Math.pow(2, policy.maxRetries - 1)).toLocaleString()}ms</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fallback Configurations */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Fallback Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fallbackConfigs.map((config) => (
              <div key={config.id} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                <div className="rounded-lg bg-muted p-2">
                  {config.name.includes("Email") && <Mail className="h-5 w-5 text-primary" />}
                  {config.name.includes("Slack") && <Webhook className="h-5 w-5 text-purple-600" />}
                  {config.name.includes("Dead Letter") && <Database className="h-5 w-5 text-orange-600" />}
                  {config.name.includes("Fallback") && <RefreshCw className="h-5 w-5 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{config.name}</h4>
                  <p className="text-sm text-muted-foreground">{config.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">Trigger: {config.trigger}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={config.status === "active" ? "success" : "default"} size="sm">
                    {config.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Codes Reference */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Common Error Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { code: "ETIMEDOUT", description: "Connection timed out" },
              { code: "ECONNREFUSED", description: "Connection refused" },
              { code: "ENOTFOUND", description: "Host not found" },
              { code: "401", description: "Authentication failed" },
              { code: "403", description: "Permission denied" },
              { code: "429", description: "Rate limit exceeded" },
              { code: "500", description: "Internal server error" },
              { code: "503", description: "Service unavailable" },
            ].map((error) => (
              <div key={error.code} className="p-3 bg-muted/50 rounded-lg">
                <code className="font-medium text-sm">{error.code}</code>
                <p className="text-xs text-muted-foreground mt-1">{error.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Circuit Breaker */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Circuit Breaker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium text-foreground">Automatic Circuit Breaker</h4>
              <p className="text-sm text-muted-foreground">
                Automatically disable failing connectors after repeated errors
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">Threshold: 10 failures</p>
                <p className="text-xs text-muted-foreground">Reset after: 5 minutes</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
