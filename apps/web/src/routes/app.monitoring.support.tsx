/**
 * Support Metrics
 *
 * Customer support performance and metrics.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Headphones,
  MessageSquare,
  Smile,
  ThumbsDown,
  ThumbsUp,
  Ticket,
  TrendingUp,
  Users,
  RefreshCw,
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
import { monitoringApi } from "@/lib/api";

export const Route = createFileRoute("/app/monitoring/support")({
  component: SupportMetrics,
});

function SupportMetrics() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["monitoring", "support"],
    queryFn: () => monitoringApi.getSupport(),
    refetchInterval: 60000,
  });

  type SatisfactionPoint = { label: string; value: number; color: string };
  type ResponseTimePoint = { hour: string; avgResponse: number; firstResponse: number };
  type TicketVolumePoint = { day: string; open: number; resolved: number };

  const responseTimeData: ResponseTimePoint[] = (data as any)?.responseTimeData || [
    { hour: "00:00", avgResponse: 45, firstResponse: 12 },
    { hour: "04:00", avgResponse: 52, firstResponse: 15 },
    { hour: "08:00", avgResponse: 38, firstResponse: 8 },
    { hour: "12:00", avgResponse: 42, firstResponse: 10 },
    { hour: "16:00", avgResponse: 35, firstResponse: 7 },
    { hour: "20:00", avgResponse: 48, firstResponse: 11 },
  ];

  const ticketVolumeData: TicketVolumePoint[] = (data as any)?.ticketVolumeData || [
    { day: "Mon", open: 45, resolved: 52 },
    { day: "Tue", open: 52, resolved: 48 },
    { day: "Wed", open: 38, resolved: 55 },
    { day: "Thu", open: 42, resolved: 50 },
    { day: "Fri", open: 35, resolved: 45 },
    { day: "Sat", open: 18, resolved: 22 },
    { day: "Sun", open: 12, resolved: 15 },
  ];

  const satisfactionData: SatisfactionPoint[] = (data as any)?.satisfactionData || [
    { label: "Very Satisfied", value: 45, color: "#34d399" },
    { label: "Satisfied", value: 32, color: "#22d3ee" },
    { label: "Neutral", value: 15, color: "#fbbf24" },
    { label: "Unsatisfied", value: 8, color: "#f472b6" },
  ];

  const metricCards = [
    { title: "Open Tickets", value: data?.openTickets || "...", change: (data as any)?.openTicketsChange || "-12%", trend: "down", icon: Ticket },
    { title: "Avg Response Time", value: data?.avgResponseTime || "...", change: (data as any)?.avgResponseTimeChange || "-25%", trend: "down", icon: Clock },
    { title: "CSAT Score", value: (data as any)?.csatScore || "...", change: (data as any)?.csatChange || "+8%", trend: "up", icon: Smile },
    { title: "Resolution Rate", value: (data as any)?.resolutionRate || "...", change: (data as any)?.resolutionChange || "+3%", trend: "up", icon: ThumbsUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Support Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Customer support performance and satisfaction tracking
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.trend === "up";
          return (
            <Card key={metric.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                      {metric.title}
                    </p>
                    <p className="font-black text-2xl text-foreground mt-0.5">{metric.value}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <span
                        className={`text-[10px] font-bold ${
                          isPositive ? "text-emerald-400" : "text-emerald-400"
                        }`}
                      >
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Response Time Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Response Time Trend (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Line type="monotone" dataKey="avgResponse" stroke="#a78bfa" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="firstResponse" stroke="#34d399" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-xs text-muted-foreground">Avg Response</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">First Response</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Ticket Volume (7 days)
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
                  <Bar dataKey="open" fill="#f472b6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-pink-500" />
                <span className="text-xs text-muted-foreground">Opened</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Resolved</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Satisfaction */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={satisfactionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {satisfactionData.map((entry, index) => (
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
              {satisfactionData.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-xs font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Top Support Agents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Agent</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Resolved</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Avg Time</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">CSAT</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Sarah Johnson", resolved: 156, avgTime: "28m", csat: null },
                  { name: "Mike Chen", resolved: 142, avgTime: "32m", csat: null },
                  { name: "Emily Davis", resolved: 138, avgTime: "35m", csat: null },
                  { name: "Alex Kim", resolved: 125, avgTime: "38m", csat: null },
                  { name: "Jordan Lee", resolved: 118, avgTime: "41m", csat: null },
                ].map((agent, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3 text-sm font-medium">{agent.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{agent.resolved}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{agent.avgTime}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{agent.csat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
