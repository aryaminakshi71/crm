import {
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
  RefreshCw,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import { z } from "zod";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { intelligenceApi } from "@/lib/api";

const retentionCurveData = [
  { week: "W0", rate: 100 }, { week: "W1", rate: 72 }, { week: "W2", rate: 58 },
  { week: "W3", rate: 48 }, { week: "W4", rate: 41 }, { week: "W5", rate: 36 },
  { week: "W6", rate: 32 }, { week: "W7", rate: 29 }, { week: "W8", rate: 27 },
];

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/app/intelligence/cohort/_index")({
  validateSearch: searchSchema,
  component: CohortPage,
});

function getRetentionColor(val: number | null | undefined): string {
  if (val == null) return "bg-muted/30 text-muted-foreground/40";
  if (val >= 80) return "bg-green-600/80 text-white";
  if (val >= 60) return "bg-green-500/60 text-white";
  if (val >= 40) return "bg-yellow-500/60 text-white";
  if (val >= 20) return "bg-orange-500/60 text-white";
  return "bg-red-500/50 text-white";
}

function CohortPage() {
  const { q = "" } = useSearch({ from: "/app/intelligence/cohort/_index" });
  const navigate = useNavigate({ from: "/app/intelligence/cohort/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["intelligence", "cohort"],
    queryFn: () => intelligenceApi.cohort.get(),
  });

  const cohortData: any = data ?? {};
  const matrix: any[] = cohortData.retentionMatrix ?? cohortData.cohorts ?? cohortData.data ?? [];
  const cohorts: any[] = cohortData.cohorts ?? [];

  // Compute month columns (m0, m1, m2, …) from matrix
  const monthKeys =
    matrix.length > 0
      ? Object.keys(matrix[0]).filter((k) => /^m\d+$/.test(k)).sort()
      : ["m0", "m1", "m2", "m3", "m4"];

  // Avg D30 retention = average of m1 column
  const m1Values = matrix
    .map((row) => row.m1)
    .filter((v) => v != null) as number[];
  const avgD30 =
    m1Values.length > 0
      ? (m1Values.reduce((a, b) => a + b, 0) / m1Values.length).toFixed(1)
      : "—";

  // Best cohort = highest m1 value
  let bestCohortName = "—";
  let bestCohortVal = -1;
  matrix.forEach((row) => {
    if (row.m1 != null && row.m1 > bestCohortVal) {
      bestCohortVal = row.m1;
      bestCohortName = row.cohort ?? "—";
    }
  });

  const filteredMatrix = matrix.filter((row) =>
    !q || (row.cohort ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load cohort data.</p>
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
          <h1 className="text-2xl font-bold">Cohort Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Retention rates by customer acquisition cohort
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
          placeholder="Filter cohorts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Month-1 Retention
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgD30}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Cohort
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestCohortName}</div>
            {bestCohortVal > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {bestCohortVal}% M1 retention
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Retention Curve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Retention Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retentionCurveData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} fontSize={11} stroke="#888" />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  stroke="#888"
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px", fontSize: "11px" }}
                  formatter={(v: number) => [`${v}%`, "Retention"]}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#6366f1" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cohort Retention Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Retention Matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse h-10 rounded bg-muted" />
              ))}
            </div>
          ) : filteredMatrix.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <p className="text-sm">{q ? "No cohorts match your search." : "No cohort data available."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap bg-background sticky left-0 z-10 border-r border-border/50">
                      Cohort
                    </th>
                    {cohorts.length > 0 && (
                      <th className="px-3 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                        Size
                      </th>
                    )}
                    {monthKeys.map((key, i) => (
                      <th
                        key={key}
                        className="px-3 py-3 text-center font-medium text-muted-foreground whitespace-nowrap min-w-[64px]"
                      >
                        Month {i}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMatrix.map((row, rowIdx) => {
                    const cohortInfo = cohorts.find(
                      (c) => c.cohort === row.cohort,
                    );
                    return (
                      <tr
                        key={rowIdx}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-medium whitespace-nowrap bg-background sticky left-0 z-10 border-r border-border/50">
                          {row.cohort ?? `Cohort ${rowIdx + 1}`}
                        </td>
                        {cohorts.length > 0 && (
                          <td className="px-3 py-2.5 text-right text-muted-foreground font-mono text-xs">
                            {cohortInfo?.size ?? "—"}
                          </td>
                        )}
                        {monthKeys.map((key) => {
                          const val = row[key];
                          return (
                            <td
                              key={key}
                              className="px-1 py-1 text-center"
                            >
                              {val != null ? (
                                <div
                                  className={`mx-auto rounded text-xs font-medium py-1.5 px-2 ${getRetentionColor(val)}`}
                                >
                                  {Number(val).toFixed(0)}%
                                </div>
                              ) : (
                                <div className="mx-auto rounded text-xs py-1.5 px-2 text-muted-foreground/30">
                                  —
                                </div>
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
          )}
        </CardContent>
      </Card>

      {/* Color Legend */}
      {!isLoading && matrix.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Retention:</span>
          <div className="flex items-center gap-2">
            {[
              { label: "≥80%", color: "bg-green-600/80" },
              { label: "60–79%", color: "bg-green-500/60" },
              { label: "40–59%", color: "bg-yellow-500/60" },
              { label: "20–39%", color: "bg-orange-500/60" },
              { label: "<20%", color: "bg-red-500/50" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className={`w-4 h-4 rounded ${item.color}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
