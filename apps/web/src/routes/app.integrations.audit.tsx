/**
 * Audit Log Viewer
 *
 * View all integration-related audit events.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Settings,
  Trash2,
  Plus,
  Key,
  Bell,
  Webhook,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integrations/audit")({
  component: AuditLogPage,
});

function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterUser, setFilterUser] = useState("all");

  const auditLogs = [
    {
      id: "aud_001",
      action: "connector.created",
      description: "Created Salesforce connector",
      user: "sarah.chen@nucleo.io",
      userRole: "Admin",
      connector: "Salesforce",
      timestamp: "2 hours ago",
      ipAddress: "192.168.1.100",
    },
    {
      id: "aud_002",
      action: "workflow.activated",
      description: "Activated Lead Sync workflow",
      user: "david.park@nucleo.io",
      userRole: "Developer",
      connector: "Salesforce",
      timestamp: "3 hours ago",
      ipAddress: "192.168.1.101",
    },
    {
      id: "aud_003",
      action: "webhook.configured",
      description: "Updated webhook endpoint URL",
      user: "sarah.chen@nucleo.io",
      userRole: "Admin",
      connector: "Stripe",
      timestamp: "5 hours ago",
      ipAddress: "192.168.1.100",
    },
    {
      id: "aud_004",
      action: "oauth.authorized",
      description: "Authorized Zapier integration",
      user: "emily.zhang@nucleo.io",
      userRole: "User",
      connector: "Zapier",
      timestamp: "1 day ago",
      ipAddress: "10.0.0.50",
    },
    {
      id: "aud_005",
      action: "connector.error",
      description: "Salesforce authentication failed",
      user: "system",
      userRole: "System",
      connector: "Salesforce",
      timestamp: "1 day ago",
      ipAddress: "Internal",
    },
    {
      id: "aud_006",
      action: "ratelimit.exceeded",
      description: "API rate limit exceeded for /api/sync",
      user: "api",
      userRole: "API",
      connector: "Internal",
      timestamp: "2 days ago",
      ipAddress: "Internal",
    },
    {
      id: "aud_007",
      action: "settings.updated",
      description: "Updated retry policy for connection timeouts",
      user: "sarah.chen@nucleo.io",
      userRole: "Admin",
      connector: "All",
      timestamp: "2 days ago",
      ipAddress: "192.168.1.100",
    },
    {
      id: "aud_008",
      action: "connector.deleted",
      description: "Removed legacy Mailchimp connector",
      user: "david.park@nucleo.io",
      userRole: "Developer",
      connector: "Mailchimp",
      timestamp: "3 days ago",
      ipAddress: "192.168.1.101",
    },
  ];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === "all" || log.action.startsWith(filterAction);
    const matchesUser = filterUser === "all" || log.userRole === filterUser;
    return matchesSearch && matchesAction && matchesUser;
  });

  const getActionIcon = (action: string) => {
    if (action.startsWith("connector")) return <Settings className="h-4 w-4" />;
    if (action.startsWith("workflow")) return <CheckCircle2 className="h-4 w-4" />;
    if (action.startsWith("webhook")) return <Webhook className="h-4 w-4" />;
    if (action.startsWith("oauth")) return <Key className="h-4 w-4" />;
    if (action.startsWith("settings")) return <Settings className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getActionBadge = (action: string) => {
    if (action.includes("created") || action.includes("activated") || action.includes("authorized"))
      return <Badge variant="success" size="sm">Created</Badge>;
    if (action.includes("deleted"))
      return <Badge variant="danger" size="sm">Deleted</Badge>;
    if (action.includes("error") || action.includes("exceeded"))
      return <Badge variant="warning" size="sm">Warning</Badge>;
    return <Badge variant="default" size="sm">Info</Badge>;
  };

  const uniqueUsers = [...new Set(auditLogs.map((l) => l.userRole))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/app/integrations">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Audit Logs</h2>
              <p className="text-sm text-muted-foreground">
                {filteredLogs.length} events recorded
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="connector">Connectors</option>
            <option value="workflow">Workflows</option>
            <option value="webhook">Webhooks</option>
            <option value="oauth">OAuth</option>
            <option value="settings">Settings</option>
          </select>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
          >
            <option value="all">All Users</option>
            {uniqueUsers.map((user) => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="space-y-2">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-muted p-2 mt-1">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <code className="text-sm font-medium">{log.action}</code>
                    {getActionBadge(log.action)}
                  </div>
                  <p className="text-sm text-foreground mb-1">{log.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {log.user}
                    </span>
                    <span>Connector: {log.connector}</span>
                    <span>IP: {log.ipAddress}</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No audit logs found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {auditLogs.length} events
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
