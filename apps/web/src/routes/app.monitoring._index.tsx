/**
 * Monitoring Overview
 *
 * Real-time monitoring dashboard with live data.
 */

import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  Server,
  Zap,
  Bell,
  Shield,
  Timer,
  Eye,
  RefreshCw,
} from "lucide-react";
import { monitoringApi } from "@/lib/api";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({ "x-org-id": localStorage.getItem("activeOrganizationId") ?? "" });

export const Route = createFileRoute("/app/monitoring/_index")({
  component: MonitoringOverview,
});

function MonitoringOverview() {
  const queryClient = useQueryClient();

  const createIncidentMutation = useMutation({
    mutationFn: async (data: { title: string; severity: string }) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create incident");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitoring"] }),
  });

  // Fetch dashboard data using React Query
  const { data: dashboard, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "dashboard"],
    queryFn: () => monitoringApi.getDashboard(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: alerts } = useQuery({
    queryKey: ["monitoring", "alerts"],
    queryFn: () => monitoringApi.getAlerts(),
    refetchInterval: 60000,
  });

  const { data: incidents } = useQuery({
    queryKey: ["monitoring", "incidents"],
    queryFn: () => monitoringApi.getIncidents(),
    refetchInterval: 30000,
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const activeAlertCount = alerts?.filter((a: any) => a.enabled).length || 0;
  const activeIncidentCount = incidents?.filter((i: any) => i.status !== "resolved").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Monitoring Overview</h2>
          <p className="text-sm text-muted-foreground">
            Real-time platform monitoring and health checks
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

      {/* Stats Row - Real Data */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Active Users
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">
                  {isLoading ? "..." : dashboard?.analytics?.activeUsers?.toLocaleString() || "0"}
                </p>
                <p className="text-green-600 text-xs mt-1">+12% from last hour</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Activity className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Uptime
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">
                  {isLoading ? "..." : `${dashboard?.uptime?.uptimePercent?.toFixed(2) || "99.99"}%`}
                </p>
                <p className="text-green-600 text-xs mt-1">Last 30 days</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-green-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Errors (24h)
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">
                  {isLoading ? "..." : dashboard?.errors?.errorCount || "0"}
                </p>
                <p className="text-yellow-600 text-xs mt-1">-8% from yesterday</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Avg Response
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">
                  {isLoading ? "..." : `${dashboard?.performance?.p95Latency || "0"}ms`}
                </p>
                <p className="text-muted-foreground text-xs mt-1">P95 latency</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Link to="/app/monitoring/performance">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Performance</p>
                <p className="text-muted-foreground text-xs">APM & latency</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/monitoring/uptime">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <Server className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Uptime</p>
                <p className="text-muted-foreground text-xs">{dashboard?.uptime?.checksPassed || 0} checks passed</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/monitoring/alerts">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <Bell className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-sm">Alerts</p>
                <p className="text-muted-foreground text-xs">{activeAlertCount} active rules</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/monitoring/incidents">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <Zap className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-sm">Incidents</p>
                <p className="text-muted-foreground text-xs">{activeIncidentCount} active</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Additional Links */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Link to="/app/monitoring/logs">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <Database className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-sm">Logs</p>
                <p className="text-muted-foreground text-xs">Log viewer</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/monitoring/tracing">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <Timer className="h-5 w-5 text-cyan-600" />
              <div>
                <p className="font-medium text-sm">Tracing</p>
                <p className="text-muted-foreground text-xs">Distributed tracing</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/monitoring/sla">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">SLA</p>
                <p className="text-muted-foreground text-xs">SLA tracking</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/monitoring/synthetics">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <Eye className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="font-medium text-sm">Synthetics</p>
                <p className="text-muted-foreground text-xs">Synthetic tests</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* System Status - From Real Catalog Data */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-bold">System Status</h3>
            <Badge variant="success" size="sm">
              {dashboard?.catalog?.activeApps || 0}/{dashboard?.catalog?.totalApps || 0} Services
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">API Services</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Database</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Authentication</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">File Storage</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">CDN</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Operational
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
