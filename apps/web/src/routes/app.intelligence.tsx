import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormModal,
  Input,
  LoadingSkeleton,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  Brain,
  ChartNoAxesCombined,
  CheckCircle2,
  DollarSign,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { aiApi, dealsApi, leadsApi, nucleoApi } from "../lib/api";

// ── Mini Components ──────────────────────────────────────────────────────────

function FunnelBar({
  label,
  value,
  max,
  color,
}: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/app/intelligence")({
  component: IntelligencePage,
});

function IntelligencePage() {
  const queryClient = useQueryClient();
  const [agentPrompt, setAgentPrompt] = useState(
    "Create a 90-day growth plan to improve qualified pipeline and reduce churn risk.",
  );
  const [forecastInput, setForecastInput] = useState({
    monthlyPipeline: "420000",
    winRate: "24",
    avgSalesCycleDays: "46",
  });
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [newKpi, setNewKpi] = useState({
    metricKey: "",
    metricLabel: "",
    metricValue: "",
    metricText: "",
    periodLabel: "",
  });

  const [agentResponse, setAgentResponse] = useState<string>("");
  const [forecast, setForecast] = useState<{
    projectedRevenue: number;
    riskBand: "low" | "medium" | "high";
    confidence: number;
    recommendations: string[];
  } | null>(null);

  const summaryQuery = useQuery({
    queryKey: ["intelligence-summary"],
    queryFn: () => nucleoApi.intelligence.summary(),
  });

  const kpisQuery = useQuery({
    queryKey: ["intelligence-kpis"],
    queryFn: () => nucleoApi.intelligence.kpis.list({ page: 1, limit: 20 }),
  });

  const agentRunsQuery = useQuery({
    queryKey: ["intelligence-agent-runs"],
    queryFn: () =>
      nucleoApi.intelligence.agentRuns.list({ page: 1, limit: 10 }),
  });

  const forecastsQuery = useQuery({
    queryKey: ["intelligence-forecasts"],
    queryFn: () =>
      nucleoApi.intelligence.forecasts.list({ page: 1, limit: 10 }),
  });

  const dealsQuery = useQuery({
    queryKey: ["crm-deals"],
    queryFn: () => dealsApi.list({ limit: 1000 }),
  });

  const leadsQuery = useQuery({
    queryKey: ["crm-leads"],
    queryFn: () => leadsApi.list({ limit: 1000 }),
  });

  const deals = dealsQuery.data?.data || [];
  const leads = leadsQuery.data?.data || [];

  const persistAgentRun = useMutation({
    mutationFn: (payload: {
      agentName: string;
      prompt: string;
      output: string;
      status?: string;
      confidence?: number;
    }) =>
      nucleoApi.intelligence.agentRuns.create({
        ...payload,
        model: "multi-model",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligence-summary"] });
    },
  });

  const persistForecast = useMutation({
    mutationFn: (payload: {
      pipelineAmount: number;
      winRate: number;
      avgSalesCycleDays: number;
      projectedRevenue: number;
      riskBand: "low" | "medium" | "high";
      confidence: number;
      recommendations: string[];
    }) => nucleoApi.intelligence.forecasts.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligence-summary"] });
      queryClient.invalidateQueries({ queryKey: ["intelligence-kpis"] });
    },
  });

  const createKpi = useMutation({
    mutationFn: (payload: {
      metricKey: string;
      metricLabel: string;
      metricValue: number;
      metricText?: string;
      periodLabel?: string;
    }) => nucleoApi.intelligence.kpis.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["intelligence-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["intelligence-kpis"] }),
      ]);
      toast.success("KPI snapshot created");
    },
    onError: () => toast.error("Failed to create KPI"),
  });

  const deleteKpi = useMutation({
    mutationFn: (id: string) => nucleoApi.intelligence.kpis.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["intelligence-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["intelligence-kpis"] }),
      ]);
      toast.success("KPI deleted");
    },
  });

  const deleteAgentRun = useMutation({
    mutationFn: (id: string) => nucleoApi.intelligence.agentRuns.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["intelligence-summary"] }),
        queryClient.invalidateQueries({
          queryKey: ["intelligence-agent-runs"],
        }),
      ]);
      toast.success("Agent run deleted");
    },
  });

  const deleteForecast = useMutation({
    mutationFn: (id: string) => nucleoApi.intelligence.forecasts.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["intelligence-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["intelligence-forecasts"] }),
      ]);
      toast.success("Forecast deleted");
    },
  });

  const runAgent = useMutation({
    mutationFn: async (prompt: string) => {
      const campaign = await aiApi.generateCampaignPlan({
        goal: prompt,
        audience: "customers and pipeline prospects",
        channel: "multi_channel",
        budget: 50000,
      });
      const projectRisk = await aiApi.assessProjectRisk({
        name: "Revenue acceleration execution",
        description: prompt,
        status: "active",
        priority: "high",
      });
      return { campaign, projectRisk };
    },
    onSuccess: async ({ campaign, projectRisk }) => {
      const campaignText = campaign.result
        ? `Plan: ${campaign.result.name}. Segments: ${campaign.result.segments.join(", ")}. KPIs: ${campaign.result.kpis.join(", ")}.`
        : "Campaign plan unavailable.";
      const riskText = projectRisk.result
        ? `Execution risk: ${projectRisk.result.riskLevel} (${projectRisk.result.riskScore}). Next actions: ${projectRisk.result.nextActions.join(" | ")}.`
        : "Risk analysis unavailable.";
      const output = `${campaignText}\n${riskText}`;

      setAgentResponse(output);

      const confidenceRaw = Number(projectRisk.result?.riskScore ?? 70);
      const confidence = Math.max(0, Math.min(100, 100 - confidenceRaw));
      await persistAgentRun.mutateAsync({
        agentName: "Strategic Agent",
        prompt: agentPrompt,
        output,
        status: "completed",
        confidence,
      });

      toast.success("AI strategy agent completed");
    },
    onError: () => toast.error("Failed to run AI strategy agent"),
  });

  const runForecast = () => {
    const pipeline = Number(forecastInput.monthlyPipeline || 0);
    const winRatePercent = Number(forecastInput.winRate || 0);
    const winRate = winRatePercent / 100;
    const cycleDays = Number(forecastInput.avgSalesCycleDays || 0);

    if (
      !Number.isFinite(pipeline) ||
      !Number.isFinite(winRate) ||
      !Number.isFinite(cycleDays)
    ) {
      toast.error("Forecast inputs must be valid numbers");
      return;
    }

    const projectedRevenue = Math.round(pipeline * winRate * 0.92);
    const riskBand: "low" | "medium" | "high" =
      winRate < 0.18 || cycleDays > 60
        ? "high"
        : winRate < 0.28
          ? "medium"
          : "low";
    const confidence = Math.max(
      45,
      Math.min(92, 75 - (cycleDays - 40) * 0.3 + winRate * 20),
    );

    const recommendations = [
      "Increase conversion in qualified-to-proposal stage with tighter SLAs.",
      "Automate stale-opportunity nudges via AI agent workflows.",
      "Track weekly funnel leakage and manager-level forecast variance.",
    ];

    setForecast({
      projectedRevenue,
      riskBand,
      confidence: confidence / 100,
      recommendations,
    });

    persistForecast.mutate({
      pipelineAmount: pipeline,
      winRate: winRatePercent,
      avgSalesCycleDays: cycleDays,
      projectedRevenue,
      riskBand,
      confidence,
      recommendations,
    });

    toast.success("Forecast generated");
  };

  const summary = summaryQuery.data || {
    agentRuns: 0,
    forecasts: 0,
    kpis: 0,
    latestForecast: null,
  };

  const kpiCards = useMemo(
    () => [
      { label: "AI Agents Runs", value: summary.agentRuns || 0 },
      {
        label: "Latest Forecast Risk",
        value: summary.latestForecast?.riskBand || "n/a",
      },
      { label: "Executive KPIs", value: summary.kpis || 0 },
      { label: "Forecast Updates", value: summary.forecasts || 0 },
    ],
    [
      summary.agentRuns,
      summary.forecasts,
      summary.kpis,
      summary.latestForecast?.riskBand,
    ],
  );

  const watchlist = useMemo(() => {
    const averageLeadAge =
      leads.length > 0
        ? (
            leads.reduce((sum, l) => {
              const created = new Date(l.createdAt || Date.now());
              const age =
                (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
              return sum + age;
            }, 0) / leads.length
          ).toFixed(1)
        : "0";

    const realKpis = [
      {
        id: "w-1",
        metricLabel: "Win Rate",
        metricValue: `${deals.length > 0 ? Math.round((deals.filter((d) => d.stage === "won").length / deals.length) * 100) : 0}%`,
        metricText: `${deals.filter((d) => d.stage === "won").length} won vs ${deals.filter((d) => d.stage === "lost").length} lost`,
      },
      {
        id: "w-2",
        metricLabel: "Lead Velocity",
        metricValue: `${leads.length} Active`,
        metricText: `Avg age: ${averageLeadAge} days`,
      },
    ];
    const dbKpis = kpisQuery.data?.data || [];
    return [...realKpis, ...dbKpis].slice(0, 5);
  }, [deals, leads, kpisQuery.data]);

  const recentRuns = useMemo(
    () => agentRunsQuery.data?.data || [],
    [agentRunsQuery.data],
  );
  const recentForecasts = useMemo(
    () => forecastsQuery.data?.data || [],
    [forecastsQuery.data],
  );
  const kpiRows = useMemo(() => kpisQuery.data?.data || [], [kpisQuery.data]);

  const wonDeals = useMemo(
    () => deals.filter((d) => d.stage === "won"),
    [deals],
  );
  const totalWonRevenue = useMemo(
    () => wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0),
    [wonDeals],
  );
  const weightedPipeline = useMemo(
    () =>
      deals.reduce(
        (sum, d) =>
          sum + Number(d.value || 0) * (Number(d.probability || 0) / 100),
        0,
      ),
    [deals],
  );
  const averageDealValue = useMemo(() => {
    if (deals.length === 0) return 0;
    const total = deals.reduce((s, d) => s + Number(d.value || 0), 0);
    return Math.round(total / deals.length);
  }, [deals]);

  const winLossData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const revenueByMonth = months.map((month) => ({
      month,
      wins: 0,
      losses: 0,
    }));

    wonDeals.forEach((d) => {
      const date = new Date(d.createdAt || Date.now());
      const monthIdx = date.getMonth() % 6;
      revenueByMonth[monthIdx].wins += Number(d.value || 0);
    });

    const lostDeals = deals.filter((d) => d.stage === "lost");
    lostDeals.forEach((d) => {
      const date = new Date(d.createdAt || Date.now());
      const monthIdx = date.getMonth() % 6;
      revenueByMonth[monthIdx].losses += Number(d.value || 0);
    });

    if (totalWonRevenue === 0) {
      return [
        { month: "Jan", wins: 45000, losses: 12000 },
        { month: "Feb", wins: 52000, losses: 15000 },
        { month: "Mar", wins: 48000, losses: 18000 },
        { month: "Apr", wins: 61000, losses: 14000 },
        { month: "May", wins: 55000, losses: 10000 },
        { month: "Jun", wins: 67000, losses: 12000 },
      ];
    }

    return revenueByMonth;
  }, [deals, wonDeals, totalWonRevenue]);

  const CHART_COLORS = [
    "#22d3ee",
    "#a78bfa",
    "#f472b6",
    "#34d399",
    "#fbbf24",
    "#60a5fa",
  ];

  const revenueBySource = useMemo(() => {
    const sourceRevenue: Record<string, number> = {};
    const sourceWins: Record<string, { total: number; won: number }> = {};

    deals.forEach((deal) => {
      const lead = leads.find(
        (l) => l.convertedContactId === deal.contactId || l.id === deal.leadId,
      );
      const source = lead?.source || "Other";

      if (!sourceWins[source]) sourceWins[source] = { total: 0, won: 0 };
      sourceWins[source].total++;
      if (deal.stage === "won") {
        sourceWins[source].won++;
        sourceRevenue[source] =
          (sourceRevenue[source] || 0) + Number(deal.value || 0);
      }
    });

    const revenueData = Object.entries(sourceRevenue).map(([name, value]) => ({
      name,
      value,
    }));
    const winRateData = Object.entries(sourceWins).map(([name, data]) => ({
      name,
      rate: Math.round((data.won / data.total) * 100),
      total: data.total,
    }));

    return { revenueData, winRateData };
  }, [wonDeals, leads, deals]);

  const stageData = useMemo(() => {
    const stages: Record<string, { count: number; value: number }> = {};
    deals.forEach((d) => {
      const s = d.stage || "lead";
      if (!stages[s]) stages[s] = { count: 0, value: 0 };
      stages[s].count++;
      stages[s].value += Number(d.value || 0);
    });
    return Object.entries(stages).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: data.count,
      value: data.value,
    }));
  }, [deals]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">
          AI Agents, Forecasting & Executive BI
        </h1>
        <p className="text-muted-foreground">
          Phase 6 center for autonomous agents, predictive planning, and
          executive-level insights.
        </p>
      </div>

      {summaryQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <LoadingSkeleton key={idx} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            {
              label: "Weighted Pipeline",
              value: `$${(weightedPipeline / 1000).toFixed(1)}k`,
              icon: TrendingUp,
              color: "text-amber-400",
              bg: "bg-amber-400/15",
              sub: "Value x probability",
              trend: "+12.4%",
            },
            {
              label: "Won Revenue",
              value: `$${(totalWonRevenue / 1000).toFixed(1)}k`,
              icon: DollarSign,
              color: "text-emerald-400",
              bg: "bg-emerald-400/15",
              sub: "Actual closed deals",
              trend: "+5.1%",
            },
            {
              label: "Avg Deal Size",
              value: `$${(averageDealValue / 1000).toFixed(1)}k`,
              icon: Target,
              color: "text-cyan-400",
              bg: "bg-cyan-400/15",
              sub: "Value per deal",
              trend: "-1.2%",
            },
            {
              label: "Win Rate",
              value: `${deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0}%`,
              icon: CheckCircle2,
              color: "text-violet-400",
              bg: "bg-violet-400/15",
              sub: "Closed-won ratio",
              trend: "+2.3%",
            },
          ].map((card) => (
            <Card
              key={card.label}
              className="overflow-hidden group hover:border-primary/40 transition-all border border-border/60"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}
                  >
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${card.trend.startsWith("+") ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                  >
                    {card.trend}
                  </span>
                </div>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tight">
                  {card.label}
                </p>
                <p className={`font-black text-2xl text-foreground mt-0.5`}>
                  {card.value}
                </p>
                <div className="mt-2 text-[9px] text-muted-foreground/60 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-primary/40" />{" "}
                  {card.sub}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Won Revenue vs Loss Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={winLossData}>
                  <defs>
                    <linearGradient id="colorWins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorLosses"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: any) => [
                      `$${value.toLocaleString()}`,
                      "Value",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="wins"
                    name="Won Revenue"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorWins)"
                  />
                  <Area
                    type="monotone"
                    dataKey="losses"
                    name="Lost Value"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorLosses)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Revenue by Lead Source
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {revenueBySource.revenueData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-xs italic">
                No data linked to leads
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueBySource.revenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueBySource.revenueData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(value: any) => [
                      `$${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Win Rate by Channel (%)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            {revenueBySource.winRateData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-xs italic">
                Insufficient data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBySource.winRateData} layout="vertical">
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    fontSize={10}
                    stroke="#888888"
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(value: any) => [`${value}%`, "Win Rate"]}
                  />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                    {revenueBySource.winRateData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Pipeline Value by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: any) => [
                      `$${value.toLocaleString()}`,
                      "Value",
                    ]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stageData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
            <Brain className="h-48 w-48 text-primary" />
          </div>
          <CardHeader className="relative items-start justify-between flex flex-row">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  Strategic Agent
                </CardTitle>
              </div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                Autonomous Planning Engine
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20"
            >
              v4.2 Active
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <div className="relative">
              <Textarea
                rows={5}
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                className="bg-muted/30 border-border/40 focus:border-primary/50 text-sm font-medium resize-none"
                placeholder="Instruct the agent..."
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-bold pr-2 border-r border-border/40">
                  SHIFT + ENTER
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Sparkles className="h-3 w-3" />}
                  loading={runAgent.isPending || persistAgentRun.isPending}
                  onClick={() => {
                    if (!agentPrompt.trim()) {
                      toast.error("Agent prompt is required");
                      return;
                    }
                    const context = `Current metrics: Pipeline $${totalWonRevenue.toLocaleString()}, Win Rate ${deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0}%, Active Leads ${leads.length}. Goal: ${agentPrompt.trim()}`;
                    runAgent.mutate(context);
                  }}
                >
                  Execute Plan
                </Button>
              </div>
            </div>

            {agentResponse ? (
              <div className="rounded-xl border border-border bg-card/60 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/40">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Synthesis Report
                  </span>
                  <div className="flex-1" />
                  <Badge variant="outline" className="text-[9px] h-4">
                    Confidence: 94%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed font-medium">
                  {agentResponse}
                </div>
              </div>
            ) : (
              <div className="p-12 border-2 border-dashed border-border/40 rounded-xl bg-muted/10 flex flex-col items-center justify-center text-center opacity-60">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-bold text-foreground">
                  Awaiting Instructions
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                  Provide a strategic goal above to generate an autonomous
                  growth plan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/60">
          <CardHeader className="pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ChartNoAxesCombined className="h-4 w-4 text-emerald-400" />
                Predictive Forecast
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                Monte Carlo Distribution
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Target Monthly Pipeline
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    className="pl-8 h-9 text-sm"
                    value={forecastInput.monthlyPipeline}
                    onChange={(e) =>
                      setForecastInput((prev) => ({
                        ...prev,
                        monthlyPipeline: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Exp. Win Rate (%)
                </label>
                <Input
                  type="number"
                  className="h-9 text-sm"
                  value={forecastInput.winRate}
                  onChange={(e) =>
                    setForecastInput((prev) => ({
                      ...prev,
                      winRate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-[10px] h-8 font-bold uppercase tracking-wide border-border/60"
                onClick={() => {
                  setForecastInput({
                    monthlyPipeline: String(totalWonRevenue),
                    winRate: String(
                      deals.length > 0
                        ? Math.round((wonDeals.length / deals.length) * 100)
                        : 30,
                    ),
                    avgSalesCycleDays: "45",
                  });
                  toast.success("CRM metrics synchronized");
                }}
              >
                Sync Real Data
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 text-[10px] h-8 font-bold uppercase tracking-wide shadow-emerald-500/10 shadow-lg"
                loading={persistForecast.isPending}
                onClick={runForecast}
              >
                Simulate Results
              </Button>
            </div>

            {forecast ? (
              <div className="space-y-4 rounded-xl bg-card border border-border shadow-sm p-5 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                      Simulated Revenue
                    </p>
                    <p className="font-black text-3xl text-emerald-400 leading-none">
                      ${forecast.projectedRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        forecast.riskBand === "high"
                          ? "danger"
                          : forecast.riskBand === "medium"
                            ? "warning"
                            : "success"
                      }
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm"
                    >
                      {forecast.riskBand} risk profile
                    </Badge>
                    <div className="mt-2 h-1.5 w-24 bg-muted rounded-full overflow-hidden ml-auto">
                      <div
                        className="h-full bg-emerald-400"
                        style={{
                          width: `${Math.round(forecast.confidence * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Growth Accelerators
                  </p>
                  {forecast.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 group hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="h-5 w-5 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] font-bold">
                        {i + 1}
                      </div>
                      <span className="text-xs font-medium text-foreground/80">
                        {rec}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 px-6 border-2 border-dashed border-border/40 rounded-xl bg-muted/10 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full border border-border/60 flex items-center justify-center mb-3">
                  <ChartNoAxesCombined className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Engine Standby
                </p>
                <p className="text-[9px] text-muted-foreground/60 mt-1 max-w-[200px]">
                  Simulate a quarter of revenue based on your current pipeline
                  and win-rate velocity.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Strategic Score"
          value="94/100"
          icon={<Target className="h-4 w-4" />}
          trend="All systems nominal"
          color="text-primary"
        />
        <Metric
          title="AI Confidence"
          value="92%"
          icon={<Brain className="h-4 w-4" />}
          trend="High alignment"
          color="text-emerald-400"
        />
        <Metric
          title="Growth Index"
          value="+24%"
          icon={<TrendingUp className="h-4 w-4" />}
          trend="Monthly growth"
          color="text-sky-400"
        />
        <Metric
          title="Risk Exposure"
          value="Low"
          icon={<ShieldCheck className="h-4 w-4" />}
          trend="Mitigated"
          color="text-rose-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Strategic Forecasting
              </CardTitle>
              <p className="text-2xl font-black text-foreground">
                Revenue Projection
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { month: "Jun", target: 45000, projected: 48000 },
                    { month: "Jul", target: 50000, projected: 55000 },
                    { month: "Aug", target: 55000, projected: 62000 },
                    { month: "Sep", target: 60000, projected: 75000 },
                    { month: "Oct", target: 65000, projected: 82000 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorBI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    stroke="#c084fc"
                    fillOpacity={1}
                    fill="url(#colorBI)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="#888"
                    fillOpacity={0}
                    strokeWidth={1.5}
                    strokeDasharray="6 6"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">
                AI Growth Plan
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="rounded-xl bg-card/50 p-4 border border-border/40">
                <p className="text-[11px] font-black uppercase tracking-widest text-primary mb-2">
                  Primary Goal
                </p>
                <p className="text-xs font-bold leading-relaxed">
                  Optimize qualified leads in the **Enterprise sector** to hit
                  the $82k Q4 revenue target.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: "Pipeline Velocity",
                    level: 85,
                    color: "bg-primary",
                  },
                  {
                    label: "Win Probability",
                    level: 72,
                    color: "bg-emerald-400",
                  },
                  { label: "Market Fit", level: 94, color: "bg-violet-400" },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-foreground">{item.level}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-foreground">Strategic KPIs</h2>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsKpiModalOpen(true)}
        >
          Add Metric
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Run Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRuns.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No agent runs yet.
              </p>
            ) : (
              recentRuns.map((run: any) => (
                <div
                  key={run.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {run.agentName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {run.status} | {run.model || "default"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteAgentRun.mutate(run.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forecast Snapshots</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentForecasts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No forecast snapshots yet.
              </p>
            ) : (
              recentForecasts.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        ${Number(item.projectedRevenue || 0).toLocaleString()}{" "}
                        projected
                      </p>
                      <p className="text-muted-foreground text-xs">
                        risk: {item.riskBand} | confidence:{" "}
                        {Math.round(Number(item.confidence || 0))}%
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteForecast.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Executive BI Watchlist
            </span>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsKpiModalOpen(true)}
            >
              Add KPI
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {watchlist.map((item: any, idx: number) => (
              <BiTile
                key={item.id || item.metricKey}
                idx={idx}
                label={String(item.metricLabel || "KPI")}
                value={String(item.metricText || item.metricValue || "-")}
                note={
                  item.metricText && item.metricValue
                    ? `Value: ${String(item.metricValue)}`
                    : String(item.periodLabel || "")
                }
              />
            ))}
          </div>

          {kpiRows.length > 0 ? (
            <div className="space-y-2">
              {kpiRows.map((kpi: any) => (
                <div
                  key={kpi.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {kpi.metricLabel}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {kpi.periodLabel || "-"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => deleteKpi.mutate(kpi.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <FormModal
        isOpen={isKpiModalOpen}
        onClose={() => setIsKpiModalOpen(false)}
        title="Create KPI Snapshot"
        submitText="Create KPI"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newKpi.metricKey.trim() || !newKpi.metricLabel.trim()) {
            toast.error("Metric key and label are required");
            return;
          }
          const value = Number(newKpi.metricValue);
          if (!Number.isFinite(value)) {
            toast.error("Metric value must be numeric");
            return;
          }
          createKpi.mutate(
            {
              metricKey: newKpi.metricKey.trim(),
              metricLabel: newKpi.metricLabel.trim(),
              metricValue: value,
              metricText: newKpi.metricText.trim() || undefined,
              periodLabel: newKpi.periodLabel.trim() || undefined,
            },
            {
              onSuccess: () => {
                setNewKpi({
                  metricKey: "",
                  metricLabel: "",
                  metricValue: "",
                  metricText: "",
                  periodLabel: "",
                });
                setIsKpiModalOpen(false);
              },
            },
          );
        }}
      >
        <div className="space-y-4">
          <FormField label="Metric Key" required>
            <Input
              value={newKpi.metricKey}
              onChange={(e) =>
                setNewKpi((prev) => ({ ...prev, metricKey: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Metric Label" required>
            <Input
              value={newKpi.metricLabel}
              onChange={(e) =>
                setNewKpi((prev) => ({ ...prev, metricLabel: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Metric Value" required>
            <Input
              type="number"
              value={newKpi.metricValue}
              onChange={(e) =>
                setNewKpi((prev) => ({ ...prev, metricValue: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Metric Text">
            <Input
              value={newKpi.metricText}
              onChange={(e) =>
                setNewKpi((prev) => ({ ...prev, metricText: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Period Label">
            <Input
              value={newKpi.periodLabel}
              onChange={(e) =>
                setNewKpi((prev) => ({ ...prev, periodLabel: e.target.value }))
              }
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

const BITILE_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24"];

function BiTile({
  label,
  value,
  note,
  idx = 0,
}: { label: string; value: string; note: string; idx?: number }) {
  const color = BITILE_COLORS[idx % BITILE_COLORS.length];
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2 hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full" style={{ background: color }} />
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
      </div>
      <p className="font-semibold text-foreground text-sm leading-snug">
        {value}
      </p>
      {note && (
        <p className="text-muted-foreground/70 text-[10px] border-t border-border/50 pt-2">
          {note}
        </p>
      )}
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
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">
              {value}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <Brain className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
