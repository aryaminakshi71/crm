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
  AlertCircle
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
import { invoicingApi } from "@/lib/api";

const EMPTY_REVENUE_BREAKDOWN: any[] = [];
const EMPTY_PL_DATA: any[] = [];
const EMPTY_EXPENSE_BREAKDOWN: any[] = [];

function PLReports() {
  const [dateRange, setDateRange] = useState("ytd");

  const plQuery = useQuery({
    queryKey: ["invoicing/reports/pl", dateRange],
    queryFn: () => invoicingApi.reports.profitLoss({ dateRange }),
    retry: false,
    placeholderData: (prev) => prev,
  });
  if (plQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => plQuery.refetch()}>Retry</Button>
    </div>
  );

  const totalRevenue = (plQuery as any).data?.totalRevenue ?? 327500;
  const totalExpenses = (plQuery as any).data?.totalExpenses ?? 238000;
  const netProfit = (plQuery as any).data?.netProfit ?? 89500;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : ((plQuery as any).data?.profitMargin ?? 27.3);

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
                <AreaChart data={EMPTY_PL_DATA}>
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
                    data={EMPTY_REVENUE_BREAKDOWN}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {EMPTY_REVENUE_BREAKDOWN.map((entry: any, index: number) => (
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
              {EMPTY_REVENUE_BREAKDOWN.map((item: any) => (
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
              {EMPTY_EXPENSE_BREAKDOWN.map((expense: any) => (
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
