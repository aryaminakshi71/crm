import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, EmptyState, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Select, Badge } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Plus, Search, ArrowRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integration/events")({
  component: EventsPage,
});

function EventsPage() {
  const navigate = useNavigate();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [events, setEvents] = useState<Array<{
    id: string;
    type: string;
    source: string;
    createdAt: string;
    payload: Record<string, unknown>;
  }>>([]);
  const [newEvent, setNewEvent] = useState({ type: "", source: "", payload: "{}" });
  const [search, setSearch] = useState("");

  const handlePublish = () => {
    if (!newEvent.type.trim()) return;
    const event = {
      id: crypto.randomUUID(),
      type: newEvent.type,
      source: newEvent.source || "api",
      createdAt: new Date().toISOString(),
      payload: JSON.parse(newEvent.payload || "{}"),
    };
    setEvents([event, ...events]);
    setNewEvent({ type: "", source: "", payload: "{}" });
    setShowPublishDialog(false);
  };

  const filteredEvents = events.filter((e) =>
    e.type.toLowerCase().includes(search.toLowerCase()) ||
    e.source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/integration" })}>
              ←
            </Button>
            <div>
              <h2 className="font-bold text-xl text-foreground">Events</h2>
              <p className="text-muted-foreground text-sm">
                View and manage event subscriptions and payloads.
              </p>
            </div>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowPublishDialog(true)}>
          Publish Event
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <EmptyState
              icon={<Bell className="h-8 w-8" />}
              title="No events yet"
              description="Events from your integrations will appear here. Publish an event to get started."
              action={
                <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowPublishDialog(true)}>
                  Publish Event
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Badge variant="outline">{event.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{event.source}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(event.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {JSON.stringify(event.payload).slice(0, 50)}...
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <Input
                placeholder="e.g., user.created, order.completed"
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <Input
                placeholder="e.g., api, webhook, workflow"
                value={newEvent.source}
                onChange={(e) => setNewEvent({ ...newEvent, source: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payload (JSON)</label>
              <textarea
                className="w-full h-32 px-3 py-2 border rounded-md bg-background text-sm font-mono"
                placeholder='{"key": "value"}'
                value={newEvent.payload}
                onChange={(e) => setNewEvent({ ...newEvent, payload: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Cancel</Button>
            <Button variant="primary" onClick={handlePublish}>Publish</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
