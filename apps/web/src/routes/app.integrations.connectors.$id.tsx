/**
 * Connector Detail
 *
 * Configure and manage a specific connector.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Settings,
  RefreshCw,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
  Bell,
  ExternalLink,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integrations/connectors/$id")({
  component: ConnectorDetail,
});

function ConnectorDetail() {
  const [isActive, setIsActive] = useState(true);
  const [syncInterval, setSyncInterval] = useState("5");

  // Mock connector data
  const connector = {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM",
    description: "Sync leads, contacts, and opportunities with Salesforce CRM.",
    status: "connected",
    lastSync: "5 min ago",
    nextSync: "in 4 min",
    events: 4521,
    icon: "SF",
    color: "#00a1e0",
    version: "2.4.1",
    credentials: {
      instanceUrl: "https://acme.salesforce.com",
      clientId: "3MVG9...",
      username: "admin@acme.com",
    },
    scopes: ["api", "refresh_token"],
  };

  const workflows = [
    { id: "wf1", name: "Lead Sync", status: "active", lastRun: "2 min ago", events: 1243 },
    { id: "wf2", name: "Contact Update", status: "active", lastRun: "5 min ago", events: 892 },
    { id: "wf3", name: "Opportunity Alert", status: "paused", lastRun: "1 hour ago", events: 156 },
  ];

  const eventLog = [
    { id: "1", type: "contact.created", timestamp: "2 min ago", status: "success" },
    { id: "2", type: "lead.updated", timestamp: "5 min ago", status: "success" },
    { id: "3", type: "opportunity.closed", timestamp: "12 min ago", status: "success" },
    { id: "4", type: "sync.error", timestamp: "1 hour ago", status: "error" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/integrations/connectors">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{connector.name} Configuration</h1>
            <Badge variant="success" size="sm">Connected</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure webhook endpoints, authentication, and sync settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Test Connection
          </Button>
          <Button
            variant={isActive ? "outline" : "ghost"}
            size="sm"
            leftIcon={isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? "Pause" : "Activate"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Authentication */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Authentication
                </CardTitle>
                <Button variant="ghost" size="sm" leftIcon={<ExternalLink className="h-3 w-3" />}>
                  Reauthorize
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Instance URL</label>
                  <Input value={connector.credentials.instanceUrl} readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Client ID</label>
                  <Input value={connector.credentials.clientId} readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Username</label>
                  <Input value={connector.credentials.username} readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Scopes</label>
                  <div className="flex gap-2">
                    {connector.scopes.map((scope) => (
                      <Badge key={scope} variant="default" size="sm">{scope}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">
                  Authentication is valid. Token expires in 45 days.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Sync Settings */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Sync Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Sync Interval</label>
                  <select
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(e.target.value)}
                  >
                    <option value="1">Every 1 minute</option>
                    <option value="5">Every 5 minutes</option>
                    <option value="15">Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="60">Every hour</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Retry Policy</label>
                  <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                    <option>3 retries with exponential backoff</option>
                    <option>5 retries with exponential backoff</option>
                    <option>No retries</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Next sync in 4 minutes</p>
                    <p className="text-xs text-muted-foreground">Last sync: 5 minutes ago</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Sync Now</Button>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Webhook Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { name: "Contact Events", url: "https://api.nucleo.io/webhooks/salesforce/contacts", events: 1243 },
                  { name: "Lead Events", url: "https://api.nucleo.io/webhooks/salesforce/leads", events: 892 },
                  { name: "Opportunity Events", url: "https://api.nucleo.io/webhooks/salesforce/opportunities", events: 156 },
                ].map((endpoint, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{endpoint.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{endpoint.url}</p>
                    </div>
                    <Badge variant="success" size="sm">{endpoint.events} events</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Add Webhook Endpoint
              </Button>
            </CardContent>
          </Card>

          {/* Event Log */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Events</CardTitle>
                <Link to="/app/integrations/events/log">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eventLog.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg">
                    {event.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{event.type}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connection</span>
                <Badge variant="success" size="sm">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-sm font-medium">v{connector.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Events</span>
                <span className="text-sm font-medium">{connector.events.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Sync</span>
                <span className="text-sm font-medium">{connector.lastSync}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next Sync</span>
                <span className="text-sm font-medium">{connector.nextSync}</span>
              </div>
            </CardContent>
          </Card>

          {/* Workflows */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Using This Connector</CardTitle>
                <Link to="/app/integrations/workflows">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {workflows.map((workflow) => (
                <Link
                  key={workflow.id}
                  to="/app/integrations/workflows/$id"
                  params={{ id: workflow.id }}
                  className="block p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{workflow.name}</p>
                    <Badge variant={workflow.status === "active" ? "success" : "warning"} size="sm">
                      {workflow.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last run: {workflow.lastRun} / {workflow.events} events
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-2">
              <Button variant="outline" className="w-full" leftIcon={<ExternalLink className="h-4 w-4" />}>
                View API Docs
              </Button>
              <Button variant="outline" className="w-full" leftIcon={<Copy className="h-4 w-4" />}>
                Duplicate Config
              </Button>
              <Button variant="outline" className="w-full text-destructive" leftIcon={<Trash2 className="h-4 w-4" />}>
                Remove Connector
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Plus(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
