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
import { ArrowLeft, CheckCircle2, Clock, Plug, XCircle,
  AlertCircle
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const MOCK_CONNECTOR = (id: string) => ({
  id,
  name: "Sample Connector",
  type: "webhook",
  status: "connected",
  config: { endpoint: "https://hooks.example.com/webhook" },
  connectedAt: new Date().toISOString(),
  rateLimit: { limit: 1000, remaining: 847, resetAt: new Date(Date.now() + 3600000).toISOString() },
  recentRuns: [
    { id: "run-1", status: "success", executedAt: new Date().toISOString(), durationMs: 124 },
    { id: "run-2", status: "success", executedAt: new Date(Date.now() - 3600000).toISOString(), durationMs: 98 },
    { id: "run-3", status: "failed", executedAt: new Date(Date.now() - 7200000).toISOString(), durationMs: 234, error: "Timeout" },
  ],
});

export const Route = createFileRoute("/app/integrations/connectors/$id")({
  component: ConnectorDetailPage,
});

function ConnectorDetailPage() {
  const { id } = useParams({ from: "/app/integrations/connectors/$id" });

  const { data, isLoading, refetch, isError} = useQuery({
    queryKey: ["integration", "connectors", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/integration/connectors/${id}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return MOCK_CONNECTOR(id);
      return res.json();
    },
    enabled: !!id,
  });

  const connector = data ?? MOCK_CONNECTOR(id);

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
        <Link to="/app/integrations/connectors" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
            <Plug className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{connector.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{connector.type}</p>
          </div>
        </div>
        <Badge variant={connector.status === "connected" ? "default" : "secondary"} className="ml-auto">
          {connector.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {connector.connectedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Connected At</span>
                <span>{new Date(connector.connectedAt).toLocaleString()}</span>
              </div>
            )}
            {connector.config && Object.entries(connector.config).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-muted-foreground capitalize">{k}</span>
                <span className="font-mono text-xs">{String(v)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {connector.rateLimit && (
          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Limit</span>
                <span className="font-semibold">{connector.rateLimit.limit}/hour</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold">{connector.rateLimit.remaining}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${(connector.rateLimit.remaining / connector.rateLimit.limit) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Resets: {new Date(connector.rateLimit.resetAt).toLocaleTimeString()}</span>
                <span>{Math.round((connector.rateLimit.remaining / connector.rateLimit.limit) * 100)}% remaining</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {connector.recentRuns?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {connector.recentRuns.map((run: any) => (
                <div key={run.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    {run.status === "success"
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : <XCircle className="h-4 w-4 text-rose-500" />}
                    <span className="text-sm capitalize">{run.status}</span>
                    {run.error && <span className="text-xs text-rose-500">– {run.error}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {run.durationMs}ms
                    </span>
                    <span>{new Date(run.executedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline">Edit Connector</Button>
        <Button variant="destructive">Disconnect</Button>
      </div>
    </div>
  );
}
