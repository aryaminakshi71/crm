/**
 * Webhook Configuration
 *
 * Configure webhook endpoints for receiving and sending data.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Webhook,
  Search,
  Plus,
  Copy,
  Trash2,
  Settings,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integrations/webhooks")({
  component: WebhooksPage,
});

function WebhooksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const webhooks = [
    {
      id: "wh1",
      name: "Production Webhook",
      url: "https://api.nucleo.io/webhooks/prod/abc123",
      secret: "whsec_••••••••••••••••",
      status: "active",
      events: 12453,
      lastEvent: "2 min ago",
      createdAt: "Jan 15, 2024",
      endpoints: ["order.created", "payment.succeeded", "customer.updated"],
    },
    {
      id: "wh2",
      name: "Staging Webhook",
      url: "https://api-staging.nucleo.io/webhooks/stg/xyz789",
      secret: "whsec_••••••••••••••••",
      status: "active",
      events: 2341,
      lastEvent: "5 min ago",
      createdAt: "Feb 1, 2024",
      endpoints: ["order.created", "payment.succeeded"],
    },
    {
      id: "wh3",
      name: "Development Webhook",
      url: "https://api-dev.nucleo.io/webhooks/dev/def456",
      secret: "whsec_••••••••••••••••",
      status: "paused",
      events: 156,
      lastEvent: "3 days ago",
      createdAt: "Mar 10, 2024",
      endpoints: ["order.created"],
    },
    {
      id: "wh4",
      name: "Legacy Integration",
      url: "https://api.nucleo.io/webhooks/legacy/ghi789",
      secret: "whsec_••••••••••••••••",
      status: "error",
      events: 892,
      lastEvent: "1 hour ago",
      createdAt: "Dec 5, 2023",
      endpoints: ["contact.created", "contact.updated", "contact.deleted"],
    },
  ];

  const filteredWebhooks = webhooks.filter(
    (wh) =>
      wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" size="sm">Active</Badge>;
      case "paused":
        return <Badge variant="warning" size="sm">Paused</Badge>;
      case "error":
        return <Badge variant="danger" size="sm">Error</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Webhook Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Manage webhook endpoints for receiving HTTP callbacks
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Create Webhook
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search webhooks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {filteredWebhooks.map((webhook) => (
          <Card key={webhook.id} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2 mt-1">
                  <Webhook className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">{webhook.name}</h3>
                    {getStatusBadge(webhook.status)}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate max-w-md">
                      {webhook.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {/* copy to clipboard */}}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-muted-foreground">Secret:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {showSecrets[webhook.id] ? webhook.secret.replace("••••••", "abc123def456") : webhook.secret}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowSecrets({ ...showSecrets, [webhook.id]: !showSecrets[webhook.id] })}
                    >
                      {showSecrets[webhook.id] ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {webhook.endpoints.map((endpoint) => (
                      <Badge key={endpoint} variant="outline" size="sm">{endpoint}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{webhook.events.toLocaleString()} events</span>
                    <span>Last: {webhook.lastEvent}</span>
                    <span>Created: {webhook.createdAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Code Example */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Webhook Payload Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm">
              <code>{`{
  "event": "order.created",
  "timestamp": "2024-03-20T10:30:00Z",
  "data": {
    "order_id": "ord_123456",
    "customer": {
      "email": "customer@example.com",
      "name": "John Smith"
    },
    "total": 99.99,
    "currency": "USD"
  },
  "signature": "sha256=abc123..."
}`}</code>
            </pre>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Verify webhook signatures using the secret key to ensure requests are authentic.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
