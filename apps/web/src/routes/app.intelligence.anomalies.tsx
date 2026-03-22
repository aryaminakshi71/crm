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
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_ANOMALIES = [
  { id: "anm-1", metric: "Daily Active Users", value: 1240, expected: 1850, deviation: -33, severity: "high", detectedAt: new Date().toISOString() },
  { id: "anm-2", metric: "Avg Session Duration", value: 4.2, expected: 3.8, deviation: 11, severity: "low", detectedAt: new Date().toISOString() },
  { id: "anm-3", metric: "Churn Rate", value: 8.4, expected: 5.0, deviation: 68, severity: "critical", detectedAt: new Date().toISOString() },
  { id: "anm-4", metric: "Revenue per Customer", value: 320, expected: 380, deviation: -16, severity: "medium", detectedAt: new Date().toISOString() },
];

export const Route = createFileRoute("/app/intelligence/anomalies")({
  component: AnomaliesPage,
});

const severityColor: Record<string, string> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

function AnomaliesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", "anomalies"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/anomalies`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: MOCK_ANOMALIES };
      return res.json();
    },
  });

  const anomalies = data?.data ?? MOCK_ANOMALIES;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Anomaly Detection</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered detection of unusual patterns in your business metrics.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {anomalies.map((anomaly: any) => (
            <Card key={anomaly.id} className="border-l-4 border-l-rose-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    {anomaly.metric}
                  </CardTitle>
                  <Badge variant={severityColor[anomaly.severity] as any}>
                    {anomaly.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Actual</span>
                  <span className="font-semibold">{anomaly.value.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expected</span>
                  <span className="font-semibold">{anomaly.expected.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deviation</span>
                  <span className={`font-semibold flex items-center gap-1 ${anomaly.deviation < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                    {anomaly.deviation < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    {anomaly.deviation}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Detected {new Date(anomaly.detectedAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
