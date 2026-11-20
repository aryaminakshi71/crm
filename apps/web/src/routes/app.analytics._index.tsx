/**
 * Analytics Overview
 *
 * Business intelligence dashboard with KPI cards, revenue trends, and module insights.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import {
  BarChart3,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
  UserPlus,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  period: z.enum(["day", "week", "month", "quarter", "year"]).optional(),
});

export const Route = createFileRoute("/app/analytics/_index")({
  validateSearch: searchSchema,
  component: AnalyticsIndexPage,
});

const FALLBACK_CHART = [
  { month: "Oct", revenue: 32000 },
  { month: "Nov", revenue: 36500 },
  { month: "Dec", revenue: 41000 },
  { month: "Jan", revenue: 38200 },
  { month: "Feb", revenue: 43800 },
  { month: "Mar", revenue: 48900 },
];

const MODULE_LINKS = [
  { label: "CRM", href: "/app/crm", color: "bg-blue-100 text-blue-600" },
  { label: "eCommerce", href: "/app/ecommerce", color: "bg-purple-100 text-purple-600" },
  { label: "Invoicing", href: "/app/invoicing", color: "bg-green-100 text-green-600" },
  { label: "Projects", href: "/app/projects", color: "bg-orange-100 text-orange-600" },
  { label: "HRM", href: "/app/hrm/org-chart", color: "bg-pink-100 text-pink-600" },
  { label: "Helpdesk", href: "/app/helpdesk", color: "bg-cyan-100 text-cyan-600" },
  { label: "DevOps", href: "/app/devops", color: "bg-indigo-100 text-indigo-600" },
  { label: "Field Service", href: "/app/field-service", color: "bg-amber-100 text-amber-600" },
];

function AnalyticsIndexPage() {
  const { q = "" } = useSearch({ from: "/app/analytics/_index" });
  const navigate = useNavigate({ from: "/app/analytics/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 864e5),
    to: new Date(),
    preset: "30d",
  });

  const period =
    dateRange.preset === "today" ? "day"
    : dateRange.preset === "7d" ? "week"
    : dateRange.preset === "90d" ? "quarter"
    : dateRange.preset === "ytd" ? "year"
    : "month";

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["dashboard-stats-analytics", dateRange.preset],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: chartsData } = useQuery({
    queryKey: ["dashboard-charts-analytics", period],
    queryFn: () =>
      fetch(`/api/v1/dashboard/charts?period=${period}`, {
        headers: { "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "" },
      }).then((r) => r.json()),
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-6 space-y-3">
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );

  const mrr = (statsData as any)?.mrr ?? (statsData as any)?.revenue ?? 42500;
  const activeUsers = (statsData as any)?.activeUsers ?? (statsData as any)?.totalContacts ?? 1284;
  const newSignups = (statsData as any)?.newSignups ?? (statsData as any)?.recentActivities?.length ?? 48;
  const churnRate = (statsData as any)?.churnRate ?? 2.4;
  const growthRate = (statsData as any)?.growthRate ?? (statsData as any)?.revenueChange ?? 18.4;

  const chartData: { month: string; revenue: number }[] =
    (chartsData as any)?.revenue ??
    (chartsData as any)?.revenueChart ??
    FALLBACK_CHART;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Analytics Overview</h2>
          <p className="text-sm text-muted-foreground">Business performance across all modules</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">MRR</p>
                <p className="text-2xl font-black text-foreground mt-0.5">
                  ${Number(mrr).toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{growthRate}% growth
                </p>
              </div>
              <div className="rounded-xl bg-green-100 p-2.5 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Users</p>
                <p className="text-2xl font-black text-foreground mt-0.5">
                  {Number(activeUsers).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Signups</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{newSignups}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  This period
                </p>
              </div>
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600">
                <UserPlus className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{churnRate}%</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Monthly average
                </p>
              </div>
              <div className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenueAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2172cd" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2172cd" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis
                  className="text-xs"
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2172cd"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenueAnalytics)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Module Links */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">Top Modules by Usage</CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-8 h-8 text-xs"
                placeholder="Filter modules…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MODULE_LINKS.filter((mod) =>
              !q || mod.label.toLowerCase().includes(q.toLowerCase()),
            ).map((mod) => (
              <Link
                key={mod.href}
                to={mod.href}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/60 p-4 hover:bg-muted/50 transition-colors text-center"
              >
                <div className={`rounded-lg p-2 ${mod.color}`}>
                  <BarChart3 className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-foreground leading-tight">{mod.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
