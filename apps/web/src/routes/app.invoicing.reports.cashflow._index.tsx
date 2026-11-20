/**
 * Cash Flow Statement
 *
 * Operating, Investing, Financing activities with area chart.
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
  Waves,
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
import { invoicingApi } from "@/lib/api";

const searchSchema = z.object({
  period: z.enum(["month", "quarter", "ytd", "fy"]).optional(),
});

export const Route = createFileRoute("/app/invoicing/reports/cashflow/_index")({
  validateSearch: searchSchema,
  component: CashFlowPage,
});

const PERIODS = [
  { label: "This Month", value: "month" },
  { label: "This Quarter", value: "quarter" },
  { label: "YTD", value: "ytd" },
  { label: "FY", value: "fy" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

interface ActivityItem {
  name?: string;
  label?: string;
  amount?: number;
  value?: number;
}

function ActivitySection({
  title,
  items,
  total,
  color,
  bgColor,
}: {
  title: string;
  items: ActivityItem[];
  total: number;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-sm font-bold uppercase tracking-tight ${color}`}>
            {title}
          </CardTitle>
          <span className={`text-sm font-black ${color}`}>{fmt(total)}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items.length > 0 ? (
          <table className="w-full">
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-2.5 text-sm">{item.name ?? item.label ?? `Item ${i + 1}`}</td>
                  <td className={`px-4 py-2.5 text-sm font-medium text-right ${Number(item.amount ?? item.value) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {fmt(Number(item.amount ?? item.value) || 0)}
                  </td>
                </tr>
              ))}
              <tr className={`${bgColor} border-t border-border/50`}>
                <td className={`px-4 py-3 text-xs font-black uppercase tracking-wide ${color}`}>
                  Net {title.replace("Activities", "").trim()}
                </td>
                <td className={`px-4 py-3 text-sm font-black text-right ${color}`}>
                  {fmt(total)}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-4 text-center">
            <p className={`text-xl font-black ${color}`}>{fmt(total)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Net cash {total >= 0 ? "inflow" : "outflow"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CashFlowPage() {
  const { period = "ytd" } = useSearch({ from: "/app/invoicing/reports/cashflow/_index" });
  const navigate = useNavigate({ from: "/app/invoicing/reports/cashflow" });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoicing/reports/cashflow", period],
    queryFn: () => invoicingApi.reports.cashFlow({ dateRange: period }),
    retry: false,
  });

  const report = (data as any) ?? {};

  const operatingCF = Number(report.operatingCashFlow ?? report.operating ?? 0);
  const investingCF = Number(report.investingCashFlow ?? report.investing ?? 0);
  const financingCF = Number(report.financingCashFlow ?? report.financing ?? 0);
  const netCashFlow = Number(report.netCashFlow ?? operatingCF + investingCF + financingCF);
  const openingBalance = Number(report.openingBalance ?? report.beginningBalance ?? 0);
  const closingBalance = Number(report.closingBalance ?? report.endingBalance ?? openingBalance + netCashFlow);

  const operatingItems: ActivityItem[] = report.operatingItems ?? [];
  const investingItems: ActivityItem[] = report.investingItems ?? [];
  const financingItems: ActivityItem[] = report.financingItems ?? [];

  const chartData: any[] = report.monthly ?? report.chartData ?? [];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load cash flow statement.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Cash Flow Statement</h2>
          <p className="text-sm text-muted-foreground">Cash movements across operating, investing, and financing</p>
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
          <Button size="sm" variant="outline" className="gap-1.5 ml-2">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Opening Balance</p>
            <p className="mt-0.5 text-xl font-black">{fmt(openingBalance)}</p>
          </CardContent>
        </Card>
        <Card className={`border-border/60 ${netCashFlow >= 0 ? "border-emerald-500/20" : "border-rose-500/20"}`}>
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net Cash Flow</p>
            <div className="flex items-center gap-1 mt-0.5">
              <p className={`text-xl font-black ${netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {fmt(netCashFlow)}
              </p>
              {netCashFlow >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-rose-400" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Closing Balance</p>
            <p className="mt-0.5 text-xl font-black text-primary">{fmt(closingBalance)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operating CF</p>
            <p className={`mt-0.5 text-xl font-black ${operatingCF >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {fmt(operatingCF)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Balance Area Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Cash Balance Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(value: number) => [fmt(value), ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Cash Balance"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorCash)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="inflow"
                    name="Inflows"
                    stroke="#34d399"
                    fillOpacity={1}
                    fill="url(#colorInflow)"
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="outflow"
                    name="Outflows"
                    stroke="#f472b6"
                    fillOpacity={1}
                    fill="url(#colorOutflow)"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          Loading cash flow data...
        </div>
      ) : (
        <div className="space-y-4">
          <ActivitySection
            title="Operating Activities"
            items={operatingItems}
            total={operatingCF}
            color="text-emerald-400"
            bgColor="bg-emerald-500/5"
          />
          <ActivitySection
            title="Investing Activities"
            items={investingItems}
            total={investingCF}
            color="text-cyan-400"
            bgColor="bg-cyan-500/5"
          />
          <ActivitySection
            title="Financing Activities"
            items={financingItems}
            total={financingCF}
            color="text-violet-400"
            bgColor="bg-violet-500/5"
          />

          {/* Net Cash Flow Summary */}
          <Card className={`border ${netCashFlow >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Net Increase in Cash</p>
                  <p className={`text-3xl font-black ${netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {fmt(netCashFlow)}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Opening</p>
                    <p className="text-lg font-bold">{fmt(openingBalance)}</p>
                  </div>
                  <div className={netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {netCashFlow >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Closing</p>
                    <p className="text-lg font-bold text-primary">{fmt(closingBalance)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
