/**
 * DevOps Pipelines
 *
 * CI/CD pipeline management with run status, trigger controls, and success rate stats.
 */

import { Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Activity, CheckCircle, GitBranch, Play, RefreshCw, Search } from "lucide-react";
import { z } from "zod";
import { devopsApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/devops/pipelines/_index")({
  validateSearch: searchSchema,
  component: PipelinesPage,
});

function statusBadgeClass(status: string): string {
  switch (status?.toLowerCase()) {
    case "success":
    case "passed": return "bg-green-100 text-green-700 border-green-200";
    case "failed":
    case "error": return "bg-red-100 text-red-700 border-red-200";
    case "running":
    case "in_progress": return "bg-blue-100 text-blue-700 border-blue-200";
    case "pending":
    case "queued": return "bg-gray-100 text-gray-600 border-gray-200";
    case "canceled":
    case "cancelled": return "bg-muted text-muted-foreground border-border";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function statusDot(status: string) {
  switch (status?.toLowerCase()) {
    case "success":
    case "passed":
      return <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />;
    case "failed":
    case "error":
      return <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />;
    case "running":
    case "in_progress":
      return <span className="h-2 w-2 rounded-full bg-blue-500 inline-block animate-pulse" />;
    default:
      return <span className="h-2 w-2 rounded-full bg-gray-400 inline-block" />;
  }
}

const PAGE_SIZE = 25;

function PipelinesPage() {
  const queryClient = useQueryClient();
  const { q: search = "", status: statusFilter = "all", page = 1 } = useSearch({ from: "/app/devops/pipelines/_index" });
  const navigate = useNavigate({ from: "/app/devops/pipelines" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setStatusFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });

  const { data: rawData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["devops", "pipelines", page],
    queryFn: () => devopsApi.pipelines.list(),
    refetchInterval: 30000,
  });

  const triggerMutation = useMutation({
    mutationFn: (id: string) => devopsApi.pipelines.trigger(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["devops", "runs"] });
    },
  });

  const pipelines: any[] = (rawData as any)?.data ?? (Array.isArray(rawData) ? rawData : []);
  const total = (rawData as any)?.total ?? (rawData as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = pipelines.filter((p: any) => {
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.repo?.toLowerCase().includes(search.toLowerCase()) ||
      p.branch?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const successCount = pipelines.filter((p: any) => ["success", "passed"].includes(p.status?.toLowerCase())).length;
  const successRate = pipelines.length > 0 ? Math.round((successCount / pipelines.length) * 100) : 0;
  const runningCount = pipelines.filter((p: any) => ["running", "in_progress"].includes(p.status?.toLowerCase())).length;
  const today = new Date().toDateString();
  const runsToday = pipelines.filter((p: any) => p.lastRunAt && new Date(p.lastRunAt).toDateString() === today).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">CI/CD Pipelines</h2>
          <p className="text-sm text-muted-foreground">
            Manage and trigger your build and deployment pipelines
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Success Rate</p>
                <p className={`font-black text-2xl mt-0.5 ${successRate >= 90 ? "text-green-600" : successRate >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                  {isLoading ? "..." : `${successRate}%`}
                </p>
                <p className="text-muted-foreground text-xs mt-1">Overall pipeline success</p>
              </div>
              <div className="rounded-xl bg-green-50 p-2.5 text-green-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Running Now</p>
                <p className={`font-black text-2xl mt-0.5 ${runningCount > 0 ? "text-blue-600" : "text-foreground"}`}>
                  {isLoading ? "..." : runningCount}
                </p>
                <p className="text-muted-foreground text-xs mt-1">Pipelines in progress</p>
              </div>
              <div className={`rounded-xl p-2.5 ${runningCount > 0 ? "bg-blue-50 text-blue-600" : "bg-muted/30 text-muted-foreground"}`}>
                <Activity className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Runs Today</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : runsToday}</p>
                <p className="text-muted-foreground text-xs mt-1">Total pipeline executions</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Play className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search pipelines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "success", "failed", "running", "pending"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); }}
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

      {/* Pipeline List */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Pipelines
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({filtered.length} total)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <GitBranch className="h-8 w-8 opacity-30" />
              <p className="text-sm">No pipelines found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((pipeline: any) => {
                const lastRun = pipeline.lastRunAt ? new Date(pipeline.lastRunAt) : null;
                const trigger = pipeline.config?.triggers?.push
                  ? "push"
                  : pipeline.config?.triggers?.schedule
                  ? "schedule"
                  : "manual";
                const isRunning = ["running", "in_progress"].includes(pipeline.status?.toLowerCase());

                return (
                  <div
                    key={pipeline.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-1 shrink-0">{statusDot(pipeline.status)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-foreground">{pipeline.name}</span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusBadgeClass(pipeline.status)} ${isRunning ? "animate-pulse" : ""}`}
                          >
                            {pipeline.status ?? "unknown"}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground capitalize">
                            {trigger}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {pipeline.repo && (
                            <span className="font-mono truncate max-w-48">{pipeline.repo}</span>
                          )}
                          {pipeline.branch && (
                            <span className="flex items-center gap-1">
                              <GitBranch className="h-3 w-3" />
                              {pipeline.branch}
                            </span>
                          )}
                          {lastRun && <span>Last run: {lastRun.toLocaleString()}</span>}
                          {pipeline.runCount !== undefined && (
                            <span>Runs: {pipeline.runCount}</span>
                          )}
                        </div>
                        {pipeline.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{pipeline.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerMutation.mutate(pipeline.id)}
                        disabled={triggerMutation.isPending || isRunning}
                        className="text-xs h-7 flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Run
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
