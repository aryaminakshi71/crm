/**
 * Agent Orchestration Route
 *
 * Manage and run agent workflows.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
  Textarea,
} from "@crm/ui";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Bot,
  CheckCircle,
  Clock,
  GitBranch,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Zap,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/agents/orchestration")({
  component: OrchestrationPage,
});

// ─── API helpers ──────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

// ─── Mock fallback data ────────────────────────────────────────────────────────

const MOCK_WORKFLOWS = [
  {
    id: "wf-001",
    name: "Lead Enrichment Pipeline",
    description: "Automatically enrich new leads with company and contact data",
    status: "active",
    triggerType: "event",
    runCount: 142,
    lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    steps: [
      { id: "s1", type: "trigger", config: {} },
      { id: "s2", type: "enrich", agentId: "crm.contact.enrich", config: {} },
      { id: "s3", type: "score", agentId: "crm.lead.score", config: {} },
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wf-002",
    name: "Weekly Sales Digest",
    description: "Summarize deal movements and send digest every Monday",
    status: "active",
    triggerType: "schedule",
    runCount: 24,
    lastRunAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    steps: [
      { id: "s1", type: "trigger", config: {} },
      { id: "s2", type: "summarize", agentId: "crm.meeting.summarize", config: {} },
    ],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wf-003",
    name: "Support Triage Bot",
    description: "Auto-triage incoming support tickets and assign priority",
    status: "paused",
    triggerType: "webhook",
    runCount: 389,
    lastRunAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    steps: [
      { id: "s1", type: "trigger", config: {} },
      { id: "s2", type: "triage", config: {} },
    ],
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Workflow {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  triggerType?: string | null;
  runCount: number;
  lastRunAt?: string | null;
  steps?: Array<{ id: string; type: string; agentId?: string; config: Record<string, unknown> }>;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    case "paused":
      return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    case "draft":
      return "bg-slate-500/15 text-slate-400 border-slate-500/20";
    default:
      return "bg-slate-500/15 text-slate-400 border-slate-500/20";
  }
}

function triggerIcon(triggerType?: string | null) {
  switch (triggerType) {
    case "schedule":
      return <Clock className="w-3 h-3" />;
    case "event":
      return <Zap className="w-3 h-3" />;
    case "webhook":
      return <GitBranch className="w-3 h-3" />;
    default:
      return <Play className="w-3 h-3" />;
  }
}

function relativeTime(iso?: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

function OrchestrationPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    triggerType: "manual" as "schedule" | "event" | "manual" | "webhook",
    status: "draft" as "active" | "paused" | "draft",
  });

  // ── Fetch workflows ──────────────────────────────────────────────────────
  const { data: workflowsData, isLoading, isError, refetch} = useQuery({
    queryKey: ["agents", "workflows"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/agents/workflows`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
  });
  const workflows: Workflow[] = (workflowsData as any)?.data ?? [];

  // ── Fetch stats ──────────────────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ["agents", "workflows", "stats"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/agents/workflows/stats`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<any>;
    },
  });

  // ── Create workflow ──────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: typeof newWorkflow) => {
      const res = await fetch(`${API_BASE}/agents/workflows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getOrgHeader(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create workflow");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", "workflows"] });
      setIsCreateOpen(false);
      setNewWorkflow({ name: "", description: "", triggerType: "manual", status: "draft" });
      toast.success("Workflow created");
    },
    onError: () => {
      toast.error("Failed to create workflow");
    },
  });

  // ── Run workflow ─────────────────────────────────────────────────────────
  const runMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/agents/workflows/${id}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getOrgHeader(),
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to run workflow");
      return res.json() as Promise<any>;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["agents", "workflows"] });
      toast.success("Workflow triggered");
    },
    onError: () => {
      toast.error("Failed to trigger workflow");
    },
  });

  // ── Stats (fallback to local count) ─────────────────────────────────────
  const totalWorkflows = (stats as any)?.totalWorkflows ?? workflows.length;
  const activeWorkflows =
    (stats as any)?.activeWorkflows ?? workflows.filter((w) => w.status === "active").length;
  const runsToday = (stats as any)?.runsToday ?? 0;

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-6 h-6 text-violet-400" />
            Agent Orchestration
          </h1>
          <p className="text-muted-foreground mt-1">
            Build and manage automated agent workflows
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <GitBranch className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Workflows</p>
              <p className="text-2xl font-bold text-foreground">{totalWorkflows}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-foreground">{activeWorkflows}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Runs Today</p>
              <p className="text-2xl font-bold text-foreground">{runsToday}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow list */}
      {isLoading ? (
        <Loading />
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={<Bot className="w-10 h-10 text-muted-foreground" />}
          title="No workflows yet"
          description="Create your first agent workflow to automate complex tasks."
          action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>New Workflow</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {workflow.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(workflow.status)}`}
                      >
                        {workflow.status === "active" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : workflow.status === "paused" ? (
                          <Pause className="w-3 h-3" />
                        ) : null}
                        {workflow.status}
                      </span>
                      {workflow.triggerType && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                          {triggerIcon(workflow.triggerType)}
                          {workflow.triggerType}
                        </span>
                      )}
                    </div>
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {workflow.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        {workflow.runCount} runs
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last run: {relativeTime(workflow.lastRunAt)}
                      </span>
                      {workflow.steps && (
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {workflow.steps.length} steps
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => runMutation.mutate(workflow.id)}
                      disabled={runMutation.isPending}
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      Run
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Workflow Modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Workflow"
        onSubmit={() => createMutation.mutate(newWorkflow)}
        isLoading={createMutation.isPending}
        submitText="Create Workflow"
      >
        <FormField label="Name" required>
          <Input
            placeholder="e.g. Lead Enrichment Pipeline"
            value={newWorkflow.name}
            onChange={(e) =>
              setNewWorkflow((p) => ({ ...p, name: e.target.value }))
            }
          />
        </FormField>
        <FormField label="Description">
          <Textarea
            placeholder="What does this workflow do?"
            value={newWorkflow.description}
            onChange={(e) =>
              setNewWorkflow((p) => ({ ...p, description: e.target.value }))
            }
          />
        </FormField>
        <FormField label="Trigger Type">
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newWorkflow.triggerType}
            onChange={(e) =>
              setNewWorkflow((p) => ({
                ...p,
                triggerType: e.target.value as typeof newWorkflow.triggerType,
              }))
            }
          >
            <option value="manual">Manual</option>
            <option value="schedule">Schedule</option>
            <option value="event">Event</option>
            <option value="webhook">Webhook</option>
          </select>
        </FormField>
        <FormField label="Initial Status">
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newWorkflow.status}
            onChange={(e) =>
              setNewWorkflow((p) => ({
                ...p,
                status: e.target.value as typeof newWorkflow.status,
              }))
            }
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </FormField>
      </FormModal>
    </div>
  );
}
