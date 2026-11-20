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
  ArrowRight,
  Bot,
  GitMerge,
  Play,
  Plus,
  RefreshCw,
  Search,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["all", "active", "paused", "draft", "error"]).optional(),
});

export const Route = createFileRoute("/app/agents/orchestration/_index")({
  validateSearch: searchSchema,
  component: OrchestrationPage,
});

function formatDate(val: string | null | undefined): string {
  if (!val) return "—";
  return new Date(val).toLocaleString();
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  paused: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  draft: "bg-muted text-muted-foreground",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
};

function OrchestrationPage() {
  const { q = "", status: statusFilter = "all" } = useSearch({ from: "/app/agents/orchestration/_index" });
  const navigate = useNavigate({ from: "/app/agents/orchestration/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setStatusFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v === "all" ? undefined : v as any }) });

  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [trigger, setTrigger] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["agents", "orchestration"],
    queryFn: () =>
      fetch("/api/v1/agents/orchestration", {
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
      }).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; trigger: string }) =>
      fetch("/api/v1/agents/orchestration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", "orchestration"] });
      setShowCreateModal(false);
      setWorkflowName("");
      setTrigger("");
    },
  });

  const workflows: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  const filteredWorkflows = workflows.filter((w) => {
    const matchesQ =
      !q || (w.name ?? "").toLowerCase().includes(q.toLowerCase());
    const matchesStatus =
      !statusFilter || statusFilter === "all" || (w.status ?? "") === statusFilter;
    return matchesQ && matchesStatus;
  });

  const activeWorkflows = workflows.filter((w) => w.status === "active").length;
  const today = new Date();
  const runsToday = workflows.reduce((sum, w) => {
    if (!w.lastRunAt) return sum;
    const d = new Date(w.lastRunAt);
    if (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    ) {
      return sum + 1;
    }
    return sum;
  }, 0);

  const stats = [
    { label: "Active Workflows", value: activeWorkflows, icon: GitMerge, color: "text-green-400" },
    { label: "Runs Today", value: runsToday, icon: Zap, color: "text-yellow-400" },
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load workflows.</p>
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
          <h1 className="text-2xl font-bold">Agent Orchestration</h1>
          <p className="text-muted-foreground mt-1">
            Multi-agent workflows and automation pipelines
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Workflow
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search workflows…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="draft">Draft</option>
          <option value="error">Error</option>
        </select>
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

      {/* Workflows */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-32 rounded-lg bg-muted" />
          ))}
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
          <GitMerge className="h-8 w-8" />
          <p className="text-sm">{q || statusFilter !== "all" ? "No workflows match your filters." : "No workflows configured."}</p>
          {!q && statusFilter === "all" && (
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create First Workflow
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkflows.map((workflow) => {
            const agents: string[] = Array.isArray(workflow.agents)
              ? workflow.agents
              : [];
            return (
              <Card key={workflow.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <GitMerge className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium">{workflow.name ?? "Unnamed Workflow"}</span>
                        <Badge
                          variant="outline"
                          className={
                            STATUS_COLORS[workflow.status] ??
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {workflow.status ?? "draft"}
                        </Badge>
                      </div>

                      {/* Agent Pipeline Visualization */}
                      {agents.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mb-3">
                          {agents.map((agent, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded px-2 py-1">
                                <Bot className="h-3 w-3 text-primary" />
                                <span className="text-xs font-medium">{agent}</span>
                              </div>
                              {idx < agents.length - 1 && (
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {workflow.trigger && (
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Trigger: {workflow.trigger}
                          </span>
                        )}
                        {workflow.runsCount != null && (
                          <span>
                            <Play className="h-3 w-3 inline mr-1" />
                            {workflow.runsCount} runs
                          </span>
                        )}
                        {workflow.lastRunAt && (
                          <span>Last run: {formatDate(workflow.lastRunAt)}</span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        fetch(`/api/v1/agents/orchestration/${workflow.id}/run`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            "x-organization-id":
                              localStorage.getItem("activeOrganizationId") ?? "",
                          },
                        })
                      }
                    >
                      <Play className="h-3.5 w-3.5 mr-1.5" /> Run
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Workflow</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Workflow Name</label>
                <Input
                  placeholder="e.g. Lead Qualification Pipeline"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Trigger</label>
                <Input
                  placeholder="e.g. new_lead, schedule:daily"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  createMutation.mutate({ name: workflowName, trigger })
                }
                disabled={createMutation.isPending || !workflowName.trim()}
              >
                {createMutation.isPending ? "Creating…" : "Create Workflow"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
