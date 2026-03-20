/**
 * Event Log
 *
 * View and search all integration events.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integrations/events/log")({
  component: EventLogPage,
});

function EventLogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterConnector, setFilterConnector] = useState("all");

  const events = [
    {
      id: "evt_001",
      type: "workflow.completed",
      connector: "Salesforce",
      workflow: "Lead Sync",
      status: "success",
      timestamp: "2 min ago",
      duration: "1.2s",
      details: "Successfully synced 5 records",
    },
    {
      id: "evt_002",
      type: "connector.error",
      connector: "Stripe",
      workflow: "Payment Sync",
      status: "error",
      timestamp: "5 min ago",
      duration: "0.5s",
      details: "Connection timeout after 30s",
    },
    {
      id: "evt_003",
      type: "event.received",
      connector: "Shopify",
      workflow: "Order Created",
      status: "success",
      timestamp: "8 min ago",
      duration: "0.8s",
      details: "Received order #12345",
    },
    {
      id: "evt_004",
      type: "webhook.triggered",
      connector: "Slack",
      workflow: "Notify Team",
      status: "success",
      timestamp: "12 min ago",
      duration: "0.3s",
      details: "Message sent to #sales channel",
    },
    {
      id: "evt_005",
      type: "workflow.completed",
      connector: "HubSpot",
      workflow: "Contact Update",
      status: "success",
      timestamp: "15 min ago",
      duration: "1.1s",
      details: "Updated 3 contact records",
    },
    {
      id: "evt_006",
      type: "connector.error",
      connector: "QuickBooks",
      workflow: "Invoice Sync",
      status: "error",
      timestamp: "30 min ago",
      duration: "0.2s",
      details: "Authentication failed: Invalid token",
    },
    {
      id: "evt_007",
      type: "event.received",
      connector: "GitHub",
      workflow: "Issue Sync",
      status: "success",
      timestamp: "45 min ago",
      duration: "0.9s",
      details: "Received issue #456 in nucleus-api",
    },
    {
      id: "evt_008",
      type: "workflow.completed",
      connector: "Salesforce",
      workflow: "Opportunity Alert",
      status: "warning",
      timestamp: "1 hour ago",
      duration: "2.1s",
      details: "Completed with warnings: 2 records skipped",
    },
    {
      id: "evt_009",
      type: "webhook.triggered",
      connector: "Twilio",
      workflow: "SMS Alert",
      status: "success",
      timestamp: "1.5 hours ago",
      duration: "0.4s",
      details: "SMS sent to +1-555-0123",
    },
    {
      id: "evt_010",
      type: "connector.error",
      connector: "Mailchimp",
      workflow: "List Sync",
      status: "error",
      timestamp: "2 hours ago",
      duration: "0.1s",
      details: "Rate limit exceeded",
    },
  ];

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.connector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.workflow.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || event.status === filterStatus;
    const matchesConnector = filterConnector === "all" || event.connector === filterConnector;
    return matchesSearch && matchesStatus && matchesConnector;
  });

  const connectors = [...new Set(events.map((e) => e.connector))];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="success" size="sm">Success</Badge>;
      case "error":
        return <Badge variant="danger" size="sm">Error</Badge>;
      case "warning":
        return <Badge variant="warning" size="sm">Warning</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/app/integrations/events">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Event Log</h2>
              <p className="text-sm text-muted-foreground">
                {filteredEvents.length} events
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
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
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
          </select>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterConnector}
            onChange={(e) => setFilterConnector(e.target.value)}
          >
            <option value="all">All Connectors</option>
            {connectors.map((conn) => (
              <option key={conn} value={conn}>{conn}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Event Timeline */}
      <div className="space-y-2">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">{getStatusIcon(event.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-medium">{event.type}</span>
                    {getStatusBadge(event.status)}
                    <Badge variant="outline" size="sm">{event.connector}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{event.details}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Workflow: {event.workflow}</span>
                    <span>Duration: {event.duration}</span>
                    <span>{event.timestamp}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No events found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredEvents.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredEvents.length} of {events.length} events
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
