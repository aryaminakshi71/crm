import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  GitBranch,
  Play,
} from "lucide-react";

export const Route = createFileRoute("/app/devops/runs")({
  component: Runs,
});

const runs = [
  { id: 1, pipeline: "frontend-app", status: "success", duration: "4m 23s", branch: "main", commit: "abc1234", message: "Update homepage styles", time: "5 min ago", artifacts: 3 },
  { id: 2, pipeline: "backend-api", status: "running", duration: "-", branch: "feature/auth", commit: "def5678", message: "Add OAuth support", time: "Running..." },
  { id: 3, pipeline: "data-pipeline", status: "failed", duration: "2m 15s", branch: "main", commit: "ghi9012", message: "Fix data validation", time: "12 min ago", error: "Test timeout after 120s" },
  { id: 4, pipeline: "mobile-app", status: "success", duration: "6m 45s", branch: "release/v2.1", commit: "jkl3456", message: "Bump version to 2.1.0", time: "1 hour ago", artifacts: 5 },
  { id: 5, pipeline: "frontend-app", status: "success", duration: "4m 10s", branch: "main", commit: "mno7890", message: "Fix responsive layout", time: "2 hours ago", artifacts: 3 },
  { id: 6, pipeline: "infrastructure", status: "success", duration: "3m 15s", branch: "main", commit: "pqr2345", message: "Update Terraform version", time: "3 hours ago", artifacts: 2 },
  { id: 7, pipeline: "backend-api", status: "cancelled", duration: "1m 30s", branch: "feature/db", commit: "stu6789", message: "Database migration", time: "5 hours ago" },
  { id: 8, pipeline: "ml-service", status: "success", duration: "18m 22s", branch: "main", commit: "vwx3456", message: "Update ML model weights", time: "6 hours ago", artifacts: 4 },
];

function Runs() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Pipeline Run History</h2>
          <p className="text-sm text-muted-foreground">
            View all pipeline execution history and logs
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search runs..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Pipelines</option>
          <option value="frontend">Frontend App</option>
          <option value="backend">Backend API</option>
          <option value="data">Data Pipeline</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Runs List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {runs.map((run) => (
              <Link
                key={run.id}
                to="/app/devops/runs/$id"
                params={{ id: String(run.id) }}
                className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  run.status === "success" ? "bg-green-500/10" :
                  run.status === "failed" ? "bg-red-500/10" :
                  run.status === "running" ? "bg-blue-500/10" :
                  "bg-muted/10"
                }`}>
                  {run.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : run.status === "failed" ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : run.status === "running" ? (
                    <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{run.pipeline}</p>
                    <span className="text-xs text-muted-foreground font-mono">{run.commit?.slice(0, 7)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      run.status === "success" ? "bg-green-500/10 text-green-500" :
                      run.status === "failed" ? "bg-red-500/10 text-red-500" :
                      run.status === "running" ? "bg-blue-500/10 text-blue-500" :
                      "bg-muted/10 text-muted-foreground"
                    }`}>
                      {run.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{run.message}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <GitBranch className="h-3 w-3" />
                    <span>{run.branch}</span>
                  </div>
                  {run.artifacts && (
                    <span className="text-muted-foreground">{run.artifacts} artifacts</span>
                  )}
                  <span className="text-muted-foreground">{run.time}</span>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="font-medium">{run.duration}</p>
                  <p className="text-xs text-muted-foreground">duration</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
