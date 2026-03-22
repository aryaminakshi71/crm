import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@crm/ui";
import { Key } from "lucide-react";

export const Route = createFileRoute("/app/devops/secrets")({
  component: Secrets,
});

function Secrets() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Secrets Management</h2>
        <p className="text-sm text-muted-foreground">
          Securely manage API keys, passwords, and sensitive data
        </p>
      </div>

      <EmptyState
        icon={<Key className="h-12 w-12 text-muted-foreground/50" />}
        title="Secrets Management coming soon"
        description="Securely store and rotate API keys, database passwords, and cloud credentials. Integration with HashiCorp Vault, AWS Secrets Manager, and 1Password coming soon."
        action={{
          label: "View Documentation",
          onClick: () => window.open("https://docs.nucleo.one/devops/secrets", "_blank"),
        }}
      />
    </div>
  );
}
