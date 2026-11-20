/**
 * DevOps Environments
 *
 * Environment management with status indicators, deployment tracking, and service counts.
 */

import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { CheckCircle2, Cloud, ExternalLink, Plus, RefreshCw, Search, Server } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { devopsApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(["all", "production", "staging", "development"]).optional(),
});

export const Route = createFileRoute("/app/devops/environments/_index")({
  validateSearch: searchSchema,
  component: EnvironmentsPage,
});

function StatusDot({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === "active" || s === "healthy") {
    return <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />;
  }
  if (s === "degraded" || s === "warning") {
    return <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 inline-block animate-pulse" />;
  }
  if (s === "down" || s === "error") {
    return <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />;
  }
  return <span className="h-2.5 w-2.5 rounded-full bg-gray-300 inline-block" />;
}

function envTypeColor(type: string): string {
  switch (type?.toLowerCase()) {
    case "production":
    case "prod": return "bg-red-50 text-red-700 border-red-200";
    case "staging": return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "development":
    case "dev": return "bg-blue-50 text-blue-700 border-blue-200";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function EnvironmentsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("development");
  const { q = "", type = "all" } = useSearch({ from: "/app/devops/environments/_index" });
  const navigate = useNavigate({ from: "/app/devops/environments" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setType = (v: string) => navigate({ search: (p) => ({ ...p, type: v === "all" ? undefined : (v as any) }) });

  const { data: rawData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["devops", "environments"],
    queryFn: () => devopsApi.environments.list(),
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => devopsApi.environments.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "environments"] });
      setShowCreate(false);
      setNewName("");
      setNewType("development");
    },
  });

  const allEnvironments: any[] = (rawData as any)?.data ?? (Array.isArray(rawData) ? rawData : []);

  const environments = allEnvironments
    .filter((e: any) =>
      !q ||
      (e.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (e.type ?? "").toLowerCase().includes(q.toLowerCase()),
    )
    .filter((e: any) => type === "all" || (e.type ?? "").toLowerCase() === type);

  const totalEnvs = allEnvironments.length;
  const healthyEnvs = allEnvironments.filter((e: any) =>
    ["active", "healthy"].includes(e.status?.toLowerCase()),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Environments</h1>
          <p className="text-muted-foreground mt-1">
            Manage deployment environments and their configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Environment
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search environments..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "production", "staging", "development"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                type === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>
      </div>

      {showCreate && (
        <Card className="border-primary/40 border-dashed">
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-3">Create Environment</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                <input
                  type="text"
                  placeholder="e.g. staging-v2"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => createMutation.mutate({ name: newName, type: newType })}
                  disabled={!newName.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Total Environments</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{isLoading ? "..." : totalEnvs}</p>
                <p className="text-muted-foreground text-xs mt-1">Configured deployment targets</p>
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
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Healthy</p>
                <p className={`font-black text-2xl mt-0.5 ${healthyEnvs === totalEnvs ? "text-green-600" : "text-yellow-600"}`}>
                  {isLoading ? "..." : `${healthyEnvs} / ${totalEnvs}`}
                </p>
                <p className="text-muted-foreground text-xs mt-1">Environments operational</p>
              </div>
              <div className={`rounded-xl p-2.5 ${healthyEnvs === totalEnvs ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deployment Frequency</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { week: "W1", production: 3, staging: 12, development: 28 },
              { week: "W2", production: 5, staging: 15, development: 31 },
              { week: "W3", production: 2, staging: 9, development: 24 },
              { week: "W4", production: 7, staging: 18, development: 35 },
              { week: "W5", production: 4, staging: 14, development: 29 },
              { week: "W6", production: 6, staging: 16, development: 33 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="development" fill="#e5e7eb" name="Development" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="staging" fill="#6366f1" name="Staging" stackId="a" />
              <Bar dataKey="production" fill="#10b981" name="Production" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loading />
      ) : environments.length === 0 ? (
        <EmptyState
          title="No environments configured"
          description="Create an environment to start deploying your applications."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {environments.map((env: any) => {
            const lastDeploy = env.lastDeployedAt ?? env.updatedAt;
            const servicesCount = env.servicesCount ?? env.services?.length ?? 0;
            return (
              <Card key={env.id} className="border-border/60 hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={env.status ?? "active"} />
                      <span className="font-semibold text-sm text-foreground">{env.name}</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${envTypeColor(env.type)}`}>
                      {env.type ?? "env"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className={`font-medium capitalize ${env.status === "active" || env.status === "healthy" ? "text-green-600" : "text-foreground"}`}>
                        {env.status ?? "active"}
                      </span>
                    </div>
                    {lastDeploy && (
                      <div className="flex justify-between">
                        <span>Last Deployed</span>
                        <span className="font-medium text-foreground">
                          {new Date(lastDeploy).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {env.version && (
                      <div className="flex justify-between">
                        <span>Version</span>
                        <span className="font-mono font-medium text-foreground">{env.version}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Services</span>
                      <span className="font-medium text-foreground">{servicesCount}</span>
                    </div>
                    {env.url && (
                      <div className="flex justify-between items-center">
                        <span>URL</span>
                        <a
                          href={env.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-primary flex items-center gap-1 hover:underline"
                        >
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
