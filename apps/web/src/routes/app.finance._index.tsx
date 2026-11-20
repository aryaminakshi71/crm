/**
 * Finance Dashboard
 *
 * Finance parent-route overview: KPI cards, recent invoices, and quick links
 * to all sub-sections.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  DollarSign,
  FileText,
  Globe,
  Receipt,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { invoicingApi } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/app/finance/_index")({
  validateSearch: searchSchema,
  component: FinanceDashboard,
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  paid: "success",
  overdue: "danger",
  sent: "primary",
  draft: "outline",
  viewed: "primary",
  cancelled: "outline",
};

const NAV_LINKS = [
  {
    to: "/app/invoicing/invoices",
    label: "Invoices",
    desc: "Create & track invoices",
    icon: <FileText className="h-5 w-5 text-emerald-400" />,
    bg: "bg-emerald-500/10",
  },
  {
    to: "/app/invoicing/quotes",
    label: "Quotes",
    desc: "Send & convert quotes",
    icon: <Receipt className="h-5 w-5 text-cyan-400" />,
    bg: "bg-cyan-500/10",
  },
  {
    to: "/app/invoicing/payments",
    label: "Payments",
    desc: "Record & view payments",
    icon: <DollarSign className="h-5 w-5 text-violet-400" />,
    bg: "bg-violet-500/10",
  },
  {
    to: "/app/invoicing/expenses",
    label: "Expenses",
    desc: "Track business expenses",
    icon: <Wallet className="h-5 w-5 text-amber-400" />,
    bg: "bg-amber-500/10",
  },
  {
    to: "/app/invoicing/recurring",
    label: "Recurring",
    desc: "Manage subscriptions",
    icon: <RefreshCcw className="h-5 w-5 text-rose-400" />,
    bg: "bg-rose-500/10",
  },
  {
    to: "/app/invoicing/vendors",
    label: "Vendors",
    desc: "Accounts payable",
    icon: <Users className="h-5 w-5 text-primary" />,
    bg: "bg-primary/10",
  },
  {
    to: "/app/invoicing/accounts",
    label: "Chart of Accounts",
    desc: "Manage ledger accounts",
    icon: <BookOpen className="h-5 w-5 text-emerald-400" />,
    bg: "bg-emerald-500/10",
  },
  {
    to: "/app/invoicing/taxes",
    label: "Tax Rates",
    desc: "Configure tax rates",
    icon: <Globe className="h-5 w-5 text-cyan-400" />,
    bg: "bg-cyan-500/10",
  },
  {
    to: "/app/invoicing/reports/pl",
    label: "P&L Report",
    desc: "Profit & loss statement",
    icon: <BarChart3 className="h-5 w-5 text-violet-400" />,
    bg: "bg-violet-500/10",
  },
  {
    to: "/app/invoicing/reports/balance",
    label: "Balance Sheet",
    desc: "Assets, liabilities, equity",
    icon: <BarChart3 className="h-5 w-5 text-amber-400" />,
    bg: "bg-amber-500/10",
  },
  {
    to: "/app/invoicing/reports/cashflow",
    label: "Cash Flow",
    desc: "Cash flow statement",
    icon: <TrendingUp className="h-5 w-5 text-rose-400" />,
    bg: "bg-rose-500/10",
  },
];

function FinanceDashboard() {
  const { q = "", status: statusFilter = "" } = useSearch({ from: "/app/finance/_index" });
  const navigate = useNavigate({ from: "/app/finance/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setStatusFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v || undefined }) });

  const plQuery = useQuery({
    queryKey: ["invoicing/reports/pl/dashboard"],
    queryFn: () => invoicingApi.reports.profitLoss({ dateRange: "ytd" }),
    retry: false,
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoicing/invoices/recent"],
    queryFn: () => invoicingApi.invoices.list({ page: 1, limit: 5 }),
    retry: false,
  });

  const pl = (plQuery.data as any) ?? {};
  const revenue = Number(pl.totalRevenue ?? pl.revenue ?? 0);
  const expenses = Number(pl.totalExpenses ?? pl.expenses ?? 0);
  const netProfit = Number(pl.netProfit ?? revenue - expenses);

  const invoices: any[] = (invoicesQuery.data as any)?.data ?? [];

  const filteredInvoices = invoices.filter((inv) => {
    const matchesQ =
      !q ||
      (inv.invoiceNumber ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (inv.clientName ?? inv.clientEmail ?? "").toLowerCase().includes(q.toLowerCase());
    const matchesStatus =
      !statusFilter || (inv.status ?? "") === statusFilter;
    return matchesQ && matchesStatus;
  });
  const outstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revenue (YTD)</p>
                <p className="mt-0.5 text-2xl font-black text-emerald-400">
                  {plQuery.isLoading ? "..." : fmt(revenue)}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400">Year to date</span>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expenses (YTD)</p>
                <p className="mt-0.5 text-2xl font-black text-rose-400">
                  {plQuery.isLoading ? "..." : fmt(expenses)}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <Receipt className="h-3 w-3 text-rose-400" />
                  <span className="text-[10px] font-bold text-rose-400">Year to date</span>
                </div>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-2.5">
                <Wallet className="h-4 w-4 text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net Profit</p>
                <p className={`mt-0.5 text-2xl font-black ${netProfit >= 0 ? "text-primary" : "text-rose-400"}`}>
                  {plQuery.isLoading ? "..." : fmt(netProfit)}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {netProfit >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-primary" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-rose-400" />
                  )}
                  <span className={`text-[10px] font-bold ${netProfit >= 0 ? "text-primary" : "text-rose-400"}`}>
                    {revenue > 0 ? `${Math.round((netProfit / revenue) * 100)}% margin` : "No revenue"}
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Outstanding AR</p>
                <p className="mt-0.5 text-2xl font-black text-amber-400">
                  {invoicesQuery.isLoading ? "..." : fmt(outstanding)}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400">Accounts receivable</span>
                </div>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2.5">
                <FileText className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={[
              { month: "Sep", revenue: 82000, expenses: 54000 },
              { month: "Oct", revenue: 91000, expenses: 58000 },
              { month: "Nov", revenue: 88000, expenses: 61000 },
              { month: "Dec", revenue: 105000, expenses: 63000 },
              { month: "Jan", revenue: 97000, expenses: 59000 },
              { month: "Feb", revenue: 112000, expenses: 67000 },
              { month: "Mar", revenue: 124000, expenses: 71000 },
            ]}>
              <defs>
                <linearGradient id="finRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#finRevGrad)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="none" strokeWidth={2} strokeDasharray="4 2" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Recent Invoices
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-8 h-8 text-xs w-44"
                placeholder="Search invoices…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Link to="/app/invoicing/invoices">
              <Button size="sm" variant="ghost">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {invoicesQuery.isLoading ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <FileText className="h-6 w-6 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{q || statusFilter ? "No invoices match your filters." : "No invoices yet"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Invoice</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Client</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Due</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-primary">
                        {inv.invoiceNumber ?? inv.id?.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {inv.clientName ?? inv.clientEmail ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        {fmt(Number(inv.totalAmount) || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {fmtDate(inv.dueDate)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[inv.status ?? "draft"] as any}>
                          {inv.status ?? "draft"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Cards */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Finance Modules
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {NAV_LINKS.filter((link) =>
            !q || link.label.toLowerCase().includes(q.toLowerCase()) || link.desc.toLowerCase().includes(q.toLowerCase()),
          ).map((link) => (
            <Link key={link.to} to={link.to as any}>
              <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${link.bg}`}>
                    {link.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-tight">{link.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
