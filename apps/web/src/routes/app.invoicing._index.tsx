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

export const Route = createFileRoute("/app/invoicing/_index")({
  component: FinanceOverview,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

const CHART_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24"];

const revenueData = [
  { month: "Jan", revenue: 45000, expenses: 32000 },
  { month: "Feb", revenue: 52000, expenses: 35000 },
  { month: "Mar", revenue: 48000, expenses: 33000 },
  { month: "Apr", revenue: 61000, expenses: 38000 },
  { month: "May", revenue: 55000, expenses: 36000 },
  { month: "Jun", revenue: 67000, expenses: 40000 },
];

const invoiceStatusData = [
  { status: "Paid", count: 45, color: "#34d399" },
  { status: "Sent", count: 23, color: "#22d3ee" },
  { status: "Overdue", count: 12, color: "#f472b6" },
  { status: "Draft", count: 8, color: "#a78bfa" },
];

const recentInvoices = [
  { id: "INV-2026-001", client: "Acme Corp", amount: 12500, status: "paid", date: "2026-03-15" },
  { id: "INV-2026-002", client: "TechStart Inc", amount: 8750, status: "sent", date: "2026-03-18" },
  { id: "INV-2026-003", client: "Global Solutions", amount: 15200, status: "overdue", date: "2026-03-10" },
  { id: "INV-2026-004", client: "Innovate Co", amount: 6800, status: "draft", date: "2026-03-20" },
];

const recentExpenses = [
  { id: "EXP-001", description: "Office Supplies", category: "Operations", amount: 450, date: "2026-03-18" },
  { id: "EXP-002", description: "Software Subscription", category: "Software", amount: 1200, date: "2026-03-15" },
  { id: "EXP-003", description: "Marketing Campaign", category: "Marketing", amount: 3500, date: "2026-03-12" },
  { id: "EXP-004", description: "Travel Expenses", category: "Travel", amount: 890, date: "2026-03-10" },
];

function FinanceOverview() {
  const statsQuery = useQuery({
    queryKey: ["invoicing/stats"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/invoicing/stats`, { headers: { ...getOrgHeader() } });
      return res.json();
    },
    retry: false,
  });

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value="$327.5K"
          trend="+18.2% vs last month"
          icon={<DollarSign className="h-4 w-4" />}
          color="text-emerald-400"
        />
        <MetricCard
          title="Outstanding"
          value="$128.4K"
          trend="-5.3% vs last month"
          icon={<Wallet className="h-4 w-4" />}
          color="text-primary"
        />
        <MetricCard
          title="Overdue"
          value="$23.5K"
          trend="+12.1% vs last month"
          icon={<AlertCircle className="h-4 w-4" />}
          color="text-rose-400"
        />
        <MetricCard
          title="Expenses"
          value="$89.2K"
          trend="+3.4% vs last month"
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
                <AreaChart data={revenueData}>
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
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {invoiceStatusData.map((entry, index) => (
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
              {invoiceStatusData.map((item) => (
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
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border">
                    <td className="px-4 py-3 text-sm font-medium">{invoice.id}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.client}</td>
                    <td className="px-4 py-3 text-sm font-medium">${invoice.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={invoice.status === "paid" ? "success" : invoice.status === "sent" ? "primary" : invoice.status === "overdue" ? "danger" : "outline"}>
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
                {recentExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border">
                    <td className="px-4 py-3 text-sm font-medium">{expense.description}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{expense.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-rose-400">-${expense.amount.toLocaleString()}</td>
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

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
