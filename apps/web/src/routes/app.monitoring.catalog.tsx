/**
 * App Catalog
 *
 * Registered applications and services for monitoring.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  XCircle,
} from "lucide-react";
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/catalog")({
  component: CatalogPage,
});

function CatalogPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "catalog"],
    queryFn: () => monitoringApi.getCatalog({ limit: 100 }),
    refetchInterval: 60000,
  });

  type AppPoint = {
    id: number;
    name: string;
    category: string;
    status: string;
    lastHealthCheck: string;
    endpoint: string;
    metrics: { uptime: number; latency: number; errorRate: number };
  };

  const apps: AppPoint[] = data?.items || [];

  const summary = {
    total: data?.total || apps.length,
    healthy: apps.filter((a: AppPoint) => a.status === "healthy").length,
    degraded: apps.filter((a: AppPoint) => a.status === "degraded").length,
    down: apps.filter((a: AppPoint) => a.status === "down").length,
  };

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
          <h2 className="text-lg font-semibold text-foreground">App Catalog</h2>
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
          <Button variant="primary" size="sm">
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
                <p className="font-black text-2xl text-foreground mt-0.5">{summary.total}</p>
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
                <p className="font-black text-2xl text-emerald-400 mt-0.5">{summary.healthy}</p>
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
                <p className="font-black text-2xl text-amber-400 mt-0.5">{summary.degraded}</p>
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
                <p className="font-black text-2xl text-rose-400 mt-0.5">{summary.down}</p>
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
            {apps.map((app) => (
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
                  <div className="flex items-center gap-6 text-right">
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
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
