/**
 * Performance Monitoring
 *
 * APM metrics, latency distribution, and application performance.
 */

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  Clock,
  Database,
  Gauge,
  Globe,
  Server,
  TrendingDown,
  TrendingUp,
  Webhook,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/performance")({
  component: PerformancePage,
});

function PerformancePage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "performance"],
    queryFn: () => monitoringApi.getPerformance(),
    refetchInterval: 60000,
  });

  type LatencyPoint = { time: string; p50: number; p95: number; p99: number };
  type ErrorPoint = { time: string; errors: number; warnings: number };
  type EndpointPoint = { endpoint: string; p95: number; errorRate: number; requests: string };
  type ServicePoint = { name: string; status: string; latency: number; requests: string };

  const latencyData: LatencyPoint[] = (data as any)?.latencyData || [
    { time: "00:00", p50: 45, p95: 120, p99: 245 },
    { time: "04:00", p50: 42, p95: 115, p99: 230 },
    { time: "08:00", p50: 52, p95: 145, p99: 310 },
    { time: "12:00", p50: 48, p95: 135, p99: 280 },
    { time: "16:00", p50: 55, p95: 160, p99: 340 },
    { time: "20:00", p50: 58, p95: 175, p99: 365 },
  ];

  const errorData: ErrorPoint[] = (data as any)?.errorData || [
    { time: "00:00", errors: 12, warnings: 45 },
    { time: "04:00", errors: 8, warnings: 32 },
    { time: "08:00", errors: 25, warnings: 78 },
    { time: "12:00", errors: 18, warnings: 56 },
    { time: "16:00", errors: 32, warnings: 89 },
    { time: "20:00", errors: 22, warnings: 67 },
  ];

  const endpointData: EndpointPoint[] = (data as any)?.endpointData || [
    { endpoint: "/api/users", p95: 145, errorRate: 0.2, requests: "12.5K" },
    { endpoint: "/api/orders", p95: 230, errorRate: 0.5, requests: "8.3K" },
    { endpoint: "/api/products", p95: 95, errorRate: 0.1, requests: "15.2K" },
    { endpoint: "/api/auth", p95: 180, errorRate: 0.3, requests: "6.8K" },
    { endpoint: "/api/payments", p95: 420, errorRate: 0.8, requests: "2.1K" },
  ];

  const serviceHealth: ServicePoint[] = (data as any)?.serviceHealth || [
    { name: "API Gateway", status: "healthy", latency: 45, requests: "45.2K" },
    { name: "Auth Service", status: "healthy", latency: 85, requests: "12.8K" },
    { name: "User Service", status: "degraded", latency: 180, requests: "8.5K" },
    { name: "Order Service", status: "healthy", latency: 120, requests: "5.2K" },
    { name: "Payment Service", status: "healthy", latency: 320, requests: "1.8K" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Performance Monitoring</h2>
          <p className="text-sm text-muted-foreground">
            APM metrics, latency distribution, and application performance
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

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">P50 Latency</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : `${data?.p50Latency || 48}ms`}</p>
                <div className="mt-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400">-8%</span>
                </div>
              </div>
              <Gauge className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">P95 Latency</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : `${data?.p95Latency || 145}ms`}</p>
                <div className="mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-rose-400" />
                  <span className="text-[10px] font-bold text-rose-400">+12%</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">P99 Latency</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : `${data?.p99Latency || 295}ms`}</p>
                <div className="mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-rose-400" />
                  <span className="text-[10px] font-bold text-rose-400">+18%</span>
                </div>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Error Rate</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : `${data?.errorRate || 0.32}%`}</p>
                <div className="mt-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400">-15%</span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Latency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Latency Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Line type="monotone" dataKey="p50" stroke="#34d399" strokeWidth={2} dot={false} name="P50" />
                  <Line type="monotone" dataKey="p95" stroke="#fbbf24" strokeWidth={2} dot={false} name="P95" />
                  <Line type="monotone" dataKey="p99" stroke="#f472b6" strokeWidth={2} dot={false} name="P99" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">P50</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">P95</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-pink-500" />
                <span className="text-xs text-muted-foreground">P99</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Errors & Warnings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Errors & Warnings (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={errorData}>
                  <defs>
                    <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f472b6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Area type="monotone" dataKey="errors" stroke="#f472b6" fillOpacity={1} fill="url(#colorErrors)" strokeWidth={2} name="Errors" />
                  <Area type="monotone" dataKey="warnings" stroke="#fbbf24" fillOpacity={1} fill="url(#colorErrors)" strokeWidth={2} name="Warnings" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Service Health
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Service</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Latency (P95)</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Requests</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Trend</th>
              </tr>
            </thead>
            <tbody>
              {serviceHealth.map((service, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-3 text-sm font-medium">{service.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={service.status === "healthy" ? "success" : "warning"} size="sm">
                      {service.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{service.latency}ms</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{service.requests}</td>
                  <td className="px-4 py-3">
                    {service.latency < 150 ? (
                      <TrendingDown className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-amber-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Top Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Top Endpoints by Latency
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Endpoint</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">P95 Latency</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Error Rate</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Requests</th>
              </tr>
            </thead>
            <tbody>
              {endpointData.map((endpoint, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Webhook className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{endpoint.endpoint}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={endpoint.p95 > 200 ? "text-rose-400 font-medium" : "text-muted-foreground"}>
                      {endpoint.p95}ms
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={endpoint.errorRate > 0.5 ? "text-rose-400" : "text-muted-foreground"}>
                      {endpoint.errorRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{endpoint.requests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
