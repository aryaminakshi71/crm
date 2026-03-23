import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, LoadingSkeleton } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Plus, Play, Pause, Users,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

export const Route = createFileRoute("/app/marketing/automation")({
  component: MarketingAutomationPage,
});

const MOCK_AUTOMATIONS = [
  {
    id: "auto-1",
    name: "Welcome Series",
    status: "active",
    trigger: "Contact subscribes",
    steps: 5,
    enrolled: 1240,
    completed: 892,
    conversionRate: 18.4,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "auto-2",
    name: "Lead Nurture — 30 Day",
    status: "active",
    trigger: "Lead score >= 50",
    steps: 8,
    enrolled: 387,
    completed: 142,
    conversionRate: 11.2,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "auto-3",
    name: "Abandoned Cart Recovery",
    status: "paused",
    trigger: "Cart abandoned > 1hr",
    steps: 3,
    enrolled: 0,
    completed: 0,
    conversionRate: 0,
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "auto-4",
    name: "Post-Purchase Follow-up",
    status: "draft",
    trigger: "Order confirmed",
    steps: 4,
    enrolled: 0,
    completed: 0,
    conversionRate: 0,
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function MarketingAutomationPage() {
  const { data: campaignsData, isLoading, refetch, isError} = useQuery({
    queryKey: ["marketing", "campaigns", "automation"],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${API_BASE}/v1/marketing/campaigns?type=automation&limit=50`,
          { headers: { "Content-Type": "application/json", ...getOrgHeader() } },
        );
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
  });

  const automations = campaignsData?.data?.length ? campaignsData.data : MOCK_AUTOMATIONS;

  const statusColor = (s: string) =>
    s === "active" ? "bg-green-100 text-green-800"
    : s === "paused" ? "bg-yellow-100 text-yellow-800"
    : "bg-gray-100 text-gray-800";

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <LoadingSkeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Automation</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl text-foreground">Marketing Automation</h1>
            <p className="text-muted-foreground text-sm">
              Build automated workflows for lead nurturing and campaign execution.
            </p>
          </div>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            New Automation
          </Button>
        </div>
      </div>

      {automations.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-8 w-8 text-primary/40" />}
          title="No automations yet"
          description="Create your first marketing automation to start nurturing leads automatically."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {automations.map((automation: any) => (
            <Card key={automation.id} className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{automation.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Trigger: {automation.trigger ?? "Manual"}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColor(automation.status ?? "draft")}>
                    {automation.status ?? "draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Steps</p>
                    <p className="font-bold text-sm">{automation.steps ?? 0}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Enrolled</p>
                    <p className="font-bold text-sm flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" />
                      {(automation.enrolled ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Conv. Rate</p>
                    <p className="font-bold text-sm">{automation.conversionRate ?? 0}%</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {automation.status === "active" ? (
                    <Button variant="outline" size="sm" leftIcon={<Pause className="h-3 w-3" />}>
                      Pause
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" leftIcon={<Play className="h-3 w-3" />}>
                      Activate
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
