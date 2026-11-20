import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  GitBranch,
  ListFilter,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/app/communications/routing/_index")({
  validateSearch: searchSchema,
  component: RoutingPage,
});

function RoutingPage() {
  const queryClient = useQueryClient();
  const { q = "", status = "all" } = useSearch({ from: "/app/communications/routing/_index" });
  const navigate = useNavigate({ from: "/app/communications/routing/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v }) });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [destination, setDestination] = useState("");
  const [conditions, setConditions] = useState("");
  const [priority, setPriority] = useState("1");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["communications", "routing-rules"],
    queryFn: () =>
      fetch("/api/v1/communications/routing-rules?page=1&limit=50", {
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
      }).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      priority: number;
      conditions: string[];
      destination: string;
      status: "active" | "paused";
    }) =>
      fetch("/api/v1/communications/routing-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "routing-rules"] });
      setShowCreateModal(false);
      setRuleName("");
      setDestination("");
      setConditions("");
      setPriority("1");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" }) =>
      fetch(`/api/v1/communications/routing-rules/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "routing-rules"] });
    },
  });

  const allRules: any[] = (data as any)?.data ?? [];

  const rules = allRules.filter((r) => {
    if (q.trim()) {
      const s = q.toLowerCase();
      const matchesQ = [r.name, r.destination].some((v) => String(v ?? "").toLowerCase().includes(s));
      if (!matchesQ) return false;
    }
    if (status !== "all" && r.status !== status) return false;
    return true;
  });

  const activeRules = allRules.filter((r) => r.status === "active").length;

  const stats = [
    { label: "Active Rules", value: activeRules, icon: ListFilter, color: "text-green-400" },
    { label: "Total Rules", value: rules.length, icon: GitBranch, color: "text-blue-400" },
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load routing rules.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Call Routing</h1>
          <p className="text-muted-foreground mt-1">
            Configure rules for routing inbound communications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Rule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rules..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Routing Rules</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 rounded bg-muted" />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <GitBranch className="h-8 w-8" />
              <p className="text-sm">No routing rules configured.</p>
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create First Rule
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rule Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Conditions</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Destination</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {rules
                    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
                    .map((rule) => {
                      const conds: string[] = Array.isArray(rule.conditions)
                        ? rule.conditions
                        : [];
                      const isActive = rule.status === "active";
                      return (
                        <tr
                          key={rule.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium">{rule.name}</td>
                          <td className="px-4 py-3">
                            {conds.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {conds.slice(0, 3).map((c, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {c}
                                  </Badge>
                                ))}
                                {conds.length > 3 && (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">
                                    +{conds.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">No conditions</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-sm">
                            {rule.destination ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs font-mono">
                              #{rule.priority ?? 1}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                toggleMutation.mutate({
                                  id: rule.id,
                                  status: isActive ? "paused" : "active",
                                })
                              }
                              className={`flex items-center gap-1.5 text-sm transition-colors ${
                                isActive
                                  ? "text-green-400 hover:text-green-300"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {isActive ? (
                                <ToggleRight className="h-5 w-5" />
                              ) : (
                                <ToggleLeft className="h-5 w-5" />
                              )}
                              {isActive ? "Active" : "Paused"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Routing Rule</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Rule Name</label>
                <Input
                  placeholder="e.g. Business Hours Forward"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Destination</label>
                <Input
                  placeholder="e.g. queue:support, +1555000000"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Conditions (comma-separated)
                </label>
                <Input
                  placeholder="e.g. time:9-17, caller:+1555"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <Input
                  type="number"
                  min="1"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  createMutation.mutate({
                    name: ruleName,
                    priority: parseInt(priority) || 1,
                    conditions: conditions
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean),
                    destination,
                    status: "active",
                  })
                }
                disabled={
                  createMutation.isPending ||
                  !ruleName.trim() ||
                  !destination.trim()
                }
              >
                {createMutation.isPending ? "Creating…" : "Create Rule"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
