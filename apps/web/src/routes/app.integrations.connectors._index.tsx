/**
 * Integrations Connectors
 *
 * Third-party connector management with connect/disconnect controls and sync status.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  CheckCircle2,
  Link2,
  Link2Off,
  PlugZap,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/integrations/connectors/_index")({
  validateSearch: searchSchema,
  component: ConnectorsPage,
});

const orgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

function statusDot(status: string) {
  switch (status?.toLowerCase()) {
    case "connected": return <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />;
    case "error": return <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />;
    default: return <span className="h-2.5 w-2.5 rounded-full bg-gray-400 inline-block" />;
  }
}

function statusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "connected": return "bg-green-100 text-green-700";
    case "error": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function categoryColor(category: string): string {
  switch (category?.toUpperCase()) {
    case "CRM": return "bg-blue-100 text-blue-700";
    case "ERP": return "bg-purple-100 text-purple-700";
    case "PAYMENT": return "bg-green-100 text-green-700";
    case "COMM":
    case "COMMUNICATION": return "bg-orange-100 text-orange-700";
    default: return "bg-muted text-muted-foreground";
  }
}

function ConnectorsPage() {
  const queryClient = useQueryClient();
  const { q = "", page = 1 } = useSearch({ from: "/app/integrations/connectors/_index" });
  const navigate = useNavigate({ from: "/app/integrations/connectors" });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });

  const { data, isLoading } = useQuery({
    queryKey: ["integrations", "connectors", page],
    queryFn: () =>
      fetch(`/api/v1/integrations/connectors?page=${page}&limit=${PAGE_SIZE}`, { headers: orgHeader() }).then((r) => r.json()),
  });

  const connectMutation = useMutation({
    mutationFn: async ({ id, connect }: { id: string; connect: boolean }) => {
      const action = connect ? "connect" : "disconnect";
      const res = await fetch(`/api/v1/integrations/connectors/${id}/${action}`, {
        method: "POST",
        headers: orgHeader(),
      });
      if (!res.ok) throw new Error(`Failed to ${action} connector`);
      return res.json() as Promise<any>;
    },
    onSuccess: (_, { connect }) => {
      toast.success(connect ? "Connector connected" : "Connector disconnected");
      queryClient.invalidateQueries({ queryKey: ["integrations", "connectors"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const connectors: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const connectedCount = connectors.filter((c) => c.status?.toLowerCase() === "connected").length;
  const lastSync = connectors
    .filter((c) => c.lastSync)
    .sort((a, b) => new Date(b.lastSync).getTime() - new Date(a.lastSync).getTime())[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connectors</h1>
        <p className="text-muted-foreground mt-1">
          Connect and manage third-party service integrations
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <PlugZap className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold">{connectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="text-lg font-bold">
                  {lastSync?.lastSync
                    ? new Date(lastSync.lastSync).toLocaleTimeString()
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Connectors</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : connectors.length === 0 ? (
            <EmptyState
              title="No connectors configured"
              description="Add connectors to integrate with external services."
            />
          ) : (
            <div className="divide-y">
              {connectors.map((connector: any) => {
                const isConnected = connector.status?.toLowerCase() === "connected";
                return (
                  <div
                    key={connector.id}
                    className="py-4 hover:bg-muted/20 px-2 rounded transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <PlugZap className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{connector.name}</p>
                            {connector.category && (
                              <Badge className={`text-xs ${categoryColor(connector.category)}`}>
                                {connector.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {statusDot(connector.status)}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${statusBadge(connector.status)}`}>
                              {connector.status ?? "disconnected"}
                            </span>
                            {connector.lastSync && (
                              <span className="text-xs text-muted-foreground">
                                Synced {new Date(connector.lastSync).toLocaleDateString()}
                              </span>
                            )}
                            {connector.recordsCount != null && (
                              <span className="text-xs text-muted-foreground">
                                {connector.recordsCount.toLocaleString()} records
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isConnected ? "outline" : "secondary"}
                        onClick={() =>
                          connectMutation.mutate({ id: connector.id, connect: !isConnected })
                        }
                        disabled={connectMutation.isPending}
                        className="gap-1.5 shrink-0"
                      >
                        {isConnected ? (
                          <>
                            <Link2Off className="h-3.5 w-3.5" />
                            Disconnect
                          </>
                        ) : (
                          <>
                            <Link2 className="h-3.5 w-3.5" />
                            Connect
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
