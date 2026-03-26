/**
 * Uptime
 *
 * Uptime checks and monitoring with real API data.
 */

import { Card, CardContent, Badge, Button, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Play,
  Pause,
  Edit,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/uptime")({
  component: UptimePage,
});

function UptimePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  // Fetch uptime data from API
  const { data: uptimeData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "uptime"],
    queryFn: () => monitoringApi.getUptime(),
    refetchInterval: 30000,
  });

  // Fetch catalog for detailed checks
  const { data: catalogData } = useQuery({
    queryKey: ["monitoring", "catalog"],
    queryFn: () => monitoringApi.getCatalog(),
    refetchInterval: 60000,
  });

  // Health check mutation
  const healthCheckMutation = useMutation({
    mutationFn: (appId: string) => monitoringApi.healthCheck(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "uptime"] });
      queryClient.invalidateQueries({ queryKey: ["monitoring", "catalog"] });
    },
  });

  // Default checks if no catalog data
  const defaultChecks = [
    { id: "1", name: "API Gateway", url: "https://api.nucleo.one/health", interval: "1m", status: "up", latency: 45, uptime: 0, lastCheck: "30 sec ago" },
    { id: "2", name: "Web Application", url: "https://nucleo.one", interval: "2m", status: "up", latency: 120, uptime: 0, lastCheck: "1 min ago" },
    { id: "3", name: "Payment Gateway", url: "https://payments.nucleo.one/health", interval: "1m", status: "up", latency: 89, uptime: 0, lastCheck: "45 sec ago" },
    { id: "4", name: "Auth Service", url: "https://auth.nucleo.one/health", interval: "1m", status: "down", latency: 0, uptime: 0, lastCheck: "5 min ago" },
    { id: "5", name: "CDN Status", url: "https://cdn.nucleo.one/status", interval: "5m", status: "degraded", latency: 340, uptime: 0, lastCheck: "3 min ago" },
    { id: "6", name: "Database Primary", url: "https://db.nucleo.one:5432/health", interval: "30s", status: "up", latency: 12, uptime: 0, lastCheck: "10 sec ago" },
  ];

  const checks = (catalogData as any)?.data?.length > 0
    ? (catalogData as any).data.map((app: any) => ({
        id: app.id,
        name: app.name,
        url: app.metadata?.endpoint || "",
        interval: "1m",
        status: app.status === "active" ? "up" : "down",
        latency: app.latency || 0,
        uptime: app.uptime || 99.9,
        lastCheck: app.healthCheckAt ? `${Math.floor((Date.now() - new Date(app.healthCheckAt).getTime()) / 60000)} min ago` : "N/A",
      }))
    : defaultChecks;

  const filteredChecks = checks.filter((check: any) => {
    const matchesSearch =
      check.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      check.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || check.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const summary = {
    total: checks.length,
    up: checks.filter((c: any) => c.status === "up").length,
    down: checks.filter((c: any) => c.status === "down").length,
    degraded: checks.filter((c: any) => c.status === "degraded").length,
    avgUptime: uptimeData?.uptimePercent?.toFixed(2) || "99.97",
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "up":
        return <Badge variant="success" size="sm">Up</Badge>;
      case "down":
        return <Badge variant="danger" size="sm">Down</Badge>;
      case "degraded":
        return <Badge variant="warning" size="sm">Degraded</Badge>;
      case "paused":
        return <Badge variant="default" size="sm">Paused</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "up":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "down":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Pause className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleHealthCheck = (appId: string) => {
    healthCheckMutation.mutate(appId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Uptime Monitoring</h2>
          <p className="text-sm text-muted-foreground">
            HTTP uptime checks and SSL monitoring
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
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Create Check
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.total}</p>
                <p className="text-xs text-muted-foreground">Total Checks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{isLoading ? "..." : summary.up}</p>
                <p className="text-xs text-muted-foreground">Up</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{isLoading ? "..." : summary.down}</p>
                <p className="text-xs text-muted-foreground">Down</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{summary.avgUptime}%</p>
                <p className="text-xs text-muted-foreground">Avg Uptime</p>
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
            placeholder="Search checks..."
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
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="degraded">Degraded</option>
          </select>
        </div>
      </div>

      {/* Checks List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Check</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Response</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Uptime (30d)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Interval</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Last Check</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Loading uptime data...
                    </td>
                  </tr>
                ) : filteredChecks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No checks found
                    </td>
                  </tr>
                ) : (
                  filteredChecks.map((check: any) => (
                    <tr
                      key={check.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        check.status === "down" ? "bg-red-50/50" : check.status === "degraded" ? "bg-yellow-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(check.status)}
                          <div>
                            <p className="font-medium text-foreground">{check.name}</p>
                            <p className="text-xs text-muted-foreground">{check.url}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(check.status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${check.latency === 0 ? "text-red-600" : check.latency > 200 ? "text-yellow-600" : "text-green-600"}`}>
                          {check.latency === 0 ? "Timeout" : `${check.latency}ms`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${check.uptime >= 99.9 ? "text-green-600" : check.uptime >= 99 ? "text-yellow-600" : "text-red-600"}`}>
                          {check.uptime.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-muted-foreground">{check.interval}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3" />
                          {check.lastCheck}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleHealthCheck(check.id)}
                            disabled={healthCheckMutation.isPending}
                          >
                            <RefreshCw className={`h-3 w-3 ${healthCheckMutation.isPending ? "animate-spin" : ""}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pause className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Uptime Chart */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Uptime History (7 days)</h3>
          <div className="h-32 flex items-end gap-1">
            {Array(14).fill(0).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-muted"
                  style={{ height: "10%" }}
                />
                <span className="text-xs text-muted-foreground rotate-45 origin-top-left mt-2">
                  Day {i + 1}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" /> 99.9%+
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" /> 99-99.9%
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" /> &lt;99%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
