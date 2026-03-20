import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
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
} from "lucide-react";

export const Route = createFileRoute("/app/devops/_index")({
  component: DevOpsDashboard,
});

const stats = [
  { label: "Active Pipelines", value: "12", icon: GitBranch, color: "text-blue-500", trend: "+3 from last week" },
  { label: "Running Builds", value: "3", icon: Play, color: "text-emerald-500", trend: "2 queued" },
  { label: "Servers", value: "24", icon: Server, color: "text-amber-500", trend: "+2 this month" },
  { label: "Environments", value: "4", icon: Globe, color: "text-purple-500", trend: "Dev, Staging, Prod, QA" },
];

const recentPipelines = [
  { name: "frontend-app", status: "success", duration: "4m 23s", branch: "main", commit: "abc1234", time: "5 min ago" },
  { name: "backend-api", status: "running", duration: "-", branch: "feature/auth", commit: "def5678", time: "Running..." },
  { name: "data-pipeline", status: "failed", duration: "2m 15s", branch: "main", commit: "ghi9012", time: "12 min ago" },
  { name: "mobile-app", status: "success", duration: "6m 45s", branch: "release/v2.1", commit: "jkl3456", time: "1 hour ago" },
];

const environments = [
  { name: "Production", status: "healthy", url: "app.nucleo.one", deployments: 142, lastDeploy: "2 hours ago" },
  { name: "Staging", status: "healthy", url: "staging.nucleo.one", deployments: 389, lastDeploy: "30 min ago" },
  { name: "Development", status: "warning", url: "dev.nucleo.one", deployments: 1205, lastDeploy: "5 min ago" },
  { name: "QA", status: "healthy", url: "qa.nucleo.one", deployments: 256, lastDeploy: "1 hour ago" },
];

function DevOpsDashboard() {
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

        {/* Environments */}
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
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                  <div className={`w-3 h-3 rounded-full ${
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
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
