import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@crm/ui";
import {
  Server,
  Plus,
  Search,
  Settings,
  Cpu,
  HardDrive,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/devops/infrastructure")({
  component: Infrastructure,
});

function Infrastructure() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["devops", "infrastructure", typeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API_BASE}/devops/infrastructure?${params}`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch infrastructure");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: { name: string; type: string }) => {
      const res = await fetch(`${API_BASE}/devops/infrastructure`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to create infrastructure");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "infrastructure"] });
    },
  });

  const servers = (data?.data || []).filter((s: any) =>
    search
      ? s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.type?.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const total = data?.total ?? 0;

  const statusColor = (status: string) => {
    if (status === "running" || status === "healthy") return "text-green-500";
    if (status === "warning") return "text-amber-500";
    if (status === "stopped" || status === "critical" || status === "terminated") return "text-red-500";
    return "text-muted-foreground";
  };

  const statusBg = (status: string) => {
    if (status === "running" || status === "healthy") return "bg-green-500/10";
    if (status === "warning") return "bg-amber-500/10";
    if (status === "stopped" || status === "critical" || status === "terminated") return "bg-red-500/10";
    return "bg-muted/10";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Infrastructure</h2>
          <p className="text-sm text-muted-foreground">
            Manage servers, provisioning, and resource allocation
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" />
            Configure
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Provision Server
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs">Total Resources</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{total}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5">
                <Server className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs">Running</p>
                <p className="font-black text-2xl text-foreground mt-0.5">
                  {servers.filter((s: any) => s.status === "running" || s.status === "healthy").length}
                </p>
              </div>
              <div className="rounded-xl bg-green-500/20 p-2.5">
                <Cpu className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs">Warning</p>
                <p className="font-black text-2xl text-foreground mt-0.5">
                  {servers.filter((s: any) => s.status === "warning").length}
                </p>
              </div>
              <div className="rounded-xl bg-amber-500/20 p-2.5">
                <HardDrive className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs">Stopped</p>
                <p className="font-black text-2xl text-foreground mt-0.5">
                  {servers.filter((s: any) => s.status === "stopped" || s.status === "terminated").length}
                </p>
              </div>
              <div className="rounded-xl bg-red-500/20 p-2.5">
                <Server className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="server">Server</option>
          <option value="database">Database</option>
          <option value="cache">Cache</option>
          <option value="load_balancer">Load Balancer</option>
          <option value="storage">Storage</option>
        </select>
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
          <option value="warning">Warning</option>
          <option value="provisioning">Provisioning</option>
        </select>
      </div>

      {/* Infrastructure Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No infrastructure resources found
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {servers.map((server: any) => (
            <Card
              key={server.id}
              className={`border-border/60 hover:border-primary/30 transition-colors ${
                server.status === "warning" ? "border-amber-500/30" :
                server.status === "critical" || server.status === "terminated" ? "border-red-500/30" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${statusBg(server.status)}`}>
                      <Server className={`h-5 w-5 ${statusColor(server.status)}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground">{server.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBg(server.status)} ${statusColor(server.status)}`}>
                          {server.status || "unknown"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {server.type}
                        {server.provider && ` — ${server.provider}`}
                        {server.region && ` — ${server.region}`}
                      </p>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-muted rounded">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {server.config && (
                  <div className="space-y-1 mb-4 text-xs text-muted-foreground">
                    {Object.entries(server.config as Record<string, unknown>)
                      .slice(0, 3)
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="capitalize">{k}</span>
                          <span className="font-medium">{String(v)}</span>
                        </div>
                      ))}
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-border/40">
                  <button className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                    Details
                  </button>
                  <button className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                    Restart
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
