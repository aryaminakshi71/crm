import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, AlertTriangle, BellOff, Bookmark, TrendingDown, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { z } from "zod";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

// 30-day anomaly trend data
const ANOMALY_TREND_DATA = [
  { day: "Mar 1", anomalies: 2, critical: 0, high: 1, medium: 1, low: 0 },
  { day: "Mar 3", anomalies: 1, critical: 0, high: 0, medium: 1, low: 0 },
  { day: "Mar 5", anomalies: 4, critical: 1, high: 2, medium: 1, low: 0 },
  { day: "Mar 7", anomalies: 3, critical: 0, high: 1, medium: 1, low: 1 },
  { day: "Mar 9", anomalies: 2, critical: 0, high: 1, medium: 0, low: 1 },
  { day: "Mar 11", anomalies: 5, critical: 2, high: 2, medium: 1, low: 0 },
  { day: "Mar 13", anomalies: 3, critical: 1, high: 1, medium: 0, low: 1 },
  { day: "Mar 15", anomalies: 2, critical: 0, high: 1, medium: 1, low: 0 },
  { day: "Mar 17", anomalies: 6, critical: 1, high: 3, medium: 2, low: 0 },
  { day: "Mar 19", anomalies: 4, critical: 0, high: 2, medium: 1, low: 1 },
  { day: "Mar 21", anomalies: 3, critical: 1, high: 1, medium: 1, low: 0 },
  { day: "Mar 23", anomalies: 4, critical: 1, high: 2, medium: 1, low: 0 },
  { day: "Mar 24", anomalies: 4, critical: 1, high: 1, medium: 1, low: 1 },
];

// Per-metric deviation history (last 14 days)
const METRIC_TREND_DATA = [
  { day: "Mar 11", dau: -5, sessionDur: 3, churnRate: 12, revenuePerCust: -4 },
  { day: "Mar 13", dau: -9, sessionDur: 5, churnRate: 18, revenuePerCust: -7 },
  { day: "Mar 15", dau: -14, sessionDur: 8, churnRate: 22, revenuePerCust: -10 },
  { day: "Mar 17", dau: -21, sessionDur: 7, churnRate: 35, revenuePerCust: -12 },
  { day: "Mar 19", dau: -28, sessionDur: 9, churnRate: 48, revenuePerCust: -14 },
  { day: "Mar 21", dau: -31, sessionDur: 10, churnRate: 58, revenuePerCust: -15 },
  { day: "Mar 23", dau: -33, sessionDur: 11, churnRate: 65, revenuePerCust: -15 },
  { day: "Mar 24", dau: -33, sessionDur: 11, churnRate: 68, revenuePerCust: -16 },
];

const searchSchema = z.object({
  q: z.string().optional(),
  severity: z.enum(["critical", "high", "medium", "low", "all"]).optional().default("all"),
});

export const Route = createFileRoute("/app/intelligence/anomalies")({
  validateSearch: searchSchema,
  component: AnomaliesPage,
});

const severityColor: Record<string, string> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

