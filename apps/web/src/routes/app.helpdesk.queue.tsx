/**
 * Queue Operations
 *
 * Agent queue view for managing ticket workload.
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
  ArrowLeft,
  Clock,
  GripVertical,
  Headphones,
  Inbox,
  RefreshCw,
  Ticket,
  Timer,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/helpdesk/queue")({
  component: QueueOperations,
});

const agentQueue = [
  {
    id: "1",
    agent: "John Doe",
    status: "online",
    avatar: "JD",
    activeTickets: 8,
    capacity: 12,
    avgResponseTime: "2.4 min",
    tickets: [
      { id: "TKT-001", subject: "Cannot login to dashboard", priority: "high", waitTime: "34 min", status: "pending" },
      { id: "TKT-007", subject: "Charts not loading in Firefox", priority: "high", waitTime: "28 min", status: "open" },
      { id: "TKT-010", subject: "Email notifications not working", priority: "medium", waitTime: "12 min", status: "open" },
    ],
  },
  {
    id: "2",
    agent: "Jane Smith",
    status: "online",
    avatar: "JS",
    activeTickets: 6,
    capacity: 12,
    avgResponseTime: "1.8 min",
    tickets: [
      { id: "TKT-002", subject: "Billing inquiry - overcharged", priority: "medium", waitTime: "45 min", status: "pending" },
      { id: "TKT-006", subject: "Account upgrade request", priority: "high", waitTime: "22 min", status: "pending" },
    ],
  },
  {
    id: "3",
    agent: "Mike Wilson",
    status: "away",
    avatar: "MW",
    activeTickets: 4,
    capacity: 12,
    avgResponseTime: "3.2 min",
    tickets: [
      { id: "TKT-005", subject: "How to export data to CSV?", priority: "low", waitTime: "1.2 hrs", status: "resolved" },
    ],
  },
];

const unassignedTickets = [
  { id: "TKT-004", subject: "API integration not working", priority: "urgent", waitTime: "3 hrs", channel: "phone" },
  { id: "TKT-011", subject: "Performance issues on mobile", priority: "high", waitTime: "45 min", channel: "chat" },
  { id: "TKT-012", subject: "Integration with Slack broken", priority: "high", waitTime: "1 hr", channel: "email" },
];

function QueueOperations() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/helpdesk">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-xl text-foreground">Queue Operations</h2>
            <p className="text-sm text-muted-foreground">Manage agent workload and ticket distribution</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm">
            Auto-Assign
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Online Agents" value="8" icon={<Headphones className="h-4 w-4" />} color="text-emerald-400" />
        <StatCard title="Unassigned Tickets" value="3" icon={<Inbox className="h-4 w-4" />} color="text-amber-400" />
        <StatCard title="Avg Wait Time" value="24 min" icon={<Clock className="h-4 w-4" />} color="text-primary" />
        <StatCard title="Queue Depth" value="47" icon={<Ticket className="h-4 w-4" />} color="text-violet-400" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Agent Queue */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Agent Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agentQueue.map((agent) => (
              <div
                key={agent.id}
                className={`rounded-lg border p-4 transition-colors ${
                  selectedAgent === agent.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`relative flex h-10 w-10 items-center justify-center rounded-full ${
                      agent.status === "online" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {agent.avatar}
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ${
                        agent.status === "online" ? "bg-emerald-500" : "bg-amber-500"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{agent.agent}</p>
                      <p className="text-xs text-muted-foreground capitalize">{agent.status} - {agent.activeTickets}/{agent.capacity} tickets</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{agent.avgResponseTime}</p>
                      <p className="text-xs text-muted-foreground">avg response</p>
                    </div>
                    <div className="w-20">
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${agent.activeTickets / agent.capacity > 0.8 ? "bg-rose-400" : "bg-primary"}`}
                          style={{ width: `${(agent.activeTickets / agent.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agent Tickets */}
                {selectedAgent === agent.id && (
                  <div className="mt-4 border-t border-border pt-4 space-y-2">
                    {agent.tickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        to={`/app/helpdesk/tickets/${ticket.id}` as string}
                        className="flex items-center justify-between rounded-lg bg-muted/50 p-2 hover:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <div>
                            <p className="text-sm font-medium">{ticket.id}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{ticket.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={ticket.priority === "high" ? "danger" : ticket.priority === "medium" ? "warning" : "outline"}>
                            {ticket.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{ticket.waitTime}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Unassigned Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Unassigned Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unassignedTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-lg border border-border p-3 hover:border-amber-500/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Link to={`/app/helpdesk/tickets/${ticket.id}` as string} className="font-medium text-sm text-primary hover:underline">
                    {ticket.id}
                  </Link>
                  <Badge variant={ticket.priority === "urgent" ? "danger" : "warning"}>
                    {ticket.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket.subject}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground capitalize">{ticket.channel}</span>
                  <span className="text-xs text-amber-400">{ticket.waitTime} waiting</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Assign
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-xl text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
