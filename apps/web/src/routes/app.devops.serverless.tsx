import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@crm/ui";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/app/devops/serverless")({
  component: Serverless,
});

function Serverless() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Serverless Functions</h2>
        <p className="text-sm text-muted-foreground">
          Deploy and manage serverless functions
        </p>
      </div>

      <EmptyState
        icon={<Zap className="h-12 w-12 text-muted-foreground/50" />}
        title="Serverless Functions coming soon"
        description="Deploy and monitor serverless functions across AWS Lambda, Google Cloud Functions, Vercel, and Cloudflare Workers — all from one place."
        action={{
          label: "View Documentation",
          onClick: () => window.open("https://docs.nucleo.one/devops/serverless", "_blank"),
        }}
      />
    </div>
  );
}
