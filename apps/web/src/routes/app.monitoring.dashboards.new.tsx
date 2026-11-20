/**
 * New Dashboard
 *
 * Create a new custom dashboard.
 */

import { Card, CardContent, Badge, Button, Input } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Plus,
  X,
  GripVertical,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Hash,
  Table,
  Text,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/monitoring/dashboards/new")({
  component: NewDashboard,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

function NewDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dashboardName, setDashboardName] = useState("");
  const [widgets, setWidgets] = useState<any[]>([
    { id: 1, type: "metric", title: "Total Revenue", metric: "$124,500", icon: "DollarSign" },
    { id: 2, type: "chart", title: "Revenue Trend", chartType: "line" },
    { id: 3, type: "metric", title: "Active Users", metric: "1,247", icon: "Users" },
    { id: 4, type: "chart", title: "User Growth", chartType: "bar" },
  ]);

  const availableWidgets = [
    { type: "metric", label: "Metric", icon: Activity },
    { type: "line", label: "Line Chart", icon: LineChart },
    { type: "bar", label: "Bar Chart", icon: BarChart3 },
    { type: "pie", label: "Pie Chart", icon: PieChart },
    { type: "number", label: "Hash", icon: Hash },
    { type: "table", label: "Table", icon: Table },
    { type: "text", label: "Text", icon: Text },
  ];

  const addWidget = (type: string) => {
    const newWidget = {
      id: Date.now(),
      type,
      title: `New ${type}`,
    };
    setWidgets([...widgets, newWidget]);
  };

  const removeWidget = (id: number) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const saveDashboardMutation = useMutation({
    mutationFn: async (payload: { name: string; widgets: typeof widgets }) => {
      const res = await fetch(`${API_BASE}/monitoring/catalog`, {
        method: "POST",
        headers: getOrgHeader(),
        body: JSON.stringify({
          appId: `dashboard-${Date.now()}`,
          name: payload.name,
          description: `Custom dashboard with ${payload.widgets.length} widgets`,
          category: "dashboard",
        }),
      });
      if (!res.ok) throw new Error("Failed to save dashboard");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring-dashboards"] });
      navigate({ to: "/app/monitoring/dashboards" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Create Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Build a custom monitoring dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/monitoring/dashboards">Cancel</Link>
          </Button>
          <Button
            disabled={!dashboardName || saveDashboardMutation.isPending}
            onClick={() => saveDashboardMutation.mutate({ name: dashboardName, widgets })}
          >
            {saveDashboardMutation.isPending ? "Saving…" : "Save Dashboard"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Widget Palette */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-4">Widget Library</h3>
            <div className="space-y-2">
              {availableWidgets.map((widget) => (
                <button
                  key={widget.type}
                  onClick={() => addWidget(widget.type)}
                  className="w-full flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <widget.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{widget.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <Input
                placeholder="Dashboard Name"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                className="text-lg font-semibold border-0 p-0 focus:ring-0 mb-4"
              />
              <div className="space-y-4">
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center gap-3 p-4 border border-dashed border-border rounded-lg bg-muted/30"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      {widget.type === "metric" ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{widget.title}</span>
                          <span className="text-xl font-bold text-foreground">{widget.metric}</span>
                        </div>
                      ) : (
                        <div className="h-32 flex items-center justify-center bg-muted rounded">
                          <span className="text-sm text-muted-foreground">{widget.title} ({widget.chartType})</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeWidget(widget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {widgets.length === 0 && (
                <div className="text-center py-12">
                  <LayoutDashboard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Click widgets on the left to add them</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Widget Settings */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-4">Widget Settings</h3>
            <p className="text-sm text-muted-foreground">Select a widget to configure</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
