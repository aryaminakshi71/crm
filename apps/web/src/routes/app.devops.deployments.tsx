import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@crm/ui";
import {
  Rocket,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { devopsApi } from "@/lib/api";

export const Route = createFileRoute("/app/devops/deployments")({
  component: Deployments,
});

function Deployments() {
  const queryClient = useQueryClient();
  const [environmentFilter, setEnvironmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["devops", "deployments", environmentFilter, statusFilter],
    queryFn: () => devopsApi.deployments.list(),
    placeholderData: (prev) => prev,
  });

  const rollbackMutation = useMutation({
    mutationFn: async (deploymentId: string) => {
      const orgId = localStorage.getItem("activeOrganizationId");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (orgId) headers["x-organization-id"] = orgId;
      const res = await fetch(`/api/v1/devops/deployments/${deploymentId}/rollback`, {
        method: "POST",
        headers,
      });
      if (!res.ok) throw new Error("Rollback failed");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "deployments"] });
    },
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <button onClick={() => refetch()} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Retry</button>
    </div>
  );

  const deployments = ((data as any)?.data || []).filter((d: any) =>
    search
      ? d.version?.toLowerCase().includes(search.toLowerCase()) ||
        d.environment?.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const total = (data as any)?.total ?? 0;
  const successful = deployments.filter((d: any) => d.status === "success" || d.status === "deployed").length;
  const failed = deployments.filter((d: any) => d.status === "failed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Deployments</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage all deployments across environments
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Rocket className="h-4 w-4" />
            New Deployment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Rocket className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Total Deployments</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{successful}</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Avg Duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deployments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          value={environmentFilter}
          onChange={(e) => setEnvironmentFilter(e.target.value)}
        >
          <option value="">All Environments</option>
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="development">Development</option>
          <option value="qa">QA</option>
        </select>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="rolled_back">Rolled Back</option>
        </select>
      </div>

      {/* Deployments List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            {deployments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No deployments found</div>
            ) : (
              <div className="divide-y divide-border/40">
                {deployments.map((deployment: any) => (
                  <div key={deployment.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className={`p-2 rounded-lg ${
                      deployment.status === "success" || deployment.status === "deployed" ? "bg-green-500/10" :
                      deployment.status === "failed" ? "bg-red-500/10" :
                      "bg-blue-500/10"
                    }`}>
                      {deployment.status === "success" || deployment.status === "deployed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : deployment.status === "failed" ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground font-mono text-sm">{deployment.version || "—"}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          deployment.environment === "production" ? "bg-red-500/10 text-red-500" :
                          deployment.environment === "staging" ? "bg-blue-500/10 text-blue-500" :
                          "bg-green-500/10 text-green-500"
                        }`}>
                          {deployment.environment || "—"}
                        </span>
                        {deployment.rolloutStrategy && (
                          <span className="text-xs text-muted-foreground">{deployment.rolloutStrategy}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {deployment.previousVersion && `Prev: ${deployment.previousVersion} — `}
                        {deployment.deployedBy || "System"}
                      </p>
                    </div>
                    <div className="text-right min-w-[150px]">
                      <p className="text-sm">
                        {deployment.deployedAt
                          ? new Date(deployment.deployedAt).toLocaleString()
                          : new Date(deployment.createdAt).toLocaleString()}
                      </p>
                      <p className={`text-xs font-medium ${
                        deployment.status === "success" || deployment.status === "deployed" ? "text-green-600" :
                        deployment.status === "failed" ? "text-red-600" :
                        "text-muted-foreground"
                      }`}>
                        {deployment.status}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {(deployment.status === "success" || deployment.status === "deployed") &&
                        deployment.previousVersion && (
                          <button
                            onClick={() => rollbackMutation.mutate(deployment.id)}
                            disabled={rollbackMutation.isPending}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="Rollback"
                          >
                            <RotateCcw className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                      <Link
                        to="/app/devops/deployments/$id"
                        params={{ id: deployment.id }}
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
