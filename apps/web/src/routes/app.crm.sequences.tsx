import { Button, EmptyState } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Zap,
  AlertCircle
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export const Route = createFileRoute("/app/crm/sequences")({
  component: CrmSequencesPage,
});

function CrmSequencesPage() {
  const query = useQuery({
    queryKey: ["crm/sequences"],
    queryFn: () =>
      fetch(`${API_BASE}/crm/sequences`, {
        headers: { "x-org-id": localStorage.getItem("activeOrganizationId") ?? "" },
      }).then((r) => r.json()),
    retry: false,
  });

  const hasData = Array.isArray(query.data?.data) && query.data.data.length > 0;

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
      {!hasData && (
        <EmptyState
          icon={<Zap className="h-8 w-8 text-primary/40" />}
          title="Sequences coming soon"
          description="Email and outreach sequences will be available in an upcoming release. Stay tuned!"
        />
      )}
    </div>
  );
}
