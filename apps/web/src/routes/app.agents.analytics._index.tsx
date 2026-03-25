import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import { z } from "zod";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/app/agents/analytics/_index")({
  validateSearch: searchSchema,
  component: AgentAnalyticsPage,
});

function AgentAnalyticsPage() {
  const { q = "" } = useSearch({ from: "/app/agents/analytics/_index" });
  const navigate = useNavigate({ from: "/app/agents/analytics/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["agents", "analytics"],
    queryFn: () =>
      fetch("/api/v1/agents/analytics", {
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
      }).then((r) => r.json()),
  });

  const analytics: any = data ?? {};
  const agents: any[] = analytics.agents ?? analytics.data ?? [];

  const filteredAgents = agents.filter((a) =>
    !q || (a.name ?? a.id ?? "").toLowerCase().includes(q.toLowerCase()),
  );
  const kpis = analytics.kpis ?? {};

  // Build daily runs chart data
  const dailyRuns: any[] = analytics.dailyRuns ?? analytics.trends ?? [];
  const chartData =
    dailyRuns.length > 0
      ? dailyRuns
      : Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            date: d.toLocaleDateString("en-US", { weekday: "short" }),
            runs: 0,
          };
        });

  const totalRuns =
    kpis.totalRuns ??
    analytics.totalRuns ??
    agents.reduce((s: number, a: any) => s + (a.runs ?? 0), 0);
  const successRate =
    kpis.successRate ?? analytics.successRate ?? 0;
  const avgLatency =
    kpis.avgResponseTime ?? kpis.avgLatency ?? analytics.avgLatency ?? 0;
  const costThisMonth =
    kpis.costThisMonth ?? analytics.cost ?? 0;

  const kpiCards = [
    {
      label: "Total Runs",
      value: totalRuns.toLocaleString(),
      icon: Zap,
      color: "text-blue-400",
    },
    {
      label: "Success Rate",
      value: `${Number(successRate).toFixed(1)}%`,
      icon: CheckCircle2,
      color: "text-green-400",
    },
    {
      label: "Avg Response Time",
      value: avgLatency ? `${Number(avgLatency).toFixed(0)}ms` : "—",
      icon: Clock,
      color: "text-purple-400",
    },
    {
      label: "Cost This Month",
      value: `$${Number(costThisMonth).toFixed(2)}`,
      icon: DollarSign,
      color: "text-orange-400",
    },
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load analytics.</p>
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
          <h1 className="text-2xl font-bold">Agent Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Performance metrics across all AI agents
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
          placeholder="Search agents…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-24 rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Daily Runs Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Runs (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-48 animate-pulse bg-muted rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="runs"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse h-10 rounded bg-muted" />
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground p-4">
              <p className="text-sm">{q ? "No agents match your search." : "No agent performance data available yet."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Agent</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Runs</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Success %</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Avg Latency</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent: any) => {
                    const successPct = agent.successRate ?? agent.successPct ?? 0;
                    const latency = agent.avgLatency ?? agent.avgResponseTime ?? 0;
                    const cost = agent.cost ?? 0;
                    return (
                      <tr
                        key={agent.id ?? agent.name}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {agent.name ?? agent.id ?? "Unknown Agent"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(agent.runs ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={
                              successPct >= 90
                                ? "text-green-400"
                                : successPct >= 70
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }
                          >
                            {Number(successPct).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {latency ? `${Number(latency).toFixed(0)}ms` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          ${Number(cost).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
