/**
 * Event Management
 *
 * Manage in-person and hybrid events.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  CalendarCheck,
  Clock,
  Edit,
  Globe,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Ticket,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/marketing/events")({
  component: EventManagement,
});

const events = [
  {
    id: "1",
    title: "SaaS Summit 2026",
    type: "conference",
    format: "in-person",
    status: "upcoming",
    date: "2026-04-15",
    endDate: "2026-04-17",
    location: "San Francisco, CA",
    venue: "Moscone Center",
    capacity: 2500,
    registered: 1876,
    waitlist: 234,
    ticketTypes: [
      { name: "General", price: 299, sold: 1200 },
      { name: "VIP", price: 599, sold: 156 },
      { name: "Workshop", price: 199, sold: 520 },
    ],
  },
  {
    id: "2",
    title: "Product Roadmap Webinar",
    type: "webinar",
    format: "virtual",
    status: "upcoming",
    date: "2026-03-28",
    time: "2:00 PM EST",
    duration: 60,
    capacity: 500,
    registered: 312,
    ticketTypes: [
      { name: "Free", price: 0, sold: 312 },
    ],
  },
  {
    id: "3",
    title: "Networking Mixer - Austin",
    type: "networking",
    format: "in-person",
    status: "upcoming",
    date: "2026-04-08",
    time: "6:00 PM CST",
    location: "Austin, TX",
    venue: "The Driskill Hotel",
    capacity: 150,
    registered: 89,
    ticketTypes: [
      { name: "Standard", price: 25, sold: 89 },
    ],
  },
  {
    id: "4",
    title: "Partner Enablement Day",
    type: "workshop",
    format: "hybrid",
    status: "completed",
    date: "2026-03-05",
    location: "New York, NY",
    venue: "Andaz Hotel",
    capacity: 100,
    registered: 78,
    attended: 72,
    ticketTypes: [
      { name: "In-Person", price: 149, sold: 45 },
      { name: "Virtual", price: 49, sold: 33 },
    ],
  },
  {
    id: "5",
    title: "Community Meetup - Seattle",
    type: "networking",
    format: "in-person",
    status: "completed",
    date: "2026-02-20",
    location: "Seattle, WA",
    venue: "Impact Hub",
    capacity: 80,
    registered: 67,
    attended: 62,
    ticketTypes: [
      { name: "Standard", price: 15, sold: 67 },
    ],
  },
];

function EventManagement() {
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed">("all");
  const [eventType, setEventType] = useState<string>("all");

  const filteredEvents = events.filter((event) => {
    if (activeTab === "upcoming" && event.status === "completed") return false;
    if (activeTab === "completed" && event.status !== "completed") return false;
    if (eventType !== "all" && event.type !== eventType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/marketing">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-xl text-foreground">Event Management</h2>
            <p className="text-sm text-muted-foreground">Manage in-person and virtual events</p>
          </div>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Create Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total Events" value="8" icon={<Calendar className="h-4 w-4" />} color="text-primary" />
        <StatCard title="Upcoming" value="3" icon={<CalendarDays className="h-4 w-4" />} color="text-violet-400" />
        <StatCard title="Total Attendees" value="2,412" icon={<Users className="h-4 w-4" />} color="text-emerald-400" />
        <StatCard title="Revenue" value="$48.2K" icon={<Ticket className="h-4 w-4" />} color="text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="border-b border-border">
          <nav className="flex gap-4">
            {[
              { id: "all", label: "All" },
              { id: "upcoming", label: "Upcoming" },
              { id: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="conference">Conference</option>
          <option value="webinar">Webinar</option>
          <option value="workshop">Workshop</option>
          <option value="networking">Networking</option>
        </select>
      </div>

      {/* Event List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      {event.format === "virtual" ? (
                        <Video className="h-6 w-6 text-primary" />
                      ) : (
                        <MapPin className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="capitalize">{event.type}</Badge>
                        <Badge variant="outline" className="capitalize">{event.format}</Badge>
                        <Badge variant={event.status === "upcoming" ? "primary" : "outline"}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="flex items-center gap-1 text-sm font-medium">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.date).toLocaleDateString()}
                        {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    {event.time && (
                      <div>
                        <p className="text-xs text-muted-foreground">Time</p>
                        <p className="flex items-center gap-1 text-sm font-medium">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </p>
                      </div>
                    )}
                    {event.location && (
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="flex items-center gap-1 text-sm font-medium">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Venue</p>
                      <p className="text-sm font-medium">{event.venue || "N/A"}</p>
                    </div>
                  </div>

                  {/* Ticket Types */}
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Ticket Sales</p>
                    <div className="flex flex-wrap gap-4">
                      {event.ticketTypes.map((ticket) => (
                        <div key={ticket.name} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{ticket.name}:</span>
                          <span className="text-xs font-medium">
                            {ticket.sold} sold {ticket.price > 0 ? `($${ticket.price})` : "(Free)"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  {/* Capacity */}
                  <div className="text-right">
                    <p className="text-2xl font-bold">{event.registered}</p>
                    <p className="text-xs text-muted-foreground">
                      / {event.capacity} capacity
                      {event.waitlist && ` (+${event.waitlist} waitlist)`}
                    </p>
                  </div>

                  {/* Capacity Bar */}
                  <div className="w-32">
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${event.registered / event.capacity > 0.9 ? "bg-rose-400" : event.registered / event.capacity > 0.7 ? "bg-amber-400" : "bg-primary"}`}
                        style={{ width: `${Math.min((event.registered / event.capacity) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-xl text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
