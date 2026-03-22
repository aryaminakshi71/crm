/**
 * P&L Reports
 *
 * Profit and Loss financial reports.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Download,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
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

export const Route = createFileRoute("/app/invoicing/reports/pl")({
  component: PLReports,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

const CHART_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24"];

const revenueBreakdown = [
  { name: "Product Sales", value: 180000, color: "#22d3ee" },
  { name: "Services", value: 95000, color: "#a78bfa" },
  { name: "Subscriptions", value: 45000, color: "#f472b6" },
  { name: "Other", value: 7500, color: "#34d399" },
];

const monthlyPLData = [
  { month: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
  { month: "Feb", revenue: 52000, expenses: 35000, profit: 17000 },
  { month: "Mar", revenue: 48000, expenses: 33000, profit: 15000 },
  { month: "Apr", revenue: 61000, expenses: 38000, profit: 23000 },
  { month: "May", revenue: 55000, expenses: 36000, profit: 19000 },
  { month: "Jun", revenue: 67000, expenses: 40000, profit: 27000 },
];

const expenseBreakdown = [
  { category: "Salaries & Wages", amount: 120000, percentage: 50 },
  { category: "Software & Tools", amount: 24000, percentage: 10 },
  { category: "Marketing", amount: 36000, percentage: 15 },
  { category: "Office & Facilities", amount: 18000, percentage: 7.5 },
  { category: "Professional Services", amount: 18000, percentage: 7.5 },
  { category: "Other Expenses", amount: 24000, percentage: 10 },
];

function PLReports() {
  const [dateRange, setDateRange] = useState("ytd");

  const plQuery = useQuery({
    queryKey: ["invoicing/reports/pl", dateRange],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/invoicing/reports/pl?dateRange=${dateRange}`, { headers: { ...getOrgHeader() } });
      return res.json();
    },
    retry: false,
  });

  const totalRevenue = plQuery.data?.totalRevenue ?? 327500;
  const totalExpenses = plQuery.data?.totalExpenses ?? 238000;
  const netProfit = plQuery.data?.netProfit ?? 89500;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : (plQuery.data?.profitMargin ?? 27.3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/invoicing">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-xl text-foreground">Profit & Loss</h2>
            <p className="text-sm text-muted-foreground">Financial performance overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <option value="q1">Q1 2026</option>
            <option value="q2">Q2 2026</option>
            <option value="ytd">Year to Date</option>
            <option value="fy">Full Year 2025</option>
          </select>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard title="Total Revenue" value="$327.5K" trend="+18.2%" trendUp icon={<TrendingUp className="h-4 w-4" />} color="text-emerald-400" />
        <MetricCard title="Total Expenses" value="$238K" trend="+3.4%" trendUp={false} icon={<TrendingDown className="h-4 w-4" />} color="text-rose-400" />
        <MetricCard title="Net Profit" value="$89.5K" trend="+24.1%" trendUp icon={<DollarSign className="h-4 w-4" />} color="text-primary" />
        <MetricCard title="Profit Margin" value={`${profitMargin.toFixed(1)}%`} trend="+2.3%" trendUp icon={<BarChart3 className="h-4 w-4" />} color="text-violet-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue vs Expenses Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Revenue vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyPLData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#34d399" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="#f472b6" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" stroke="#22d3ee" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {revenueBreakdown.map((entry, index) => (
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
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {revenueBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-medium">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Expense Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">% of Total</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Trend</th>
              </tr>
            </thead>
            <tbody>
              {expenseBreakdown.map((expense) => (
                <tr key={expense.category} className="border-b border-border">
                  <td className="px-4 py-3 text-sm font-medium">{expense.category}</td>
                  <td className="px-4 py-3 text-sm text-rose-400">${expense.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{expense.percentage}%</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full max-w-24 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${expense.percentage * 5}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/50">
                <td className="px-4 py-3 text-sm font-bold">Total Expenses</td>
                <td className="px-4 py-3 text-sm font-bold text-rose-400">${totalExpenses.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm font-bold">100%</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, trend, trendUp, icon, color }: { title: string; value: string; trend: string; trendUp: boolean; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            <div className="mt-1 flex items-center gap-1">
              {trendUp ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-400" />
              )}
              <span className={`text-[10px] font-bold ${trendUp ? "text-emerald-400" : "text-rose-400"}`}>
                {trend}
              </span>
            </div>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
