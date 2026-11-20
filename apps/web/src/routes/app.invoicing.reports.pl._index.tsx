/**
 * Profit & Loss Report
 *
 * Income statement with monthly comparison chart and time period selector.
 */

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { invoicingApi } from "@/lib/api";

const searchSchema = z.object({
  period: z.enum(["month", "quarter", "ytd", "fy"]).optional(),
});

export const Route = createFileRoute("/app/invoicing/reports/pl/_index")({
  validateSearch: searchSchema,
  component: ProfitLossPage,
});

const PERIODS = [
  { label: "This Month", value: "month" },
  { label: "This Quarter", value: "quarter" },
  { label: "This Year", value: "ytd" },
  { label: "FY", value: "fy" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}


function exportToCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ProfitLossPage() {
  const { period = "ytd" } = useSearch({ from: "/app/invoicing/reports/pl/_index" });
  const navigate = useNavigate({ from: "/app/invoicing/reports/pl/_index" });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoicing/reports/pl", period],
    queryFn: () => invoicingApi.reports.profitLoss({ dateRange: period }),
    retry: false,
  });

  const report = (data as any) ?? {};

  const revenue = Number(report.totalRevenue ?? report.revenue ?? 0);
  const expenses = Number(report.totalExpenses ?? report.expenses ?? 0);
  const netProfit = Number(report.netProfit ?? revenue - expenses);
  const margin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;

  const revenueLines: any[] = report.revenueItems ?? report.revenueBreakdown ?? [];
  const expenseLines: any[] = report.expenseItems ?? report.expenseBreakdown ?? [];
  const monthlyData: any[] = report.monthly ?? report.chartData ?? [];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load P&L report.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Profit & Loss Statement</h2>
          <p className="text-sm text-muted-foreground">Income and expense summary for the selected period</p>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() =>
                navigate({ search: (prev) => ({ ...prev, period: p.value as "month" | "quarter" | "ytd" | "fy" }) })
              }
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                period === p.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {p.label}
            </button>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 ml-2"
            onClick={() => {
              const headers = ["Type", "Name", "Amount"];
              const rows: string[][] = [];
              revenueLines.forEach((line: any, i: number) => {
                rows.push(["Revenue", line.name ?? line.label ?? `Revenue ${i + 1}`, String(Number(line.amount ?? line.value) || 0)]);
              });
              rows.push(["Revenue", "Total Revenue", String(revenue)]);
              expenseLines.forEach((line: any, i: number) => {
                rows.push(["Expense", line.name ?? line.label ?? `Expense ${i + 1}`, String(Number(line.amount ?? line.value) || 0)]);
              });
              rows.push(["Expense", "Total Expenses", String(expenses)]);
              rows.push(["Summary", "Net Profit", String(netProfit)]);
              rows.push(["Summary", "Profit Margin", `${margin}%`]);
              exportToCsv(`pl-report-${period}.csv`, headers, rows);
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revenue</p>
            <p className="mt-0.5 text-2xl font-black text-emerald-400">{fmt(revenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expenses</p>
            <p className="mt-0.5 text-2xl font-black text-rose-400">{fmt(expenses)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net Profit</p>
            <p className={`mt-0.5 text-2xl font-black ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {fmt(netProfit)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profit Margin</p>
            <div className="flex items-center gap-1 mt-0.5">
              <p className={`text-2xl font-black ${margin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {margin}%
              </p>
              {margin >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Monthly Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
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
                    formatter={(value: number) => [fmt(value), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f472b6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netProfit" name="Net Profit" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* P&L Statement */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-emerald-400">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : revenueLines.length > 0 ? (
              <table className="w-full">
                <tbody>
                  {revenueLines.map((line: any, i: number) => (
                    <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                      <td className="px-4 py-2.5 text-sm">{line.name ?? line.label ?? `Revenue ${i + 1}`}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-right text-emerald-400">
                        {fmt(Number(line.amount ?? line.value) || 0)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-500/5 border-t border-emerald-500/20">
                    <td className="px-4 py-3 text-sm font-black uppercase tracking-wide text-emerald-400">
                      Total Revenue
                    </td>
                    <td className="px-4 py-3 text-sm font-black text-right text-emerald-400">{fmt(revenue)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-2xl font-black text-emerald-400">{fmt(revenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-rose-400">
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : expenseLines.length > 0 ? (
              <table className="w-full">
                <tbody>
                  {expenseLines.map((line: any, i: number) => (
                    <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                      <td className="px-4 py-2.5 text-sm">{line.name ?? line.label ?? `Expense ${i + 1}`}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-right text-rose-400">
                        {fmt(Number(line.amount ?? line.value) || 0)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-rose-500/5 border-t border-rose-500/20">
                    <td className="px-4 py-3 text-sm font-black uppercase tracking-wide text-rose-400">
                      Total Expenses
                    </td>
                    <td className="px-4 py-3 text-sm font-black text-right text-rose-400">{fmt(expenses)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-2xl font-black text-rose-400">{fmt(expenses)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Expenses</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Net Profit Summary */}
      <Card className={`border ${netProfit >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Net Profit</p>
              <p className={`mt-1 text-4xl font-black ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {fmt(netProfit)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {margin >= 0 ? `${margin}% profit margin` : `${Math.abs(margin)}% loss margin`}
              </p>
            </div>
            <div className={`rounded-2xl p-4 ${netProfit >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
              {netProfit >= 0 ? (
                <TrendingUp className="h-8 w-8 text-emerald-400" />
              ) : (
                <TrendingDown className="h-8 w-8 text-rose-400" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
