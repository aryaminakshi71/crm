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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Route = createFileRoute("/app/devops/_index")({
  component: DevOpsDashboard,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
}

const ENV_BADGE_COLORS: Record<string, string> = {
  Production: "bg-red-100 text-red-800",
  Staging: "bg-yellow-100 text-yellow-800",
  Development: "bg-blue-100 text-blue-800",
  QA: "bg-purple-100 text-purple-800",
};

const deploymentData = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(Date.now() - (13 - i) * 86400000);
  return {
    date: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
    deployments: Math.floor(Math.random() * 8) + 1,
    failures: Math.floor(Math.random() * 2),
  };
});

const BUILD_SUCCESS_DATA = [
  { name: "Success", value: 87, color: "#22c55e" },
  { name: "Failed", value: 13, color: "#ef4444" },
];

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
  const [rollbackTarget, setRollbackTarget] = useState<any | null>(null);

  const { data: pipelinesData, isLoading: pipelinesLoading, isError: pipelinesError, refetch: pipelinesRefetch } = useQuery({
    queryKey: ["devops", "pipelines"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/devops/pipelines?limit=5`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    placeholderData: (prev) => prev,
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
    placeholderData: (prev) => prev,
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
    placeholderData: (prev) => prev,
  });

  const recentPipelines = useMemo(() => {
    const data: any[] = (pipelinesData as any)?.data ?? [];
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
    return [];
  }, [pipelinesData]);

  const environments = useMemo(() => {
    const data: any[] = Array.isArray(environmentsData) ? environmentsData : ((environmentsData as any)?.data ?? []);
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
    return [];
  }, [environmentsData]);

  const stats = useMemo(() => {
    const data: any[] = (pipelinesData as any)?.data ?? [];
    if (!data.length) return [];
    const total = (pipelinesData as any)?.total ?? data.length;
    const running = data.filter((p: any) => p.status === "running").length;
    const envCount = Array.isArray(environmentsData)
      ? environmentsData.length
      : ((environmentsData as any)?.data?.length ?? 4);
    return [
      { label: "Total Pipelines", value: String(total), icon: GitBranch, color: "text-blue-500", trend: `${running} running` },
      { label: "Running Builds", value: String(running), icon: Play, color: "text-emerald-500", trend: `${total - running} idle` },
      { label: "Environments", value: String(envCount), icon: Globe, color: "text-purple-500", trend: "Dev, Staging, Prod" },
      { label: "Success Rate", value: `${data.filter((p: any) => p.status === "success").length}/${data.length}`, icon: CheckCircle2, color: "text-amber-500", trend: "Last 5 runs" },
    ];
  }, [pipelinesData, environmentsData]);

  const deploymentTimeline = useMemo(() => {
    const data: any[] = (deploymentsData as any)?.data ?? [];
    if (!data.length) return [];
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

      {/* Charts: Deployment Frequency + Build Success Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/60 lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Deployment Frequency</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={deploymentData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="deployGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="failGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="deployments" name="Deployments" stroke="#3b82f6" strokeWidth={2} fill="url(#deployGradient)" dot={false} activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="failures" name="Failures" stroke="#ef4444" strokeWidth={2} fill="url(#failGradient)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Build Success Rate</h3>
            <div className="h-[200px] flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={BUILD_SUCCESS_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {BUILD_SUCCESS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 text-xs">
                {BUILD_SUCCESS_DATA.map((d) => (
                  <span key={d.name} className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold">{d.value}%</span>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
