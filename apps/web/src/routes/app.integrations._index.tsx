/**
 * Integration Hub Overview
 *
 * Dashboard showing integration stats, recent activity, and quick actions.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Puzzle,
  Workflow,
  Bell,
  Webhook,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Plus,
  Activity,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/integrations/_index")({
  component: IntegrationsOverview,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => ({
  "x-org-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

const MOCK_CONNECTORS = [
  { name: "Salesforce", type: "CRM", events: 4521, status: "connected" },
  { name: "Stripe", type: "Payments", events: 3892, status: "connected" },
  { name: "Shopify", type: "E-commerce", events: 2156, status: "connected" },
  { name: "Slack", type: "Communication", events: 1874, status: "connected" },
  { name: "HubSpot", type: "Marketing", events: 1203, status: "connected" },
];

const MOCK_WORKFLOWS = [
  { id: "wf_1", name: "Lead Sync", status: "active" },
  { id: "wf_2", name: "Payment Sync", status: "active" },
  { id: "wf_3", name: "Order Created", status: "active" },
];

const MOCK_EVENTS = [
  { id: "evt_1", type: "workflow.completed", connector: "Salesforce", workflow: "Lead Sync", status: "success", time: "2 min ago" },
  { id: "evt_2", type: "connector.error", connector: "Stripe", workflow: "Payment Sync", status: "error", time: "5 min ago" },
  { id: "evt_3", type: "event.received", connector: "Shopify", workflow: "Order Created", status: "success", time: "8 min ago" },
  { id: "evt_4", type: "webhook.triggered", connector: "Slack", workflow: "Notify Team", status: "success", time: "12 min ago" },
  { id: "evt_5", type: "workflow.completed", connector: "HubSpot", workflow: "Contact Update", status: "success", time: "15 min ago" },
];

function IntegrationsOverview() {
  const { data: connectorsData, isLoading: connectorsLoading, isError: connectorsError, refetch: connectorsRefetch } = useQuery({
    queryKey: ["integration-connectors"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/integration/connectors`, { headers: getOrgHeader() });
      if (!res.ok) throw new Error("Failed to fetch connectors");
      return res.json();
    },
  });

  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    queryKey: ["integration-workflows"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/integration/workflows`, { headers: getOrgHeader() });
      if (!res.ok) throw new Error("Failed to fetch workflows");
      return res.json();
    },
  });

  if (connectorsError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => connectorsRefetch()}>Retry</Button>
    </div>
  );

  const connectors = connectorsData?.data ?? MOCK_CONNECTORS;
  const workflows = workflowsData?.data ?? MOCK_WORKFLOWS;
  const recentEvents = MOCK_EVENTS;

  const stats = {
    activeConnectors: connectorsData?.total ?? 24,
    activeWorkflows: workflowsData?.total ?? 156,
    eventsToday: 12847,
    successRate: 99.2,
    failedEvents: 23,
    pendingEvents: 145,
  };

  const topConnectors = connectors.slice(0, 5).map((c: { name: string; type?: string; events?: number; status?: string }) => ({
    name: c.name,
    type: c.type ?? "Integration",
    events: c.events ?? 0,
    status: c.status ?? "connected",
  }));

  const eventTrendData = [
    { time: "00:00", events: 1200, errors: 5 },
    { time: "04:00", events: 800, errors: 3 },
    { time: "08:00", events: 2400, errors: 12 },
    { time: "12:00", events: 3100, errors: 8 },
    { time: "16:00", events: 2800, errors: 15 },
    { time: "20:00", events: 1800, errors: 6 },
    { time: "Now", events: 1747, errors: 3 },
  ];

  const connectorBreakdown = [
    { name: "Sales", value: 8, color: "#2172cd" },
    { name: "Marketing", value: 6, color: "#8b5cf6" },
    { name: "Support", value: 4, color: "#22c55e" },
    { name: "Finance", value: 3, color: "#f59e0b" },
    { name: "Other", value: 3, color: "#6b7280" },
  ];

  const workflowStatusData = [
    { status: "Active", count: 142, color: "#22c55e" },
    { status: "Paused", count: 12, color: "#f59e0b" },
    { status: "Error", count: 2, color: "#ef4444" },
  ];


  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Active Connectors
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.activeConnectors}</p>
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +3 this week
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Puzzle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Active Workflows
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.activeWorkflows}</p>
                <p className="text-foreground text-xs mt-1">
                  142 running now
                </p>
              </div>
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600">
                <Workflow className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Events Today
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.eventsToday.toLocaleString()}</p>
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +18% from yesterday
                </p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <Bell className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Success Rate
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">{stats.successRate}%</p>
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {stats.failedEvents} failed
                </p>
              </div>
              <div className="rounded-xl bg-green-100 p-2.5 text-green-600">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Event Trend */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Event Volume (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={eventTrendData}>
                  <defs>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2172cd" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2172cd" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#2172cd"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEvents)"
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorErrors)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Connector Breakdown */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Connectors by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={connectorBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {connectorBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {connectorBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Workflow Status */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Workflow Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workflowStatusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="status" type="category" className="text-xs" width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {workflowStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Connectors */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Top Connectors</CardTitle>
              <Link
                to="/app/integrations/connectors"
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topConnectors.map((connector) => (
              <div
                key={connector.name}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="rounded-lg bg-primary/10 p-2">
                  <Puzzle className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{connector.name}</p>
                  <p className="text-xs text-muted-foreground">{connector.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {connector.events.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">events</p>
                </div>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Events</CardTitle>
            <Link
              to="/app/integrations/events/log"
              className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {event.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{event.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.connector} / {event.workflow}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{event.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm font-medium">Add Connector</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
        >
          <Workflow className="h-5 w-5" />
          <span className="text-sm font-medium">New Workflow</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
        >
          <Webhook className="h-5 w-5" />
          <span className="text-sm font-medium">Create Webhook</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
        >
          <Zap className="h-5 w-5" />
          <span className="text-sm font-medium">API Settings</span>
        </Button>
      </div>
    </div>
  );
}
