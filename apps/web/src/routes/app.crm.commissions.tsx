import { EmptyState } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DollarSign } from "lucide-react";

export const Route = createFileRoute("/app/crm/commissions")({
  component: CrmCommissionsPage,
});

function CrmCommissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/crm" className="hover:text-foreground transition-colors">CRM</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Commissions</span>
        </div>
        <h1 className="font-bold text-2xl text-foreground">Commissions</h1>
        <p className="text-muted-foreground text-sm">
          Track and manage sales commissions for your team.
        </p>
      </div>
      <EmptyState
        icon={<DollarSign className="h-8 w-8 text-primary/40" />}
        title="Commissions coming soon"
        description="Sales commission tracking and payouts will be available in an upcoming release."
      />
    </div>
  );
}
