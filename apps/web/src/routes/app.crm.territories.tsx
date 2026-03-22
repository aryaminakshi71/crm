import { EmptyState } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";

export const Route = createFileRoute("/app/crm/territories")({
  component: CrmTerritoriesPage,
});

function CrmTerritoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/crm" className="hover:text-foreground transition-colors">CRM</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Territories</span>
        </div>
        <h1 className="font-bold text-2xl text-foreground">Sales Territories</h1>
        <p className="text-muted-foreground text-sm">
          Define and manage geographic or account-based sales territories.
        </p>
      </div>
      <EmptyState
        icon={<Globe className="h-8 w-8 text-primary/40" />}
        title="Territories coming soon"
        description="Territory management and assignment will be available in an upcoming release."
      />
    </div>
  );
}
