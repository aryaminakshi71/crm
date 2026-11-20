/**
 * Balance Sheet Report
 *
 * Assets, Liabilities, and Equity sections with totals.
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
  Building2,
  Download,
  Scale,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { invoicingApi } from "@/lib/api";

const searchSchema = z.object({
  period: z.enum(["current", "q1", "q2", "q3", "q4", "ytd"]).optional().default("current"),
  section: z.enum(["all", "assets", "liabilities", "equity"]).optional().default("all"),
});

export const Route = createFileRoute("/app/invoicing/reports/balance/_index")({
  validateSearch: searchSchema,
  component: BalanceSheetPage,
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

interface LineItem {
  name?: string;
  label?: string;
  amount?: number;
  value?: number;
}

function Section({
  title,
  items,
  total,
  color,
  bgColor,
  borderColor,
}: {
  title: string;
  items: LineItem[];
  total: number;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <Card className={`border ${borderColor}`}>
      <CardHeader className={`${bgColor} rounded-t-xl`}>
        <CardTitle className={`text-sm font-bold uppercase tracking-tight ${color}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length > 0 ? (
          <table className="w-full">
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-2.5 text-sm">{item.name ?? item.label ?? `Item ${i + 1}`}</td>
                  <td className={`px-4 py-2.5 text-sm font-medium text-right ${color}`}>
                    {fmt(Number(item.amount ?? item.value) || 0)}
                  </td>
                </tr>
              ))}
              <tr className={`${bgColor} border-t ${borderColor}`}>
                <td className={`px-4 py-3 text-sm font-black uppercase tracking-wide ${color}`}>
                  Total {title}
                </td>
                <td className={`px-4 py-3 text-sm font-black text-right ${color}`}>
                  {fmt(total)}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-6 text-center">
            <p className={`text-2xl font-black ${color}`}>{fmt(total)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total {title}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BalanceSheetPage() {
  const { period, section } = useSearch({ from: "/app/invoicing/reports/balance/_index" });
  const navigate = useNavigate({ from: "/app/invoicing/reports/balance" });

  const setPeriod = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, period: value as any }) });
  const setSection = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, section: value as any }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoicing/reports/balance"],
    queryFn: () => invoicingApi.reports.balanceSheet(),
    retry: false,
  });

  const report = (data as any) ?? {};

  const totalAssets = Number(report.totalAssets ?? 0);
  const totalLiabilities = Number(report.totalLiabilities ?? 0);
  const totalEquity = Number(report.totalEquity ?? totalAssets - totalLiabilities);

  const assetItems: LineItem[] = report.assets ?? report.assetItems ?? [];
  const liabilityItems: LineItem[] = report.liabilities ?? report.liabilityItems ?? [];
  const equityItems: LineItem[] = report.equity ?? report.equityItems ?? [];

  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load balance sheet.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Balance Sheet</h2>
          <p className="text-sm text-muted-foreground">Financial position as of today</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-3 py-1 text-sm"
          >
            <option value="current">Current</option>
            <option value="q1">Q1</option>
            <option value="q2">Q2</option>
            <option value="q3">Q3</option>
            <option value="q4">Q4</option>
            <option value="ytd">Year to Date</option>
          </select>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-3 py-1 text-sm"
          >
            <option value="all">All Sections</option>
            <option value="assets">Assets</option>
            <option value="liabilities">Liabilities</option>
            <option value="equity">Equity</option>
          </select>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total Assets</p>
            <p className="mt-0.5 text-2xl font-black text-emerald-400">{fmt(totalAssets)}</p>
          </CardContent>
        </Card>
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Total Liabilities</p>
            <p className="mt-0.5 text-2xl font-black text-rose-400">{fmt(totalLiabilities)}</p>
          </CardContent>
        </Card>
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">Total Equity</p>
            <p className="mt-0.5 text-2xl font-black text-violet-400">{fmt(totalEquity)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Balance Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Balance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              layout="vertical"
              data={[
                { name: "Assets", value: totalAssets },
                { name: "Liabilities", value: totalLiabilities },
                { name: "Equity", value: totalEquity },
              ]}
              margin={{ left: 20, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  `$${v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                }
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={75} />
              <Tooltip
                formatter={(v: number) => [
                  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v),
                  "Amount",
                ]}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                <Cell fill="#10b981" />
                <Cell fill="#f43f5e" />
                <Cell fill="#8b5cf6" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          Loading balance sheet...
        </div>
      ) : (
        <>
          {/* Sections */}
          {(section === "all" || section === "assets") && (
            <Section
              title="Assets"
              items={assetItems}
              total={totalAssets}
              color="text-emerald-400"
              bgColor="bg-emerald-500/5"
              borderColor="border-emerald-500/20"
            />
          )}
          {(section === "all" || section === "liabilities") && (
            <Section
              title="Liabilities"
              items={liabilityItems}
              total={totalLiabilities}
              color="text-rose-400"
              bgColor="bg-rose-500/5"
              borderColor="border-rose-500/20"
            />
          )}
          {(section === "all" || section === "equity") && (
            <Section
              title="Equity"
              items={equityItems}
              total={totalEquity}
              color="text-violet-400"
              bgColor="bg-violet-500/5"
              borderColor="border-violet-500/20"
            />
          )}

          {/* Accounting Equation */}
          <Card className={`border ${isBalanced ? "border-emerald-500/30" : "border-amber-500/30"}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                    Assets = Liabilities + Equity
                  </p>
                  <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-black text-emerald-400">{fmt(totalAssets)}</span>
                    <span className="text-muted-foreground">=</span>
                    <span className="text-xl font-bold text-rose-400">{fmt(totalLiabilities)}</span>
                    <span className="text-muted-foreground">+</span>
                    <span className="text-xl font-bold text-violet-400">{fmt(totalEquity)}</span>
                  </div>
                  <p className={`mt-2 text-xs font-medium ${isBalanced ? "text-emerald-400" : "text-amber-400"}`}>
                    {isBalanced ? "Balance sheet is balanced" : "Balance sheet has discrepancies"}
                  </p>
                </div>
                <div className={`rounded-2xl p-4 ${isBalanced ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                  <Scale className={`h-8 w-8 ${isBalanced ? "text-emerald-400" : "text-amber-400"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
