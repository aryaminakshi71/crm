import {
  Card,
  CardContent,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Globe } from "lucide-react";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/marketing/events")({
  component: MarketingEventsPage,
});

function MarketingEventsPage() {
  // Filter campaigns by type=event or channel=event if available
  const { data, isLoading } = useQuery({
    queryKey: ["marketing-events"],
    queryFn: () => nucleoApi.campaigns.list({ page: 1, limit: 100 }),
  });

  const allCampaigns = (data?.data as any[]) ?? [];
  // Events are campaigns with type === "event" or name containing "event"
  const events = allCampaigns.filter(
    (c: any) => c.type === "event" || (c.name || "").toLowerCase().includes("event"),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link to="/app/marketing" className="hover:text-foreground transition-colors">Marketing</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Events</span>
        </div>
        <h1 className="font-bold text-2xl text-foreground">Events</h1>
        <p className="text-muted-foreground text-sm">
          Webinars, conferences, and event-based campaigns.
        </p>
      </div>

      {isLoading ? (
        <Loading text="Loading events..." />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-8 w-8 text-primary/40" />}
          title="No events found"
          description="Event-type campaigns will appear here. Create a campaign with type 'event' to get started. A dedicated event manager is coming soon."
        />
      ) : (
        <div className="grid gap-3">
          {events.map((event: any) => (
            <Card key={event.id} className="border-border/60 hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-muted/30 p-2.5 text-muted-foreground shrink-0">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{event.name}</p>
                    {event.goal && (
                      <p className="text-muted-foreground text-xs mt-0.5">{event.goal}</p>
                    )}
                    <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      event.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
