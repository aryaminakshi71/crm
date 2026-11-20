import { createFileRoute, Link } from "@tanstack/react-router";
import { Button,
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
  StopCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { devopsApi } from "@/lib/api";

export const Route = createFileRoute("/app/devops/pipelines/$id")({
  component: PipelineDetail,
});

function PipelineDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const pipelineQuery = useQuery({
    queryKey: ["devops", "pipelines", id],
    queryFn: () => devopsApi.pipelines.get(id),
    placeholderData: (prev) => prev,
    retry: false,
  });

  const triggerRun = useMutation({
    mutationFn: () => devopsApi.pipelines.trigger(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "pipelines", id] });
      queryClient.invalidateQueries({ queryKey: ["devops", "runs"] });
      toast.success("Pipeline run triggered");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to trigger run"),
  });

  const cancelRun = useMutation({
    mutationFn: (runId: string) =>
      fetch(
        `${import.meta.env.VITE_API_URL ?? "/api"}/devops/runs/${runId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("activeOrganizationId")
              ? { "x-organization-id": localStorage.getItem("activeOrganizationId")! }
              : {}),
          },
        }
      ).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "pipelines", id] });
      queryClient.invalidateQueries({ queryKey: ["devops", "runs"] });
      toast.success("Run cancelled");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to cancel run"),
  });
  if (pipelineQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => pipelineQuery.refetch()}>Retry</Button>
    </div>
  );

  const pipeline = (pipelineQuery.data as any) ?? {};

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
            <h2 className="text-xl font-bold text-foreground">{(pipeline as any).name}</h2>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              (pipeline as any).status === "enabled" ? "bg-green-500/10 text-green-500" : "bg-muted/10 text-muted-foreground"
            }`}>
              {(pipeline as any).status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{(pipeline as any).description}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={() => triggerRun.mutate()}
            disabled={triggerRun.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <Play className="h-4 w-4" />
            {triggerRun.isPending ? "Triggering..." : "Run Pipeline"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <GitBranch className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{(pipeline as any).successRate}%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{(pipeline as any).avgDuration}</p>
            <p className="text-xs text-muted-foreground">Avg Duration</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <GitCommit className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{(pipeline as any).branch}</p>
            <p className="text-xs text-muted-foreground">Default Branch</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <History className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{(pipeline as any).lastRun}</p>
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
              <span>{(pipeline as any).repo}</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">Branch: {(pipeline as any).branch}</span>
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
            {(pipeline as any).runs.map((run: any) => (
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
                <div className="flex items-center gap-2">
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
                  {run.status === "running" && (
                    <button
                      onClick={(e) => { e.preventDefault(); cancelRun.mutate(String(run.id)); }}
                      disabled={cancelRun.isPending}
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                      title="Cancel run"
                    >
                      <StopCircle className="h-4 w-4 text-red-500" />
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
