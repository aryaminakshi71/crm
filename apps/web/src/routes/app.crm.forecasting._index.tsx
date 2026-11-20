import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Loading,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  BarChart2,
  DollarSign,
  Search,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { z } from "zod";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const EMPTY_FORECAST_DATA: any[] = [];
import { dealsApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  stage: z.string().optional(),
});

export const Route = createFileRoute("/app/crm/forecasting/_index")({
  validateSearch: searchSchema,
  component: ForecastingPage,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STAGE_PROBABILITY: Record<string, number> = {
  prospecting: 0.1,
  qualification: 0.2,
  proposal: 0.4,
  negotiation: 0.7,
  closed_won: 1.0,
  closed_lost: 0.0,
};

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function ForecastingPage() {
  const { q = "", stage: stageFilter = "all" } = useSearch({ from: "/app/crm/forecasting/_index" });
  const navigate = useNavigate({ from: "/app/crm/forecasting" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setStageFilter = (v: string) => navigate({ search: (p) => ({ ...p, stage: v }) });

  const { data, isLoading } = useQuery({
    queryKey: ["crm-forecast-deals"],
    queryFn: () => dealsApi.list({ page: 1, limit: 500 }),
  });

  const allDeals: any[] = (data as any)?.data ?? [];

  const deals = allDeals.filter((d: any) => {
    if (q.trim()) {
      const s = q.toLowerCase();
      const matchesQ = [d.name, d.title].some((v) => String(v ?? "").toLowerCase().includes(s));
      if (!matchesQ) return false;
    }
    if (stageFilter !== "all" && d.stage !== stageFilter) return false;
    return true;
  });

  const { monthlyForecast, totalExpected, totalCommitted, totalBestCase } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Build monthly buckets for next 6 months
    const buckets: Record<string, { expected: number; committed: number; bestCase: number; label: string }> = {};

    for (let i = 0; i < 6; i++) {
      const m = (currentMonth + i) % 12;
      const y = currentYear + Math.floor((currentMonth + i) / 12);
      const key = `${y}-${m}`;
      buckets[key] = { expected: 0, committed: 0, bestCase: 0, label: `${MONTHS[m]} ${y}` };
    }

    for (const deal of deals) {
      if (deal.stage === "closed_lost") continue;
      const closeDate = deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null;
      const value = Number(deal.value) || 0;
      const prob = STAGE_PROBABILITY[deal.stage] ?? 0.1;

      let month = currentMonth;
      let year = currentYear;
      if (closeDate && closeDate > now) {
        month = closeDate.getMonth();
        year = closeDate.getFullYear();
      }

      const key = `${year}-${month}`;
      if (buckets[key]) {
        buckets[key].expected += value * prob;
        if (prob >= 0.7) buckets[key].committed += value;
        buckets[key].bestCase += value;
      }
    }

    const monthlyForecast = Object.values(buckets);
    const totalExpected = monthlyForecast.reduce((s, b) => s + b.expected, 0);
    const totalCommitted = monthlyForecast.reduce((s, b) => s + b.committed, 0);
    const totalBestCase = monthlyForecast.reduce((s, b) => s + b.bestCase, 0);

    return { monthlyForecast, totalExpected, totalCommitted, totalBestCase };
  }, [deals]);

  const { stageBreakdown } = useMemo(() => {
    const stages: Record<string, { count: number; value: number }> = {};
    for (const deal of deals) {
      if (!stages[deal.stage]) stages[deal.stage] = { count: 0, value: 0 };
      stages[deal.stage].count++;
      stages[deal.stage].value += Number(deal.value) || 0;
    }
    return {
      stageBreakdown: Object.entries(stages).map(([stage, { count, value }]) => ({
        stage: stage.replace("_", " "),
        count,
        value,
      })),
    };
  }, [deals]);

  if (isLoading) return <Loading text="Loading forecast data..." />;

  if (deals.length === 0) {
    return (
      <EmptyState
        icon={<BarChart2 className="h-12 w-12" />}
        title="No forecast data"
        description="Add deals to your pipeline to generate revenue forecasts."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <BarChart2 className="h-6 w-6" /> Revenue Forecasting
        </h1>
        <p className="text-muted-foreground text-sm">Projected revenue based on pipeline stage probabilities.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter deals by name..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All stages</option>
          <option value="prospecting">Prospecting</option>
          <option value="qualification">Qualification</option>
          <option value="proposal">Proposal</option>
          <option value="negotiation">Negotiation</option>
          <option value="closed_won">Closed Won</option>
          <option value="closed_lost">Closed Lost</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric
          title="Expected Revenue"
          value={fmt(totalExpected)}
          icon={<DollarSign className="h-4 w-4" />}
          trend="probability-weighted"
          color="text-primary"
        />
        <Metric
          title="Committed"
          value={fmt(totalCommitted)}
          icon={<Target className="h-4 w-4" />}
          trend="70%+ probability deals"
          color="text-emerald-400"
        />
        <Metric
          title="Best Case"
          value={fmt(totalBestCase)}
          icon={<TrendingUp className="h-4 w-4" />}
          trend="all deals at full value"
          color="text-amber-400"
        />
      </div>

      {/* Revenue Forecast: Actual vs Projected */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={EMPTY_FORECAST_DATA}>
                <defs>
                  <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} stroke="#888" />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  stroke="#888"
                  tickFormatter={(v) => fmt(v)}
                />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px", fontSize: "11px" }}
                  formatter={(v: any) => [v != null ? fmt(v) : "—", ""]}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  name="Projected"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  connectNulls
                  dot={{ r: 3, fill: "#a855f7" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">6-Month Revenue Forecast</CardTitle>
          <p className="text-2xl font-black text-foreground">Pipeline Projection</p>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyForecast}>
                <defs>
                  <linearGradient id="gradExpected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradBest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  stroke="#888"
                  tickFormatter={(v) => fmt(v)}
                />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", fontSize: "11px" }}
                  formatter={(v: number) => [fmt(v), ""]}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Area
                  type="monotone"
                  dataKey="bestCase"
                  name="Best Case"
                  stroke="#22d3ee"
                  fill="url(#gradBest)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="expected"
                  name="Expected"
                  stroke="#6366f1"
                  fill="url(#gradExpected)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="committed"
                  name="Committed"
                  stroke="#22c55e"
                  fill="none"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Pipeline by Stage</CardTitle>
          <p className="text-lg font-black text-foreground">Stage Breakdown</p>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  stroke="#888"
                  tickFormatter={(v) => fmt(v)}
                />
                <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} fontSize={10} stroke="#888" width={80} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", fontSize: "11px" }}
                  formatter={(v: number) => [fmt(v), "Value"]}
                />
                <Bar dataKey="value" name="Value" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">{trend}</span>
              </div>
            )}
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color ?? "text-primary"}`}>
            {icon ?? <BarChart2 className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