function AnomaliesPage() {
  const queryClient = useQueryClient();
  const { q, severity } = Route.useSearch();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["intelligence", "anomalies"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/anomalies`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    placeholderData: (prev) => prev,
    refetchInterval: 60000,
  });

  const allAnomalies: any[] = (data as any)?.data ?? [];

  // Client-side filtering from validateSearch params
  const anomalies = allAnomalies
    .filter((a) => !q || a.metric.toLowerCase().includes(q.toLowerCase()))
    .filter((a) => !severity || severity === "all" || a.severity === severity);

  const dismissMutation = useMutation({
    mutationFn: async (anomalyId: string) => {
      const res = await fetch(`${API_BASE}/v1/intelligence/anomalies/${anomalyId}/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to dismiss");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Anomaly dismissed");
      queryClient.invalidateQueries({ queryKey: ["intelligence", "anomalies"] });
    },
    onError: () => toast.error("Failed to dismiss anomaly"),
  });

  const watchlistMutation = useMutation({
    mutationFn: async (anomalyId: string) => {
      const res = await fetch(`${API_BASE}/v1/intelligence/anomalies/${anomalyId}/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to add to watchlist");
      return res.json();
    },
    onSuccess: () => toast.success("Added to watchlist"),
    onError: () => toast.error("Failed to add to watchlist"),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (anomalyId: string) => {
      const res = await fetch(`${API_BASE}/v1/intelligence/anomalies/${anomalyId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to acknowledge");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Anomaly acknowledged");
      queryClient.invalidateQueries({ queryKey: ["intelligence", "anomalies"] });
    },
    onError: () => toast.error("Failed to acknowledge anomaly"),
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const criticalCount = anomalies.filter((a: any) => a.severity === "critical").length;
  const highCount = anomalies.filter((a: any) => a.severity === "high").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Anomaly Detection</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered detection of unusual patterns in your business metrics. Auto-refreshes every 60s.
        </p>
      </div>

      {/* Summary stat pills */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-600 text-sm font-semibold">
          <AlertTriangle className="h-3.5 w-3.5" />
          {criticalCount} Critical
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 text-sm font-semibold">
          <AlertTriangle className="h-3.5 w-3.5" />
          {highCount} High
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-semibold">
          {anomalies.length} Total Active
        </span>
      </div>

      {/* Anomaly trend charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Anomaly Volume — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ANOMALY_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }}
                />
                <ReferenceLine y={4} stroke="#f43f5e" strokeDasharray="4 2" label={{ value: "Alert Threshold", position: "insideTopRight", fontSize: 10, fill: "#f43f5e" }} />
                <Line type="monotone" dataKey="critical" stroke="#f43f5e" strokeWidth={2} dot={false} name="Critical" />
                <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} dot={false} name="High" />
                <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={1.5} dot={false} name="Medium" />
                <Line type="monotone" dataKey="anomalies" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3 }} strokeDasharray="5 2" name="Total" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {[
                { label: "Total", color: "#818cf8" },
                { label: "Critical", color: "#f43f5e" },
                { label: "High", color: "#f97316" },
                { label: "Medium", color: "#eab308" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Metric Deviation Trends — Last 14 Days (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={METRIC_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }}
                  formatter={(v: any) => [`${v}%`]}
                />
                <ReferenceLine y={0} stroke="rgba(128,128,128,0.4)" />
                <Line type="monotone" dataKey="dau" stroke="#f43f5e" strokeWidth={2} dot={false} name="DAU" />
                <Line type="monotone" dataKey="churnRate" stroke="#f97316" strokeWidth={2} dot={false} name="Churn Rate" />
                <Line type="monotone" dataKey="revenuePerCust" stroke="#eab308" strokeWidth={2} dot={false} name="Rev/Customer" />
                <Line type="monotone" dataKey="sessionDur" stroke="#10b981" strokeWidth={1.5} dot={false} name="Session Dur." />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {[
                { label: "DAU", color: "#f43f5e" },
                { label: "Churn Rate", color: "#f97316" },
                { label: "Rev/Customer", color: "#eab308" },
                { label: "Session Dur.", color: "#10b981" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly cards */}
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
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    disabled={acknowledgeMutation.isPending}
                    onClick={() => acknowledgeMutation.mutate(anomaly.id)}
                  >
                    <AlertCircle className="h-3 w-3" />
                    Acknowledge
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    disabled={watchlistMutation.isPending}
                    onClick={() => watchlistMutation.mutate(anomaly.id)}
                  >
                    <Bookmark className="h-3 w-3" />
                    Watchlist
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    disabled={dismissMutation.isPending}
                    onClick={() => dismissMutation.mutate(anomaly.id)}
                  >
                    <BellOff className="h-3 w-3" />
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
