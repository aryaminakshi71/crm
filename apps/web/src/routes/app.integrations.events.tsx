import { Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { Zap,
  AlertCircle
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
});

const SOURCE_COLORS: Record<string, string> = {
  CRM: "text-blue-500",
  Finance: "text-emerald-500",
  Helpdesk: "text-violet-500",
  HRM: "text-orange-500",
};

export const Route = createFileRoute("/app/integrations/events")({
  component: EventsLayout,
});

function EventsLayout() {
  const location = useLocation();
  const isSubRoute = location.pathname !== "/app/integrations/events";
  if (isSubRoute) return <Outlet />;
  return <EventsPage />;
}

function EventsPage() {
  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["integration", "events"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/v1/integration/events`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const events = (data as any)?.data ?? [];

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Events & Triggers</h1>
        <p className="text-muted-foreground mt-1">
          Available events that can trigger integration workflows.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {events.map((event: any) => (
            <Card key={event.id} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted flex-shrink-0">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{event.name}</p>
                    <Badge variant="outline" className="text-xs">
                      <span className={SOURCE_COLORS[event.source] ?? ""}>{event.source}</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                </div>
                <Badge variant="secondary">{event.type}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
