/**
 * Finance Overview
 *
 * Overview of financial metrics, recent invoices, and quick actions.
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
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { invoicingApi } from "@/lib/api";

export const Route = createFileRoute("/app/invoicing/_index")({
  component: FinanceOverview,
});


function FinanceOverview() {
  const statsQuery = useQuery({
    queryKey: ["invoicing/stats"],
    queryFn: () => invoicingApi.stats(),
    retry: false,
  });

  const reportsQuery = useQuery({
    queryKey: ["invoicing/reports/pl"],
    queryFn: () => invoicingApi.reports.profitLoss({ dateRange: "ytd" }),
    retry: false,
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoicing/invoices"],
    queryFn: () => invoicingApi.invoices.list({ limit: 5 }),
    retry: false,
  });

  const expensesQuery = useQuery({
    queryKey: ["invoicing/expenses"],
    queryFn: () => invoicingApi.expenses.list({ limit: 5 }),
    retry: false,
  });

  const stats = statsQuery.data as any;
  const reports = reportsQuery.data as any;
  const invoices = (invoicesQuery.data as any)?.data ?? [];
  const expenses = (expensesQuery.data as any)?.data ?? [];

  const isLoading = statsQuery.isLoading || reportsQuery.isLoading || invoicesQuery.isLoading || expensesQuery.isLoading;
  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (statsQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => statsQuery.refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={stats?.totalRevenue != null ? `$${Number(stats.totalRevenue).toLocaleString()}` : "—"}
          trend={stats?.revenueTrend ? `${stats.revenueTrend > 0 ? "+" : ""}${stats.revenueTrend.toFixed(1)}% vs last month` : "—"}
          icon={<DollarSign className="h-4 w-4" />}
          color="text-emerald-400"
        />
        <MetricCard
          title="Outstanding"
          value={stats?.outstanding != null ? `$${Number(stats.outstanding).toLocaleString()}` : "—"}
          trend={stats?.outstandingTrend ? `${stats.outstandingTrend > 0 ? "+" : ""}${stats.outstandingTrend.toFixed(1)}% vs last month` : "—"}
          icon={<Wallet className="h-4 w-4" />}
          color="text-primary"
        />
        <MetricCard
          title="Overdue"
          value={stats?.overdue != null ? `$${Number(stats.overdue).toLocaleString()}` : "—"}
          trend={stats?.overdueTrend ? `${stats.overdueTrend > 0 ? "+" : ""}${stats.overdueTrend.toFixed(1)}% vs last month` : "—"}
          icon={<AlertCircle className="h-4 w-4" />}
          color="text-rose-400"
        />
        <MetricCard
          title="Expenses"
          value={stats?.expenses != null ? `$${Number(stats.expenses).toLocaleString()}` : "—"}
          trend={stats?.expenseTrend ? `${stats.expenseTrend > 0 ? "+" : ""}${stats.expenseTrend.toFixed(1)}% vs last month` : "—"}
          icon={<Receipt className="h-4 w-4" />}
          color="text-amber-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue vs Expenses */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Revenue vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reports?.monthlyRevenue ?? []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f472b6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
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
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { status: "Paid", count: stats?.paidInvoices ?? 0, color: "#34d399" },
                      { status: "Sent", count: stats?.sentInvoices ?? 0, color: "#22d3ee" },
                      { status: "Overdue", count: stats?.overdueInvoices ?? 0, color: "#f472b6" },
                      { status: "Draft", count: stats?.draftInvoices ?? 0, color: "#a78bfa" },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {[
                      { status: "Paid", count: stats?.paidInvoices ?? 0, color: "#34d399" },
                      { status: "Sent", count: stats?.sentInvoices ?? 0, color: "#22d3ee" },
                      { status: "Overdue", count: stats?.overdueInvoices ?? 0, color: "#f472b6" },
                      { status: "Draft", count: stats?.draftInvoices ?? 0, color: "#a78bfa" },
                    ].map((entry, index) => (
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
              {[
                { status: "Paid", count: stats?.paidInvoices ?? 0, color: "#34d399" },
                { status: "Sent", count: stats?.sentInvoices ?? 0, color: "#22d3ee" },
                { status: "Overdue", count: stats?.overdueInvoices ?? 0, color: "#f472b6" },
                { status: "Draft", count: stats?.draftInvoices ?? 0, color: "#a78bfa" },
              ].map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.status}</span>
                  </div>
                  <span className="text-xs font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices & Expenses */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Recent Invoices
            </CardTitle>
            <Link to="/app/invoicing/invoices">
              <Button size="sm" variant="ghost">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Invoice</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No invoices yet</td>
                  </tr>
                ) : invoices.map((invoice: any) => (
                  <tr key={invoice.id} className="border-b border-border">
                    <td className="px-4 py-3 text-sm font-medium">{invoice.invoiceNumber ?? invoice.id}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.clientName ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium">${Number(invoice.total ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={invoice.status === "paid" ? "success" : invoice.status === "sent" || invoice.status === "viewed" ? "primary" : invoice.status === "overdue" ? "danger" : "outline"}>
                        {invoice.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Recent Expenses
            </CardTitle>
            <Link to="/app/invoicing/expenses">
              <Button size="sm" variant="ghost">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">No expenses yet</td>
                  </tr>
                ) : expenses.map((expense: any) => (
                  <tr key={expense.id} className="border-b border-border">
                    <td className="px-4 py-3 text-sm font-medium">{expense.description}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{expense.category ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-rose-400">-${Number(expense.amount ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link to="/app/invoicing/invoices">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <FileText className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-sm">New Invoice</p>
                <p className="text-xs text-muted-foreground">Create invoice</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/invoicing/quotes">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">New Quote</p>
                <p className="text-xs text-muted-foreground">Create quote</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/invoicing/expenses">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Receipt className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Record Expense</p>
                <p className="text-xs text-muted-foreground">Add expense</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/invoicing/reports/pl">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <BarChart3 className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Financial Reports</p>
                <p className="text-xs text-muted-foreground">View reports</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
  icon,
  color,
}: {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  color: string;
}) {
  const trendPositive = !trend.includes("-") && !trend.includes("+");
  const trendValue = trend.match(/[+-]?[\d.]+/)?.[0] || "";
  const trendDirection = trend.includes("+") ? "up" : trend.includes("-") ? "down" : "neutral";

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            <div className="mt-1 flex items-center gap-1">
              {trendDirection === "up" ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : trendDirection === "down" ? (
                <TrendingDown className="h-3 w-3 text-rose-400" />
              ) : null}
              <span className={`text-[10px] font-bold ${trendDirection === "up" ? "text-emerald-400" : trendDirection === "down" ? "text-rose-400" : "text-muted-foreground"}`}>
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
