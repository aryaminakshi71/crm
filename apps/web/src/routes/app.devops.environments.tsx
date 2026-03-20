import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  Globe,
  Plus,
  Settings,
  CheckCircle2,
  AlertCircle,
  Rocket,
  Server,
  Activity,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/app/devops/environments")({
  component: Environments,
});

const environments = [
  { id: 1, name: "Production", url: "app.nucleo.one", status: "healthy", servers: 8, deployments: 142, lastDeploy: "2 hours ago", branch: "main", color: "red" },
  { id: 2, name: "Staging", url: "staging.nucleo.one", status: "healthy", servers: 4, deployments: 389, lastDeploy: "30 min ago", branch: "main", color: "blue" },
  { id: 3, name: "Development", url: "dev.nucleo.one", status: "warning", servers: 2, deployments: 1205, lastDeploy: "5 min ago", branch: "develop", color: "green" },
  { id: 4, name: "QA", url: "qa.nucleo.one", status: "healthy", servers: 2, deployments: 256, lastDeploy: "1 hour ago", branch: "main", color: "purple" },
];

function Environments() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Environment Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage deployment environments and configurations
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          New Environment
        </button>
      </div>

      {/* Environments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {environments.map((env) => (
          <Card key={env.id} className={`border-${
            env.color === "red" ? "red" : env.color === "blue" ? "blue" : env.color === "green" ? "green" : "purple"
          }-500/30 hover:border-primary/30 transition-colors`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-${env.color}-500/10`}>
                    <Globe className={`h-6 w-6 text-${env.color}-500`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{env.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        env.status === "healthy" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {env.status}
                      </span>
                    </div>
                    <a href={`https://${env.url}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                      {env.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <Server className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-bold">{env.servers}</p>
                  <p className="text-xs text-muted-foreground">Servers</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <Rocket className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-bold">{env.deployments}</p>
                  <p className="text-xs text-muted-foreground">Deploys</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <Activity className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm font-bold">99.9%</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-sm font-bold">{env.branch}</p>
                  <p className="text-xs text-muted-foreground">Branch</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <span className="text-sm text-muted-foreground">Last deployment: {env.lastDeploy}</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                    View Logs
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                    Deploy
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
