import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@crm/ui";
import {
  GitBranch,
  Plus,
  Search,
  Play,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

export const Route = createFileRoute("/app/devops/pipelines")({
  component: Pipelines,
});

function Pipelines() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["devops", "pipelines", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API_BASE}/devops/pipelines?${params}`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch pipelines");
      return res.json();
    },
  });

  const triggerRunMutation = useMutation({
    mutationFn: async (pipelineId: string) => {
      const res = await fetch(`${API_BASE}/devops/pipelines/${pipelineId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to trigger run");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["devops", "runs"] });
    },
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <button onClick={() => refetch()} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Retry</button>
    </div>
  );

  const pipelines = ((data as any)?.data || []).filter((p: any) =>
    search
      ? p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const statusIcon = (status: string) => {
    if (status === "active" || status === "enabled") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "failed") return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (status === "running") return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    return null;
  };

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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="running">Running</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Pipelines List */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : pipelines.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          {(data as any)?.data?.length === 0 ? "No pipelines yet. Create your first pipeline." : "No matching pipelines."}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pipelines.map((pipeline: any) => (
            <Card
              key={pipeline.id}
              className={`border-border/60 hover:border-primary/30 transition-colors ${
                pipeline.status === "disabled" ? "opacity-60" : ""
              }`}
            >
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
                          pipeline.status === "active" ? "bg-green-500/10 text-green-500" :
                          pipeline.status === "failed" ? "bg-red-500/10 text-red-500" :
                          "bg-muted/10 text-muted-foreground"
                        }`}>
                          {pipeline.status || "unknown"}
                        </span>
                      </div>
                      {pipeline.description && (
                        <p className="text-sm text-muted-foreground">{pipeline.description}</p>
                      )}
                    </div>
                  </div>
                  <button className="p-1 hover:bg-muted rounded">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  {pipeline.repo && (
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {pipeline.repo}
                    </span>
                  )}
                  {pipeline.branch && <span>{pipeline.branch}</span>}
                  {pipeline.environment && (
                    <span className="rounded-full px-2 py-0.5 bg-muted/50">
                      {pipeline.environment}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/30 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold">{pipeline.runCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Runs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {pipeline.lastRunAt
                        ? new Date(pipeline.lastRunAt).toLocaleDateString()
                        : "Never"}
                    </p>
                    <p className="text-xs text-muted-foreground">Last Run</p>
                  </div>
                  <div className="text-center">
                    {statusIcon(pipeline.status)}
                    <p className="text-xs text-muted-foreground mt-1">Status</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => triggerRunMutation.mutate(pipeline.id)}
                    disabled={triggerRunMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    {triggerRunMutation.isPending ? "Starting..." : "Run"}
                  </button>
                  <Link
                    to="/app/devops/pipelines/$id"
                    params={{ id: pipeline.id }}
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
      )}
    </div>
  );
}
