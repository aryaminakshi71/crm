import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@crm/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Phone,
  Plus,
  ArrowRight,
  Settings,
  Trash2,
  Users,
  Clock,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/communications/routing")({
  component: CallRoutingPage,
});

interface RouteRule {
  id: string;
  name: string;
  conditions: string[];
  destination: string;
  priority: number;
  status: "active" | "paused";
  createdAt: string;
}

const MOCK_ROUTES: RouteRule[] = [
  { id: "r1", name: "Business Hours", conditions: ["Time: 9AM-5PM", "Day: Mon-Fri"], destination: "Sales Team", priority: 1, status: "active", createdAt: new Date().toISOString() },
  { id: "r2", name: "After Hours", conditions: ["Time: 5PM-9AM", "Day: Mon-Fri"], destination: "Voicemail", priority: 2, status: "active", createdAt: new Date().toISOString() },
  { id: "r3", name: "Weekend", conditions: ["Day: Sat-Sun"], destination: "Emergency Line", priority: 3, status: "active", createdAt: new Date().toISOString() },
  { id: "r4", name: "VIP Customers", conditions: ["Caller ID: +1 555-123-4567"], destination: "VIP Support", priority: 1, status: "paused", createdAt: new Date().toISOString() },
];

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

function CallRoutingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", destination: "", conditions: "", priority: "1" });

  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["communications", "routing-rules"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/communications/routing-rules`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to load routing rules");
      return res.json() as Promise<{ data: RouteRule[] }>;
    },
  });

  const rules = data?.data ?? MOCK_ROUTES;

  const createMutation = useMutation({
    mutationFn: async (input: { name: string; destination: string; conditions: string[]; priority: number }) => {
      const res = await fetch(`${API_BASE}/communications/routing-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ ...input, status: "active" }),
      });
      if (!res.ok) throw new Error("Failed to create rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "routing-rules"] });
      toast.success("Routing rule created");
      setShowCreateModal(false);
      setNewRule({ name: "", destination: "", conditions: "", priority: "1" });
    },
    onError: () => toast.error("Failed to create routing rule"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "paused" }) => {
      const res = await fetch(`${API_BASE}/communications/routing-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "routing-rules"] });
      toast.success("Rule updated");
    },
    onError: () => toast.error("Failed to update rule"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/communications/routing-rules/${id}`, {
        method: "DELETE",
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to delete rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "routing-rules"] });
      toast.success("Rule deleted");
    },
    onError: () => toast.error("Failed to delete rule"),
  });

  const activeRules = rules.filter((r) => r.status === "active");

  const handleCreate = () => {
    if (!newRule.name.trim() || !newRule.destination.trim()) return;
    createMutation.mutate({
      name: newRule.name.trim(),
      destination: newRule.destination.trim(),
      conditions: newRule.conditions
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      priority: parseInt(newRule.priority, 10) || 1,
    });
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Call Routing</h2>
            <p className="text-muted-foreground text-sm">Configure how incoming calls are routed</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
          Add Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-xl font-bold">{isLoading ? "…" : activeRules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rules</p>
                <p className="text-xl font-bold">{isLoading ? "…" : rules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Answer Time</p>
                <p className="text-xl font-bold">12s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routing Rules */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Routing Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground text-sm py-8">Loading rules…</div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, idx) => (
                <div key={rule.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {rule.priority}
                      </div>
                      <div>
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge className={rule.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {rule.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          toggleMutation.mutate({
                            id: rule.id,
                            status: rule.status === "active" ? "paused" : "active",
                          })
                        }
                        disabled={toggleMutation.isPending}
                        title={rule.status === "active" ? "Pause rule" : "Activate rule"}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(rule.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-sm flex-wrap">
                    <span className="text-muted-foreground">When:</span>
                    {rule.conditions.map((cond, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                        {cond}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Route to:</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded">
                      {rule.destination}
                    </span>
                  </div>

                  {idx < rules.length - 1 && (
                    <div className="flex justify-center mt-4 mb-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              ))}
              {rules.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">No routing rules yet</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Add Routing Rule</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Rule Name</label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Business Hours"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Conditions (comma-separated)</label>
                  <input
                    type="text"
                    value={newRule.conditions}
                    onChange={(e) => setNewRule((p) => ({ ...p, conditions: e.target.value }))}
                    placeholder="Time: 9AM-5PM, Day: Mon-Fri"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Route To</label>
                  <input
                    type="text"
                    value={newRule.destination}
                    onChange={(e) => setNewRule((p) => ({ ...p, destination: e.target.value }))}
                    placeholder="e.g. Sales Team"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <input
                    type="number"
                    min="1"
                    value={newRule.priority}
                    onChange={(e) => setNewRule((p) => ({ ...p, priority: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!newRule.name.trim() || !newRule.destination.trim() || createMutation.isPending}
                  onClick={handleCreate}
                >
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
