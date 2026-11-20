/**
 * DevOps Runs
 *
 * Pipeline run history with status filtering, duration, and commit details.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  Activity,
  CheckCircle2,
  Circle,
  Clock,
  GitBranch,
  Play,
  RefreshCw,
  Search,
  StopCircle,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { devopsApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/devops/runs/_index")({
  validateSearch: searchSchema,
  component: DevopsRunsPage,
});

function statusBadgeClass(status: string): string {
  switch (status?.toLowerCase()) {
    case "success": return "bg-green-100 text-green-700 border-green-200";
    case "failed": return "bg-red-100 text-red-700 border-red-200";
    case "running":
    case "in_progress": return "bg-blue-100 text-blue-700 border-blue-200";
    case "cancelled":
    case "canceled": return "bg-gray-100 text-gray-600 border-gray-200";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status?.toLowerCase()) {
    case "success": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
    case "running":
    case "in_progress": return <Play className="h-4 w-4 text-blue-500 animate-pulse" />;
    case "cancelled":
    case "canceled": return <Circle className="h-4 w-4 text-gray-400" />;
    default: return <Circle className="h-4 w-4 text-gray-400" />;
  }
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.floor((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function DevopsRunsPage() {
  const queryClient = useQueryClient();
  const { q = "", status: statusFilter = "all", page = 1 } = useSearch({ from: "/app/devops/runs/_index" });
  const navigate = useNavigate({ from: "/app/devops/runs" });
  const search = q;
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setStatusFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [selectedPipelineId, setSelectedPipelineId] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["devops", "runs"],
    queryFn: () => devopsApi.runs.list(),
    refetchInterval: 10000,
  });

  const { data: pipelinesData } = useQuery({
    queryKey: ["devops", "pipelines"],
    queryFn: () => devopsApi.pipelines.list(),
  });
  const pipelines: any[] = (pipelinesData as any)?.data ?? (Array.isArray(pipelinesData) ? pipelinesData : []);

  const triggerRunMutation = useMutation({
    mutationFn: (pipelineId: string) => devopsApi.pipelines.trigger(pipelineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "runs"] });
      toast.success("Pipeline run triggered");
      setSelectedPipelineId("");
    },
    onError: () => toast.error("Failed to trigger pipeline run"),
  });

  const cancelRunMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/v1/devops/runs/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "runs"] });
      toast.success("Run cancelled");
    },
    onError: () => toast.error("Failed to cancel run"),
  });

  const runs: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  const filtered = runs.filter((r: any) => {
    const matchSearch =
      !search ||
      (r.id ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.branch ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.commitMessage ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.triggeredBy ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || (r.status ?? "").toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const today = new Date().toDateString();
  const runsToday = runs.filter(
    (r: any) => r.createdAt && new Date(r.createdAt).toDateString() === today,
  ).length;

  const successCount = runs.filter((r: any) => r.status?.toLowerCase() === "success").length;
  const successRate = runs.length > 0 ? Math.round((successCount / runs.length) * 100) : 0;

  const completedRuns = runs.filter((r: any) => r.startedAt && r.completedAt);
  const avgDurationMs =
    completedRuns.length > 0
      ? completedRuns.reduce(
          (acc: number, r: any) =>
            acc + (new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()),
          0,
        ) / completedRuns.length
      : 0;
  const avgSec = Math.floor(avgDurationMs / 1000);
  const avgDuration =
    completedRuns.length > 0
      ? avgSec < 60
        ? `${avgSec}s`
        : `${Math.floor(avgSec / 60)}m ${avgSec % 60}s`
      : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Runs</h1>
          <p className="text-muted-foreground mt-1">
            History of all pipeline executions and their outcomes
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pipelines.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                className="text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground"
                value={selectedPipelineId}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
              >
                <option value="">Select pipeline…</option>
                {pipelines.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name ?? p.id}</option>
                ))}
              </select>
              <Button
                size="sm"
                leftIcon={<Play className="h-3.5 w-3.5" />}
                disabled={!selectedPipelineId || triggerRunMutation.isPending}
                onClick={() => selectedPipelineId && triggerRunMutation.mutate(selectedPipelineId)}
              >
                {triggerRunMutation.isPending ? "Triggering..." : "Trigger Run"}
              </Button>
            </div>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Runs Today</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : runsToday}</p>
                <p className="text-muted-foreground text-xs mt-1">Pipeline executions today</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Activity className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Success Rate</p>
                <p className={`font-black text-2xl mt-0.5 ${successRate >= 90 ? "text-green-600" : successRate >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                  {isLoading ? "..." : `${successRate}%`}
                </p>
                <p className="text-muted-foreground text-xs mt-1">Across all runs</p>
              </div>
              <div className={`rounded-xl p-2.5 ${successRate >= 90 ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Avg Duration</p>
                <p className="font-black text-2xl text-foreground mt-0.5">
                  {isLoading ? "..." : avgDuration}
                </p>
                <p className="text-muted-foreground text-xs mt-1">Mean run duration</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by branch, commit, or trigger..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "success", "failed", "running", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Run History{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({filtered.length} runs)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState title="No runs found" description="No pipeline runs match your filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Run</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pipeline</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Triggered By</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Started At</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map((run: any) => (
                    <tr key={run.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        #{run.runNumber ?? (run.id ?? "").slice(0, 8)}
                      </td>
                      <td className="p-3 font-medium">{run.pipelineName ?? run.pipeline ?? "—"}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <GitBranch className="h-3.5 w-3.5" />
                          <span className="font-mono text-xs">{run.branch ?? "main"}</span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {run.triggeredBy ?? run.triggerSource ?? "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon status={run.status} />
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusBadgeClass(run.status)}`}>
                            {run.status ?? "unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {run.startedAt
                          ? new Date(run.startedAt).toLocaleString()
                          : run.createdAt
                            ? new Date(run.createdAt).toLocaleString()
                            : "—"}
                      </td>
                      <td className="p-3 text-right font-mono text-xs tabular-nums">
                        {formatDuration(run.startedAt ?? run.createdAt, run.completedAt)}
                      </td>
                      <td className="p-3 text-right">
                        {(run.status?.toLowerCase() === "running" || run.status?.toLowerCase() === "in_progress") && (
                          <button
                            className="flex items-center gap-1 ml-auto text-xs text-muted-foreground hover:text-destructive transition-colors"
                            disabled={cancelRunMutation.isPending}
                            onClick={() => cancelRunMutation.mutate(run.id)}
                            title="Cancel run"
                          >
                            <StopCircle className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
