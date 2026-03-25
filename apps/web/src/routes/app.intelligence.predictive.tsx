import { Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, TrendingDown, TrendingUp,
  AlertCircle
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

export const Route = createFileRoute("/app/intelligence/predictive")({
  component: PredictivePage,
});

function confidenceBadge(confidence: number): string {
  if (confidence >= 0.85) return "default";
  if (confidence >= 0.7) return "secondary";
  return "outline";
}

function PredictivePage() {
  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["intelligence", "predictive"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/predictive`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { forecasts: [] };
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const predictive = data ?? { forecasts: [] };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Predictive Forecasts</h1>
        <p className="text-muted-foreground mt-1">
          AI-generated predictions for key business metrics.
        </p>
      </div>

      {(predictive as any).lastUpdated && (
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date((predictive as any).lastUpdated).toLocaleString()}
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
          {((predictive as any).forecasts ?? []).map((forecast: any) => (
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
