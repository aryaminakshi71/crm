import { EmptyState } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

export const Route = createFileRoute("/app/marketing/lead-scoring")({
  component: MarketingLeadScoringPage,
});

function MarketingLeadScoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Lead Scoring</span>
        </div>
        <h1 className="font-bold text-2xl text-foreground">Lead Scoring</h1>
        <p className="text-muted-foreground text-sm">
          Configure scoring rules to automatically qualify marketing leads.
        </p>
      </div>
      <EmptyState
        icon={<Star className="h-8 w-8 text-primary/40" />}
        title="Lead scoring coming soon"
        description="Rule-based and AI-powered lead scoring configuration will be available in an upcoming release. You can already score individual leads in the CRM."
      />
    </div>
  );
}
