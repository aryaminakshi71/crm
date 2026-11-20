/**
 * Monitoring Alerts
 *
 * Alert rules management with severity-based filtering and acknowledge/resolve actions.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AlertCircle, AlertTriangle, Bell, CheckCircle, Info, RefreshCw, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { z } from "zod";
import { monitoringApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export const Route = createFileRoute("/app/monitoring/alerts/_index")({
  validateSearch: z.object({
    severity: z.string().optional().default("all"),
    page: z.number().optional().default(1),
  }),
  component: AlertsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({ "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "" });

function severityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical": return "destructive";
    case "high":
    case "warning": return "warning";
    case "medium": return "warning";
    case "low":
    case "info": return "secondary";
    default: return "secondary";
  }
}

function severityIcon(severity: string) {
  switch (severity?.toLowerCase()) {
    case "critical": return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "high":
    case "warning": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case "medium": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default: return <Info className="h-4 w-4 text-blue-500" />;
  }
}

function severityBadgeClass(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical": return "bg-red-100 text-red-700 border-red-200";
    case "high":
    case "warning": return "bg-orange-100 text-orange-700 border-orange-200";
    case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default: return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

const PAGE_SIZE = 50;

function AlertsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { severity: severityFilter, page } = useSearch({ from: Route.id });
  const navigate = useNavigate({ from: Route.fullPath });
  const setSeverityFilter = (v: string) => navigate({ search: (prev: any) => ({ ...prev, severity: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (prev: any) => ({ ...prev, page: v }) });

  const { data: rawAlerts, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["monitoring", "alerts", page],
    queryFn: () => monitoringApi.getAlerts(),
    refetchInterval: 15000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/alerts/${id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to acknowledge alert");
      return res.json() as Promise<any>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitoring", "alerts"] }),
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/alerts/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to resolve alert");
      return res.json() as Promise<any>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitoring", "alerts"] }),
  });

  const alerts: any[] = (rawAlerts as any) ?? [];
  const total = (rawAlerts as any)?.total ?? (rawAlerts as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = alerts.filter((a: any) => {
    const matchesSearch =
      !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.metric?.toLowerCase().includes(search.toLowerCase()) ||
      a.service?.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity =
      severityFilter === "all" || a.severity?.toLowerCase() === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const criticalActive = alerts.filter(
    (a: any) => a.severity?.toLowerCase() === "critical" && a.enabled !== false,
  ).length;
  const totalActive = alerts.filter((a: any) => a.enabled !== false).length;
  const resolved = alerts.filter((a: any) => a.enabled === false).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Alert Rules</h2>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live · updated {timeAgo(lastUpdated.toISOString())}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage monitoring alerts and notification rules
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Critical Active</p>
                <p className="font-black text-2xl text-red-600 mt-0.5">{isLoading ? "..." : criticalActive}</p>
                <p className="text-muted-foreground text-xs mt-1">Require immediate attention</p>
              </div>
              <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Total Active</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : totalActive}</p>
                <p className="text-muted-foreground text-xs mt-1">All enabled alert rules</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Bell className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Resolved / Disabled</p>
                <p className="font-black text-2xl text-green-600 mt-0.5">{isLoading ? "..." : resolved}</p>
                <p className="text-muted-foreground text-xs mt-1">Resolved or disabled rules</p>
              </div>
              <div className="rounded-xl bg-green-50 p-2.5 text-green-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "critical", "warning", "info"].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                severityFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Alert Rules
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({filtered.length} rules)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">No alerts found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((alert: any) => (
                <div
                  key={alert.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">{severityIcon(alert.severity)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate">{alert.name}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${severityBadgeClass(alert.severity)}`}
                        >
                          {alert.severity}
                        </span>
                        {alert.enabled === false && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-muted text-muted-foreground border-border">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>Metric: <span className="font-mono text-foreground">{alert.metric}</span></span>
                        {alert.condition && alert.threshold !== undefined && (
                          <span>
                            Condition: <span className="font-mono text-foreground">{alert.condition} {alert.threshold}</span>
                          </span>
                        )}
                        {alert.duration && (
                          <span>For: <span className="font-mono text-foreground">{alert.duration}m</span></span>
                        )}
                        {alert.triggerCount !== undefined && (
                          <span>Triggers: <span className="font-semibold text-foreground">{alert.triggerCount}</span></span>
                        )}
                        {alert.createdAt && (
                          <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      {alert.channels && alert.channels.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {alert.channels.map((ch: string) => (
                            <span key={ch} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground capitalize">
                              {ch}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {alert.enabled !== false && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeMutation.mutate(alert.id)}
                        disabled={acknowledgeMutation.isPending}
                        className="text-xs h-7"
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveMutation.mutate(alert.id)}
                      disabled={resolveMutation.isPending}
                      className="text-xs h-7 text-green-700 border-green-300 hover:bg-green-50"
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
