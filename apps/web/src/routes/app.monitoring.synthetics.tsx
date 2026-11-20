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
  CheckCircle2,
  Clock,
  Globe,
  Plus,
  Trash2,
  XCircle,
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

export const Route = createFileRoute("/app/monitoring/synthetics")({
  component: MonitoringSyntheticsPage,
});

function MonitoringSyntheticsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: "",
    url: "",
    type: "http",
    interval: "60",
    locations: "",
    expectedStatus: "200",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["monitoring", "synthetics"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/monitoring/synthetics`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) return { items: [] };
      return res.json() as Promise<any>;
    },
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/synthetics`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create synthetic test");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "synthetics"] });
      setIsCreateOpen(false);
      setNewTest({
        name: "",
        url: "",
        type: "http",
        interval: "60",
        locations: "",
        expectedStatus: "200",
      });
      toast.success("Synthetic test created");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create synthetic test"),
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/synthetics/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to delete synthetic test");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring", "synthetics"] });
      toast.success("Test deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete test"),
  });

  const tests: any[] = (data as any)?.items ?? [];

  const statusIcon = (status: string) => {
    if (status === "passing") return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    if (status === "failing") return <XCircle className="h-4 w-4 text-red-400" />;
    return <Activity className="h-4 w-4 text-zinc-400" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Synthetic Monitoring</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Automated tests to proactively detect issues
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Test
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : tests.length === 0 ? (
        <EmptyState
          icon={<Globe className="h-8 w-8 text-zinc-400" />}
          title="No synthetic tests"
          description="Create a test to monitor your endpoints continuously"
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create Test
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {tests.map((test: any) => (
            <Card key={test.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {statusIcon(test.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {test.name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {test.url}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Every {test.interval ?? 60}s
                        </span>
                        {test.responseTime != null && (
                          <span>{test.responseTime}ms</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        test.status === "passing"
                          ? "default"
                          : test.status === "failing"
                            ? "danger"
                            : "outline"
                      }
                    >
                      {test.status ?? "unknown"}
                    </Badge>
                    <span className="text-xs text-zinc-500 uppercase">{test.type}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-zinc-400 hover:text-red-400 h-7 w-7 p-0"
                      disabled={deleteTestMutation.isPending}
                      onClick={() => deleteTestMutation.mutate(test.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Test Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Create Synthetic Test</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Name *</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newTest.name}
                  onChange={(e) => setNewTest((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Homepage check"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">URL *</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newTest.url}
                  onChange={(e) => setNewTest((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Type</label>
                  <select
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    value={newTest.type}
                    onChange={(e) => setNewTest((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="http">HTTP</option>
                    <option value="browser">Browser</option>
                    <option value="tcp">TCP</option>
                    <option value="dns">DNS</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">
                    Interval (seconds)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    value={newTest.interval}
                    onChange={(e) => setNewTest((p) => ({ ...p, interval: e.target.value }))}
                    min={30}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">
                  Expected Status Code
                </label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newTest.expectedStatus}
                  onChange={(e) =>
                    setNewTest((p) => ({ ...p, expectedStatus: e.target.value }))
                  }
                  placeholder="200"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">
                  Locations (comma-separated)
                </label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  value={newTest.locations}
                  onChange={(e) =>
                    setNewTest((p) => ({ ...p, locations: e.target.value }))
                  }
                  placeholder="us-east, eu-west"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1"
                disabled={!newTest.name || !newTest.url || createTestMutation.isPending}
                onClick={() => createTestMutation.mutate(newTest)}
              >
                {createTestMutation.isPending ? "Creating..." : "Create Test"}
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
