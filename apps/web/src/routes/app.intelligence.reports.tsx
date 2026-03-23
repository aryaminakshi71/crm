import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button,
  Card,
  CardContent,
} from "@crm/ui";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Download,
  MoreVertical,
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  AlertCircle
} from "lucide-react";

export const Route = createFileRoute("/app/intelligence/reports")({
  component: Reports,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

function getOrgHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const MOCK_REPORTS = [
  { id: "1", name: "Monthly Revenue Summary", type: "financial", schedule: "Monthly", lastRun: "Mar 1, 2026", status: "active", views: 245 },
  { id: "2", name: "Customer Acquisition Funnel", type: "marketing", schedule: "Weekly", lastRun: "Mar 15, 2026", status: "active", views: 189 },
  { id: "3", name: "Product Performance", type: "sales", schedule: "Daily", lastRun: "Mar 20, 2026", status: "active", views: 432 },
  { id: "4", name: "Churn Analysis", type: "retention", schedule: "Weekly", lastRun: "Mar 18, 2026", status: "active", views: 156 },
  { id: "5", name: "Sales Pipeline Report", type: "sales", schedule: "Daily", lastRun: "Mar 19, 2026", status: "draft", views: 0 },
  { id: "6", name: "Marketing ROI", type: "marketing", schedule: "Monthly", lastRun: "Feb 28, 2026", status: "active", views: 98 },
  { id: "7", name: "Customer Satisfaction", type: "retention", schedule: "Quarterly", lastRun: "Jan 15, 2026", status: "active", views: 67 },
  { id: "8", name: "Inventory Turnover", type: "operations", schedule: "Weekly", lastRun: "Mar 16, 2026", status: "active", views: 124 },
];

const chartTypes = [
  { type: "bar", icon: BarChart3, label: "Bar Chart" },
  { type: "line", icon: LineChart, label: "Line Chart" },
  { type: "pie", icon: PieChart, label: "Pie Chart" },
];

function Reports() {
  const agentRunsQuery = useQuery({
    queryKey: ["intelligence", "agent-runs"],
    retry: false,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/intelligence/agent-runs?limit=50`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch agent runs");
      return res.json();
    },
  });
  if (agentRunsQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => agentRunsQuery.refetch()}>Retry</Button>
    </div>
  );

  const apiRuns = agentRunsQuery.data?.data;
  const reports: typeof MOCK_REPORTS = apiRuns?.length
    ? apiRuns.map((run: any) => ({
        id: run.id,
        name: run.agentName ?? "Agent Run",
        type: "ai",
        schedule: "On demand",
        lastRun: run.completedAt
          ? new Date(run.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "Pending",
        status: run.status === "completed" ? "active" : run.status === "failed" ? "draft" : "draft",
        views: 0,
      }))
    : MOCK_REPORTS;

  if (agentRunsQuery.isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Report Builder</h2>
          <p className="text-sm text-muted-foreground">
            Create, manage, and schedule custom reports
          </p>
        </div>
        <Link
          to={`/app/intelligence/reports/new` as string}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Report
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reports..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="financial">Financial</option>
          <option value="marketing">Marketing</option>
          <option value="sales">Sales</option>
          <option value="retention">Retention</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Schedules</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Chart Types for New Report */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Quick Create</h3>
          <div className="grid grid-cols-3 gap-4">
            {chartTypes.map((chart) => (
              <button
                key={chart.type}
                className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center gap-2"
              >
                <chart.icon className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">{chart.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">All Reports</h3>
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{report.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      report.status === "active" ? "bg-green-500/10 text-green-500" : "bg-muted/10 text-muted-foreground"
                    }`}>
                      {report.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-muted text-xs capitalize">{report.type}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {report.schedule}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last run: {report.lastRun}
                    </span>
                    <span>{report.views} views</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Download">
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <Link
                    to={`/app/intelligence/reports/$id` as string}
                    params={{ id: String(report.id) }}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
