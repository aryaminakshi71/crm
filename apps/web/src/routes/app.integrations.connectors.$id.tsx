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
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
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
      if (!res.ok) return {};
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
    enabled: !!id,
  });

  const connector = (data as any) ?? {};

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
        <Link to="/app/integrations/connectors" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
            <Plug className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{(connector as any).name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{(connector as any).type}</p>
          </div>
        </div>
        <Badge variant={(connector as any).status === "connected" ? "default" : "secondary"} className="ml-auto">
          {(connector as any).status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(connector as any).connectedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Connected At</span>
                <span>{new Date((connector as any).connectedAt).toLocaleString()}</span>
              </div>
            )}
            {(connector as any).config && Object.entries((connector as any).config).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-muted-foreground capitalize">{k}</span>
                <span className="font-mono text-xs">{String(v)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {(connector as any).rateLimit && (
          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Limit</span>
                <span className="font-semibold">{(connector as any).rateLimit.limit}/hour</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold">{(connector as any).rateLimit.remaining}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${((connector as any).rateLimit.remaining / (connector as any).rateLimit.limit) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Resets: {new Date((connector as any).rateLimit.resetAt).toLocaleTimeString()}</span>
                <span>{Math.round(((connector as any).rateLimit.remaining / (connector as any).rateLimit.limit) * 100)}% remaining</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {(connector as any).recentRuns?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(connector as any).recentRuns.map((run: any) => (
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
