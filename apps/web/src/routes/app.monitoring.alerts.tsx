/**
 * Alerts
 *
 * Alert management and notification rules with real API data.
 */

import { Card, CardContent, Badge, Button, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Mail,
  Slack,
  Webhook,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { monitoringApi } from "@/lib/api";

const API_BASE = "/api/v1";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const isDemo = localStorage.getItem("demo_mode") === "true";
  if (isDemo) return { "x-organization-id": "demo-org" };
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.companyId) return { "x-organization-id": user.companyId };
  } catch {}
  return {};
}

export const Route = createFileRoute("/app/monitoring/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  // Fetch alerts from API
  const { data: alerts = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "alerts"],
    queryFn: () => monitoringApi.getAlerts(),
    refetchInterval: 60000,
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/monitoring/alerts/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to delete alert");
      return res.json() as Promise<any>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitoring", "alerts"] }),
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`${API_BASE}/monitoring/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update alert");
      return res.json() as Promise<any>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitoring", "alerts"] }),
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const filteredAlerts = alerts.filter((alert: any) => {
    const matchesSearch = alert.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || (alert.enabled ? "active" : "inactive") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const summary = {
    total: alerts.length,
    active: alerts.filter((a: any) => a.enabled).length,
    critical: alerts.filter((a: any) => a.severity === "critical" && a.enabled).length,
    triggered: alerts.reduce((sum: number, a: any) => sum + (a.triggerCount || 0), 0),
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="danger" size="sm">Critical</Badge>;
      case "warning":
        return <Badge variant="warning" size="sm">Warning</Badge>;
      case "info":
        return <Badge variant="info" size="sm">Info</Badge>;
      default:
        return <Badge variant="default" size="sm">{severity}</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-3 w-3" />;
      case "slack":
        return <Slack className="h-3 w-3" />;
      case "webhook":
        return <Webhook className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Alerts</h2>
          <p className="text-sm text-muted-foreground">
            Alert management and notification rules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <Link to="/app/monitoring/alerts/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Create Alert
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.total}</p>
                <p className="text-xs text-muted-foreground">Total Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{isLoading ? "..." : summary.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{isLoading ? "..." : summary.critical}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.triggered}</p>
                <p className="text-xs text-muted-foreground">Times Triggered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="space-y-3 p-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No alerts found</div>
            ) : (
              filteredAlerts.map((alert: any) => (
                <div key={alert.id} className={`flex items-center gap-4 p-4 border border-border rounded-lg ${
                  alert.severity === "critical" ? "border-red-200 bg-red-50/50" : ""
                }`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{alert.name}</p>
                      {getSeverityBadge(alert.severity)}
                      <Badge variant={alert.enabled ? "success" : "default"} size="sm">
                        {alert.enabled ? "active" : "inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.description || `${alert.metric} ${alert.condition} ${alert.threshold}`}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Metric: {alert.metric}</span>
                      <span>Threshold: {alert.condition} {alert.threshold}</span>
                      <span>Duration: {alert.duration}m</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {(alert.channels || []).map((channel: string) => (
                      <div key={channel} className="flex items-center gap-1 text-muted-foreground">
                        {getChannelIcon(channel)}
                      </div>
                    ))}
                  </div>
                  <div className="text-center px-4">
                    <p className="text-lg font-bold text-foreground">{alert.triggerCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Triggered</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={alert.enabled ? "Disable alert" : "Enable alert"}
                      onClick={() => toggleAlertMutation.mutate({ id: alert.id, enabled: !alert.enabled })}
                      disabled={toggleAlertMutation.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteAlertMutation.mutate(alert.id)}
                      disabled={deleteAlertMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
