import { createFileRoute, Link } from "@tanstack/react-router";
import {Button, Card,
  CardContent,
} from "@crm/ui";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Copy,
  GitBranch,
  GitCommit,
  User,
  Terminal,
  Box,
  StopCircle,
  RotateCcw,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { devopsApi } from "@/lib/api";

export const Route = createFileRoute("/app/devops/runs/$id")({
  component: RunDetail,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

const runActionsApi = {
  cancel: (runId: string) =>
    fetch(`${API_BASE}/devops/runs/${runId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getOrgHeader() },
    }).then((r) => r.json()),
  retry: (runId: string) =>
    fetch(`${API_BASE}/devops/runs/${runId}/retry`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getOrgHeader() },
    }).then((r) => r.json()),
};

function RunDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: runQuery, isLoading, refetch, isError} = useQuery({
    queryKey: ["devops", "runs", id],
    queryFn: () => devopsApi.runs.get(id),
    placeholderData: (prev) => prev,
    enabled: !!id,
  });

  const cancelRun = useMutation({
    mutationFn: () => runActionsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "runs", id] });
      queryClient.invalidateQueries({ queryKey: ["devops", "runs"] });
      toast.success("Run cancelled");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to cancel run"),
  });

  const retryRun = useMutation({
    mutationFn: () => runActionsApi.retry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "runs"] });
      toast.success("Run re-triggered");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to re-run"),
  });

  const runDetail = (runQuery as any)?.data ?? runQuery ?? {};

  const pipelineName = (runDetail as any)?.pipelineName ?? (runDetail as any)?.pipeline ?? "Pipeline";
  const runNumber = (runDetail as any)?.runNumber ?? (runDetail as any)?.id;
  const status = (runDetail as any)?.status ?? "unknown";
  const branch = (runDetail as any)?.branch ?? (runDetail as any)?.commitSha?.slice(0, 7) ?? "—";
  const commit = (runDetail as any)?.commitSha?.slice(0, 7) ?? (runDetail as any)?.commit ?? "—";
  const author = (runDetail as any)?.triggeredBy ?? (runDetail as any)?.author ?? "—";
  const message = (runDetail as any)?.message ?? "Pipeline run";
  const stages: Array<{ name: string; status: string; duration: string }> =
    (runDetail as any)?.stages ?? [];
  const logs: string = (runDetail as any)?.logs ?? "";
  const artifacts: Array<{ name: string; size: string; type: string }> =
    (runDetail as any)?.artifacts ?? [];

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => (refetch as () => void)()}>Retry</Button>
    </div>
  );
    return (
      <div className="space-y-6">
        <div className="h-12 rounded-lg bg-muted/30 animate-pulse" />
        <div className="h-32 rounded-lg bg-muted/30 animate-pulse" />
        <div className="h-48 rounded-lg bg-muted/30 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/devops/runs" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">{pipelineName} - Run #{runNumber}</h2>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              status === "success" ? "bg-green-500/10 text-green-500" :
              status === "failed" ? "bg-red-500/10 text-red-500" :
              "bg-blue-500/10 text-blue-500"
            }`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Download className="h-4 w-4" />
            Logs
          </button>
          {status === "running" && (
            <button
              onClick={() => cancelRun.mutate()}
              disabled={cancelRun.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              <StopCircle className="h-4 w-4" />
              {cancelRun.isPending ? "Cancelling..." : "Cancel"}
            </button>
          )}
          <button
            onClick={() => retryRun.mutate()}
            disabled={retryRun.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            {retryRun.isPending ? "Re-running..." : "Re-run"}
          </button>
        </div>
      </div>

      {/* Run Info */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="text-lg font-bold">{runDetail.duration ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Branch</p>
              <p className="text-lg font-bold flex items-center gap-1">
                <GitBranch className="h-4 w-4" />
                {branch}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Commit</p>
              <p className="text-lg font-bold font-mono">{commit}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Author</p>
              <p className="text-lg font-bold flex items-center gap-1">
                <User className="h-4 w-4" />
                {author}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stages */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Pipeline Stages</h3>
          <div className="flex items-center gap-4">
            {stages.map((stage, idx) => (
              <div key={stage.name} className="flex items-center">
                <div className="text-center">
                  <div className={`p-3 rounded-lg ${
                    stage.status === "success" ? "bg-green-500/10" :
                    stage.status === "failed" ? "bg-red-500/10" :
                    "bg-blue-500/10"
                  }`}>
                    {stage.status === "success" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : stage.status === "failed" ? (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    ) : (
                      <Clock className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                  <p className="font-medium mt-2">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">{stage.duration}</p>
                </div>
                {idx < stages.length - 1 && (
                  <div className="w-12 h-0.5 bg-border mx-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs */}
        <div className="lg:col-span-2">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Build Logs</h3>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="Copy">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="Download">
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-auto h-[400px]">
                <pre className="text-muted-foreground whitespace-pre-wrap">{logs}</pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Artifacts */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Artifacts</h3>
            <div className="space-y-3">
              {artifacts.map((artifact, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Box className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{artifact.name}</p>
                    <p className="text-xs text-muted-foreground">{artifact.type} - {artifact.size}</p>
                  </div>
                  <button className="p-1 hover:bg-muted rounded">
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
