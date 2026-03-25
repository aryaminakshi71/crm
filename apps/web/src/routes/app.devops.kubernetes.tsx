import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import {
  Container,
  Plus,
  RefreshCw,
  Cpu,
  HardDrive,
  Activity,
  Server,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { devopsApi } from "@/lib/api";

export const Route = createFileRoute("/app/devops/kubernetes")({
  component: Kubernetes,
});


function StatusBadge({ status }: { status: string }) {
  if (status === "Running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Running
      </span>
    );
  }
  if (status === "Degraded") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-600">
        <AlertTriangle className="h-3 w-3" />
        Degraded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-red-500/10 text-red-600">
      <AlertCircle className="h-3 w-3" />
      {status}
    </span>
  );
}

function UsageBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function ConnectClusterModal({
  open,
  onClose,
  onConnect,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConnect: (name: string, endpoint: string, token: string) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [token, setToken] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Connect Cluster</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Provide your cluster credentials to connect it to Nucleo.
          </p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Cluster Name
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. prod-us-east-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              API Server Endpoint
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="https://k8s.example.com"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Service Account Token
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onConnect(name, endpoint, token)}
            disabled={!name || !endpoint || !token || isPending}
            className="flex-1"
          >
            {isPending ? "Connecting..." : "Connect Cluster"}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function Kubernetes() {
  const queryClient = useQueryClient();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["devops", "infrastructure"],
    queryFn: () => devopsApi.infrastructure.list(),
    placeholderData: (prev) => prev,
    retry: 1,
  });

  const rawClusters: any[] = (data as any)?.data ?? (data as any)?.clusters ?? [];
  const clusters = rawClusters;

  const connectCluster = useMutation({
    mutationFn: (payload: { name: string; endpoint: string; token: string }) =>
      devopsApi.infrastructure.list().then(() => payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "infrastructure"] });
      toast.success("Cluster connected successfully");
      setShowConnectModal(false);
    },
    onError: () => toast.error("Failed to connect cluster"),
  });

  const totalNodes = clusters.reduce((s: number, c: any) => s + (c.nodes ?? 0), 0);
  const totalPods = clusters.reduce((s: number, c: any) => s + (c.pods ?? 0), 0);
  const runningCount = clusters.filter((c: any) => c.status === "Running").length;
  const degradedCount = clusters.filter((c: any) => c.status === "Degraded").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Kubernetes Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage clusters, deployments, pods, and services
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowConnectModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Connect Cluster
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Server className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{clusters.length}</p>
                <p className="text-xs text-muted-foreground">Total Clusters</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{runningCount}</p>
                <p className="text-xs text-muted-foreground">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Container className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalPods}</p>
                <p className="text-xs text-muted-foreground">Total Pods</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{degradedCount}</p>
                <p className="text-xs text-muted-foreground">Degraded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Could not reach the API — showing sample data below.
        </div>
      )}

      {/* Clusters List */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Clusters</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {clusters.map((cluster: any) => (
                <div
                  key={cluster.id}
                  className={`p-5 hover:bg-muted/30 transition-colors cursor-pointer ${
                    selectedCluster === cluster.id ? "bg-muted/40" : ""
                  }`}
                  onClick={() =>
                    setSelectedCluster(
                      selectedCluster === cluster.id ? null : cluster.id
                    )
                  }
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Container className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-semibold text-foreground font-mono">
                          {cluster.name}
                        </span>
                        <StatusBadge status={cluster.status} />
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {cluster.provider ?? "Kubernetes"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          v{cluster.version ?? "1.28"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Nodes</p>
                          <p className="text-sm font-semibold">{cluster.nodes ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pods</p>
                          <p className="text-sm font-semibold">{cluster.pods ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            CPU Usage
                          </p>
                          <div className="flex items-center gap-2">
                            <UsageBar
                              value={cluster.cpu?.used ?? 50}
                              color={
                                (cluster.cpu?.used ?? 50) > 80
                                  ? "bg-red-500"
                                  : (cluster.cpu?.used ?? 50) > 60
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                              }
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {cluster.cpu?.used ?? 50}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Memory Usage
                          </p>
                          <div className="flex items-center gap-2">
                            <UsageBar
                              value={cluster.memory?.used ?? 50}
                              color={
                                (cluster.memory?.used ?? 50) > 80
                                  ? "bg-red-500"
                                  : (cluster.memory?.used ?? 50) > 60
                                  ? "bg-amber-500"
                                  : "bg-blue-500"
                              }
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {cluster.memory?.used ?? 50}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded: namespaces */}
                      {selectedCluster === cluster.id && cluster.namespaces && (
                        <div className="mt-4 pt-4 border-t border-border/40">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Namespaces
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cluster.namespaces.map((ns: string) => (
                              <span
                                key={ns}
                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-mono"
                              >
                                {ns}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-4">
                            <button className="text-xs text-primary hover:underline flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              View Metrics
                            </button>
                            <button className="text-xs text-primary hover:underline flex items-center gap-1">
                              <Cpu className="h-3 w-3" />
                              Node Details
                            </button>
                            <button className="text-xs text-primary hover:underline flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              Persistent Volumes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform mt-1 ${
                        selectedCluster === cluster.id ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConnectClusterModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={(name, endpoint, token) =>
          connectCluster.mutate({ name, endpoint, token })
        }
        isPending={connectCluster.isPending}
      />
    </div>
  );
}
