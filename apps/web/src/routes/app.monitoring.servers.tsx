import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Clock,
  Cpu,
  HardDrive,
  Plus,
  Server,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const API_BASE =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

function getOrgHeader(): Record<string, string> {
  const isDemo =
    typeof window !== "undefined" &&
    localStorage.getItem("demo_mode") === "true";
  const orgId = isDemo ? "demo-org" : undefined;
  if (!orgId && typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.companyId && !user.isDemo) {
          return { "x-organization-id": user.companyId };
        }
      } catch {}
    }
  }
  return orgId ? { "x-organization-id": orgId } : {};
}

export const Route = createFileRoute("/app/monitoring/servers")({
  component: MonitoringServersPage,
});

function MonitoringServersPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newServer, setNewServer] = useState({
    name: "",
    host: "",
    type: "linux",
    region: "",
    tags: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["monitoring", "servers"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/monitoring/servers`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) return { items: [] };
      return res.json();
    },
  });

  const addServerMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/servers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add server");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "servers"] });
      setIsAddOpen(false);
      setNewServer({ name: "", host: "", type: "linux", region: "", tags: "" });
      toast.success("Server added");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add server"),
  });

  const deleteServerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/servers/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to delete server");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "servers"] });
      toast.success("Server removed");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete server"),
  });

  const servers: any[] = (data as any)?.items ?? [];

  const statusColor = (status: string) =>
    status === "up" ? "bg-green-400" : status === "degraded" ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Servers</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Monitor your infrastructure servers
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Server
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : servers.length === 0 ? (
        <EmptyState
          icon={<Server className="h-8 w-8 text-zinc-400" />}
          title="No servers"
          description="Add your first server to start monitoring"
          action={
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Server
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {servers.map((server: any) => (
            <Card key={server.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${statusColor(server.status)}`} />
                    <h3 className="text-sm font-medium text-white">{server.name}</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-zinc-400 hover:text-red-400 h-7 w-7 p-0"
                    disabled={deleteServerMutation.isPending}
                    onClick={() => deleteServerMutation.mutate(server.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="text-xs text-zinc-400 space-y-1">
                  <div className="flex items-center gap-1">
                    <Server className="h-3 w-3" />
                    {server.host ?? "N/A"}
                  </div>
                  {server.region && (
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {server.region}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-zinc-800 rounded-lg p-2">
                    <Cpu className="h-3 w-3 text-blue-400 mx-auto mb-1" />
                    <div className="text-xs font-medium text-white">
                      {server.cpuUsage != null ? `${server.cpuUsage}%` : "N/A"}
                    </div>
                    <div className="text-xs text-zinc-500">CPU</div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-2">
                    <HardDrive className="h-3 w-3 text-purple-400 mx-auto mb-1" />
                    <div className="text-xs font-medium text-white">
                      {server.memoryUsage != null ? `${server.memoryUsage}%` : "N/A"}
                    </div>
                    <div className="text-xs text-zinc-500">Mem</div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-2">
                    <Clock className="h-3 w-3 text-green-400 mx-auto mb-1" />
                    <div className="text-xs font-medium text-white">
                      {server.uptime ?? "N/A"}
                    </div>
                    <div className="text-xs text-zinc-500">Uptime</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={server.status === "up" ? "default" : "danger"}
                    className="text-xs"
                  >
                    {server.status ?? "unknown"}
                  </Badge>
                  <span className="text-xs text-zinc-500 capitalize">{server.type}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Server Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Add Server</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Server Name *</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newServer.name}
                  onChange={(e) => setNewServer((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. prod-web-01"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Host / IP *</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newServer.host}
                  onChange={(e) => setNewServer((p) => ({ ...p, host: e.target.value }))}
                  placeholder="192.168.1.1 or hostname"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Type</label>
                <select
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newServer.type}
                  onChange={(e) => setNewServer((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="linux">Linux</option>
                  <option value="windows">Windows</option>
                  <option value="container">Container</option>
                  <option value="cloud">Cloud</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Region</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newServer.region}
                  onChange={(e) => setNewServer((p) => ({ ...p, region: e.target.value }))}
                  placeholder="e.g. us-east-1"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Tags</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newServer.tags}
                  onChange={(e) => setNewServer((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="production, web, api"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1"
                disabled={!newServer.name || !newServer.host || addServerMutation.isPending}
                onClick={() => addServerMutation.mutate(newServer)}
              >
                {addServerMutation.isPending ? "Adding..." : "Add Server"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
