/**
 * Analytics Dashboard
 *
 * Funnel metrics, conversion rates, and business intelligence.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, LoadingSkeleton } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  DollarSign,
  Funnel,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
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
import { dealsApi, leadsApi, nucleoApi } from "../lib/api";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/analytics")({
  component: AnalyticsDashboard,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface FunnelStage {
  name: string;
  value: number;
  color: string;
}

interface ConversionMetric {
  from: string;
  to: string;
  rate: number;
}

// ─── Mock Data Generators ─────────────────────────────────────────────────────

function generateFunnelData() {
  return [
    { name: "Visitors", value: 10000, color: "#818cf8" },
    { name: "Leads", value: 2500, color: "#a78bfa" },
    { name: "Qualified", value: 800, color: "#22d3ee" },
    { name: "Proposals", value: 300, color: "#34d399" },
    { name: "Negotiations", value: 150, color: "#fbbf24" },
    { name: "Closed", value: 75, color: "#22c55e" },
  ];
}

function generateConversionData() {
  return [
    { month: "Jan", visitors: 8200, leads: 2100, qualified: 680, proposals: 240, closed: 58 },
    { month: "Feb", visitors: 9500, leads: 2400, qualified: 780, proposals: 280, closed: 65 },
    { month: "Mar", visitors: 11000, leads: 2800, qualified: 920, proposals: 340, closed: 78 },
    { month: "Apr", visitors: 10500, leads: 2600, qualified: 850, proposals: 310, closed: 72 },
    { month: "May", visitors: 12000, leads: 3000, qualified: 980, proposals: 360, closed: 85 },
    { month: "Jun", visitors: 13500, leads: 3400, qualified: 1100, proposals: 400, closed: 95 },
  ];
}

function generateSourceData() {
  return [
    { source: "Organic Search", value: 35, color: "#818cf8" },
    { source: "Paid Ads", value: 28, color: "#22d3ee" },
    { source: "Referral", value: 18, color: "#34d399" },
    { source: "Social Media", value: 12, color: "#f472b6" },
    { source: "Direct", value: 7, color: "#fbbf24" },
  ];
}

function generateDealVelocityData() {
  return [
    { stage: "Lead → MQL", rate: 68, avgDays: 3.2 },
    { stage: "MQL → SQL", rate: 45, avgDays: 5.8 },
    { stage: "SQL → Proposal", rate: 38, avgDays: 8.1 },
    { stage: "Proposal → Negotiation", rate: 52, avgDays: 12.4 },
    { stage: "Negotiation → Close", rate: 71, avgDays: 18.6 },
  ];
}

// ─── Funnel Chart ─────────────────────────────────────────────────────────────

function FunnelChart({ data }: { data: FunnelStage[] }) {
  const maxValue = data[0]?.value || 1;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {data.map((stage, i) => {
        const widthPct = ((stage.value / maxValue) * 100).toFixed(1);
        const isLast = i === data.length - 1;
        return (
          <div key={stage.name} className="w-full max-w-md text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="text-xs font-semibold text-foreground w-24 text-right">{stage.name}</span>
              <div className="relative h-10 flex-1 max-w-[200px] bg-muted rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
                  style={{
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${stage.color}cc, ${stage.color})`,
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {stage.value.toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-muted-foreground w-12 text-left">
                {((stage.value / maxValue) * 100).toFixed(1)}%
              </span>
            </div>
            {!isLast && (
              <div className="flex justify-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground/40" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Conversion Funnel ────────────────────────────────────────────────────────

function ConversionFunnel({ data }: { data: ReturnType<typeof generateFunnelData> }) {
  const totalRate = ((data[data.length - 1].value / data[0].value) * 100).toFixed(2);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Funnel className="h-4 w-4 text-primary" /> Sales Funnel
          </CardTitle>
          <Badge variant="success" className="text-xs">{totalRate}% Overall</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <FunnelChart data={data} />
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Based on last 6 months of data
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Conversion Rate Card ──────────────────────────────────────────────────────

function ConversionRatesCard({ data }: { data: ReturnType<typeof generateDealVelocityData> }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" /> Stage Conversion Rates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((stage, i) => (
          <div key={stage.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{stage.stage}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{stage.rate}%</span>
                <span className="text-muted-foreground">{stage.avgDays}d avg</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                style={{ width: `${stage.rate}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Monthly Trends ─────────────────────────────────────────────────────────────

function MonthlyTrendsChart({ data }: { data: ReturnType<typeof generateConversionData> }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-violet-500" /> Monthly Conversion Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
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
              <Area type="monotone" dataKey="visitors" stroke="#818cf8" fillOpacity={1} fill="url(#colorVisitors)" strokeWidth={2} />
              <Area type="monotone" dataKey="leads" stroke="#22d3ee" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={2} />
              <Area type="monotone" dataKey="closed" stroke="#22c55e" fillOpacity={1} fill="url(#colorClosed)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          {[
            { label: "Visitors", color: "#818cf8" },
            { label: "Leads", color: "#22d3ee" },
            { label: "Closed", color: "#22c55e" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ background: item.color }} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Lead Source Distribution ──────────────────────────────────────────────────

function LeadSourceChart({ data }: { data: ReturnType<typeof generateSourceData> }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-pink-500" /> Lead Sources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
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
        <div className="space-y-2 mt-4">
          {data.map((item) => (
            <div key={item.source} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                <span className="text-muted-foreground">{item.source}</span>
              </div>
              <span className="font-semibold text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── KPI Cards ─────────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  change,
  changeType,
  icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-1">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              {changeType === "up" ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className={`text-[10px] font-bold ${changeType === "up" ? "text-success" : "text-destructive"}`}>
                {change}
              </span>
              <span className="text-muted-foreground text-[10px]">vs last month</span>
            </div>
          </div>
          <div className={`rounded-xl bg-muted/30 p-3 ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Pipeline Value Chart ─────────────────────────────────────────────────────

function PipelineValueChart({ deals }: { deals: any[] }) {
  const byStage = deals.reduce((acc: Record<string, number>, d: any) => {
    const stage = d.stage || "unknown";
    acc[stage] = (acc[stage] || 0) + (d.value || 0);
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(byStage).map(([stage, value]) => ({
    stage: stage.replace(/_/g, " "),
    value: value as number,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-amber-500" /> Pipeline by Stage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" axisLine={false} tickLine={false} fontSize={10} stroke="#888" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} fontSize={10} stroke="#888" width={80} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "11px",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
              />
              <Bar dataKey="value" fill="#22d3ee" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page Component ─────────────────────────────────────────────────────────────

function AnalyticsDashboard() {
  const [funnelData] = useState(generateFunnelData);
  const [conversionData] = useState(generateConversionData);
  const [sourceData] = useState(generateSourceData);
  const [velocityData] = useState(generateDealVelocityData);

  // Fetch real data
  const dealsQuery = useQuery({
    queryKey: ["analytics-deals"],
    queryFn: () => dealsApi.list({ limit: 1000 }),
  });
  const leadsQuery = useQuery({
    queryKey: ["analytics-leads"],
    queryFn: () => leadsApi.list({ limit: 1000 }),
  });
  const summaryQuery = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => nucleoApi.summary(),
  });

  const deals = dealsQuery.data?.data || [];
  const leads = leadsQuery.data?.data || [];
  const s = summaryQuery.data || {};

  const isLoading = dealsQuery.isLoading || leadsQuery.isLoading || summaryQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate KPIs
  const totalLeads = leads.length || s.leads || 0;
  const totalDeals = deals.length || s.deals || 0;
  const closedWon = deals.filter((d: any) => d.stage === "closed_won").length;
  const closedLost = deals.filter((d: any) => d.stage === "closed_lost").length;
  const avgDealValue = deals.reduce((a: number, d: any) => a + (d.value || 0), 0) / (totalDeals || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Business <span className="text-primary">Analytics</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Conversion funnels, pipeline metrics, and revenue intelligence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
            <option>Last 6 months</option>
            <option>Last 12 months</option>
            <option>This year</option>
          </select>
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Leads"
          value={totalLeads.toLocaleString()}
          change="+12.5%"
          changeType="up"
          icon={<UserRound className="h-5 w-5 text-indigo-500" />}
          color="text-indigo-500"
        />
        <KPICard
          title="Conversion Rate"
          value={funnelData.length > 1 ? ((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(2) + "%" : "0%"}
          change="+2.3%"
          changeType="up"
          icon={<Target className="h-5 w-5 text-emerald-500" />}
          color="text-emerald-500"
        />
        <KPICard
          title="Avg Deal Value"
          value={`$${(avgDealValue / 1000).toFixed(1)}k`}
          change="-5.2%"
          changeType="down"
          icon={<DollarSign className="h-5 w-5 text-amber-500" />}
          color="text-amber-500"
        />
        <KPICard
          title="Win Rate"
          value={totalDeals > 0 ? ((closedWon / (closedWon + closedLost || 1)) * 100).toFixed(1) + "%" : "0%"}
          change="+8.1%"
          changeType="up"
          icon={<TrendingUp className="h-5 w-5 text-cyan-500" />}
          color="text-cyan-500"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ConversionFunnel data={funnelData} />
        <MonthlyTrendsChart data={conversionData} />
      </div>

      {/* Secondary Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <LeadSourceChart data={sourceData} />
        <ConversionRatesCard data={velocityData} />
        <PipelineValueChart deals={deals} />
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Dive Deeper</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link to="/app/crm">
              <div className="flex items-center justify-between rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-all">
                <div>
                  <p className="font-semibold text-foreground text-sm">CRM Analytics</p>
                  <p className="text-muted-foreground text-xs">Detailed lead & deal reports</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/app/marketing">
              <div className="flex items-center justify-between rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-all">
                <div>
                  <p className="font-semibold text-foreground text-sm">Marketing Metrics</p>
                  <p className="text-muted-foreground text-xs">Campaign performance data</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/app/monitoring/analytics">
              <div className="flex items-center justify-between rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-all">
                <div>
                  <p className="font-semibold text-foreground text-sm">Platform Analytics</p>
                  <p className="text-muted-foreground text-xs">Usage & performance insights</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
