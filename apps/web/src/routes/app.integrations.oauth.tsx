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
import { createFileRoute, Link } from "@tanstack/react-router";
import { Key, Plus, RefreshCw,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_OAUTH = {
  data: [
    { id: "conn-3", name: "GitHub", type: "oauth", status: "connected", connectedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() },
    { id: "conn-4", name: "Mailchimp", type: "oauth", status: "disconnected", connectedAt: null, expiresAt: null },
    { id: "conn-6", name: "Google Workspace", type: "oauth", status: "connected", connectedAt: new Date(Date.now() - 86400000).toISOString(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() },
  ],
};

export const Route = createFileRoute("/app/integrations/oauth")({
  component: OAuthPage,
});

function OAuthPage() {
  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["integration", "connectors", "oauth"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/integration/connectors?type=oauth`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
  });

  const oauthConnectors = (data as any)?.data ?? [];

  const handleRefresh = (name: string) => {
    toast.success(`Refreshing token for ${name}...`);
  };

  const handleConnect = (name: string) => {
    toast.info(`Redirecting to ${name} OAuth...`);
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6" />
            OAuth Connections
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage OAuth-authorized integrations and tokens.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/integrations/connectors/new">
            <Plus className="h-4 w-4 mr-2" />
            Add OAuth
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {oauthConnectors.map((conn: any) => {
            const isConnected = conn.status === "connected";
            const daysLeft = conn.expiresAt
              ? Math.ceil((new Date(conn.expiresAt).getTime() - Date.now()) / 86400000)
              : null;
            const isExpiringSoon = daysLeft !== null && daysLeft <= 7;

            return (
              <Card key={conn.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      {conn.name}
                    </CardTitle>
                    <Badge variant={isConnected ? (isExpiringSoon ? "secondary" : "default") : "outline"}>
                      {isConnected ? (isExpiringSoon ? "Expiring Soon" : "Connected") : "Disconnected"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isConnected && conn.connectedAt && (
                    <div className="text-xs text-muted-foreground">
                      Connected: {new Date(conn.connectedAt).toLocaleDateString()}
                      {daysLeft !== null && (
                        <span className={isExpiringSoon ? " text-amber-500 font-medium" : ""}>
                          {" · Expires in "}{daysLeft} days
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {isConnected ? (
                      <Button size="sm" variant="outline" onClick={() => handleRefresh(conn.name)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Refresh Token
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleConnect(conn.name)}>
                        Connect {conn.name}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/app/integrations/connectors/$id" params={{ id: conn.id }}>
                        Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
