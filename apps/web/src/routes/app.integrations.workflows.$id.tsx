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
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
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
      if (!res.ok) return {};
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
    enabled: !!id,
  });

  const workflow = (data as any) ?? {};

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => (refetch as () => void)()}>Retry</Button>
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
            <h1 className="text-xl font-bold">{(workflow as any).name}</h1>
            <p className="text-sm text-muted-foreground">
              {(workflow as any).runCount ?? 0} total runs
            </p>
          </div>
        </div>
        <Badge variant={(workflow as any).isActive ? "default" : "secondary"} className="ml-auto">
          {(workflow as any).isActive ? "Active" : "Inactive"}
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
                <p className="font-semibold capitalize">{(workflow as any).sourceApp}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{(workflow as any).triggerEvent}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 rounded-lg border bg-muted px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground mb-1">Target</p>
                <p className="font-semibold capitalize">{(workflow as any).targetApp}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{(workflow as any).actionType}</p>
              </div>
            </div>
            {(workflow as any).actionConfig && (
              <div>
                <p className="text-sm font-medium mb-2">Action Config</p>
                <div className="space-y-1">
                  {Object.entries((workflow as any).actionConfig).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{k}</span>
                      <span className="font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(workflow as any).createdAt && (
              <div className="text-xs text-muted-foreground">
                Created: {new Date((workflow as any).createdAt).toLocaleString()}
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
              {((workflow as any).recentRuns ?? []).map((run: any) => (
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
              {(!(workflow as any).recentRuns || (workflow as any).recentRuns.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No runs yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="outline">Edit Workflow</Button>
        <Button variant={(workflow as any).isActive ? "secondary" : "secondary"}>
          {(workflow as any).isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button variant="destructive">Delete</Button>
      </div>
    </div>
  );
}
