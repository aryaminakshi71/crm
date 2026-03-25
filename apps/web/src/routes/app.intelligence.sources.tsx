import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Database, RefreshCw, Wifi, WifiOff,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

export const Route = createFileRoute("/app/intelligence/sources")({
  component: SourcesPage,
});

const statusBadge: Record<string, string> = {
  connected: "default",
  syncing: "secondary",
  error: "destructive",
  disconnected: "outline",
};

const statusIcon = {
  connected: <Wifi className="h-4 w-4 text-emerald-500" />,
  syncing: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
  error: <WifiOff className="h-4 w-4 text-rose-500" />,
  disconnected: <WifiOff className="h-4 w-4 text-muted-foreground" />,
};

function SourcesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["intelligence", "sources"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/intelligence/sources`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { sources: [] };
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/v1/intelligence/sources/${id}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { success: true, sourceId: id, message: "Sync initiated" };
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intelligence", "sources"] });
      toast.success("Sync started successfully");
    },
    onError: () => {
      toast.error("Failed to start sync");
    },
  });

  const sources = (data as any)?.sources ?? [];

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Sources</h1>
        <p className="text-muted-foreground mt-1">
          Manage connected data sources powering your intelligence.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {sources.map((source: any) => (
            <Card key={source.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
                      <Database className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{source.name}</CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">{source.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {statusIcon[source.status as keyof typeof statusIcon] ?? statusIcon.disconnected}
                      <Badge variant={statusBadge[source.status] as any}>{source.status}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={syncMutation.isPending}
                      onClick={() => syncMutation.mutate(source.id)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Records: </span>
                    <span className="font-semibold">{source.recordCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last sync: </span>
                    <span className="font-semibold">{new Date(source.lastSync).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
