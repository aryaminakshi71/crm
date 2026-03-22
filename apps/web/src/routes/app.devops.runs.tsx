import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@crm/ui";
import {
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  GitBranch,
  XCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/devops/runs")({
  component: Runs,
});

function Runs() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["devops", "runs", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API_BASE}/devops/runs?${params}`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch runs");
      return res.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (runId: string) => {
      const res = await fetch(`${API_BASE}/devops/runs/${runId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to cancel run");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "runs"] });
    },
  });

  const runs = (data?.data || []).filter((r: any) =>
    search
      ? r.branch?.toLowerCase().includes(search.toLowerCase()) ||
        r.commitSha?.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const statusIcon = (status: string) => {
    if (status === "success") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === "failed") return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (status === "running" || status === "pending") return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
    return <XCircle className="h-5 w-5 text-muted-foreground" />;
  };

  const statusBg = (status: string) => {
    if (status === "success") return "bg-green-500/10";
    if (status === "failed") return "bg-red-500/10";
    if (status === "running" || status === "pending") return "bg-blue-500/10";
    return "bg-muted/10";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <History className="h-5 w-5" />
            Pipeline Runs
          </h2>
          <p className="text-sm text-muted-foreground">
            History of all CI/CD pipeline executions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by branch or commit..."
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
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
          <option value="pending">Pending</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>

      {/* Runs List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            {runs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No pipeline runs found</div>
            ) : (
              <div className="divide-y divide-border/40">
                {runs.map((run: any) => (
                  <div key={run.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className={`p-2 rounded-lg ${statusBg(run.status)}`}>
                      {statusIcon(run.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm">
                          Run #{run.runNumber || run.id.slice(0, 8)}
                        </span>
                        {run.branch && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <GitBranch className="h-3 w-3" />
                            {run.branch}
                          </span>
                        )}
                        {run.commitSha && (
                          <span className="font-mono text-xs text-muted-foreground">
                            {run.commitSha.slice(0, 7)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {run.triggerSource || "manual"} — {run.triggeredBy || "system"}
                      </p>
                    </div>
                    <div className="text-right min-w-[150px]">
                      <p className="text-sm">
                        {new Date(run.createdAt).toLocaleString()}
                      </p>
                      <p className={`text-xs font-medium ${
                        run.status === "success" ? "text-green-600" :
                        run.status === "failed" ? "text-red-600" :
                        "text-muted-foreground"
                      }`}>
                        {run.status}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {(run.status === "running" || run.status === "pending") && (
                        <button
                          onClick={() => cancelMutation.mutate(run.id)}
                          disabled={cancelMutation.isPending}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title="Cancel run"
                        >
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                      <Link
                        to="/app/devops/runs/$id"
                        params={{ id: run.id }}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
