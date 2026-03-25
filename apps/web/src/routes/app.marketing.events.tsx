import { Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Globe,
  AlertCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { nucleoApi } from "@/lib/api";

export const Route = createFileRoute("/app/marketing/events")({
  component: MarketingEventsPage,
});

function MarketingEventsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", goal: "", location: "", date: "" });

  // Filter campaigns by type=event or channel=event if available
  const { data, isLoading, isError, refetch} = useQuery({
    queryKey: ["marketing-events"],
    queryFn: () => nucleoApi.campaigns.list({ page: 1, limit: 100 }),
  });

  const createEventMutation = useMutation({
    mutationFn: (data: { name: string; goal?: string; location?: string; date?: string }) =>
      nucleoApi.campaigns.create({ name: data.name, type: "event", goal: data.goal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-events"] });
      toast.success("Event created successfully");
      setIsModalOpen(false);
      setForm({ name: "", goal: "", location: "", date: "" });
    },
    onError: () => toast.error("Failed to create event"),
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => nucleoApi.campaigns.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-events"] });
      toast.success("Event deleted");
    },
    onError: () => toast.error("Failed to delete event"),
  });

  const allCampaigns = (data?.data as any[]) ?? [];
  // Events are campaigns with type === "event" or name containing "event"
  const events = allCampaigns.filter(
    (c: any) => c.type === "event" || (c.name || "").toLowerCase().includes("event"),
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
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
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          New Event
        </Button>
      </div>

      {/* New Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border border-border p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">New Event</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Event Name *</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Annual Summit 2026"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</label>
                <Input
                  className="mt-1"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. San Francisco, CA or Virtual"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
                <Input
                  className="mt-1"
                  placeholder="Brief description of the event"
                  value={form.goal}
                  onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!form.name.trim() || createEventMutation.isPending}
                onClick={() => createEventMutation.mutate(form)}
              >
                {createEventMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  <button
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    disabled={deleteEventMutation.isPending}
                    onClick={() => deleteEventMutation.mutate(event.id)}
                    title="Delete event"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
