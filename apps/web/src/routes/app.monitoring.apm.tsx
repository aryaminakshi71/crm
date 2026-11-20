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
  Activity,
  AlertTriangle,
  Clock,
  Cpu,
  Database,
  Plus,
  Zap,
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

export const Route = createFileRoute("/app/monitoring/apm")({
  component: MonitoringApmPage,
});

function MonitoringApmPage() {
  const queryClient = useQueryClient();
  const [isCreateTraceOpen, setIsCreateTraceOpen] = useState(false);
  const [newTrace, setNewTrace] = useState({
    name: "",
    service: "",
    operation: "",
    duration: "",
    tags: "",
  });

  const { data: tracesData, isLoading: isTracesLoading } = useQuery({
    queryKey: ["monitoring", "traces"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/monitoring/traces?limit=50`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) return { items: [] };
      return res.json() as Promise<any>;
    },
  });

  const { data: apmData } = useQuery({
    queryKey: ["monitoring", "apm"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/monitoring/apm`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) return null;
      return res.json() as Promise<any>;
    },
  });

  const createTraceMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/traces`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create trace");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "traces"] });
      setIsCreateTraceOpen(false);
      setNewTrace({ name: "", service: "", operation: "", duration: "", tags: "" });
      toast.success("Trace recorded");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create trace"),
  });

  const traces: any[] = (tracesData as any)?.items ?? [];

  const metrics = apmData ?? {
    avgResponseTime: null,
    errorRate: null,
    throughput: null,
    p99Latency: null,
  };

  const metricCards = [
    {
      label: "Avg Response Time",
      value: (metrics as any).avgResponseTime != null ? `${(metrics as any).avgResponseTime}ms` : "N/A",
      icon: Clock,
      color: "text-blue-400",
    },
    {
      label: "Error Rate",
      value: (metrics as any).errorRate != null ? `${(metrics as any).errorRate}%` : "N/A",
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      label: "Throughput",
      value: (metrics as any).throughput != null ? `${(metrics as any).throughput} rpm` : "N/A",
      icon: Zap,
      color: "text-green-400",
    },
    {
      label: "P99 Latency",
      value: (metrics as any).p99Latency != null ? `${(metrics as any).p99Latency}ms` : "N/A",
      icon: Cpu,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Application Performance Monitoring
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Traces, errors, and performance metrics
          </p>
        </div>
        <Button
          onClick={() => setIsCreateTraceOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Record Trace
        </Button>
      </div>

      {/* APM Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <Card key={m.label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-3">
              <m.icon className={`h-7 w-7 ${m.color}`} />
              <div>
                <div className="text-lg font-bold text-white">{m.value}</div>
                <div className="text-xs text-zinc-400">{m.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Traces */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Recent Traces
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isTracesLoading ? (
            <Loading />
          ) : traces.length === 0 ? (
            <EmptyState
              icon={<Database className="h-6 w-6 text-zinc-400" />}
              title="No traces recorded"
              description="Traces from your services will appear here"
            />
          ) : (
            <div className="space-y-2">
              {traces.map((trace: any) => (
                <div
                  key={trace.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {trace.name ?? trace.operation ?? trace.id}
                      </p>
                      {trace.service && (
                        <Badge variant="outline" className="text-xs">
                          {trace.service}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {trace.createdAt
                        ? new Date(trace.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {trace.duration != null && (
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {trace.duration}ms
                      </span>
                    )}
                    {trace.status && (
                      <Badge
                        variant={trace.status === "error" ? "danger" : "default"}
                        className="text-xs"
                      >
                        {trace.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Trace Modal */}
      {isCreateTraceOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Record Trace</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Name *</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newTrace.name}
                  onChange={(e) => setNewTrace((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. GET /api/users"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Service</label>
                  <input
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    value={newTrace.service}
                    onChange={(e) =>
                      setNewTrace((p) => ({ ...p, service: e.target.value }))
                    }
                    placeholder="api"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">
                    Duration (ms)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    value={newTrace.duration}
                    onChange={(e) =>
                      setNewTrace((p) => ({ ...p, duration: e.target.value }))
                    }
                    placeholder="120"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Operation</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newTrace.operation}
                  onChange={(e) =>
                    setNewTrace((p) => ({ ...p, operation: e.target.value }))
                  }
                  placeholder="db.query"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newTrace.tags}
                  onChange={(e) => setNewTrace((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="production, slow"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1"
                disabled={!newTrace.name || createTraceMutation.isPending}
                onClick={() => createTraceMutation.mutate(newTrace)}
              >
                {createTraceMutation.isPending ? "Recording..." : "Record Trace"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsCreateTraceOpen(false)}
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
