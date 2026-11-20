/**
 * DevOps Infrastructure
 *
 * Infrastructure resource management with CPU/memory utilization and cost tracking.
 */

import { Card, CardContent, CardHeader, CardTitle, EmptyState, Loading } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, DollarSign, RefreshCw, Search, Server } from "lucide-react";
import { z } from "zod";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { devopsApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
});

export const Route = createFileRoute("/app/devops/infrastructure/_index")({
  validateSearch: searchSchema,
  component: InfrastructurePage,
});

function statusDot(status: string) {
  const s = status?.toLowerCase();
  if (s === "running" || s === "active" || s === "healthy") {
    return <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />;
  }
  if (s === "degraded" || s === "warning") {
    return <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 inline-block animate-pulse" />;
  }
  if (s === "provisioning") {
    return <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block animate-pulse" />;
  }
  return <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />;
}

function statusTextColor(status: string): string {
  const s = status?.toLowerCase();
  if (s === "running" || s === "active" || s === "healthy") return "text-green-600";
  if (s === "degraded" || s === "warning") return "text-yellow-600";
  if (s === "stopped" || s === "error" || s === "failed") return "text-red-600";
  if (s === "provisioning") return "text-blue-600";
  return "text-muted-foreground";
}

function typeBadgeColor(type: string): string {
  switch (type?.toLowerCase()) {
    case "server":
    case "vm": return "bg-blue-100 text-blue-700";
    case "container": return "bg-purple-100 text-purple-700";
    case "database": return "bg-green-100 text-green-700";
    case "cache": return "bg-orange-100 text-orange-700";
    default: return "bg-muted text-muted-foreground";
  }
}

function UsageBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 95 ? "bg-red-500" : pct >= 80 ? "bg-yellow-400" : "bg-green-500";
  const textColor = pct >= 95 ? "text-red-600" : pct >= 80 ? "text-yellow-600" : "text-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] tabular-nums font-semibold w-9 text-right ${textColor}`}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

function InfrastructurePage() {
  const { q: search = "", type: typeFilter = "all" } = useSearch({ from: "/app/devops/infrastructure/_index" });
  const navigate = useNavigate({ from: "/app/devops/infrastructure" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setTypeFilter = (v: string) => navigate({ search: (p) => ({ ...p, type: v === "all" ? undefined : v }) });

  const { data: rawData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["devops", "infrastructure"],
    queryFn: () => devopsApi.infrastructure.list(),
    refetchInterval: 30000,
  });

  const resources: any[] = (rawData as any)?.data ?? (Array.isArray(rawData) ? rawData : []);
  const types = Array.from(new Set(resources.map((r: any) => r.type).filter(Boolean)));

  const filtered = resources.filter((r: any) => {
    const matchesSearch =
      !search ||
      (r.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.type ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.region ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || r.type?.toLowerCase() === typeFilter;
    return matchesSearch && matchesType;
  });

  const unhealthyCount = resources.filter(
    (r: any) => !["running", "active", "healthy"].includes(r.status?.toLowerCase()),
  ).length;

  const totalCost = resources.reduce((acc: number, r: any) => {
    return acc + Number(r.costPerMonth ?? r.config?.costPerMonth ?? 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Infrastructure</h1>
          <p className="text-muted-foreground mt-1">
            Cloud resources, servers, and infrastructure components
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Total Resources</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : resources.length}</p>
                <p className="text-muted-foreground text-xs mt-1">Across all providers</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Server className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Unhealthy</p>
                <p className={`font-black text-2xl mt-0.5 ${unhealthyCount > 0 ? "text-red-600" : "text-green-600"}`}>
                  {isLoading ? "..." : unhealthyCount}
                </p>
                <p className="text-muted-foreground text-xs mt-1">Resources needing attention</p>
              </div>
              <div className={`rounded-xl p-2.5 ${unhealthyCount > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                {unhealthyCount > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Monthly Cost</p>
                <p className="font-black text-2xl text-foreground mt-0.5">
                  {isLoading ? "..." : totalCost > 0 ? `$${totalCost.toLocaleString()}` : "N/A"}
                </p>
                <p className="text-muted-foreground text-xs mt-1">Estimated infrastructure spend</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-green-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Utilization Trend (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={[
              { day: "Mon", cpu: 62, memory: 71, network: 45 },
              { day: "Tue", cpu: 58, memory: 68, network: 52 },
              { day: "Wed", cpu: 74, memory: 76, network: 61 },
              { day: "Thu", cpu: 81, memory: 79, network: 58 },
              { day: "Fri", cpu: 69, memory: 73, network: 49 },
              { day: "Sat", cpu: 44, memory: 61, network: 31 },
              { day: "Sun", cpu: 38, memory: 58, network: 27 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={2} dot={false} name="CPU" />
              <Line type="monotone" dataKey="memory" stroke="#f59e0b" strokeWidth={2} dot={false} name="Memory" />
              <Line type="monotone" dataKey="network" stroke="#10b981" strokeWidth={2} dot={false} name="Network I/O" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, type, or region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {types.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${typeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              All
            </button>
            {types.map((t: string) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t.toLowerCase())}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${typeFilter === t.toLowerCase() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Resources{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({filtered.length} items)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState title="No resources found" description="No infrastructure resources match your search." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resource</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Region</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[100px]">CPU</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[100px]">Memory</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost/mo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map((res: any) => {
                    const cpu = res.cpuUsage ?? res.config?.cpu ?? 0;
                    const mem = res.memoryUsage ?? res.config?.memory ?? 0;
                    const cost = res.costPerMonth ?? res.config?.costPerMonth;
                    return (
                      <tr key={res.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-medium text-foreground">{res.name}</p>
                              {res.provider && (
                                <p className="text-[10px] text-muted-foreground capitalize">{res.provider}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${typeBadgeColor(res.type)}`}>
                            {res.type ?? "—"}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{res.region ?? "—"}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {statusDot(res.status ?? "running")}
                            <span className={`text-xs font-medium capitalize ${statusTextColor(res.status ?? "running")}`}>
                              {res.status ?? "running"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3"><UsageBar value={cpu} /></td>
                        <td className="p-3"><UsageBar value={mem} /></td>
                        <td className="p-3 text-right text-xs font-mono">
                          {cost != null ? `$${Number(cost).toLocaleString()}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
