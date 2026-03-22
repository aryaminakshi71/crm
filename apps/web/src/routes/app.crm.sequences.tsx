import { EmptyState } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/app/crm/sequences")({
  component: CrmSequencesPage,
});

function CrmSequencesPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/crm" className="hover:text-foreground transition-colors">CRM</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Sequences</span>
        </div>
        <h1 className="font-bold text-2xl text-foreground">Email Sequences</h1>
        <p className="text-muted-foreground text-sm">
          Automate multi-step outreach sequences for leads.
        </p>
      </div>
      <EmptyState
        icon={<Zap className="h-8 w-8 text-primary/40" />}
        title="Sequences coming soon"
        description="Email and outreach sequences will be available in an upcoming release. Stay tuned!"
      />
    </div>
  );
}
