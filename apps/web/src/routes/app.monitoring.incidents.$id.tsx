/**
 * Incident Detail
 *
 * Detailed view of an incident with timeline and actions.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  User,
  Zap,
  Activity,
  FileText,
  Send,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/incidents/$id")({
  component: IncidentDetailPage,
});

function IncidentDetailPage() {
  const { id } = useParams({ from: "/app/monitoring/incidents/$id" });

  const { data: incidentData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "incident", id],
    queryFn: () => monitoringApi.getIncident(id),
    enabled: !!id,
  });

  type IncidentPoint = {
    id: string;
    title: string;
    status: string;
    severity: string;
    service: string;
    startedAt: string;
    duration: string;
    assignee: string;
    impact: string;
    description: string;
    rootCause: string;
    resolution: string;
  };

  type TimelinePoint = { id: number; type: string; content: string; timestamp: string; author: string };

  const incident: IncidentPoint = incidentData || {
    id: id || "INC-2026-001",
    title: "Loading...",
    status: "investigating",
    severity: "critical",
    service: "Database",
    startedAt: "Mar 18, 2026 10:15",
    duration: "2h 30m",
    assignee: "DBA Team",
    impact: "Critical",
    description: "Loading incident details...",
    rootCause: "Under investigation",
    resolution: "Pending",
  };

  const timeline: TimelinePoint[] = incidentData?.timeline || [
    { id: 1, type: "created", content: "Incident created", timestamp: "Mar 18, 2026 10:15", author: "System" },
    { id: 2, type: "alert", content: "Alert triggered", timestamp: "Mar 18, 2026 10:15", author: "Monitoring" },
    { id: 3, type: "assignment", content: "Incident assigned to DBA Team", timestamp: "Mar 18, 2026 10:20", author: "Alert Manager" },
  ];

  const [newNote, setNewNote] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge variant="success" size="sm">Resolved</Badge>;
      case "investigating":
        return <Badge variant="danger" size="sm">Investigating</Badge>;
      case "monitoring":
        return <Badge variant="warning" size="sm">Monitoring</Badge>;
      default:
        return <Badge variant="outline" size="sm">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="danger" size="sm">Critical</Badge>;
      case "high":
        return <Badge variant="warning" size="sm">High</Badge>;
      case "medium":
        return <Badge variant="info" size="sm">Medium</Badge>;
      default:
        return <Badge variant="outline" size="sm">{severity}</Badge>;
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "created":
      case "alert":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "note":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "status":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "assignment":
        return <User className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/app/monitoring/incidents">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{incident.title}</h1>
            {getStatusBadge(incident.status)}
            {getSeverityBadge(incident.severity)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {incident.id} • {incident.service} • Started {incident.startedAt}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-1" />
            Escalate
          </Button>
          <Button variant="primary" size="sm">
            <CheckCircle className="h-4 w-4 mr-1" />
            Resolve
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{incident.description}</p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Incident Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {getTimelineIcon(event.type)}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="h-full w-px bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{event.author}</span>
                        <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{event.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Note */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  />
                  <Button size="sm" disabled={!newNote.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Duration</p>
                <p className="font-medium">{incident.duration}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Assignee</p>
                <p className="font-medium">{incident.assignee}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Impact</p>
                <p className="font-medium">{incident.impact}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Root Cause</p>
                <p className="text-sm text-muted-foreground">{incident.rootCause}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Resolution</p>
                <p className="text-sm text-muted-foreground">{incident.resolution}</p>
              </div>
            </CardContent>
          </Card>

          {/* Related Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Affected Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Primary Database</span>
                  <Badge variant="danger" size="sm">Degraded</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Gateway</span>
                  <Badge variant="warning" size="sm">Slow</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auth Service</span>
                  <Badge variant="success" size="sm">Healthy</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Runbook
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                View Metrics
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Create Alert Rule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
