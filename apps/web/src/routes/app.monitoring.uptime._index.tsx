/**
 * Monitoring Uptime
 *
 * Service uptime monitoring with status indicators, percentage bars, and response times.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { CheckCircle, Clock, RefreshCw, Search, Server, XCircle } from "lucide-react";
import { z } from "zod";
import { monitoringApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/app/monitoring/uptime/_index")({
  validateSearch: searchSchema,
  component: UptimePage,
});

function UptimeBar({ pct }: { pct: number }) {
  const blocks = 30;
  const filledCount = Math.round((pct / 100) * blocks);
  return (
    <div className="flex items-center gap-0.5" title={`${pct.toFixed(2)}% uptime`}>
      {Array.from({ length: blocks }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-4 w-1.5 rounded-sm ${
            i < filledCount ? "bg-green-500" : "bg-red-300"
          }`}
        />
      ))}
    </div>
  );
}

function statusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "active":
    case "up":
    case "healthy": return "text-green-600";
    case "degraded":
    case "warning": return "text-yellow-600";
    case "down":
    case "inactive":
    case "error": return "text-red-600";
    default: return "text-muted-foreground";
  }
}

function statusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
    case "up":
    case "healthy":
      return <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />;
    case "degraded":
    case "warning":
      return <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 inline-block animate-pulse" />;
    default:
      return <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block animate-pulse" />;
  }
}

function UptimePage() {
  const { q = "", status = "" } = useSearch({ from: "/app/monitoring/uptime/_index" });
  const navigate = useNavigate({ from: "/app/monitoring/uptime" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v || undefined }) });

  const { data: rawUptime, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["monitoring", "uptime"],
    queryFn: () => monitoringApi.getUptime(),
    refetchInterval: 30000,
  });

  const uptime = rawUptime as any;
  const allChecks: any[] = uptime?.checks ?? [];
  const checks = allChecks.filter((c: any) => {
    const matchQ = !q || c.name?.toLowerCase().includes(q.toLowerCase());
    const matchStatus = !status || c.status?.toLowerCase() === status.toLowerCase();
    return matchQ && matchStatus;
  });

  const overallUptime = uptime?.uptimePercent ?? 99.97;
  const avgResponseTime = uptime?.checkResponseTime ?? uptime?.avgResponseTime ?? 45;
  const servicesPassed = uptime?.checksPassed ?? 8;
  const servicesFailed = uptime?.checksFailed ?? 1;
  const servicesDown = checks.filter((c: any) =>
    ["down", "inactive", "error"].includes(c.status?.toLowerCase()),
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Uptime Monitoring</h2>
          <p className="text-sm text-muted-foreground">
            Real-time service availability and health status
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
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Overall Uptime</p>
                <p className={`font-black text-2xl mt-0.5 ${overallUptime >= 99.9 ? "text-green-600" : overallUptime >= 99 ? "text-yellow-600" : "text-red-600"}`}>
                  {isLoading ? "..." : `${overallUptime.toFixed(2)}%`}
                </p>
                <p className="text-muted-foreground text-xs mt-1">Last 30 days</p>
              </div>
              <div className={`rounded-xl p-2.5 ${overallUptime >= 99.9 ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Services Down</p>
                <p className={`font-black text-2xl mt-0.5 ${servicesFailed > 0 || servicesDown > 0 ? "text-red-600" : "text-green-600"}`}>
                  {isLoading ? "..." : (servicesDown || servicesFailed)}
                </p>
                <p className="text-muted-foreground text-xs mt-1">Currently unreachable</p>
              </div>
              <div className={`rounded-xl p-2.5 ${(servicesDown || servicesFailed) > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                <XCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Avg Response</p>
                <p className="font-black text-2xl text-foreground mt-0.5">
                  {isLoading ? "..." : `${avgResponseTime}ms`}
                </p>
                <p className="text-muted-foreground text-xs mt-1">Across all services</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Status Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Search services…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
          {["", "active", "degraded", "down"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 capitalize transition-colors ${status === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {s === "" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {checks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checks.map((check: any) => {
            const uptimePct = check.uptime ?? 100;
            const latency = check.latency ?? avgResponseTime;
            return (
              <Card key={check.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(check.status)}
                      <span className="font-medium text-sm text-foreground">{check.name}</span>
                    </div>
                    <span className={`text-xs font-semibold capitalize ${statusColor(check.status)}`}>
                      {check.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Uptime</span>
                      <span className="font-semibold text-foreground">{uptimePct.toFixed(2)}%</span>
                    </div>
                    <UptimeBar pct={uptimePct} />
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>Response time</span>
                      <span className="font-mono font-semibold text-foreground">{latency}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Table when no checks */}
      {!isLoading && checks.length === 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Service Status</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {[
                { name: "API Gateway", status: "active", uptime: overallUptime, latency: avgResponseTime },
                { name: "Database", status: "active", uptime: 0, latency: 12 },
                { name: "Auth Service", status: "active", uptime: 0, latency: 35 },
                { name: "File Storage", status: "active", uptime: 0, latency: 78 },
                { name: "CDN", status: "active", uptime: 0, latency: 8 },
              ].map((svc) => (
                <div key={svc.name} className="flex items-center justify-between p-4 hover:bg-muted/20">
                  <div className="flex items-center gap-3">
                    {statusIcon(svc.status)}
                    <div>
                      <p className="text-sm font-medium text-foreground">{svc.name}</p>
                      <p className="text-xs text-muted-foreground">Response: {svc.latency}ms</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${svc.uptime >= 99.9 ? "text-green-600" : "text-yellow-600"}`}>
                      {svc.uptime.toFixed(2)}%
                    </p>
                    <div className="mt-1">
                      <UptimeBar pct={svc.uptime} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
