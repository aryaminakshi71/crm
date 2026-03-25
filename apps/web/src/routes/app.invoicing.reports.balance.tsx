/**
 * Balance Sheet Report
 *
 * Assets, liabilities, and equity overview.
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
  Download,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/invoicing/reports/balance")({
  component: BalanceSheet,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

const EMPTY_ASSETS: any[] = [];
const EMPTY_LIABILITIES: any[] = [];
const EMPTY_EQUITY: any[] = [];

function BalanceSheet() {
  const [dateRange, setDateRange] = useState("q1");

  const balanceQuery = useQuery({
    queryKey: ["invoicing/reports/balance", dateRange],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/invoicing/reports/balance`, { headers: { ...getOrgHeader() } });
      return res.json();
    },
    retry: false,
    placeholderData: (prev) => prev,
  });
  if (balanceQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => balanceQuery.refetch()}>Retry</Button>
    </div>
  );

  const totalCurrentAssets = (balanceQuery as any).data?.totalCurrentAssets ?? 271400;
  const totalFixedAssets = (balanceQuery as any).data?.totalFixedAssets ?? 160000;
  const totalAssets = (balanceQuery as any).data?.totalAssets ?? 431400;

  const totalCurrentLiabilities = (balanceQuery as any).data?.totalCurrentLiabilities ?? 120000;
  const totalLongTermLiabilities = (balanceQuery as any).data?.totalLongTermLiabilities ?? 135000;
  const totalLiabilities = (balanceQuery as any).data?.totalLiabilities ?? 255000;

  const totalEquity = (balanceQuery as any).data?.totalEquity ?? 176400;

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
            <h2 className="font-bold text-xl text-foreground">Balance Sheet</h2>
            <p className="text-sm text-muted-foreground">Assets, liabilities, and equity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <option value="q1">As of Mar 31, 2026</option>
            <option value="q4">As of Dec 31, 2025</option>
            <option value="q3">As of Sep 30, 2025</option>
          </select>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard title="Total Assets" value="$431.4K" color="text-primary" />
        <MetricCard title="Total Liabilities" value="$255K" color="text-rose-400" />
        <MetricCard title="Net Assets" value="$176.4K" color="text-emerald-400" />
        <MetricCard title="Debt-to-Equity" value="1.45" color="text-violet-400" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Assets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Assets
              </CardTitle>
              <Badge variant="success">${(totalAssets / 1000).toFixed(1)}K</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {EMPTY_ASSETS.map((section: any) => (
              <div key={section.category}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{section.category}</p>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <span className={item.amount < 0 ? "text-rose-400" : ""}>{item.name}</span>
                      <span className={item.amount < 0 ? "text-rose-400" : "font-medium"}>
                        ${Math.abs(item.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 border-t border-border pt-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{section.category === "Current Assets" ? "Total Current" : "Total Fixed"}</span>
                    <span>${(section.category === "Current Assets" ? totalCurrentAssets : totalFixedAssets).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Liabilities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Liabilities
              </CardTitle>
              <Badge variant="danger">${(totalLiabilities / 1000).toFixed(1)}K</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {EMPTY_LIABILITIES.map((section: any) => (
              <div key={section.category}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{section.category}</p>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="font-medium text-rose-400">${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 border-t border-border pt-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{section.category === "Current Liabilities" ? "Total Current" : "Total Long-term"}</span>
                    <span>${(section.category === "Current Liabilities" ? totalCurrentLiabilities : totalLongTermLiabilities).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Equity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Equity
              </CardTitle>
              <Badge variant="primary">${(totalEquity / 1000).toFixed(1)}K</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Owner's Equity</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Common Stock</span>
                  <span className="font-medium">$100,000</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Retained Earnings</span>
                  <span className="font-medium">$76,400</span>
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between text-sm font-bold">
                <span>Total Equity</span>
                <span className="text-emerald-400">${totalEquity.toLocaleString()}</span>
              </div>
            </div>

            {/* Accounting Equation */}
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Accounting Equation</p>
              <div className="flex items-center justify-between text-sm">
                <span>Assets = Liabilities + Equity</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-lg font-bold">
                <span className="text-primary">$431.4K</span>
                <span className="text-muted-foreground">=</span>
                <span className="text-rose-400">$255K</span>
                <span className="text-muted-foreground">+</span>
                <span className="text-emerald-400">$176.4K</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className={`font-black text-2xl mt-0.5 ${color}`}>{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color}`}>
            <BarChart3 className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
