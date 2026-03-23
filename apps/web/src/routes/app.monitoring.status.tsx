/**
 * Status Page
 *
 * Public status page configuration.
 */

import { Card, CardContent, Badge, Button, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Eye,
  Settings,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { monitoringApi } from "@/lib/api";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({ "x-org-id": localStorage.getItem("activeOrganizationId") ?? "" });

export const Route = createFileRoute("/app/monitoring/status")({
  component: StatusPage,
});

function StatusPage() {
  const [isPublished, setIsPublished] = useState(true);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`${API_BASE}/v1/monitoring/status/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitoring", "catalog"] }),
  });

  const { data: catalogData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "catalog"],
    queryFn: () => monitoringApi.getCatalog({ limit: 100 }),
    refetchInterval: 60000,
  });

  type ComponentPoint = { id: number; name: string; status: string; uptime: number; lastIncident: string };
  type IncidentPoint = {
    id: number;
    title: string;
    status: string;
    severity: string;
    startedAt: string;
    resolvedAt?: string;
    duration?: string;
    affected?: string[];
  };

  // Map catalog items to status components
  const components: ComponentPoint[] = catalogData?.items?.map((app: any) => ({
    id: app.id,
    name: app.name,
    status: app.status === "healthy" ? "operational" : app.status === "degraded" ? "degraded" : "down",
    uptime: app.metrics?.uptime || 99.9,
    lastIncident: app.lastHealthCheck || "Unknown",
  })) || [
    { id: 1, name: "API Services", status: "operational", uptime: 99.99, lastIncident: "15 days ago" },
    { id: 2, name: "Web Application", status: "operational", uptime: 99.95, lastIncident: "8 days ago" },
    { id: 3, name: "Database", status: "operational", uptime: 99.99, lastIncident: "22 days ago" },
    { id: 4, name: "Authentication", status: "operational", uptime: 99.98, lastIncident: "12 days ago" },
    { id: 5, name: "File Storage", status: "operational", uptime: 99.99, lastIncident: "30 days ago" },
    { id: 6, name: "CDN", status: "degraded", uptime: 98.5, lastIncident: "2 hours ago" },
    { id: 7, name: "Payment Processing", status: "operational", uptime: 99.97, lastIncident: "5 days ago" },
    { id: 8, name: "Email Delivery", status: "operational", uptime: 99.9, lastIncident: "3 days ago" },
  ];

  const { data: incidentsData } = useQuery({
    queryKey: ["monitoring", "incidents"],
    queryFn: () => monitoringApi.getIncidents(),
    refetchInterval: 60000,
  });

  const incidents: IncidentPoint[] = incidentsData || [
    { id: 1, title: "CDN Performance Degradation", status: "investigating", severity: "major", startedAt: "Mar 18, 2026 12:00", affected: ["CDN"] },
    { id: 2, title: "API Latency Spike", status: "resolved", severity: "minor", startedAt: "Mar 15, 2026 08:30", affected: ["API Services"] },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge variant="success" size="sm">Operational</Badge>;
      case "degraded":
        return <Badge variant="warning" size="sm">Degraded</Badge>;
      case "partial":
        return <Badge variant="warning" size="sm">Partial Outage</Badge>;
      case "major":
        return <Badge variant="danger" size="sm">Major Outage</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "partial":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "major":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Status Page</h2>
          <p className="text-sm text-muted-foreground">
            Public status page configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Eye className="h-4 w-4" />}>
            Preview
          </Button>
          <Button leftIcon={<Globe className="h-4 w-4" />}>
            View Public Page
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      <Card className="border-border/60 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-green-800">All Systems Operational</h2>
                <p className="text-green-700">Last updated: March 18, 2026 14:00 UTC</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-700">Status page is</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isPublished} onChange={() => setIsPublished(!isPublished)} />
                <div className="w-11 h-6 bg-green-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Components</h3>
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Add Component
            </Button>
          </div>
          <div className="space-y-3">
            {components.map((component) => (
              <div key={component.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(component.status)}
                  <div>
                    <p className="font-medium text-foreground">{component.name}</p>
                    <p className="text-xs text-muted-foreground">Last incident: {component.lastIncident}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{component.uptime}%</p>
                    <p className="text-xs text-muted-foreground">30-day uptime</p>
                  </div>
                  {getStatusBadge(component.status)}
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Incidents */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Active Incidents</h3>
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Create Incident
            </Button>
          </div>
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div key={incident.id} className={`p-4 border rounded-lg ${
                incident.status === "investigating" ? "border-yellow-200 bg-yellow-50/50" : "border-border"
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`h-5 w-5 ${incident.status === "investigating" ? "text-yellow-600" : "text-muted-foreground"}`} />
                    <p className="font-semibold text-foreground">{incident.title}</p>
                    <Badge variant={incident.severity === "major" ? "danger" : "warning"} size="sm">{incident.severity}</Badge>
                  </div>
                  <Badge variant={incident.status === "investigating" ? "warning" : "success"} size="sm">
                    {incident.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Started: {incident.startedAt} {incident.resolvedAt && `| Resolved: ${incident.resolvedAt} (${incident.duration})`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Affected:</span>
                  {incident.affected?.map((a: string) => (
                    <Badge key={a} variant="outline" size="sm">{a}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Page Settings */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Page Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Page URL</p>
                <p className="text-sm text-muted-foreground">status.nucleo.one</p>
              </div>
              <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />}>
                Open
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Subscribers</p>
                <p className="text-sm text-muted-foreground">1,234 subscribers</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Auto-refresh</p>
                <p className="text-sm text-muted-foreground">Update status every 5 minutes</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
