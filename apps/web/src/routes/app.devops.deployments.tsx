import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Rocket,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Play,
  Pause,
} from "lucide-react";

export const Route = createFileRoute("/app/devops/deployments")({
  component: Deployments,
});

const deployments = [
  { id: 1, application: "frontend-app", version: "v2.1.45", environment: "production", status: "success", deployedBy: "John Smith", deployedAt: "Mar 20, 2026 8:30 AM", duration: "2m 15s", commit: "abc1234" },
  { id: 2, application: "backend-api", version: "v3.2.12", environment: "production", status: "success", deployedBy: "Jane Doe", deployedAt: "Mar 20, 2026 8:15 AM", duration: "3m 45s", commit: "def5678" },
  { id: 3, application: "frontend-app", version: "v2.1.44", environment: "staging", status: "success", deployedBy: "Mike Wilson", deployedAt: "Mar 20, 2026 7:45 AM", duration: "2m 20s", commit: "ghi9012" },
  { id: 4, application: "data-pipeline", version: "v1.5.8", environment: "production", status: "failed", deployedBy: "Sarah Johnson", deployedAt: "Mar 20, 2026 7:30 AM", duration: "1m 30s", commit: "jkl3456", error: "Health check failed" },
  { id: 5, application: "mobile-app", version: "v2.1.0", environment: "production", status: "success", deployedBy: "Tom Brown", deployedAt: "Mar 19, 2026 6:00 PM", duration: "4m 10s", commit: "mno7890" },
  { id: 6, application: "backend-api", version: "v3.2.11", environment: "staging", status: "success", deployedBy: "Lisa Chen", deployedAt: "Mar 19, 2026 4:30 PM", duration: "3m 50s", commit: "pqr2345" },
];

const environments = ["production", "staging", "development", "qa"];

function Deployments() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Deployments</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage all deployments across environments
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Rocket className="h-4 w-4" />
            New Deployment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Rocket className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">142</p>
            <p className="text-xs text-muted-foreground">Total Deployments</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">136</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">2.8m</p>
            <p className="text-xs text-muted-foreground">Avg Duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deployments..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Environments</option>
          {environments.map((env) => (
            <option key={env} value={env}>{env}</option>
          ))}
        </select>
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Deployments List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {deployments.map((deployment) => (
              <div key={deployment.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                <div className={`p-2 rounded-lg ${
                  deployment.status === "success" ? "bg-green-500/10" :
                  deployment.status === "failed" ? "bg-red-500/10" :
                  "bg-blue-500/10"
                }`}>
                  {deployment.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : deployment.status === "failed" ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{deployment.application}</p>
                    <span className="text-xs text-muted-foreground font-mono">{deployment.version}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      deployment.environment === "production" ? "bg-red-500/10 text-red-500" :
                      deployment.environment === "staging" ? "bg-blue-500/10 text-blue-500" :
                      "bg-green-500/10 text-green-500"
                    }`}>
                      {deployment.environment}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {deployment.error || `Deployed by ${deployment.deployedBy} - ${deployment.commit}`}
                  </p>
                </div>
                <div className="text-right min-w-[150px]">
                  <p className="text-sm">{deployment.deployedAt}</p>
                  <p className="text-xs text-muted-foreground">{deployment.duration}</p>
                </div>
                <div className="flex gap-1">
                  {deployment.status === "success" && (
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Rollback">
                      <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  <Link
                    to="/app/devops/deployments/$id"
                    params={{ id: String(deployment.id) }}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
