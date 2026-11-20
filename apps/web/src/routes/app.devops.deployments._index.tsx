/**
 * DevOps Deployments
 *
 * Deployment history with environment details, rollback support, and success rate tracking.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { devopsApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/devops/deployments/_index")({
  validateSearch: searchSchema,
  component: DeploymentsPage,
});

const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

function statusBadgeClass(status: string): string {
  switch (status?.toLowerCase()) {
    case "success":
    case "deployed": return "bg-green-100 text-green-700 border-green-200";
    case "failed": return "bg-red-100 text-red-700 border-red-200";
    case "rollback":
    case "rolled_back": return "bg-orange-100 text-orange-700 border-orange-200";
    case "in_progress":
    case "pending": return "bg-blue-100 text-blue-700 border-blue-200";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function envBadgeClass(env: string): string {
  switch (env?.toLowerCase()) {
    case "production":
    case "prod": return "bg-red-50 text-red-700 border-red-200";
    case "staging": return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "development":
    case "dev": return "bg-blue-50 text-blue-700 border-blue-200";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

const PAGE_SIZE = 25;

function DeploymentsPage() {
  const queryClient = useQueryClient();
  const { q: search = "", status: envFilter = "all", page = 1 } = useSearch({ from: "/app/devops/deployments/_index" });
  const navigate = useNavigate({ from: "/app/devops/deployments/_index" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setEnvFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });

  const { data: rawData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["devops", "deployments", page],
    queryFn: () => devopsApi.deployments.list(),
    refetchInterval: 30000,
  });

  const rollbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/devops/deployments/${id}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to rollback deployment");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Rollback initiated");
      queryClient.invalidateQueries({ queryKey: ["devops", "deployments"] });
    },
    onError: () => toast.error("Failed to initiate rollback"),
  });

  const deployments: any[] = (rawData as any)?.data ?? (Array.isArray(rawData) ? rawData : []);
  const total = (rawData as any)?.total ?? (rawData as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const environments = Array.from(new Set(deployments.map((d: any) => d.environment).filter(Boolean)));

  const filtered = deployments.filter((d: any) => {
    const matchesSearch =
      !search ||
      (d.version ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.environment ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.deployedBy ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesEnv = envFilter === "all" || d.environment?.toLowerCase() === envFilter;
    return matchesSearch && matchesEnv;
  });

  const today = new Date().toDateString();
  const deploymentsToday = deployments.filter(
    (d: any) => d.deployedAt && new Date(d.deployedAt).toDateString() === today,
  ).length;

  const successCount = deployments.filter((d: any) =>
    ["success", "deployed"].includes(d.status?.toLowerCase()),
  ).length;
  const successRate =
    deployments.length > 0 ? Math.round((successCount / deployments.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deployments</h1>
          <p className="text-muted-foreground mt-1">Deployment history across all environments</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Deployments Today</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : deploymentsToday}</p>
                <p className="text-muted-foreground text-xs mt-1">Across all environments</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Cloud className="h-4 w-4" />
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
                <p className="text-muted-foreground text-xs mt-1">Successful deployments</p>
              </div>
              <div className={`rounded-xl p-2.5 ${successRate >= 90 ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by version, environment, or deployer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {environments.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setEnvFilter("all"); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${envFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              All
            </button>
            {environments.map((env: string) => (
              <button
                key={env}
                onClick={() => { setEnvFilter(env.toLowerCase()); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${envFilter === env.toLowerCase() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {env}
              </button>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Deployment History{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({filtered.length} deployments)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState title="No deployments found" description="No deployments match your search." />
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((dep: any) => {
                const canRollback =
                  dep.previousVersion &&
                  ["success", "deployed"].includes(dep.status?.toLowerCase());
                return (
                  <div
                    key={dep.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {dep.status?.toLowerCase() === "failed" ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-medium text-sm text-foreground">
                            {dep.version ?? dep.name ?? "—"}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${envBadgeClass(dep.environment)}`}>
                            {dep.environment}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusBadgeClass(dep.status)}`}>
                            {(dep.status ?? "unknown").replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {dep.deployedBy && (
                            <span>
                              By: <span className="font-medium text-foreground">{dep.deployedBy}</span>
                            </span>
                          )}
                          {dep.previousVersion && (
                            <span>Previous: <span className="font-mono">{dep.previousVersion}</span></span>
                          )}
                          {dep.deployedAt && <span>{new Date(dep.deployedAt).toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>
                    {canRollback && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rollbackMutation.mutate(dep.id)}
                        disabled={rollbackMutation.isPending}
                        className="text-xs h-7 flex items-center gap-1 text-orange-700 border-orange-300 hover:bg-orange-50 shrink-0"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Rollback
                      </Button>
                    )}
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
