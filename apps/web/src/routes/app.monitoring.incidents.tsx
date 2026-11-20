import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
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

export const Route = createFileRoute("/app/monitoring/incidents")({
  component: MonitoringIncidentsPage,
});

function MonitoringIncidentsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newIncident, setNewIncident] = useState({
    title: "",
    severity: "medium",
    description: "",
    affectedServices: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["monitoring", "incidents", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`${API_BASE}/v1/monitoring/incidents?${params}`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) return { items: [] };
      return res.json();
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create incident");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "incidents"] });
      setIsCreateOpen(false);
      setNewIncident({ title: "", severity: "medium", description: "", affectedServices: "" });
      toast.success("Incident created");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create incident"),
  });

  const resolveIncidentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (!res.ok) throw new Error("Failed to resolve incident");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "incidents"] });
      toast.success("Incident resolved");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to resolve incident"),
  });

  const incidents: any[] = (data as any)?.items ?? [];

  const severityColors: Record<string, string> = {
    low: "bg-blue-500/10 text-blue-400",
    medium: "bg-yellow-500/10 text-yellow-400",
    high: "bg-orange-500/10 text-orange-400",
    critical: "bg-red-500/10 text-red-400",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incidents</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track and manage system incidents
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Incident
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "open", "investigating", "resolved"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Incidents List */}
      {isLoading ? (
        <Loading />
      ) : incidents.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-8 w-8 text-green-400" />}
          title="No incidents"
          description="All systems are operational"
        />
      ) : (
        <div className="space-y-3">
          {incidents.map((incident: any) => (
            <Card key={incident.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                      <h3 className="text-sm font-medium text-white truncate">
                        {incident.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${severityColors[incident.severity] ?? "text-zinc-400"}`}
                      >
                        {incident.severity}
                      </span>
                    </div>
                    {incident.description && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {incident.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {incident.createdAt
                          ? new Date(incident.createdAt).toLocaleString()
                          : "Unknown"}
                      </span>
                      {incident.affectedServices && (
                        <span>Services: {incident.affectedServices}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={incident.status === "resolved" ? "default" : "danger"}
                    >
                      {incident.status}
                    </Badge>
                    {incident.status !== "resolved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resolveIncidentMutation.isPending}
                        onClick={() => resolveIncidentMutation.mutate(incident.id)}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Incident Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Create Incident</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Title *</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Incident title"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Severity</label>
                <select
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident((p) => ({ ...p, severity: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Affected Services</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newIncident.affectedServices}
                  onChange={(e) =>
                    setNewIncident((p) => ({ ...p, affectedServices: e.target.value }))
                  }
                  placeholder="e.g. API, Database"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Description</label>
                <textarea
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                  rows={3}
                  value={newIncident.description}
                  onChange={(e) =>
                    setNewIncident((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Describe what happened..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1"
                disabled={!newIncident.title || createIncidentMutation.isPending}
                onClick={() => createIncidentMutation.mutate(newIncident)}
              >
                {createIncidentMutation.isPending ? "Creating..." : "Create Incident"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsCreateOpen(false)}
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
