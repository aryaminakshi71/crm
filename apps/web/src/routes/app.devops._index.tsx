import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  SkeletonCard,
  SkeletonTable,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import {
  GitBranch,
  Play,
  Server,
  Globe,
  Rocket,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  RotateCcw,
  User,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/app/devops/_index")({
  component: DevOpsDashboard,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const MOCK_STATS = [
  { label: "Active Pipelines", value: "12", icon: GitBranch, color: "text-blue-500", trend: "+3 from last week" },
  { label: "Running Builds", value: "3", icon: Play, color: "text-emerald-500", trend: "2 queued" },
  { label: "Servers", value: "24", icon: Server, color: "text-amber-500", trend: "+2 this month" },
  { label: "Environments", value: "4", icon: Globe, color: "text-purple-500", trend: "Dev, Staging, Prod, QA" },
];

const MOCK_RECENT_PIPELINES = [
  { name: "frontend-app", status: "success", duration: "4m 23s", branch: "main", commit: "abc1234", time: "5 min ago" },
  { name: "backend-api", status: "running", duration: "-", branch: "feature/auth", commit: "def5678", time: "Running..." },
  { name: "data-pipeline", status: "failed", duration: "2m 15s", branch: "main", commit: "ghi9012", time: "12 min ago" },
  { name: "mobile-app", status: "success", duration: "6m 45s", branch: "release/v2.1", commit: "jkl3456", time: "1 hour ago" },
];

const MOCK_ENVIRONMENTS = [
  { name: "Production", status: "healthy", url: "app.nucleo.one", deployments: 142, lastDeploy: "2 hours ago", cpu: 62, memory: 71, requestRate: 84 },
  { name: "Staging", status: "healthy", url: "staging.nucleo.one", deployments: 389, lastDeploy: "30 min ago", cpu: 38, memory: 52, requestRate: 41 },
  { name: "Development", status: "warning", url: "dev.nucleo.one", deployments: 1205, lastDeploy: "5 min ago", cpu: 78, memory: 85, requestRate: 23 },
  { name: "QA", status: "healthy", url: "qa.nucleo.one", deployments: 256, lastDeploy: "1 hour ago", cpu: 29, memory: 44, requestRate: 18 },
];

const MOCK_DEPLOYMENT_TIMELINE = [
  { id: "d1", env: "Production", version: "v2.4.1", deployer: "Arya M.", duration: "4m 12s", status: "success", timestamp: "2h ago" },
  { id: "d2", env: "Staging", version: "v2.4.2-rc1", deployer: "James K.", duration: "3m 48s", status: "failed", timestamp: "3h ago" },
  { id: "d3", env: "Production", version: "v2.4.0", deployer: "Sarah L.", duration: "5m 02s", status: "success", timestamp: "6h ago" },
  { id: "d4", env: "QA", version: "v2.4.2-beta", deployer: "Mike R.", duration: "2m 55s", status: "rollback", timestamp: "8h ago" },
  { id: "d5", env: "Development", version: "v2.4.2-dev", deployer: "Arya M.", duration: "1m 34s", status: "success", timestamp: "10h ago" },
  { id: "d6", env: "Staging", version: "v2.4.1", deployer: "James K.", duration: "3m 22s", status: "success", timestamp: "14h ago" },
  { id: "d7", env: "Production", version: "v2.3.9", deployer: "Sarah L.", duration: "4m 45s", status: "success", timestamp: "1d ago" },
  { id: "d8", env: "QA", version: "v2.4.0", deployer: "Mike R.", duration: "2m 11s", status: "failed", timestamp: "1d ago" },
  { id: "d9", env: "Development", version: "v2.4.1-dev", deployer: "Arya M.", duration: "58s", status: "success", timestamp: "2d ago" },
  { id: "d10", env: "Staging", version: "v2.3.9", deployer: "James K.", duration: "3m 01s", status: "success", timestamp: "2d ago" },
];

const ENV_BADGE_COLORS: Record<string, string> = {
  Production: "bg-red-100 text-red-800",
  Staging: "bg-yellow-100 text-yellow-800",
  Development: "bg-blue-100 text-blue-800",
  QA: "bg-purple-100 text-purple-800",
};

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">{value}%</span>
    </div>
  );
}

