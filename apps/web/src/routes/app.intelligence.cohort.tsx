import { Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { intelligenceApi } from "@/lib/api";

// Heatmap-style bar chart: retention % for each cohort at M1, M2, M3
const COHORT_BAR_DATA = [
  { month: "Month 1", "Jan '25": 78, "Feb '25": 81, "Mar '25": 76, "Apr '25": 83 },
  { month: "Month 2", "Jan '25": 62, "Feb '25": 67, "Mar '25": 61, "Apr '25": null },
  { month: "Month 3", "Jan '25": 54, "Feb '25": 59, "Mar '25": null, "Apr '25": null },
  { month: "Month 4", "Jan '25": 48, "Feb '25": null, "Mar '25": null, "Apr '25": null },
];

const COHORT_COLORS: Record<string, string> = {
  "Jan '25": "#6366f1",
  "Feb '25": "#10b981",
  "Mar '25": "#f59e0b",
  "Apr '25": "#3b82f6",
};

// Avg retention per month across all cohorts (summary bar)
const AVG_RETENTION_BY_MONTH = [
  { month: "M0", avg: 100, fill: "#10b981" },
  { month: "M1", avg: 79.5, fill: "#22c55e" },
  { month: "M2", avg: 63.3, fill: "#eab308" },
  { month: "M3", avg: 56.5, fill: "#f97316" },
  { month: "M4", avg: 48.0, fill: "#f43f5e" },
];

// Cohort size comparison
const COHORT_SIZE_DATA = [
  { cohort: "Jan '25", size: 120, color: "#6366f1" },
  { cohort: "Feb '25", size: 98,  color: "#10b981" },
  { cohort: "Mar '25", size: 145, color: "#f59e0b" },
  { cohort: "Apr '25", size: 112, color: "#3b82f6" },
];

export const Route = createFileRoute("/app/intelligence/cohort")({
  component: CohortPage,
});

function retentionColor(value: number | null) {
  if (value === null) return "bg-muted text-muted-foreground";
  if (value >= 80) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
  if (value >= 60) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
  if (value >= 40) return "bg-orange-500/20 text-orange-700 dark:text-orange-400";
  return "bg-rose-500/20 text-rose-700 dark:text-rose-400";
}

// Custom bar fill by actual value for heatmap effect
function retentionFill(value: number | null): string {
  if (value === null) return "#6b728020";
  if (value >= 80) return "#10b981";
  if (value >= 60) return "#eab308";
  if (value >= 40) return "#f97316";
  return "#f43f5e";
}

function CohortPage() {
  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["intelligence", "cohort"],
    queryFn: () => intelligenceApi.cohort.get(),
    placeholderData: (prev) => prev,
    refetchInterval: 30000,
  });

  const cohort = data ?? { cohorts: [], retentionMatrix: [] };

  const months = ["Month 0", "Month 1", "Month 2", "Month 3", "Month 4"];
  const monthKeys = ["m0", "m1", "m2", "m3", "m4"] as const;

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
        <h1 className="text-2xl font-bold">Cohort Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Track how customer groups retain over time.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full rounded-lg" />
      ) : (
        <>
          {/* Retention Matrix table (existing) */}
          <Card>
            <CardHeader>
              <CardTitle>Retention Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 font-semibold">Cohort</th>
                      <th className="text-left p-2 font-semibold">Size</th>
                      {months.map((m) => (
                        <th key={m} className="text-center p-2 font-semibold">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(cohort as any).retentionMatrix?.map((row: any, i: number) => {
                      const cohortInfo = (cohort as any).cohorts?.[i];
                      return (
                        <tr key={row.cohort} className="border-t">
                          <td className="p-2 font-medium">{row.cohort}</td>
                          <td className="p-2 text-muted-foreground">{cohortInfo?.size ?? "-"}</td>
                          {monthKeys.map((key) => {
                            const val = row[key];
                            return (
                              <td key={key} className="p-2 text-center">
                                {val !== null && val !== undefined ? (
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${retentionColor(val)}`}>
                                    {val}%
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">–</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Heatmap-style grouped bar chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Heatmap — BarChart View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Each group of bars shows retention % for all cohorts at that month. Color intensity encodes retention level.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={COHORT_BAR_DATA} barGap={2} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }}
                    formatter={(v: any, name: string) => [v !== null ? `${v}%` : "N/A", name]}
                  />
                  {Object.keys(COHORT_COLORS).map((cohortKey) => (
                    <Bar key={cohortKey} dataKey={cohortKey} name={cohortKey} radius={[3, 3, 0, 0]}>
                      {COHORT_BAR_DATA.map((entry, idx) => {
                        const val = entry[cohortKey as keyof typeof entry] as number | null;
                        return <Cell key={idx} fill={retentionFill(val)} fillOpacity={val !== null ? 0.85 : 0.15} />;
                      })}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-6 mt-3">
                {[
                  { label: "≥ 80%", color: "#10b981" },
                  { label: "60–79%", color: "#eab308" },
                  { label: "40–59%", color: "#f97316" },
                  { label: "< 40%", color: "#f43f5e" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Row: avg retention + cohort sizes */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Avg Retention by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={AVG_RETENTION_BY_MONTH}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }}
                      formatter={(v: any) => [`${v}%`, "Avg Retained"]}
                    />
                    <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                      {AVG_RETENTION_BY_MONTH.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cohort Size by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={COHORT_SIZE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="cohort" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 11 }}
                      formatter={(v: any) => [v, "New Customers"]}
                    />
                    <Bar dataKey="size" radius={[4, 4, 0, 0]}>
                      {COHORT_SIZE_DATA.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
