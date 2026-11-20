import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import {
  GitBranch,
  Play,
  Server,
  Globe,
  Container,
  Key,
  Settings,
  Rocket,
  History,
  Box,
  Layers,
  Terminal,
} from "lucide-react";

export const Route = createFileRoute("/app/devops")({
  component: DevOpsLayout,
});

const navItems = [
  { to: "/app/devops", label: "Dashboard", icon: Globe },
  { to: "/app/devops/pipelines", label: "Pipelines", icon: GitBranch },
  { to: "/app/devops/runs", label: "Run History", icon: History },
  { to: "/app/devops/deployments", label: "Deployments", icon: Rocket },
  { to: "/app/devops/environments", label: "Environments", icon: Layers },
  { to: "/app/devops/infrastructure", label: "Infrastructure", icon: Server },
  { to: "/app/devops/kubernetes", label: "Kubernetes", icon: Container },
  { to: "/app/devops/serverless", label: "Serverless", icon: Box },
  { to: "/app/devops/registry", label: "Container Registry", icon: Container },
  { to: "/app/devops/secrets", label: "Secrets", icon: Key },
  { to: "/app/devops/settings", label: "Settings", icon: Settings },
];

function DevOpsLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Terminal className="h-7 w-7 text-primary" />
          DevOps CI/CD
        </h1>
        <p className="text-muted-foreground">
          Manage pipelines, deployments, infrastructure, and DevOps workflows
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-border/60">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
            activeProps={{ className: "bg-muted text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground" }}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