function DevOpsDashboard() {
  const [rollbackTarget, setRollbackTarget] = useState<typeof MOCK_DEPLOYMENT_TIMELINE[0] | null>(null);

  const { data: pipelinesData, isLoading: pipelinesLoading, isError: pipelinesError, refetch: pipelinesRefetch } = useQuery({
    queryKey: ["devops", "pipelines"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/devops/pipelines?limit=5`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const { data: environmentsData, isLoading: envsLoading } = useQuery({
    queryKey: ["devops", "environments"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/devops/environments`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: deploymentsData } = useQuery({
    queryKey: ["devops", "deployments"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/devops/deployments?limit=10`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const recentPipelines = useMemo(() => {
    const data: any[] = pipelinesData?.data ?? [];
    if (data.length > 0) {
      return data.map((p: any) => ({
        name: p.name,
        status: p.status,
        duration: p.duration ?? "-",
        branch: p.branch ?? "main",
        commit: p.commitSha?.substring(0, 7) ?? "unknown",
        time: new Date(p.lastRunAt ?? p.createdAt).toLocaleString(),
      }));
    }
    return MOCK_RECENT_PIPELINES;
  }, [pipelinesData]);

  const environments = useMemo(() => {
    const data: any[] = Array.isArray(environmentsData) ? environmentsData : (environmentsData?.data ?? []);
    if (data.length > 0) {
      return data.map((e: any) => ({
        name: e.name,
        status: e.status ?? "healthy",
        lastDeploy: new Date(e.updatedAt ?? e.createdAt).toLocaleString(),
        url: e.url ?? "#",
        deployments: 0,
        cpu: 0,
        memory: 0,
        requestRate: 0,
      }));
    }
    return MOCK_ENVIRONMENTS;
  }, [environmentsData]);

  const stats = useMemo(() => {
    const data: any[] = pipelinesData?.data ?? [];
    if (!data.length) return MOCK_STATS;
    const total = pipelinesData?.total ?? data.length;
    const running = data.filter((p: any) => p.status === "running").length;
    const envCount = Array.isArray(environmentsData)
      ? environmentsData.length
      : (environmentsData?.data?.length ?? 4);
    return [
      { label: "Total Pipelines", value: String(total), icon: GitBranch, color: "text-blue-500", trend: `${running} running` },
      { label: "Running Builds", value: String(running), icon: Play, color: "text-emerald-500", trend: `${total - running} idle` },
      { label: "Environments", value: String(envCount), icon: Globe, color: "text-purple-500", trend: "Dev, Staging, Prod" },
      { label: "Success Rate", value: `${data.filter((p: any) => p.status === "success").length}/${data.length}`, icon: CheckCircle2, color: "text-amber-500", trend: "Last 5 runs" },
    ];
  }, [pipelinesData, environmentsData]);

  const deploymentTimeline = useMemo(() => {
    const data: any[] = deploymentsData?.data ?? [];
    if (!data.length) return MOCK_DEPLOYMENT_TIMELINE;
    return data.map((d: any) => ({
      id: d.id,
      env: d.environment ?? "Unknown",
      version: d.version ?? "v1.0.0",
      deployer: d.deployedBy ?? "System",
      duration: "-",
      status: d.status,
      timestamp: d.deployedAt
        ? new Date(d.deployedAt).toLocaleString()
        : new Date(d.createdAt).toLocaleString(),
    }));
  }, [deploymentsData]);

  if (pipelinesError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => pipelinesRefetch()}>Retry</Button>
    </div>
  );

  if (pipelinesLoading || envsLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonTable rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <p className="font-black text-2xl text-foreground mt-0.5">{stat.value}</p>
                  <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                    {stat.trend.includes("+") ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : null}
                    {stat.trend}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/30 p-2.5">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/app/devops/pipelines"
          className="rounded-lg border border-border/60 bg-card p-5 hover:bg-muted/50 transition-colors"
        >
          <GitBranch className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold text-foreground">Pipelines</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Manage CI/CD pipelines
          </p>
        </Link>
        <Link
          to="/app/devops/deployments"
          className="rounded-lg border border-border/60 bg-card p-5 hover:bg-muted/50 transition-colors"
        >
          <Rocket className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold text-foreground">Deployments</h3>
          <p className="text-xs text-muted-foreground mt-1">
            View deployment history
          </p>
        </Link>
        <Link
          to="/app/devops/infrastructure"
          className="rounded-lg border border-border/60 bg-card p-5 hover:bg-muted/50 transition-colors"
        >
          <Server className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold text-foreground">Infrastructure</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Manage servers and resources
          </p>
        </Link>
        <Link
          to="/app/devops/pipelines/new"
          className="rounded-lg border border-primary/30 bg-primary/5 p-5 hover:bg-primary/10 transition-colors"
        >
          <Play className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold text-foreground">New Pipeline</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Create a new pipeline
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pipeline Runs */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Recent Pipeline Runs</h3>
              <Link to="/app/devops/runs" className="text-xs text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentPipelines.map((pipeline, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                  <div className={`p-2 rounded-lg ${
                    pipeline.status === "success" ? "bg-green-500/10" :
                    pipeline.status === "running" ? "bg-blue-500/10" :
                    "bg-red-500/10"
                  }`}>
                    {pipeline.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : pipeline.status === "running" ? (
                      <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{pipeline.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pipeline.branch} - {pipeline.commit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{pipeline.duration}</p>
                    <p className="text-xs text-muted-foreground">{pipeline.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Environments with Resource Mini-Charts */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Environments</h3>
              <Link to="/app/devops/environments" className="text-xs text-primary hover:underline">
                Manage
              </Link>
            </div>
            <div className="space-y-3">
              {environments.map((env, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      env.status === "healthy" ? "bg-green-500" : "bg-amber-500"
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{env.name}</p>
                      <p className="text-xs text-muted-foreground">{env.url}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{env.deployments} deploys</p>
                      <p className="text-xs text-muted-foreground">{env.lastDeploy}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pl-5">
                    <div>
                      <p className="text-[9px] text-muted-foreground mb-1 font-semibold uppercase">CPU</p>
                      <MiniBar value={env.cpu} color={env.cpu > 75 ? "#ef4444" : env.cpu > 55 ? "#f59e0b" : "#22c55e"} />
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground mb-1 font-semibold uppercase">Memory</p>
                      <MiniBar value={env.memory} color={env.memory > 80 ? "#ef4444" : env.memory > 60 ? "#f59e0b" : "#22c55e"} />
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground mb-1 font-semibold uppercase">Req Rate</p>
                      <MiniBar value={env.requestRate} color="#2172cd" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deployment Timeline */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-foreground">Deployment Timeline</h3>
            </div>
            <Link to="/app/devops/deployments" className="text-xs text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs text-muted-foreground font-semibold pb-2 pr-4">Environment</th>
                  <th className="text-left text-xs text-muted-foreground font-semibold pb-2 pr-4">Version</th>
                  <th className="text-left text-xs text-muted-foreground font-semibold pb-2 pr-4">Deployer</th>
                  <th className="text-left text-xs text-muted-foreground font-semibold pb-2 pr-4">Duration</th>
                  <th className="text-left text-xs text-muted-foreground font-semibold pb-2 pr-4">Status</th>
                  <th className="text-left text-xs text-muted-foreground font-semibold pb-2 pr-4">Time</th>
                  <th className="text-left text-xs text-muted-foreground font-semibold pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {deploymentTimeline.map((deploy) => (
                  <tr key={deploy.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${ENV_BADGE_COLORS[deploy.env] ?? "bg-gray-100 text-gray-800"}`}>
                        {deploy.env}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-foreground">{deploy.version}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs text-muted-foreground">{deploy.deployer}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        {deploy.duration}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className={`flex items-center gap-1 text-xs font-semibold ${
                        deploy.status === "success" ? "text-green-600" :
                        deploy.status === "failed" ? "text-red-600" :
                        "text-amber-600"
                      }`}>
                        {deploy.status === "success" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : deploy.status === "failed" ? (
                          <AlertCircle className="h-3.5 w-3.5" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        {deploy.status}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{deploy.timestamp}</td>
                    <td className="py-2.5">
                      {(deploy.status === "failed" || deploy.id === "d1") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[10px] font-semibold text-amber-600 border-amber-300 hover:bg-amber-50"
                          leftIcon={<RotateCcw className="h-3 w-3" />}
                          onClick={() => setRollbackTarget(deploy)}
                        >
                          Rollback
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rollback Confirmation Modal */}
      <Dialog open={rollbackTarget !== null} onOpenChange={(open) => { if (!open) setRollbackTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Confirm Rollback
            </DialogTitle>
          </DialogHeader>
          {rollbackTarget && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                This will roll back <strong>{rollbackTarget.env}</strong> to the previous stable version before{" "}
                <strong className="font-mono">{rollbackTarget.version}</strong>.
              </p>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                <strong>Warning:</strong> This action will trigger a new deployment and may cause brief downtime.
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRollbackTarget(null)}>Cancel</Button>
            <Button
              variant="primary"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                setRollbackTarget(null);
              }}
            >
              Confirm Rollback
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* System Health */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">System Health</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">API Services</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Database</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">CI/CD Runner</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Running
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Container Registry</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Operational
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
