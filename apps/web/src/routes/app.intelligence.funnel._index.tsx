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
  ArrowDown,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { z } from "zod";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const FUNNEL_BAR_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e"];

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/app/intelligence/funnel/_index")({
  validateSearch: searchSchema,
  component: FunnelPage,
});

const STAGE_COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-rose-500",
];

const STAGE_SHADOW = [
  "shadow-blue-500/20",
  "shadow-indigo-500/20",
  "shadow-purple-500/20",
  "shadow-violet-500/20",
  "shadow-pink-500/20",
  "shadow-rose-500/20",
];

function FunnelPage() {
  const { q = "" } = useSearch({ from: "/app/intelligence/funnel/_index" });
  const navigate = useNavigate({ from: "/app/intelligence/funnel/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["intelligence", "funnel"],
    queryFn: () =>
      fetch("/api/v1/intelligence/funnel?period=month", {
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
      }).then((r) => r.json()),
  });

  const funnel: any = data ?? {};
  const stages: any[] = funnel.stages ?? funnel.data ?? [];
  const overallConversion: number = funnel.overallConversion ?? 0;

  const filteredStages = stages.filter((s) =>
    !q || (s.name ?? s.stage ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  // Determine the biggest drop-off stage
  let biggestDropStage = "—";
  let biggestDropPct = 0;
  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1].count ?? stages[i - 1].value ?? 0;
    const curr = stages[i].count ?? stages[i].value ?? 0;
    if (prev > 0) {
      const drop = ((prev - curr) / prev) * 100;
      if (drop > biggestDropPct) {
        biggestDropPct = drop;
        biggestDropStage = stages[i].name ?? stages[i].stage ?? `Stage ${i + 1}`;
      }
    }
  }

  // Max count for width calculation
  const maxCount = stages.reduce(
    (m, s) => Math.max(m, s.count ?? s.value ?? 0),
    1,
  );

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load funnel data.</p>
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
          <h1 className="text-2xl font-bold">Conversion Funnel</h1>
          <p className="text-muted-foreground mt-1">
            Track how prospects move through your pipeline
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
          placeholder="Filter stages…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Conversion
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(overallConversion).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Visitor to closed-won rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Biggest Drop-off
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{biggestDropStage}</div>
            {biggestDropPct > 0 && (
              <p className="text-xs text-red-400 mt-1">
                -{biggestDropPct.toFixed(0)}% from previous stage
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recharts Horizontal BarChart */}
      {!isLoading && stages.length > 0 && (() => {
        const funnelChartData = stages.map((s: any) => ({
          stage: s.name ?? s.stage ?? "Stage",
          value: s.count ?? s.value ?? 0,
          rate: s.conversion ?? s.rate ?? 0,
        }));
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funnel Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={funnelChartData}
                    margin={{ top: 4, right: 40, left: 8, bottom: 0 }}
                  >
                    <defs>
                      {funnelChartData.map((_, idx) => (
                        <linearGradient key={idx} id={`funnelGrad${idx}`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={FUNNEL_BAR_COLORS[idx % FUNNEL_BAR_COLORS.length]} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={FUNNEL_BAR_COLORS[idx % FUNNEL_BAR_COLORS.length]} stopOpacity={0.5} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                      formatter={(value: number) => [value.toLocaleString(), "Count"]}
                    />
                    <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                      {funnelChartData.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={`url(#funnelGrad${idx})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funnel Stages</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-14 rounded bg-muted"
                  style={{ width: `${100 - i * 15}%`, margin: "0 auto" }}
                />
              ))}
            </div>
          ) : filteredStages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <p className="text-sm">{q ? "No stages match your search." : "No funnel data available."}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStages.map((stage, idx) => {
                const count = stage.count ?? stage.value ?? 0;
                const widthPct = Math.max(
                  20,
                  Math.round((count / maxCount) * 100),
                );
                const colorClass = STAGE_COLORS[idx % STAGE_COLORS.length];
                const shadowClass = STAGE_SHADOW[idx % STAGE_SHADOW.length];

                // Conversion from previous stage
                let convFromPrev: number | null = null;
                if (idx > 0) {
                  const prevCount = stages[idx - 1].count ?? stages[idx - 1].value ?? 0;
                  if (prevCount > 0) {
                    convFromPrev = (count / prevCount) * 100;
                  }
                }

                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div
                      className={`flex items-center justify-between px-4 py-3 rounded-lg ${colorClass} ${shadowClass} shadow-md text-white transition-all`}
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="font-medium text-sm truncate">
                        {stage.name ?? stage.stage ?? `Stage ${idx + 1}`}
                      </span>
                      <span className="font-bold text-sm ml-4 flex-shrink-0">
                        {count.toLocaleString()}
                      </span>
                    </div>
                    {convFromPrev !== null && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowDown className="h-3 w-3" />
                        {convFromPrev.toFixed(1)}% conversion from previous stage
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stage Detail Table */}
      {!isLoading && filteredStages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stage Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stage</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Count</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Overall Conv.</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Step Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStages.map((stage, idx) => {
                    const count = stage.count ?? stage.value ?? 0;
                    const firstCount = filteredStages[0]?.count ?? filteredStages[0]?.value ?? 1;
                    const overallConv =
                      firstCount > 0 ? (count / firstCount) * 100 : 0;
                    let stepConv: number | null = null;
                    if (idx > 0) {
                      const prevCount =
                        filteredStages[idx - 1].count ?? filteredStages[idx - 1].value ?? 0;
                      if (prevCount > 0) stepConv = (count / prevCount) * 100;
                    }
                    return (
                      <tr
                        key={idx}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              STAGE_COLORS[idx % STAGE_COLORS.length]
                            }`}
                          />
                          {stage.name ?? stage.stage ?? `Stage ${idx + 1}`}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {count.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {overallConv.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-right">
                          {stepConv !== null ? (
                            <span
                              className={
                                stepConv >= 50
                                  ? "text-green-400"
                                  : stepConv >= 20
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }
                            >
                              {stepConv.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
