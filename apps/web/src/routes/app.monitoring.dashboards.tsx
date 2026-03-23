/**
 * Dashboards
 *
 * Custom monitoring dashboards.
 */

import { Card, CardContent, Badge, Button, Input } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  LayoutDashboard,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { monitoringApi } from "../lib/api";

export const Route = createFileRoute("/app/monitoring/dashboards")({
  component: DashboardsPage,
});

const MOCK_DASHBOARDS = [
  { id: 1, name: "Production Overview", description: "Key production metrics and KPIs", widgets: 8, lastViewed: "2 hours ago", createdBy: "Admin", isDefault: true },
  { id: 2, name: "API Performance", description: "API latency and error rates", widgets: 5, lastViewed: "1 day ago", createdBy: "DevOps", isDefault: false },
  { id: 3, name: "User Activity", description: "User engagement and behavior", widgets: 6, lastViewed: "3 hours ago", createdBy: "Analytics", isDefault: false },
  { id: 4, name: "Infrastructure", description: "Server and infrastructure health", widgets: 7, lastViewed: "30 min ago", createdBy: "DevOps", isDefault: false },
  { id: 5, name: "Revenue Dashboard", description: "Revenue metrics and trends", widgets: 4, lastViewed: "5 hours ago", createdBy: "Finance", isDefault: false },
  { id: 6, name: "Customer Support", description: "Support ticket metrics", widgets: 5, lastViewed: "1 day ago", createdBy: "Support", isDefault: false },
];

function DashboardsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const dashboardQuery = useQuery({
    queryKey: ["monitoring", "dashboard"],
    queryFn: () => monitoringApi.getDashboard(),
    retry: false,
  });

  const dashboards = MOCK_DASHBOARDS;

  const filteredDashboards = dashboards.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (dashboardQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => dashboardQuery.refetch()}>Retry</Button>
    </div>
  );

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted/40 rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-lg bg-muted/40 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dashboards</h2>
          <p className="text-sm text-muted-foreground">
            Custom monitoring dashboards and visualizations
          </p>
        </div>
        <Link to="/app/monitoring/dashboards/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Create Dashboard
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search dashboards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Dashboards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDashboards.map((dashboard) => (
          <Card key={dashboard.id} className="border-border/60 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{dashboard.name}</h3>
                    {dashboard.isDefault && (
                      <Badge variant="info" size="sm">Default</Badge>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{dashboard.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" size="sm">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {dashboard.widgets} widgets
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {dashboard.lastViewed}
                </span>
                <span>By {dashboard.createdBy}</span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1" leftIcon={<Eye className="h-3 w-3" />}>
                  View
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Copy className="h-3 w-3" />}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
