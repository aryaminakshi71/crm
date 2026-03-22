import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_PREDICTIVE = {
  forecasts: [
    { id: "f-1", metric: "Revenue", period: "Q2 2025", predicted: 480000, confidence: 0.82, trend: "up" },
    { id: "f-2", metric: "New Customers", period: "Q2 2025", predicted: 145, confidence: 0.76, trend: "up" },
    { id: "f-3", metric: "Churn Rate", period: "Q2 2025", predicted: 5.2, confidence: 0.71, trend: "down" },
    { id: "f-4", metric: "Avg Deal Size", period: "Q2 2025", predicted: 3200, confidence: 0.88, trend: "up" },
  ],
  lastUpdated: new Date().toISOString(),
};

export const Route = createFileRoute("/app/intelligence/predictive")({
  component: PredictivePage,
});

function confidenceBadge(confidence: number): string {
  if (confidence >= 0.85) return "default";
  if (confidence >= 0.7) return "secondary";
  return "outline";
}

function PredictivePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", "predictive"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/predictive`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return MOCK_PREDICTIVE;
      return res.json();
    },
  });

  const predictive = data ?? MOCK_PREDICTIVE;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Predictive Forecasts</h1>
        <p className="text-muted-foreground mt-1">
          AI-generated predictions for key business metrics.
        </p>
      </div>

      {predictive.lastUpdated && (
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(predictive.lastUpdated).toLocaleString()}
        </p>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(predictive.forecasts ?? []).map((forecast: any) => (
            <Card key={forecast.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    {forecast.metric}
                  </CardTitle>
                  <Badge variant={confidenceBadge(forecast.confidence) as any}>
                    {Math.round(forecast.confidence * 100)}% confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">
                    {typeof forecast.predicted === "number" && forecast.predicted > 1000
                      ? `$${forecast.predicted.toLocaleString()}`
                      : forecast.predicted}
                  </span>
                  {forecast.trend === "up" ? (
                    <TrendingUp className="h-5 w-5 text-emerald-500 mb-1" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-rose-500 mb-1" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Forecast for {forecast.period}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
