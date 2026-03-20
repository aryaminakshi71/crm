/**
 * Analytics Dashboard
 *
 * Business intelligence and analytics overview.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointerClick,
  Clock,
  RefreshCw,
} from "lucide-react";
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/analytics")({
  component: () => (
    <ErrorBoundaryWrapper>
      <AnalyticsDashboard />
    </ErrorBoundaryWrapper>
  ),
});

const CHART_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24"];

function AnalyticsDashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "analytics"],
    queryFn: () => monitoringApi.getAnalytics(),
    refetchInterval: 60000,
  });

  type DeviceDataPoint = { name: string; value: number; color: string };
  type TrafficDataPoint = { date: string; visitors: number; pageViews: number; sessions: number };
  type ConversionDataPoint = { source: string; conversions: number; rate: number };

  const trafficData: TrafficDataPoint[] = data?.trafficData || [
    { date: "Mar 13", visitors: 4200, pageViews: 12600, sessions: 3800 },
    { date: "Mar 14", visitors: 3800, pageViews: 11400, sessions: 3400 },
    { date: "Mar 15", visitors: 5100, pageViews: 15300, sessions: 4600 },
    { date: "Mar 16", visitors: 4600, pageViews: 13800, sessions: 4100 },
    { date: "Mar 17", visitors: 5800, pageViews: 17400, sessions: 5200 },
    { date: "Mar 18", visitors: 6200, pageViews: 18600, sessions: 5600 },
    { date: "Mar 19", visitors: 5400, pageViews: 16200, sessions: 4900 },
  ];

  const conversionData: ConversionDataPoint[] = data?.conversionData || [
    { source: "Organic Search", conversions: 1234, rate: 4.2 },
    { source: "Paid Ads", conversions: 892, rate: 3.8 },
    { source: "Direct", conversions: 654, rate: 5.1 },
    { source: "Social Media", conversions: 432, rate: 2.9 },
    { source: "Email", conversions: 321, rate: 6.2 },
  ];

  const deviceData: DeviceDataPoint[] = data?.deviceData || [
    { name: "Desktop", value: 58, color: "#22d3ee" },
    { name: "Mobile", value: 35, color: "#a78bfa" },
    { name: "Tablet", value: 7, color: "#f472b6" },
  ];

  const metricCards = [
    { title: "Active Users", value: data?.activeUsers?.toLocaleString() || "...", change: data?.activeUsersChange || "+12.5%", trend: "up", icon: Users },
    { title: "Page Views", value: data?.pageViews?.toLocaleString() || "...", change: data?.pageViewsChange || "+8.2%", trend: "up", icon: Eye },
    { title: "Bounce Rate", value: data?.bounceRate || "...", change: data?.bounceRateChange || "-3.1%", trend: "down", icon: MousePointerClick },
    { title: "Avg Session", value: data?.avgSession || "...", change: data?.avgSessionChange || "+5.7%", trend: "up", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Business intelligence and user engagement metrics
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
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.trend === "up";
          return (
            <Card key={metric.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                      {metric.title}
                    </p>
                    <p className="font-black text-2xl text-foreground mt-0.5">{metric.value}</p>
                    <div className="mt-1 flex items-center gap-1">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-rose-400" />
                      )}
                      <span
                        className={`text-[10px] font-bold ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Traffic Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Traffic Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Area type="monotone" dataKey="visitors" stroke="#22d3ee" fillOpacity={1} fill="url(#colorVisitors)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Conversion by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis type="category" dataKey="source" axisLine={false} tickLine={false} fontSize={10} stroke="#888" width={100} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="conversions" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Device Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {deviceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Page</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Views</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Unique</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Bounce</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { page: "/dashboard", views: 12540, unique: 8420, bounce: "32%" },
                  { page: "/app/crm", views: 8930, unique: 6210, bounce: "45%" },
                  { page: "/app/projects", views: 6720, unique: 4890, bounce: "38%" },
                  { page: "/pricing", views: 5480, unique: 4120, bounce: "52%" },
                  { page: "/app/invoicing", views: 4210, unique: 3240, bounce: "41%" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3 text-sm font-medium">{row.page}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.unique.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.bounce}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
