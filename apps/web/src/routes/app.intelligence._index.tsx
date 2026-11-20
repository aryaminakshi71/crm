import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
} from "@crm/ui";
import {
  AlertCircle,
  Brain,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { nucleoApi } from "@/lib/api";

export const Route = createFileRoute("/app/intelligence/_index")({
  component: IntelligenceDashboard,
});


function IntelligenceDashboard() {
  const summaryQuery = useQuery({
    queryKey: ["intelligence", "summary"],
    retry: false,
    queryFn: () => nucleoApi.intelligence.summary(),
    placeholderData: (prev) => prev,
  });

  const summary = summaryQuery.data as any;

  const kpiData = summary
    ? [
        { label: "Agent Runs", value: String(summary.agentRuns ?? 0), change: "", trend: "up" },
        { label: "Forecasts", value: String(summary.forecasts ?? 0), change: "", trend: "up" },
        { label: "KPIs Tracked", value: String(summary.kpis ?? 0), change: "", trend: "up" },
        { label: "Latest Forecast", value: summary.latestForecast ? "Active" : "—", change: "", trend: summary.latestForecast ? "up" : "neutral" },
      ]
    : [
        { label: "Agent Runs", value: "—", change: "", trend: "neutral" },
        { label: "Forecasts", value: "—", change: "", trend: "neutral" },
        { label: "KPIs Tracked", value: "—", change: "", trend: "neutral" },
        { label: "Latest Forecast", value: "—", change: "", trend: "neutral" },
      ];

  if (summaryQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => summaryQuery.refetch()}>Retry</Button>
    </div>
  );

  if (summaryQuery.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-20 bg-muted rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">AI & BI Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Real-time business analytics and AI-powered insights
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <BarChart3 className="h-4 w-4" />
            Export
          </button>
          <Link
            to={`/app/intelligence/reports/new` as string}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            New Report
          </Link>
        </div>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-foreground">AI Insights</p>
              <p className="text-xs text-muted-foreground">
                Based on your data, we recommend focusing on customer retention this quarter
              </p>
            </div>
            <Link to="/app/intelligence/queries" className="text-xs text-primary hover:underline">
              Ask AI
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs">{kpi.label}</p>
              <p className="font-black text-2xl text-foreground mt-1">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {kpi.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs ${
                  kpi.trend === "up" ? "text-green-500" : "text-red-500"
                }`}>{kpi.change}</span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs">{kpi.label}</p>
              <p className="font-black text-2xl text-foreground mt-1">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {kpi.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : kpi.trend === "down" ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : null}
                <span className={`text-xs ${
                  kpi.trend === "up" ? "text-green-500" : kpi.trend === "down" ? "text-red-500" : "text-muted-foreground"
                }`}>{kpi.change || "—"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link
          to="/app/intelligence/queries"
          className="rounded-lg border border-border/60 bg-card p-5 hover:bg-muted/50 transition-colors"
        >
          <Sparkles className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold text-foreground">Ask AI</h3>
          <p className="text-xs text-muted-foreground mt-1">Query your data with natural language</p>
        </Link>
        <Link
          to="/app/intelligence/reports"
          className="rounded-lg border border-border/60 bg-card p-5 hover:bg-muted/50 transition-colors"
        >
          <BarChart3 className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold text-foreground">Custom Reports</h3>
          <p className="text-xs text-muted-foreground mt-1">Build and schedule custom reports</p>
        </Link>
        <Link
          to="/app/intelligence/predictive"
          className="rounded-lg border border-border/60 bg-card p-5 hover:bg-muted/50 transition-colors"
        >
          <TrendingUp className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold text-foreground">Predictive Analytics</h3>
          <p className="text-xs text-muted-foreground mt-1">Forecast future trends with AI</p>
        </Link>
      </div>
    </div>
  );
}
