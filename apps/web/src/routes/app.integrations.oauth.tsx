/**
 * OAuth App Management
 *
 * Manage third-party OAuth applications.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Key,
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Settings,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integrations/oauth")({
  component: OAuthAppsPage,
});

function OAuthAppsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const oauthApps = [
    {
      id: "app1",
      name: "Nucleo Mobile App",
      description: "Native iOS and Android mobile application",
      clientId: "nk_••••••••••••••••",
      clientSecret: "ncs_••••••••••••••••",
      redirectUris: ["nucleo://oauth/callback", "https://app.nucleo.io/oauth/callback"],
      scopes: ["read:profile", "write:data", "read:analytics"],
      status: "active",
      createdAt: "Jan 15, 2024",
      lastUsed: "2 min ago",
    },
    {
      id: "app2",
      name: "Zapier Integration",
      description: "Zapier connector for workflow automation",
      clientId: "nk_••••••••••••••••",
      clientSecret: "ncs_••••••••••••••••",
      redirectUris: ["https://zapier.com/oauth/callback"],
      scopes: ["read:data", "write:triggers"],
      status: "active",
      createdAt: "Feb 1, 2024",
      lastUsed: "1 hour ago",
    },
    {
      id: "app3",
      name: "Internal Analytics Dashboard",
      description: "Custom analytics dashboard for internal use",
      clientId: "nk_••••••••••••••••",
      clientSecret: "ncs_••••••••••••••••",
      redirectUris: ["https://analytics.internal.nucleo.io/oauth/callback"],
      scopes: ["read:analytics", "read:users"],
      status: "active",
      createdAt: "Mar 5, 2024",
      lastUsed: "5 min ago",
    },
    {
      id: "app4",
      name: "Legacy Integration (Deprecated)",
      description: "Old third-party integration (being phased out)",
      clientId: "nk_••••••••••••••••",
      clientSecret: "ncs_••••••••••••••••",
      redirectUris: ["https://legacy.example.com/oauth"],
      scopes: ["read:profile"],
      status: "deprecated",
      createdAt: "Jun 10, 2023",
      lastUsed: "3 days ago",
    },
  ];

  const filteredApps = oauthApps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" size="sm">Active</Badge>;
      case "inactive":
        return <Badge variant="warning" size="sm">Inactive</Badge>;
      case "deprecated":
        return <Badge variant="default" size="sm">Deprecated</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">OAuth Applications</h2>
          <p className="text-sm text-muted-foreground">
            Manage third-party application access
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Register App
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Apps List */}
      <div className="space-y-4">
        {filteredApps.map((app) => (
          <Card key={app.id} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2 mt-1">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{app.name}</h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{app.description}</p>

                  <div className="grid gap-3 sm:grid-cols-2 mb-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Client ID</label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                          {app.clientId}
                        </code>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Client Secret</label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                          {showSecrets[app.id] ? app.clientSecret.replace("••••••", "abc123def456ghi") : app.clientSecret}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setShowSecrets({ ...showSecrets, [app.id]: !showSecrets[app.id] })}
                        >
                          {showSecrets[app.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs text-muted-foreground mb-1 block">Redirect URIs</label>
                    <div className="flex flex-wrap gap-2">
                      {app.redirectUris.map((uri) => (
                        <code key={uri} className="text-xs bg-muted px-2 py-1 rounded">
                          {uri}
                        </code>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {app.scopes.map((scope) => (
                      <Badge key={scope} variant="outline" size="sm">{scope}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Created: {app.createdAt}</span>
                    <span>Last used: {app.lastUsed}</span>
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

      {/* Documentation Link */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">Need help with OAuth?</h3>
              <p className="text-sm text-muted-foreground">Check our API documentation for OAuth implementation details.</p>
            </div>
            <Button variant="outline" leftIcon={<ExternalLink className="h-4 w-4" />}>
              View Docs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
