/**
 * App Catalog
 *
 * Registered applications and services for monitoring.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AppWindow,
  CheckCircle,
  Clock,
  Globe,
  Plus,
  RefreshCw,
  Server,
  Settings,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { monitoringApi } from "@/lib/api";

const searchSchema = z.object({
  category: z.string().optional(),
  status: z.enum(["all", "healthy", "degraded", "down"]).optional().default("all"),
});

export const Route = createFileRoute("/app/monitoring/catalog")({
  validateSearch: searchSchema,
  component: CatalogPage,
});

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

type AppPoint = {
  id: string | number;
  name: string;
  category: string;
  status: string;
  lastHealthCheck: string;
  endpoint: string;
  metrics: { uptime: number; latency: number; errorRate: number };
};

function CatalogPage() {
  const queryClient = useQueryClient();
  const { status: filterStatus } = Route.useSearch();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newApp, setNewApp] = useState({ name: "", category: "Backend", endpoint: "" });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "catalog"],
    queryFn: () => monitoringApi.getCatalog({ limit: 100 }),
    refetchInterval: 15000,
  });

  // Map catalog items to AppPoint shape
  const rawApps: AppPoint[] = ((data as any)?.items || (data as any)?.data || []).map((a: any) => ({
    id: a.id,
    name: a.name,
    category: a.category || "Service",
    status: a.status === "active" ? "healthy" : a.status === "inactive" ? "down" : a.status || "healthy",
    lastHealthCheck: a.healthCheckAt
      ? `${Math.floor((Date.now() - new Date(a.healthCheckAt).getTime()) / 60000)}m ago`
      : "Just now",
    endpoint: a.metadata?.endpoint || a.endpoint || "—",
    metrics: {
      uptime: a.uptime ?? 99.9,
      latency: a.latency ?? 45,
      errorRate: a.errorRate ?? 0.1,
    },
  }));

  const apps: AppPoint[] = filterStatus && filterStatus !== "all"
    ? rawApps.filter((a) => a.status === filterStatus)
    : rawApps;

  const summary = {
    total: data?.total ?? rawApps.length,
    healthy: rawApps.filter((a) => a.status === "healthy").length,
    degraded: rawApps.filter((a) => a.status === "degraded").length,
    down: rawApps.filter((a) => a.status === "down").length,
  };

  // Create app registration mutation
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; category: string; endpoint: string }) => {
      const res = await fetch(`${API_BASE}/monitoring/catalog`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to register application");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "catalog"] });
      setIsCreateOpen(false);
      setNewApp({ name: "", category: "Backend", endpoint: "" });
      toast.success("Application registered successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to register application"),
  });

  // Delete / deregister mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await fetch(`${API_BASE}/monitoring/catalog/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to deregister application");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "catalog"] });
      toast.success("Application deregistered");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to deregister application"),
  });

  // Health-check trigger mutation
  const healthCheckMutation = useMutation({
    mutationFn: (id: string | number) => monitoringApi.healthCheck(String(id)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "catalog"] });
      toast.success(`Health check completed — ${result.latency}ms`);
    },
    onError: () => toast.error("Health check failed"),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge variant="success" size="sm">Healthy</Badge>;
      case "degraded":
        return <Badge variant="warning" size="sm">Degraded</Badge>;
      case "down":
        return <Badge variant="danger" size="sm">Down</Badge>;
      default:
        return <Badge variant="outline" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">App Catalog</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Registered applications and services for monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh All"}
          </button>
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Register App
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Total Apps</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : summary.total}</p>
              </div>
              <AppWindow className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Healthy</p>
                <p className="font-black text-2xl text-emerald-400 mt-0.5">{isLoading ? "..." : summary.healthy}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Degraded</p>
                <p className="font-black text-2xl text-amber-400 mt-0.5">{isLoading ? "..." : summary.degraded}</p>
              </div>
              <Activity className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Down</p>
                <p className="font-black text-2xl text-rose-400 mt-0.5">{isLoading ? "..." : summary.down}</p>
              </div>
              <XCircle className="h-8 w-8 text-rose-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* App List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Registered Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading catalog...</div>
            ) : apps.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No applications registered</div>
            ) : (
              apps.map((app) => (
                <div key={app.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Server className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{app.name}</h3>
                          {getStatusBadge(app.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{app.category}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-mono text-muted-foreground">{app.endpoint}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">Uptime</p>
                        <p className={`font-semibold ${app.metrics.uptime > 99.9 ? "text-emerald-400" : "text-amber-400"}`}>
                          {app.metrics.uptime}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Latency</p>
                        <p className={`font-semibold ${app.metrics.latency > 150 ? "text-amber-400" : "text-foreground"}`}>
                          {app.metrics.latency}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Error Rate</p>
                        <p className={`font-semibold ${app.metrics.errorRate > 0.5 ? "text-rose-400" : "text-foreground"}`}>
                          {app.metrics.errorRate}%
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{app.lastHealthCheck}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => healthCheckMutation.mutate(app.id)}
                        disabled={healthCheckMutation.isPending}
                        title="Trigger health check"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-rose-400"
                        onClick={() => deleteMutation.mutate(app.id)}
                        disabled={deleteMutation.isPending}
                        title="Deregister application"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create App Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-foreground mb-4">Register Application</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Name *</label>
                <input
                  className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-foreground"
                  value={newApp.name}
                  onChange={(e) => setNewApp((p) => ({ ...p, name: e.target.value }))}
                  placeholder="My Service"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Category</label>
                <select
                  className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-foreground"
                  value={newApp.category}
                  onChange={(e) => setNewApp((p) => ({ ...p, category: e.target.value }))}
                >
                  <option value="Backend">Backend</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Database">Database</option>
                  <option value="Microservice">Microservice</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Endpoint URL</label>
                <input
                  className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-foreground"
                  value={newApp.endpoint}
                  onChange={(e) => setNewApp((p) => ({ ...p, endpoint: e.target.value }))}
                  placeholder="https://api.example.com/health"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button
                className="flex-1"
                disabled={!newApp.name || createMutation.isPending}
                onClick={() => createMutation.mutate(newApp)}
              >
                {createMutation.isPending ? "Registering..." : "Register"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
