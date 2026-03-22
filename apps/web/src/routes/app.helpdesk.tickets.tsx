/**
 * Ticket List
 *
 * List of all support tickets with filters and sorting.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/helpdesk/tickets")({
  component: TicketList,
});

type TicketRow = {
  id: string;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  channel: "email" | "chat" | "phone" | "portal";
  requester: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
};

const MOCK_TICKETS: TicketRow[] = [
  { id: "TKT-001", subject: "Cannot login to dashboard after password reset", status: "open", priority: "high", channel: "email", requester: "Sarah Chen", assignedTo: "John Doe", createdAt: "2 hours ago", updatedAt: "1 hour ago" },
  { id: "TKT-002", subject: "Billing inquiry - overcharged for subscription", status: "pending", priority: "medium", channel: "chat", requester: "Michael Roberts", assignedTo: "Jane Smith", createdAt: "4 hours ago", updatedAt: "2 hours ago" },
  { id: "TKT-003", subject: "Feature request: Dark mode support", status: "resolved", priority: "low", channel: "portal", requester: "Emily Watson", assignedTo: "John Doe", createdAt: "1 day ago", updatedAt: "5 hours ago" },
  { id: "TKT-004", subject: "API integration not working properly", status: "open", priority: "urgent", channel: "phone", requester: "David Kim", assignedTo: "Unassigned", createdAt: "3 hours ago", updatedAt: "3 hours ago" },
  { id: "TKT-005", subject: "How to export data to CSV?", status: "resolved", priority: "low", channel: "chat", requester: "Jessica Brown", assignedTo: "Mike Wilson", createdAt: "2 days ago", updatedAt: "1 day ago" },
  { id: "TKT-006", subject: "Account upgrade request - Enterprise plan", status: "pending", priority: "high", channel: "email", requester: "Robert Taylor", assignedTo: "Jane Smith", createdAt: "1 day ago", updatedAt: "12 hours ago" },
  { id: "TKT-007", subject: "Bug report: Charts not loading in Firefox", status: "open", priority: "high", channel: "portal", requester: "Lisa Anderson", assignedTo: "John Doe", createdAt: "5 hours ago", updatedAt: "4 hours ago" },
  { id: "TKT-008", subject: "Request for custom integration", status: "closed", priority: "medium", channel: "email", requester: "James Martinez", assignedTo: "Mike Wilson", createdAt: "1 week ago", updatedAt: "3 days ago" },
];

function TicketList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["helpdesk-tickets-list", statusFilter],
    queryFn: () =>
      nucleoApi.tickets.list({
        page: 1,
        limit: 100,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
    retry: false,
  });

  const rawTickets: any[] = ticketsData?.data ?? MOCK_TICKETS;

  // Normalise API tickets to the TicketRow shape expected by this UI
  const allTickets: TicketRow[] = rawTickets.map((t: any) => ({
    id: t.id ?? t.ticketNumber ?? "—",
    subject: t.subject ?? t.title ?? "No subject",
    status: (t.status as TicketRow["status"]) ?? "open",
    priority: (t.priority as TicketRow["priority"]) ?? "medium",
    channel: (t.channel ?? t.source ?? "email") as TicketRow["channel"],
    requester: t.requester ?? t.customerName ?? t.contactName ?? "Customer",
    assignedTo: t.assignedTo ?? t.assigneeName ?? "Unassigned",
    createdAt: t.createdAt ? new Date(t.createdAt).toLocaleString() : (t.createdAt ?? "—"),
    updatedAt: t.updatedAt ? new Date(t.updatedAt).toLocaleString() : (t.updatedAt ?? "—"),
  }));

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 rounded bg-muted" />
          <div className="h-9 w-28 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-card h-20" />
          ))}
        </div>
        <div className="rounded-lg border border-border/60 bg-card h-64" />
      </div>
    );
  }

  const filteredTickets = allTickets.filter((ticket) => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;
    if (channelFilter !== "all" && ticket.channel !== channelFilter) return false;
    if (!search.trim()) return true;
    return ticket.subject.toLowerCase().includes(search.toLowerCase()) || ticket.id.toLowerCase().includes(search.toLowerCase());
  });

  const openCount = allTickets.filter((t) => t.status === "open").length;
  const pendingCount = allTickets.filter((t) => t.status === "pending").length;
  const resolvedCount = allTickets.filter((t) => t.status === "resolved").length;

  const getStatusBadge = (status: TicketRow["status"]) => {
    const variants: Record<TicketRow["status"], "danger" | "warning" | "success" | "outline"> = {
      open: "danger",
      pending: "warning",
      resolved: "success",
      closed: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: TicketRow["priority"]) => {
    const variants: Record<TicketRow["priority"], "outline" | "warning" | "danger"> = {
      low: "outline",
      medium: "warning",
      high: "danger",
      urgent: "danger",
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Tickets</h2>
          <p className="text-sm text-muted-foreground">Manage and respond to support requests</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          New Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Open" value={String(openCount)} icon="danger" />
        <StatCard title="Pending" value={String(pendingCount)} icon="warning" />
        <StatCard title="Resolved" value={String(resolvedCount)} icon="success" />
        <StatCard title="Avg First Response" value="2.4 hrs" icon="primary" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All Channels</option>
          <option value="email">Email</option>
          <option value="chat">Chat</option>
          <option value="phone">Phone</option>
          <option value="portal">Portal</option>
        </select>
      </div>

      {/* Ticket List */}
      {filteredTickets.length === 0 ? (
        <EmptyState
          icon={<Ticket className="h-12 w-12" />}
          title="No tickets found"
          description="Adjust your filters or create a new ticket."
          action={{ label: "Create Ticket", onClick: () => {} }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                    <button className="flex items-center gap-1">
                      ID
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Subject</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Priority</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Channel</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Requester</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Assigned To</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-border hover:bg-muted/50 cursor-pointer">
                    <td className="px-4 py-3 text-sm font-medium">
                      <Link to={`/app/helpdesk/tickets/${ticket.id}` as string} className="text-primary hover:underline">
                        {ticket.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link to={`/app/helpdesk/tickets/${ticket.id}` as string} className="hover:text-primary">
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(ticket.status)}</td>
                    <td className="px-4 py-3">{getPriorityBadge(ticket.priority)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{ticket.channel}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{ticket.requester}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{ticket.assignedTo}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{ticket.createdAt}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: "danger" | "warning" | "success" | "primary" }) {
  const colors = {
    danger: "text-rose-400 bg-rose-500/10",
    warning: "text-amber-400 bg-amber-500/10",
    success: "text-emerald-400 bg-emerald-500/10",
    primary: "text-primary bg-primary/10",
  };
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}
