import {
  Badge,
  Button,
  Card,
  CardContent,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import {
  Outlet,
  createFileRoute,
  Link,
  useLocation,
} from "@tanstack/react-router";
import { AlertCircle, ArrowRight, GitBranch, Plus } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_WORKFLOWS = {
  data: [
    { id: "wf-1", name: "New Lead → Slack Notify", sourceApp: "crm", targetApp: "slack", triggerEvent: "lead.created", isActive: true, runCount: 42 },
    { id: "wf-2", name: "Deal Won → Invoice Create", sourceApp: "crm", targetApp: "finance", triggerEvent: "deal.won", isActive: true, runCount: 18 },
    { id: "wf-3", name: "Ticket Created → Assign Agent", sourceApp: "helpdesk", targetApp: "hrm", triggerEvent: "ticket.created", isActive: false, runCount: 0 },
  ],
};

export const Route = createFileRoute("/app/integrations/workflows")({
  component: WorkflowsLayout,
});

function WorkflowsLayout() {
  const location = useLocation();
  const isSubRoute =
    location.pathname !== "/app/integrations/workflows" &&
    !location.pathname.endsWith("/workflows");
  if (isSubRoute) return <Outlet />;
  return <WorkflowsListPage />;
}

function WorkflowsListPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["integration", "workflows"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/integration/workflows`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const workflows = (data as any)?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            Workflows
          </h1>
          <p className="text-muted-foreground mt-1">
            Automated workflows connecting your apps.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/integrations/workflows/new">
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {workflows.map((wf: any) => (
            <Card key={wf.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{wf.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <span className="capitalize">{wf.sourceApp}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="capitalize">{wf.targetApp}</span>
                      <span>·</span>
                      <span>{wf.runCount} runs</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={wf.isActive ? "default" : "secondary"}>
                    {wf.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/app/integrations/workflows/$id" params={{ id: wf.id }}>
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {workflows.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No workflows yet.</p>
                <Button className="mt-4" asChild>
                  <Link to="/app/integrations/workflows/new">Create your first workflow</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
