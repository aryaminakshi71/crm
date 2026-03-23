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
  DollarSign,
  Users,
  Target,
  AlertTriangle,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/intelligence/_index")({
  component: IntelligenceDashboard,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const MOCK_KPI_DATA = [
  { label: "Total Revenue", value: "$1.24M", change: "+12.5%", trend: "up" },
  { label: "Customers", value: "8,432", change: "+5.2%", trend: "up" },
  { label: "Avg Order Value", value: "$147", change: "-2.1%", trend: "down" },
  { label: "Conversion Rate", value: "3.8%", change: "+0.4%", trend: "up" },
];

const revenueData = [
  { month: "Jan", revenue: 85000, target: 80000 },
  { month: "Feb", revenue: 92000, target: 85000 },
  { month: "Mar", revenue: 88000, target: 90000 },
  { month: "Apr", revenue: 105000, target: 95000 },
  { month: "May", revenue: 112000, target: 100000 },
  { month: "Jun", revenue: 118000, target: 105000 },
];

const customerData = [
  { month: "Jan", new: 420, returning: 1200 },
  { month: "Feb", new: 480, returning: 1350 },
  { month: "Mar", new: 510, returning: 1420 },
  { month: "Apr", new: 580, returning: 1580 },
  { month: "May", new: 620, returning: 1720 },
  { month: "Jun", new: 710, returning: 1890 },
];

const topMetrics = [
  { label: "Customer Acquisition", value: "2,320", change: "+18%", icon: Users, color: "text-blue-500" },
  { label: "Monthly Recurring Revenue", value: "$124K", change: "+12%", icon: DollarSign, color: "text-green-500" },
  { label: "Churn Rate", value: "2.1%", change: "-0.3%", icon: AlertTriangle, color: "text-amber-500" },
  { label: "NPS Score", value: "72", change: "+4", icon: Target, color: "text-purple-500" },
];

const quickInsights = [
  { type: "success", message: "Revenue up 12% vs last month - on track to exceed Q2 target" },
  { type: "warning", message: "Churn rate increased 0.3% - consider retention campaign" },
  { type: "info", message: "New customer acquisition cost down 8% due to SEO improvements" },
];

function IntelligenceDashboard() {
  const summaryQuery = useQuery({
    queryKey: ["intelligence", "summary"],
    retry: false,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/intelligence/summary`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch intelligence summary");
      return res.json();
    },
  });

  const summary = summaryQuery.data;

  const kpiData = summary
    ? [
        { label: "Total Revenue", value: "$1.24M", change: "+12.5%", trend: "up" },
        { label: "Customers", value: "8,432", change: "+5.2%", trend: "up" },
        { label: "Agent Runs", value: String(summary.agentRuns ?? 0), change: "", trend: "up" },
        { label: "Forecasts", value: String(summary.forecasts ?? 0), change: "", trend: "up" },
      ]
    : MOCK_KPI_DATA;

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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Revenue vs Target</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#888" />
                <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                <Tooltip />
                <Area type="monotone" dataKey="target" stroke="#ccc" fill="#f0f0f0" name="Target" />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f620" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Acquisition */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Customer Acquisition</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={customerData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#888" />
                <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                <Tooltip />
                <Bar dataKey="new" fill="#3b82f6" name="New Customers" />
                <Bar dataKey="returning" fill="#10b981" name="Returning" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topMetrics.map((metric) => (
          <Card key={metric.label} className="border-border/60 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
                <span className={`text-xs ${
                  metric.change.startsWith("+") ? "text-green-500" :
                  metric.change.startsWith("-") && metric.label !== "Churn Rate" ? "text-red-500" :
                  "text-green-500"
                }`}>{metric.change}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
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
