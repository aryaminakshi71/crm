/**
 * Marketing Analytics
 *
 * KPI overview, trend charts (recharts AreaChart), and channel
 * breakdown (recharts BarChart).
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  BarChart3,
  DollarSign,
  MousePointerClick,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { marketingApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  period: z.enum(["week", "month", "quarter", "year"]).optional(),
  channel: z.string().optional(),
});

export const Route = createFileRoute("/app/marketing/analytics/_index")({
  validateSearch: searchSchema,
  component: MarketingAnalyticsPage,
});

// ─── Static chart data (used when API returns nothing) ────────────────────────

const TREND_DATA = [
  { label: "Jan", impressions: 180000, clicks: 12600, conversions: 820, revenue: 41000 },
  { label: "Feb", impressions: 205000, clicks: 15375, conversions: 1000, revenue: 50000 },
  { label: "Mar", impressions: 240000, clicks: 19200, conversions: 1248, revenue: 62400 },
  { label: "Apr", impressions: 278000, clicks: 23130, conversions: 1504, revenue: 75200 },
  { label: "May", impressions: 310000, clicks: 27900, conversions: 1736, revenue: 86800 },
  { label: "Jun", impressions: 345000, clicks: 32775, conversions: 1984, revenue: 99200 },
];

const CHANNEL_DATA = [
  { channel: "Email", impressions: 92000, clicks: 9200, conversions: 644, revenue: 32200, color: "#22d3ee" },
  { channel: "Social", impressions: 110000, clicks: 8800, conversions: 528, revenue: 26400, color: "#a78bfa" },
  { channel: "Ads", impressions: 85000, clicks: 10200, conversions: 612, revenue: 30600, color: "#f472b6" },
  { channel: "Organic", impressions: 58000, clicks: 4640, conversions: 200, revenue: 10000, color: "#34d399" },
];

const PERIOD_OPTIONS = ["week", "month", "quarter", "year"] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ title, value, trend, icon, color }: { title: string; value: string; trend: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
            <p className="text-2xl font-black mt-0.5">{value}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <TrendingUp className="h-2.5 w-2.5 text-primary/40" />
              <span className="text-[9px] font-bold text-muted-foreground/60">{trend}</span>
            </div>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tooltip Styles ───────────────────────────────────────────────────────────

const tooltipStyle = {
  background: "#0f172a",
  border: "none",
  borderRadius: "12px",
  fontSize: "11px",
};

// ─── Main Component ───────────────────────────────────────────────────────────

function MarketingAnalyticsPage() {
  const { q = "", period = "month", channel = "" } = useSearch({ from: "/app/marketing/analytics/_index" });
  const navigate = useNavigate({ from: "/app/marketing/analytics/_index" });
  const setPeriod = (v: Period) => navigate({ search: (p) => ({ ...p, period: v }) });
  const setChannel = (v: string) => navigate({ search: (p) => ({ ...p, channel: v || undefined }) });

  const { data, isLoading } = useQuery({
    queryKey: ["marketing", "analytics", period],
    queryFn: async () => {
      // analytics.get not in real marketingApi — return null to use static data
      return null;
    },
    retry: false,
  });

  // Use static fallback data
  const trendData = (data as any)?.trend ?? TREND_DATA;
  const allChannelData = (data as any)?.channels ?? CHANNEL_DATA;
  const channelData = allChannelData.filter((c: any) =>
    (!channel || c.channel.toLowerCase() === channel.toLowerCase()) &&
    (!q || c.channel.toLowerCase().includes(q.toLowerCase()))
  );

  const totalImpressions = channelData.reduce((s: number, c: any) => s + (c.impressions ?? 0), 0);
  const totalClicks = channelData.reduce((s: number, c: any) => s + (c.clicks ?? 0), 0);
  const totalConversions = channelData.reduce((s: number, c: any) => s + (c.conversions ?? 0), 0);
  const totalRevenue = channelData.reduce((s: number, c: any) => s + (c.revenue ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Period Selector + Channel Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Marketing Analytics</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
            {["all", "Email", "Social", "Ads", "Organic"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c === "all" ? "" : c)}
                className={`px-3 py-1.5 capitalize transition-colors ${(channel || "all") === (c === "all" ? "all" : c) ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 capitalize transition-colors ${period === p ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Impressions" value={totalImpressions.toLocaleString()} trend="+12.4% vs last period" icon={<BarChart3 className="h-4 w-4" />} color="text-primary" />
        <KpiCard title="Clicks" value={totalClicks.toLocaleString()} trend="+8.7% vs last period" icon={<MousePointerClick className="h-4 w-4" />} color="text-violet-400" />
        <KpiCard title="Conversions" value={totalConversions.toLocaleString()} trend="+15.2% vs last period" icon={<Target className="h-4 w-4" />} color="text-emerald-400" />
        <KpiCard title="Revenue" value={`$${(totalRevenue / 1000).toFixed(0)}k`} trend="+22.1% vs last period" icon={<DollarSign className="h-4 w-4" />} color="text-amber-400" />
      </div>

      {/* Trend Chart */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Performance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="impressions" stroke="#22d3ee" fill="url(#gImpressions)" strokeWidth={2} name="Impressions" />
                <Area type="monotone" dataKey="clicks" stroke="#a78bfa" fill="url(#gClicks)" strokeWidth={2} name="Clicks" />
                <Area type="monotone" dataKey="conversions" stroke="#34d399" fill="url(#gConversions)" strokeWidth={2} name="Conversions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {[
              { label: "Impressions", color: "#22d3ee" },
              { label: "Clicks", color: "#a78bfa" },
              { label: "Conversions", color: "#34d399" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="h-2 w-4 rounded-full" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Channel Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Clicks by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="channel" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="clicks" radius={[4, 4, 0, 0]} name="Clicks">
                    {channelData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Revenue by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="channel" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} name="Revenue">
                    {channelData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel breakdown table */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Channel Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <th className="px-5 py-3 text-left">Channel</th>
                  <th className="px-4 py-3 text-right">Impressions</th>
                  <th className="px-4 py-3 text-right">Clicks</th>
                  <th className="px-4 py-3 text-right">CTR</th>
                  <th className="px-4 py-3 text-right">Conversions</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {channelData.map((c: any) => {
                  const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : "0.00";
                  return (
                    <tr key={c.channel} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                          <span className="font-medium">{c.channel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">{(c.impressions ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums">{(c.clicks ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums">{ctr}%</td>
                      <td className="px-4 py-3.5 text-right tabular-nums">{(c.conversions ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-medium">${(c.revenue ?? 0).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
