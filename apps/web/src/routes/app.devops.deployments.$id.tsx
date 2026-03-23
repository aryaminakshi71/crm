import { createFileRoute, Link } from "@tanstack/react-router";
import {Button, Card,
  CardContent,
} from "@crm/ui";
import {
  ArrowLeft,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Play,
  User,
  GitCommit,
  Server,
  Activity,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/app/devops/deployments/$id")({
  component: DeploymentDetail,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

const MOCK_DEPLOYMENT = {
  id: 1,
  application: "frontend-app",
  version: "v2.1.45",
  environment: "production",
  status: "success",
  deployedBy: "John Smith",
  deployedAt: "Mar 20, 2026 8:30:15 AM",
  completedAt: "Mar 20, 2026 8:32:30 AM",
  duration: "2m 15s",
  commit: "abc1234",
  message: "Update homepage styles and fix responsive layout",
  branch: "main",
  artifacts: ["frontend-v2.1.45.docker", "coverage-report-v2.1.45"],
  servers: [
    { name: "web-prod-01", status: "healthy", ip: "10.0.1.15", region: "us-east-1" },
    { name: "web-prod-02", status: "healthy", ip: "10.0.1.16", region: "us-east-1" },
    { name: "web-prod-03", status: "healthy", ip: "10.0.1.17", region: "us-west-2" },
  ],
  stages: [
    { name: "Pre-deployment checks", status: "success", duration: "15s" },
    { name: "Building Docker image", status: "success", duration: "45s" },
    { name: "Pushing to registry", status: "success", duration: "30s" },
    { name: "Rolling update", status: "success", duration: "30s" },
    { name: "Health checks", status: "success", duration: "15s" },
  ],
};

function DeploymentDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: deploymentQuery, isLoading, refetch, isError} = useQuery({
    queryKey: ["devops", "deployments", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/devops/deployments/${id}`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch deployment");
      return res.json();
    },
    enabled: !!id,
  });

  const rollbackMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/devops/deployments/${id}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Rollback failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devops", "deployments"] });
    },
  });

  const deployment = deploymentQuery?.data ?? deploymentQuery ?? MOCK_DEPLOYMENT;

  const application = deployment.application ?? "Application";
  const version = deployment.version ?? "—";
  const environment = deployment.environment ?? "—";
  const status = deployment.status ?? "unknown";
  const deployedBy = deployment.deployedBy ?? deployment.deployedByUserId ?? "—";
  const message = deployment.message ?? "Deployment";
  const commit = deployment.commitSha?.slice(0, 7) ?? deployment.commit ?? "—";
  const stages: Array<{ name: string; status: string; duration: string }> =
    deployment.stages ?? MOCK_DEPLOYMENT.stages;
  const servers: Array<{ name: string; status: string; ip: string; region: string }> =
    deployment.servers ?? MOCK_DEPLOYMENT.servers;

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
    return (
      <div className="space-y-6">
        <div className="h-12 rounded-lg bg-muted/30 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-lg bg-muted/30 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/devops/deployments" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">{application}</h2>
            <span className="text-lg font-mono text-muted-foreground">{version}</span>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              environment === "production" ? "bg-red-500/10 text-red-500" :
              "bg-blue-500/10 text-blue-500"
            }`}>
              {environment}
            </span>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              status === "success" ? "bg-green-500/10 text-green-500" :
              "bg-red-500/10 text-red-500"
            }`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => rollbackMutation.mutate()}
            disabled={rollbackMutation.isPending || !deployment.previousVersion}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-4 w-4" />
            Rollback
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Play className="h-4 w-4" />
            Redeploy
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{deployment.duration ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <User className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-bold">{deployedBy}</p>
            <p className="text-xs text-muted-foreground">Deployed By</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <GitCommit className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-sm font-bold font-mono">{commit}</p>
            <p className="text-xs text-muted-foreground">Commit</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Server className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{servers.length}</p>
            <p className="text-xs text-muted-foreground">Servers</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Rocket className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">98.5%</p>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Deployment Stages */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Deployment Stages</h3>
          <div className="space-y-4">
            {stages.map((stage, idx) => (
              <div key={stage.name} className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-lg ${
                    stage.status === "success" ? "bg-green-500/10" :
                    stage.status === "failed" ? "bg-red-500/10" :
                    "bg-blue-500/10"
                  }`}>
                    {stage.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{stage.name}</p>
                </div>
                <div className="text-right min-w-[60px]">
                  <p className="text-sm text-muted-foreground">{stage.duration}</p>
                </div>
                {idx < stages.length - 1 && (
                  <div className="absolute left-[52px] w-0.5 h-4 bg-border mt-8" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Servers */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Deployed Servers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {servers.map((server) => (
              <div key={server.name} className="p-4 rounded-lg border border-border/40">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{server.name}</p>
                  <span className="flex items-center gap-1 text-xs text-green-500">
                    <Activity className="h-3 w-3" />
                    {server.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">IP: {server.ip}</p>
                <p className="text-xs text-muted-foreground">Region: {server.region}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
