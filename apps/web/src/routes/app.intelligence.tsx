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
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { aiApi, nucleoApi } from "../lib/api";

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
    queryFn: () => nucleoApi.intelligence.agentRuns.list({ page: 1, limit: 10 }),
  });

  const forecastsQuery = useQuery({
    queryKey: ["intelligence-forecasts"],
    queryFn: () => nucleoApi.intelligence.forecasts.list({ page: 1, limit: 10 }),
  });

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
        queryClient.invalidateQueries({ queryKey: ["intelligence-agent-runs"] }),
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

    if (!Number.isFinite(pipeline) || !Number.isFinite(winRate) || !Number.isFinite(cycleDays)) {
      toast.error("Forecast inputs must be valid numbers");
      return;
    }

    const projectedRevenue = Math.round(pipeline * winRate * 0.92);
    const riskBand: "low" | "medium" | "high" =
      winRate < 0.18 || cycleDays > 60 ? "high" : winRate < 0.28 ? "medium" : "low";
    const confidence = Math.max(45, Math.min(92, 75 - (cycleDays - 40) * 0.3 + winRate * 20));

    const recommendations = [
      "Increase conversion in qualified-to-proposal stage with tighter SLAs.",
      "Automate stale-opportunity nudges via AI agent workflows.",
      "Track weekly funnel leakage and manager-level forecast variance.",
    ];

    setForecast({ projectedRevenue, riskBand, confidence: confidence / 100, recommendations });

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

  const summary = summaryQuery.data || { agentRuns: 0, forecasts: 0, kpis: 0, latestForecast: null };

  const kpiCards = useMemo(
    () => [
      { label: "AI Agents Runs", value: summary.agentRuns || 0 },
      { label: "Latest Forecast Risk", value: summary.latestForecast?.riskBand || "n/a" },
      { label: "Executive KPIs", value: summary.kpis || 0 },
      { label: "Forecast Updates", value: summary.forecasts || 0 },
    ],
    [summary.agentRuns, summary.forecasts, summary.kpis, summary.latestForecast?.riskBand],
  );

  const watchlist = useMemo(() => {
    const items = kpisQuery.data?.data || [];
    if (items.length > 0) return items.slice(0, 3);
    return [
      {
        id: "fallback-1",
        metricLabel: "Pipeline Health",
        metricText: "Lead-to-win efficiency improved 6.2% WoW",
        metricValue: "Stable",
      },
      {
        id: "fallback-2",
        metricLabel: "Cash Collection Risk",
        metricText: "3 enterprise invoices exceed 45 days",
        metricValue: "Moderate",
      },
      {
        id: "fallback-3",
        metricLabel: "Delivery Risk",
        metricText: "Projects risk trend down 9% over 30 days",
        metricValue: "Low",
      },
    ];
  }, [kpisQuery.data]);
  const recentRuns = useMemo(() => agentRunsQuery.data?.data || [], [agentRunsQuery.data]);
  const recentForecasts = useMemo(() => forecastsQuery.data?.data || [], [forecastsQuery.data]);
  const kpiRows = useMemo(() => kpisQuery.data?.data || [], [kpisQuery.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">AI Agents, Forecasting & Executive BI</h1>
        <p className="text-muted-foreground">
          Phase 6 center for autonomous agents, predictive planning, and executive-level insights.
        </p>
      </div>

      {summaryQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <LoadingSkeleton key={idx} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {kpiCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-sm">{card.label}</p>
                <p className="font-bold text-2xl text-foreground">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Strategic Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Agent Prompt">
              <Textarea rows={5} value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)} />
            </FormField>
            <Button
              variant="primary"
              leftIcon={<Sparkles className="h-4 w-4" />}
              loading={runAgent.isPending || persistAgentRun.isPending}
              onClick={() => {
                if (!agentPrompt.trim()) {
                  toast.error("Agent prompt is required");
                  return;
                }
                runAgent.mutate(agentPrompt.trim());
              }}
            >
              Run Agent
            </Button>
            {agentResponse ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                {agentResponse}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartNoAxesCombined className="h-4 w-4" />
              Revenue Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormField label="Monthly Pipeline ($)">
                <Input type="number" value={forecastInput.monthlyPipeline} onChange={(e) => setForecastInput((prev) => ({ ...prev, monthlyPipeline: e.target.value }))} />
              </FormField>
              <FormField label="Win Rate (%)">
                <Input type="number" value={forecastInput.winRate} onChange={(e) => setForecastInput((prev) => ({ ...prev, winRate: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="Average Sales Cycle (days)">
              <Input type="number" value={forecastInput.avgSalesCycleDays} onChange={(e) => setForecastInput((prev) => ({ ...prev, avgSalesCycleDays: e.target.value }))} />
            </FormField>
            <Button
              variant="outline"
              leftIcon={<Target className="h-4 w-4" />}
              loading={persistForecast.isPending}
              onClick={runForecast}
            >
              Generate Forecast
            </Button>

            {forecast ? (
              <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <p>
                  Projected Monthly Revenue: <span className="font-semibold">${forecast.projectedRevenue.toLocaleString()}</span>
                </p>
                <p>
                  Confidence: <span className="font-semibold">{Math.round(forecast.confidence * 100)}%</span>
                </p>
                <Badge variant={forecast.riskBand === "high" ? "danger" : forecast.riskBand === "medium" ? "warning" : "success"}>
                  {forecast.riskBand} forecast risk
                </Badge>
                <p className="text-muted-foreground">{forecast.recommendations.join(" ")}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Run Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRuns.length === 0 ? (
              <p className="text-muted-foreground text-sm">No agent runs yet.</p>
            ) : (
              recentRuns.map((run: any) => (
                <div key={run.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{run.agentName}</p>
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
              <p className="text-muted-foreground text-sm">No forecast snapshots yet.</p>
            ) : (
              recentForecasts.map((item: any) => (
                <div key={item.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        ${Number(item.projectedRevenue || 0).toLocaleString()} projected
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
            {watchlist.map((item: any) => (
              <BiTile
                key={item.id || item.metricKey}
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
                    <p className="font-medium text-foreground">{kpi.metricLabel}</p>
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

function BiTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-muted-foreground text-xs">{note}</p>
    </div>
  );
}
