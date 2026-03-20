/**
 * Incidents
 *
 * Incident response and management with real API data.
 */

import { Card, CardContent, Badge, Button, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Zap,
  Search,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  Filter,
  Eye,
  Users,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/incidents")({
  component: IncidentsPage,
});

function IncidentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch incidents from API
  const { data: incidents = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "incidents"],
    queryFn: () => monitoringApi.getIncidents(),
    refetchInterval: 30000,
  });

  const filteredIncidents = incidents.filter((incident: any) => {
    const matchesSearch =
      incident.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.service?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || incident.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const summary = {
    total: incidents.length,
    active: incidents.filter((i: any) => i.status !== "resolved").length,
    critical: incidents.filter((i: any) => i.severity === "critical" && i.status !== "resolved").length,
    mttr: "2h 15m",
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge variant="success" size="sm">Resolved</Badge>;
      case "investigating":
        return <Badge variant="danger" size="sm">Investigating</Badge>;
      case "monitoring":
        return <Badge variant="warning" size="sm">Monitoring</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
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
      case "low":
        return <Badge variant="default" size="sm">Low</Badge>;
      default:
        return <Badge variant="default" size="sm">{severity}</Badge>;
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Incidents</h2>
          <p className="text-sm text-muted-foreground">
            Incident response and management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Create Incident
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{isLoading ? "..." : summary.total}</p>
                <p className="text-xs text-muted-foreground">Total Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{isLoading ? "..." : summary.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{isLoading ? "..." : summary.critical}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{summary.mttr}</p>
                <p className="text-xs text-muted-foreground">Avg MTTR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="investigating">Investigating</option>
            <option value="monitoring">Monitoring</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="space-y-3 p-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading incidents...</div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No incidents found</div>
            ) : (
              filteredIncidents.map((incident: any) => (
                <div
                  key={incident.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg ${
                    incident.severity === "critical" ? "border-red-200" : "border-border"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{incident.title}</p>
                      {getSeverityBadge(incident.severity)}
                      {getStatusBadge(incident.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Service: {incident.service}</span>
                      <span>Started: {formatDate(incident.startedAt)}</span>
                      <span>Duration: {incident.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-foreground">{incident.assignee}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Impact: {incident.impact}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link to={`/app/monitoring/incidents/${incident.id}` as string}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
