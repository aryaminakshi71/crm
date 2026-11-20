import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Activity, GitBranch, Plus, Search, Zap } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["all", "active", "inactive"]).optional(),
});

export const Route = createFileRoute("/app/integrations/workflows/_index")({
  validateSearch: searchSchema,
  component: WorkflowsPage,
});

const orgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

function WorkflowsPage() {
  const queryClient = useQueryClient();
  const { q = "", status = "all" } = useSearch({ from: "/app/integrations/workflows/_index" });
  const navigate = useNavigate({ from: "/app/integrations/workflows/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v === "all" ? undefined : (v as any) }) });

  const { data, isLoading } = useQuery({
    queryKey: ["integrations", "workflows"],
    queryFn: () =>
      fetch("/api/v1/integrations/workflows", { headers: orgHeader() }).then((r) => r.json()),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/v1/integrations/workflows/${id}`, {
        method: "PATCH",
        headers: orgHeader(),
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to toggle workflow");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations", "workflows"] });
    },
    onError: () => toast.error("Failed to toggle workflow"),
  });

  const allWorkflows: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  const workflows = allWorkflows
    .filter((w: any) =>
      !q ||
      (w.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (w.trigger?.app ?? w.triggerApp ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (w.action?.app ?? w.actionApp ?? "").toLowerCase().includes(q.toLowerCase()),
    )
    .filter((w: any) => {
      if (status === "all") return true;
      const isActive = w.active !== false;
      return status === "active" ? isActive : !isActive;
    });

  const activeCount = allWorkflows.filter((w) => w.active !== false).length;
  const thisWeekRuns = allWorkflows.reduce((acc, w) => acc + (w.runsThisWeek ?? w.runs ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Automate actions between connected applications
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => toast.info("Workflow builder coming soon")}
        >
          <Plus className="h-4 w-4" />
          Build Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Workflows</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Runs This Week</p>
                <p className="text-2xl font-bold">{thisWeekRuns}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <CardTitle>All Workflows</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative w-52">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
                  className="pl-8"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {["all", "active", "inactive"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                      status === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : workflows.length === 0 ? (
            <EmptyState
              title="No workflows found"
              description="No workflows match your current filters."
            />
          ) : (
            <div className="space-y-3">
              {workflows.map((wf) => {
                const isActive = wf.active !== false;
                return (
                  <div
                    key={wf.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-primary shrink-0" />
                          <p className="font-semibold text-sm truncate">{wf.name ?? "Untitled Workflow"}</p>
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                          {wf.trigger && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium text-foreground">Trigger:</span>
                              {wf.trigger?.app ?? wf.triggerApp ?? "—"}
                              {wf.trigger?.event && (
                                <Badge className="text-xs bg-purple-100 text-purple-800 ml-1">
                                  {wf.trigger.event}
                                </Badge>
                              )}
                            </span>
                          )}
                          {wf.action && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium text-foreground">Action:</span>
                              {wf.action?.app ?? wf.actionApp ?? "—"}
                              {wf.action?.action && (
                                <Badge className="text-xs bg-green-100 text-green-800 ml-1">
                                  {wf.action.action}
                                </Badge>
                              )}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>Runs: {wf.runs ?? wf.totalRuns ?? 0}</span>
                          {wf.lastRun && (
                            <span>Last run: {new Date(wf.lastRun).toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleMutation.mutate({ id: wf.id, active: !isActive })}
                          disabled={toggleMutation.isPending}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            isActive ? "bg-green-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                              isActive ? "translate-x-4" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className="text-xs text-muted-foreground">
                          {isActive ? "On" : "Off"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
