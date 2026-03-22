import { EmptyState } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";

export const Route = createFileRoute("/app/marketing/ab-testing")({
  component: MarketingAbTestingPage,
});

function MarketingAbTestingPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <span>/</span>
          <span className="text-foreground font-medium">A/B Testing</span>
        </div>
        <h1 className="font-bold text-2xl text-foreground">A/B Testing</h1>
        <p className="text-muted-foreground text-sm">
          Test variations of campaigns to optimize performance.
        </p>
      </div>
      <EmptyState
        icon={<FlaskConical className="h-8 w-8 text-primary/40" />}
        title="A/B Testing coming soon"
        description="Split testing for campaigns, email subject lines, and landing pages will be available in an upcoming release."
      />
    </div>
  );
}
