import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@crm/ui";
import { Container } from "lucide-react";

export const Route = createFileRoute("/app/devops/registry")({
  component: Registry,
});

function Registry() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Container Registry</h2>
        <p className="text-sm text-muted-foreground">
          Browse and manage container images
        </p>
      </div>

      <EmptyState
        icon={<Container className="h-12 w-12 text-muted-foreground/50" />}
        title="Container Registry coming soon"
        description="Connect your container registry to browse images, tags, and vulnerability reports. Supports Docker Hub, AWS ECR, Google Artifact Registry, and more."
        action={{
          label: "View Documentation",
          onClick: () => window.open("https://docs.nucleo.one/devops/registry", "_blank"),
        }}
      />
    </div>
  );
}
