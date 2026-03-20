import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  GitBranch,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Settings,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/app/devops/pipelines")({
  component: Pipelines,
});

const pipelines = [
  { id: 1, name: "frontend-app", description: "React frontend application", repo: "github.com/nucleo/frontend", branch: "main", status: "enabled", lastRun: "5 min ago", successRate: 98, avgDuration: "4m 23s" },
  { id: 2, name: "backend-api", description: "Node.js backend API", repo: "github.com/nucleo/backend", branch: "main", status: "enabled", lastRun: "12 min ago", successRate: 95, avgDuration: "6m 45s" },
  { id: 3, name: "data-pipeline", description: "Data processing pipeline", repo: "github.com/nucleo/data", branch: "main", status: "enabled", lastRun: "1 hour ago", successRate: 88, avgDuration: "15m 30s" },
  { id: 4, name: "mobile-app", description: "React Native mobile app", repo: "github.com/nucleo/mobile", branch: "release/v2.1", status: "enabled", lastRun: "2 hours ago", successRate: 100, avgDuration: "8m 12s" },
  { id: 5, name: "ml-service", description: "Machine learning service", repo: "github.com/nucleo/ml", branch: "main", status: "disabled", lastRun: "3 days ago", successRate: 92, avgDuration: "22m 45s" },
  { id: 6, name: "infrastructure", description: "Terraform infrastructure", repo: "github.com/nucleo/infra", branch: "main", status: "enabled", lastRun: "30 min ago", successRate: 100, avgDuration: "3m 15s" },
];

function Pipelines() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">CI/CD Pipelines</h2>
          <p className="text-sm text-muted-foreground">
            Manage continuous integration and deployment pipelines
          </p>
        </div>
        <Link
          to="/app/devops/pipelines/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Pipeline
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search pipelines..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Repositories</option>
          <option value="frontend">Frontend</option>
          <option value="backend">Backend</option>
        </select>
      </div>

      {/* Pipelines List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pipelines.map((pipeline) => (
          <Card key={pipeline.id} className={`border-border/60 hover:border-primary/30 transition-colors ${
            pipeline.status === "disabled" ? "opacity-60" : ""
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <GitBranch className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{pipeline.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        pipeline.status === "enabled" ? "bg-green-500/10 text-green-500" : "bg-muted/10 text-muted-foreground"
                      }`}>
                        {pipeline.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{pipeline.description}</p>
                  </div>
                </div>
                <button className="p-1 hover:bg-muted rounded">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {pipeline.repo}
                </span>
                <span>{pipeline.branch}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/30 mb-4">
                <div className="text-center">
                  <p className={`text-lg font-bold ${
                    pipeline.successRate >= 95 ? "text-green-600" :
                    pipeline.successRate >= 85 ? "text-amber-600" : "text-red-600"
                  }`}>{pipeline.successRate}%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{pipeline.avgDuration}</p>
                  <p className="text-xs text-muted-foreground">Avg Duration</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{pipeline.lastRun}</p>
                  <p className="text-xs text-muted-foreground">Last Run</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Play className="h-4 w-4" />
                  Run
                </button>
                <Link
                  to="/app/devops/pipelines/$id"
                  params={{ id: String(pipeline.id) }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Configure
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
