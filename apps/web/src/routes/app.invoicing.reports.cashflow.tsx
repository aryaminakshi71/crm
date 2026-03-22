/**
 * Cash Flow Statement
 *
 * Cash inflows and outflows analysis.
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
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Download,
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/invoicing/reports/cashflow")({
  component: CashFlowStatement,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

const monthlyCashFlow = [
  { month: "Jan", operating: 15000, investing: -5000, financing: -3000, net: 7000 },
  { month: "Feb", operating: 18000, investing: -8000, financing: -2000, net: 8000 },
  { month: "Mar", operating: 22000, investing: -4000, financing: -5000, net: 13000 },
  { month: "Apr", operating: 19000, investing: -6000, financing: -3000, net: 10000 },
  { month: "May", operating: 24000, investing: -7000, financing: -4000, net: 13000 },
  { month: "Jun", operating: 26000, investing: -9000, financing: -3000, net: 14000 },
];

function CashFlowStatement() {
  const [dateRange, setDateRange] = useState("ytd");

  const cashflowQuery = useQuery({
    queryKey: ["invoicing/reports/cashflow", dateRange],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/invoicing/reports/cashflow?dateRange=${dateRange}`, { headers: { ...getOrgHeader() } });
      return res.json();
    },
    retry: false,
  });

  const operatingCashFlow = cashflowQuery.data?.operatingCashFlow ?? 124000;
  const investingCashFlow = cashflowQuery.data?.investingCashFlow ?? -39000;
  const financingCashFlow = cashflowQuery.data?.financingCashFlow ?? -20000;
  const netCashFlow = cashflowQuery.data?.netCashFlow ?? 65000;
  const beginningCash = cashflowQuery.data?.beginningCash ?? 60000;
  const endingCash = cashflowQuery.data?.endingCash ?? 125000;

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
            <h2 className="font-bold text-xl text-foreground">Cash Flow Statement</h2>
            <p className="text-sm text-muted-foreground">Cash inflows and outflows</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <option value="q1">Q1 2026</option>
            <option value="q2">Q2 2026</option>
            <option value="ytd">Year to Date</option>
          </select>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard title="Net Cash Flow" value={`+$${(netCashFlow / 1000).toFixed(1)}K`} color="text-emerald-400" trend="+18.2%" />
        <MetricCard title="Operating Cash" value={`$${(operatingCashFlow / 1000).toFixed(1)}K`} color="text-primary" trend="+12.4%" />
        <MetricCard title="Ending Cash" value={`$${(endingCash / 1000).toFixed(1)}K`} color="text-violet-400" trend="+108%" />
        <MetricCard title="Cash Burn Rate" value="$3.2K/mo" color="text-amber-400" trend="-15%" />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Monthly Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyCashFlow}>
                <defs>
                  <linearGradient id="colorOperating" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInvesting" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFinancing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
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
                <Area type="monotone" dataKey="operating" stroke="#34d399" fillOpacity={1} fill="url(#colorOperating)" strokeWidth={2} />
                <Area type="monotone" dataKey="investing" stroke="#f472b6" fillOpacity={1} fill="url(#colorInvesting)" strokeWidth={2} />
                <Area type="monotone" dataKey="financing" stroke="#fbbf24" fillOpacity={1} fill="url(#colorFinancing)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-4 rounded-full bg-[#34d399]" />
              <span className="text-xs text-muted-foreground">Operating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-4 rounded-full bg-[#f472b6]" />
              <span className="text-xs text-muted-foreground">Investing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-4 rounded-full bg-[#fbbf24]" />
              <span className="text-xs text-muted-foreground">Financing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Operating Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Operating Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CashFlowItem label="Cash from Customers" amount={180000} />
            <CashFlowItem label="Cash to Suppliers" amount={-45000} />
            <CashFlowItem label="Employee Wages" amount={-80000} />
            <CashFlowItem label="Other Operating" amount={-24000} />
            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between font-bold">
                <span>Net Operating</span>
                <span className="text-emerald-400">+${(operatingCashFlow / 1000).toFixed(1)}K</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investing Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Investing Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CashFlowItem label="Equipment Purchase" amount={-25000} />
            <CashFlowItem label="Asset Sales" amount={8000} />
            <CashFlowItem label="Software Investment" amount={-15000} />
            <CashFlowItem label="Other Investments" amount={-7000} />
            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between font-bold">
                <span>Net Investing</span>
                <span className="text-rose-400">-${(Math.abs(investingCashFlow) / 1000).toFixed(1)}K</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financing Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Financing Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CashFlowItem label="Loan Repayment" amount={-15000} />
            <CashFlowItem label="Owner Investment" amount={20000} />
            <CashFlowItem label="Dividends Paid" amount={-25000} />
            <CashFlowItem label="Other Financing" amount={0} />
            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between font-bold">
                <span>Net Financing</span>
                <span className="text-rose-400">-${(Math.abs(financingCashFlow) / 1000).toFixed(1)}K</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Cash Flow Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Beginning Cash</p>
              <p className="text-2xl font-bold">${beginningCash.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Net Change</p>
              <p className="text-2xl font-bold text-emerald-400">+${netCashFlow.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ending Cash</p>
              <p className="text-2xl font-bold text-primary">${endingCash.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Runway</p>
              <p className="text-2xl font-bold text-violet-400">39 months</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, color, trend }: { title: string; value: string; color: string; trend: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className={`font-black text-2xl mt-0.5 ${color}`}>{value}</p>
            <div className="mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400">{trend}</span>
            </div>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color}`}>
            <BarChart3 className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CashFlowItem({ label, amount }: { label: string; amount: number }) {
  const isPositive = amount >= 0;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
        {isPositive ? "+" : ""}${amount.toLocaleString()}
      </span>
    </div>
  );
}
