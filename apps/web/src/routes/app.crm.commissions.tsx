import { Button, EmptyState } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DollarSign,
  AlertCircle
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export const Route = createFileRoute("/app/crm/commissions")({
  component: CrmCommissionsPage,
});

function CrmCommissionsPage() {
  const query = useQuery({
    queryKey: ["crm/commissions"],
    queryFn: () =>
      fetch(`${API_BASE}/crm/commissions`, {
        headers: { "x-org-id": localStorage.getItem("activeOrganizationId") ?? "" },
      }).then((r) => r.json()),
    retry: false,
  });

  const hasData = Array.isArray(query.data?.data) && query.data.data.length > 0;

  if (query.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => query.refetch()}>Retry</Button>
    </div>
  );

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
      {!hasData && (
        <EmptyState
          icon={<DollarSign className="h-8 w-8 text-primary/40" />}
          title="Commissions coming soon"
          description="Sales commission tracking and payouts will be available in an upcoming release."
        />
      )}
    </div>
  );
}
