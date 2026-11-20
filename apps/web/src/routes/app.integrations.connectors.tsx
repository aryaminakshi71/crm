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
import { AlertCircle, Plug, Plus } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

export const Route = createFileRoute("/app/integrations/connectors")({
  component: ConnectorsLayout,
});

function ConnectorsLayout() {
  const location = useLocation();
  const isSubRoute =
    location.pathname !== "/app/integrations/connectors" &&
    !location.pathname.endsWith("/connectors");
  if (isSubRoute) return <Outlet />;
  return <ConnectorsListPage />;
}

function ConnectorsListPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["integration", "connectors"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/integration/connectors`, {
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

  const connectors = (data as any)?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="h-6 w-6" />
            Connectors
          </h1>
          <p className="text-muted-foreground mt-1">
            All connected services and integrations.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/integrations/connectors/new">
            <Plus className="h-4 w-4 mr-2" />
            New Connector
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {connectors.map((conn: any) => (
            <Card key={conn.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
                    <Plug className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{conn.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{conn.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={conn.status === "connected" || conn.status === "active" ? "default" : "outline"}>
                    {conn.status}
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/app/integrations/connectors/$id" params={{ id: conn.id }}>
                      Configure
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
