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
import {
  Outlet,
  createFileRoute,
  Link,
  useLocation,
} from "@tanstack/react-router";
import { GitBranch, Plus, Plug, Webhook, Zap } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_CONNECTORS = {
  data: [
    { id: "conn-1", name: "Stripe", type: "payment", status: "connected" },
    { id: "conn-2", name: "Slack", type: "webhook", status: "connected" },
    { id: "conn-3", name: "GitHub", type: "oauth", status: "connected" },
    { id: "conn-4", name: "Mailchimp", type: "oauth", status: "disconnected" },
  ],
};

export const Route = createFileRoute("/app/integrations")({
  component: IntegrationsLayout,
});

function IntegrationsLayout() {
  const location = useLocation();
  const isSubRoute = location.pathname !== "/app/integrations";
  if (isSubRoute) return <Outlet />;
  return <IntegrationsIndexPage />;
}

function IntegrationsIndexPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["integration", "connectors", "index"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/integration/connectors`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
  });

  const connectors = (data as any)?.data ?? [];
  const connected = connectors.filter((c: any) => c.status === "connected" || c.status === "active").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect your tools and automate workflows across your stack.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/integrations/connectors/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Connector
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{connectors.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Connectors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-emerald-500">{connected}</p>
            <p className="text-sm text-muted-foreground mt-1">Connected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{connectors.length - connected}</p>
            <p className="text-sm text-muted-foreground mt-1">Disconnected</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" />
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { label: "All Connectors", href: "/app/integrations/connectors", icon: Plug },
              { label: "Workflows", href: "/app/integrations/workflows", icon: GitBranch },
              { label: "Webhooks", href: "/app/integrations/webhooks", icon: Webhook },
              { label: "Events", href: "/app/integrations/events", icon: Zap },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted transition-colors text-sm"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Connectors</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <LoadingSkeleton key={i} className="h-10 w-full rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {connectors.slice(0, 4).map((conn: any) => (
                  <div key={conn.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{conn.name}</span>
                    <Badge variant={conn.status === "connected" ? "default" : "outline"}>
                      {conn.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
