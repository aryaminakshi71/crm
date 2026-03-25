import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Minus,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { z } from "zod";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/app/intelligence/predictive/_index")({
  validateSearch: searchSchema,
  component: PredictivePage,
});

function TrendIcon({ trend }: { trend?: string }) {
  if (!trend || trend === "stable") return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (trend === "up" || trend === "increasing")
    return <ArrowUp className="h-4 w-4 text-green-400" />;
  return <ArrowDown className="h-4 w-4 text-red-400" />;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Confidence</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PredictivePage() {
  const { q = "" } = useSearch({ from: "/app/intelligence/predictive/_index" });
  const navigate = useNavigate({ from: "/app/intelligence/predictive/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["intelligence", "predictive"],
    queryFn: () =>
      fetch("/api/v1/intelligence/predictive", {
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
      }).then((r) => r.json()),
  });

  const predictive: any = data ?? {};
  const forecasts: any[] = predictive.forecasts ?? predictive.data ?? [];

  // Build display cards — use API forecasts if present, else build from top-level keys
  const cards =
    forecasts.length > 0
      ? forecasts
      : [
          {
            id: "revenue",
            name: "Revenue Forecast",
            icon: TrendingUp,
            current: predictive.currentRevenue ?? predictive.revenue?.current,
            predicted: predictive.forecastRevenue ?? predictive.revenue?.forecast,
            confidence: predictive.revenue?.confidence ?? predictive.revenueConfidence,
            trend: predictive.revenue?.trend,
            unit: "$",
          },
          {
            id: "churn",
            name: "Churn Risk",
            icon: TrendingDown,
            current: predictive.currentChurnRate ?? predictive.churn?.current,
            predicted: predictive.forecastChurnRate ?? predictive.churn?.forecast,
            confidence: predictive.churn?.confidence ?? predictive.churnConfidence,
            trend: predictive.churn?.trend,
            unit: "%",
          },
          {
            id: "lead-score",
            name: "Avg Lead Score",
            icon: TrendingUp,
            current: predictive.currentLeadScore ?? predictive.leadScore?.current,
            predicted: predictive.forecastLeadScore ?? predictive.leadScore?.forecast,
            confidence: predictive.leadScore?.confidence ?? predictive.leadScoreConfidence,
            trend: predictive.leadScore?.trend,
            unit: "",
          },
          {
            id: "demand",
            name: "Demand Forecast",
            icon: TrendingUp,
            current: predictive.currentDemand ?? predictive.demand?.current,
            predicted: predictive.forecastDemand ?? predictive.demand?.forecast,
            confidence: predictive.demand?.confidence ?? predictive.demandConfidence,
            trend: predictive.demand?.trend,
            unit: "",
          },
        ];

  const filteredCards = cards.filter((card: any) =>
    !q || (card.name ?? card.metric ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load predictive data.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Predictive Analytics</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered forecasts and risk predictions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Filter forecasts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Prediction Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-40 rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredCards.map((card: any, idx) => {
            const unit = card.unit ?? "";
            const current = card.current ?? card.currentValue;
            const predicted = card.predicted ?? card.forecastValue ?? card.predictedValue;
            const confidence = card.confidence ?? card.confidenceScore ?? card.confidencePct;
            const trend = card.trend ?? card.direction;
            const name = card.name ?? card.metric ?? `Forecast ${idx + 1}`;

            const hasChange =
              current != null && predicted != null && current !== 0;
            const changePct = hasChange
              ? (((predicted - current) / Math.abs(current)) * 100).toFixed(1)
              : null;
            const isPositive = changePct ? Number(changePct) > 0 : null;

            return (
              <Card key={card.id ?? idx} className="hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{name}</CardTitle>
                  <TrendIcon trend={trend} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Current</p>
                      <p className="text-xl font-bold">
                        {current != null
                          ? `${unit}${Number(current).toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Predicted</p>
                      <p className="text-xl font-bold text-primary">
                        {predicted != null
                          ? `${unit}${Number(predicted).toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {changePct !== null && (
                    <div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          isPositive
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {isPositive ? "+" : ""}{changePct}% change
                      </Badge>
                    </div>
                  )}

                  {confidence != null && (
                    <ConfidenceBar value={Number(confidence)} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Model Accuracy Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Model Accuracy Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={[
              { week: "W1", accuracy: 82, precision: 79 },
              { week: "W2", accuracy: 84, precision: 81 },
              { week: "W3", accuracy: 85, precision: 83 },
              { week: "W4", accuracy: 87, precision: 85 },
              { week: "W5", accuracy: 86, precision: 84 },
              { week: "W6", accuracy: 89, precision: 87 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis domain={[75, 95]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
              <Legend />
              <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2} dot={false} name="Accuracy" />
              <Line type="monotone" dataKey="precision" stroke="#10b981" strokeWidth={2} dot={false} name="Precision" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Additional predictive data */}
      {!isLoading && predictive.insights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(Array.isArray(predictive.insights)
                ? predictive.insights
                : [predictive.insights]
              ).map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <p className="text-muted-foreground">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
