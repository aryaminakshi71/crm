import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  GitBranch,
  Play,
  Pause,
  Settings,
  Trash2,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileCode,
  History,
  GitCommit,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/devops/pipelines/$id")({
  component: PipelineDetail,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

const MOCK_PIPELINE = {
  id: "1",
  name: "frontend-app",
  description: "React frontend application",
  repo: "github.com/nucleo/frontend",
  branch: "main",
  status: "enabled",
  lastRun: "5 min ago",
  successRate: 98,
  avgDuration: "4m 23s",
  runs: [
    { id: 1, status: "success", duration: "4m 23s", branch: "main", commit: "abc1234", time: "5 min ago" },
    { id: 2, status: "success", duration: "4m 10s", branch: "main", commit: "def5678", time: "1 hour ago" },
    { id: 3, status: "failed", duration: "3m 45s", branch: "feature/ui", commit: "ghi9012", time: "2 hours ago" },
    { id: 4, status: "success", duration: "5m 02s", branch: "main", commit: "jkl3456", time: "4 hours ago" },
  ],
};

function PipelineDetail() {
  const { id } = Route.useParams();

  const pipelineQuery = useQuery({
    queryKey: ["devops", "pipelines", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/devops/pipelines/${id}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch pipeline");
      return res.json();
    },
    retry: false,
  });

  const pipeline = pipelineQuery.data ?? MOCK_PIPELINE;

  if (pipelineQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted/40 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-lg bg-muted/40 animate-pulse" />)}
        </div>
        <div className="h-64 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/devops/pipelines" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">{pipeline.name}</h2>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              pipeline.status === "enabled" ? "bg-green-500/10 text-green-500" : "bg-muted/10 text-muted-foreground"
            }`}>
              {pipeline.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{pipeline.description}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Play className="h-4 w-4" />
            Run Pipeline
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <GitBranch className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{pipeline.successRate}%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{pipeline.avgDuration}</p>
            <p className="text-xs text-muted-foreground">Avg Duration</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <GitCommit className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{pipeline.branch}</p>
            <p className="text-xs text-muted-foreground">Default Branch</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <History className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{pipeline.lastRun}</p>
            <p className="text-xs text-muted-foreground">Last Run</p>
          </CardContent>
        </Card>
      </div>

      {/* Repository Info */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Repository</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span>{pipeline.repo}</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">Branch: {pipeline.branch}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Recent Runs</h3>
            <Link to="/app/devops/runs" className="text-xs text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {pipeline.runs.map((run) => (
              <Link
                key={run.id}
                to="/app/devops/runs/$id"
                params={{ id: String(run.id) }}
                className="flex items-center gap-4 p-4 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  run.status === "success" ? "bg-green-500/10" :
                  run.status === "failed" ? "bg-red-500/10" :
                  "bg-blue-500/10"
                }`}>
                  {run.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : run.status === "failed" ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Run #{run.id}</p>
                    <span className="text-xs text-muted-foreground font-mono">{run.commit}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Branch: {run.branch} - {run.time}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    run.status === "success" ? "text-green-600" :
                    run.status === "failed" ? "text-red-600" :
                    "text-blue-600"
                  }`}>
                    {run.duration}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{run.status}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
