/**
 * Event Subscriptions
 *
 * Manage event subscriptions for your integrations.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Search,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Settings,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integrations/events")({
  component: EventsPage,
});

function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const subscriptions = [
    {
      id: "sub1",
      name: "Lead Events",
      connector: "Salesforce",
      events: ["lead.created", "lead.updated", "lead.deleted"],
      status: "active",
      endpoint: "https://api.nucleo.io/webhooks/leads",
      lastEvent: "2 min ago",
      totalEvents: 4521,
    },
    {
      id: "sub2",
      name: "Payment Events",
      connector: "Stripe",
      events: ["payment.succeeded", "payment.failed", "refund.created"],
      status: "active",
      endpoint: "https://api.nucleo.io/webhooks/payments",
      lastEvent: "5 min ago",
      totalEvents: 2341,
    },
    {
      id: "sub3",
      name: "Order Events",
      connector: "Shopify",
      events: ["order.created", "order.updated", "order.cancelled"],
      status: "active",
      endpoint: "https://api.nucleo.io/webhooks/orders",
      lastEvent: "1 min ago",
      totalEvents: 1892,
    },
    {
      id: "sub4",
      name: "Support Events",
      connector: "Zendesk",
      events: ["ticket.created", "ticket.updated"],
      status: "paused",
      endpoint: "https://api.nucleo.io/webhooks/support",
      lastEvent: "3 days ago",
      totalEvents: 234,
    },
    {
      id: "sub5",
      name: "Contact Events",
      connector: "HubSpot",
      events: ["contact.created", "contact.updated"],
      status: "active",
      endpoint: "https://api.nucleo.io/webhooks/contacts",
      lastEvent: "10 min ago",
      totalEvents: 1567,
    },
  ];

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.connector.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" size="sm">Active</Badge>;
      case "paused":
        return <Badge variant="warning" size="sm">Paused</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Event Subscriptions</h2>
          <p className="text-sm text-muted-foreground">
            {subscriptions.length} subscriptions / {subscriptions.filter((s) => s.status === "active").length} active
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          New Subscription
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {filteredSubscriptions.map((sub) => (
          <Card key={sub.id} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2 mt-1">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{sub.name}</h3>
                    {getStatusBadge(sub.status)}
                    <Badge variant="default" size="sm">{sub.connector}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sub.events.map((event) => (
                      <Badge key={event} variant="outline" size="sm">{event}</Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <span className="font-medium">Endpoint:</span> {sub.endpoint}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last event: {sub.lastEvent}
                    </span>
                    <span>{sub.totalEvents.toLocaleString()} total events</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {sub.status === "active" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubscriptions.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No subscriptions found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search or filter criteria.
          </p>
          <Button leftIcon={<Plus className="h-4 w-4" />}>Create Subscription</Button>
        </div>
      )}
    </div>
  );
}
