import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, GitBranch, XCircle,
  AlertCircle
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_WORKFLOW = (id: string) => ({
  id,
  name: "New Lead → Slack Notify",
  sourceApp: "crm",
  targetApp: "slack",
  triggerEvent: "lead.created",
  actionType: "send_message",
  actionConfig: { channel: "#sales", message: "New lead: {{lead.name}}" },
  isActive: true,
  createdAt: new Date().toISOString(),
  runCount: 42,
  lastRun: new Date().toISOString(),
  recentRuns: [
    { id: "r-1", status: "success", executedAt: new Date().toISOString() },
    { id: "r-2", status: "success", executedAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "r-3", status: "failed", executedAt: new Date(Date.now() - 7200000).toISOString(), error: "Timeout" },
  ],
});

export const Route = createFileRoute("/app/integrations/workflows/$id")({
  component: WorkflowDetailPage,
});

function WorkflowDetailPage() {
  const { id } = useParams({ from: "/app/integrations/workflows/$id" });

  const { data, isLoading, refetch, isError} = useQuery({
    queryKey: ["integration", "workflows", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/integration/workflows/${id}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return MOCK_WORKFLOW(id);
      return res.json();
    },
    enabled: !!id,
  });

  const workflow = data ?? MOCK_WORKFLOW(id);

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
    return (
      <div className="p-6 space-y-4">
        <LoadingSkeleton className="h-8 w-64 rounded" />
        <LoadingSkeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/app/integrations/workflows" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{workflow.name}</h1>
            <p className="text-sm text-muted-foreground">
              {workflow.runCount ?? 0} total runs
            </p>
          </div>
        </div>
        <Badge variant={workflow.isActive ? "default" : "secondary"} className="ml-auto">
          {workflow.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border bg-muted px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground mb-1">Source</p>
                <p className="font-semibold capitalize">{workflow.sourceApp}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{workflow.triggerEvent}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 rounded-lg border bg-muted px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground mb-1">Target</p>
                <p className="font-semibold capitalize">{workflow.targetApp}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{workflow.actionType}</p>
              </div>
            </div>
            {workflow.actionConfig && (
              <div>
                <p className="text-sm font-medium mb-2">Action Config</p>
                <div className="space-y-1">
                  {Object.entries(workflow.actionConfig).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{k}</span>
                      <span className="font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {workflow.createdAt && (
              <div className="text-xs text-muted-foreground">
                Created: {new Date(workflow.createdAt).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(workflow.recentRuns ?? []).map((run: any) => (
                <div key={run.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    {run.status === "success"
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : <XCircle className="h-4 w-4 text-rose-500" />}
                    <span className="text-sm capitalize">{run.status}</span>
                    {run.error && <span className="text-xs text-rose-500">– {run.error}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(run.executedAt).toLocaleString()}
                  </span>
                </div>
              ))}
              {(!workflow.recentRuns || workflow.recentRuns.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No runs yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="outline">Edit Workflow</Button>
        <Button variant={workflow.isActive ? "secondary" : "default"}>
          {workflow.isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button variant="destructive">Delete</Button>
      </div>
    </div>
  );
}
