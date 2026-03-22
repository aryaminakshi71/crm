import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@crm/ui";
import { Container } from "lucide-react";

export const Route = createFileRoute("/app/devops/kubernetes")({
  component: Kubernetes,
});

function Kubernetes() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Kubernetes Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage clusters, deployments, pods, and services
        </p>
      </div>

      <EmptyState
        icon={<Container className="h-12 w-12 text-muted-foreground/50" />}
        title="Kubernetes integration coming soon"
        description="Connect your Kubernetes clusters to manage pods, deployments, and services directly from Nucleo. This feature requires a live Kubernetes API connection."
        action={{
          label: "View Documentation",
          onClick: () => window.open("https://docs.nucleo.one/devops/kubernetes", "_blank"),
        }}
      />
    </div>
  );
}
