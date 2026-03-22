import { EmptyState } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/app/marketing/automation")({
  component: MarketingAutomationPage,
});

function MarketingAutomationPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Automation</span>
        </div>
        <h1 className="font-bold text-2xl text-foreground">Marketing Automation</h1>
        <p className="text-muted-foreground text-sm">
          Build automated workflows for lead nurturing and campaign execution.
        </p>
      </div>
      <EmptyState
        icon={<Zap className="h-8 w-8 text-primary/40" />}
        title="Automation coming soon"
        description="Drag-and-drop workflow automation for marketing campaigns will be available in an upcoming release."
      />
    </div>
  );
}
