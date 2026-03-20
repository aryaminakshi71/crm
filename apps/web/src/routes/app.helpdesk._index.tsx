/**
 * Helpdesk Dashboard
 *
 * Overview of helpdesk metrics, recent tickets, and quick actions.
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
  BarChart3,
  Clock,
  Headphones,
  LifeBuoy,
  MessageSquare,
  Plus,
  Search,
  Ticket,
  TrendingDown,
  TrendingUp,
  Users,
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

export const Route = createFileRoute("/app/helpdesk/_index")({
  component: HelpdeskDashboard,
});

const ticketVolumeData = [
  { day: "Mon", tickets: 45, resolved: 38 },
  { day: "Tue", tickets: 52, resolved: 48 },
  { day: "Wed", tickets: 48, resolved: 45 },
  { day: "Thu", tickets: 61, resolved: 55 },
  { day: "Fri", tickets: 55, resolved: 52 },
  { day: "Sat", tickets: 28, resolved: 26 },
  { day: "Sun", tickets: 22, resolved: 21 },
];

const channelDistribution = [
  { name: "Email", value: 35, color: "#22d3ee" },
  { name: "Chat", value: 28, color: "#a78bfa" },
  { name: "Portal", value: 22, color: "#f472b6" },
  { name: "Phone", value: 15, color: "#34d399" },
];

const recentTickets = [
  { id: "TKT-001", subject: "Cannot login to dashboard", status: "open", priority: "high", requester: "Sarah Chen", assignedTo: "John Doe", createdAt: "2 hours ago" },
  { id: "TKT-002", subject: "Billing inquiry", status: "pending", priority: "medium", requester: "Michael Roberts", assignedTo: "Jane Smith", createdAt: "4 hours ago" },
  { id: "TKT-003", subject: "Feature request: Dark mode", status: "resolved", priority: "low", requester: "Emily Watson", assignedTo: "John Doe", createdAt: "1 day ago" },
  { id: "TKT-004", subject: "API integration not working", status: "open", priority: "high", requester: "David Kim", assignedTo: "Unassigned", createdAt: "3 hours ago" },
];

function HelpdeskDashboard() {
  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          title="Open Tickets"
          value="47"
          trend="-12% vs yesterday"
          icon={<Ticket className="h-4 w-4" />}
          color="text-primary"
        />
        <MetricCard
          title="Avg Response Time"
          value="2.4 hrs"
          trend="-18% vs last week"
          icon={<Clock className="h-4 w-4" />}
          color="text-violet-400"
        />
        <MetricCard
          title="CSAT Score"
          value="94.2%"
          trend="+2.1% vs last month"
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-emerald-400"
        />
        <MetricCard
          title="Resolution Rate"
          value="87.5%"
          trend="+5.3% vs last month"
          icon={<LifeBuoy className="h-4 w-4" />}
          color="text-amber-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ticket Volume */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Ticket Volume (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="tickets" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Channel Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {channelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {channelDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Recent Tickets
          </CardTitle>
          <Link to="/app/helpdesk/tickets">
            <Button size="sm" variant="ghost" rightIcon={<BarChart3 className="h-3 w-3" />}>
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Ticket ID</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Subject</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Priority</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Requester</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Assigned To</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-border hover:bg-muted/50 cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium">{ticket.id}</td>
                  <td className="px-4 py-3 text-sm">{ticket.subject}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ticket.status === "open" ? "danger" : ticket.status === "pending" ? "warning" : "success"}>
                      {ticket.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ticket.priority === "high" ? "danger" : ticket.priority === "medium" ? "warning" : "outline"}>
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{ticket.requester}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{ticket.assignedTo}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{ticket.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link to="/app/helpdesk/tickets">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">All Tickets</p>
                <p className="text-xs text-muted-foreground">View and manage</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/helpdesk/queue">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <Headphones className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Queue View</p>
                <p className="text-xs text-muted-foreground">Agent queue</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/helpdesk/knowledge">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Search className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Knowledge Base</p>
                <p className="text-xs text-muted-foreground">Articles & docs</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/app/helpdesk/surveys">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <MessageSquare className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-sm">CSAT Surveys</p>
                <p className="text-xs text-muted-foreground">Feedback</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
  icon,
  color,
}: {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  color: string;
}) {
  const trendPositive = !trend.includes("-");
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            <div className="mt-1 flex items-center gap-1">
              {trendPositive ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-400" />
              )}
              <span className={`text-[10px] font-bold ${trendPositive ? "text-emerald-400" : "text-rose-400"}`}>
                {trend}
              </span>
            </div>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
