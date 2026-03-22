/**
 * Helpdesk Dashboard
 *
 * Overview metrics, SLA tracking, ticket queue with bulk actions, and channel breakdown.
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
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock,
  Headphones,
  LifeBuoy,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Ticket,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

// ─── Static data ──────────────────────────────────────────────────────────────

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

const agents = ["John Doe", "Jane Smith", "Carlos Ruiz", "Aisha Khan", "Tom Wei"];

// tickets with SLA due times (minutes from now, negative = overdue)
const allTickets = [
  { id: "TKT-001", subject: "Cannot login to dashboard after SSO update", status: "open", priority: "urgent", requester: "Sarah Chen", assignedTo: "John Doe", channel: "Email", createdAt: "2 hours ago", slaMinutes: -45, tags: ["auth","login"] },
  { id: "TKT-002", subject: "Billing invoice shows incorrect amount", status: "pending", priority: "high", requester: "Michael Roberts", assignedTo: "Jane Smith", channel: "Portal", createdAt: "4 hours ago", slaMinutes: 120, tags: ["billing"] },
  { id: "TKT-003", subject: "Feature request: export contacts to CSV", status: "open", priority: "low", requester: "Emily Watson", assignedTo: "Unassigned", channel: "Email", createdAt: "1 day ago", slaMinutes: 840, tags: ["feature"] },
  { id: "TKT-004", subject: "API integration returns 403 on webhooks endpoint", status: "open", priority: "urgent", requester: "David Kim", assignedTo: "Unassigned", channel: "Chat", createdAt: "3 hours ago", slaMinutes: -20, tags: ["api","integration"] },
  { id: "TKT-005", subject: "Dashboard charts not loading in Firefox", status: "open", priority: "high", requester: "Priya Singh", assignedTo: "Carlos Ruiz", channel: "Chat", createdAt: "5 hours ago", slaMinutes: 55, tags: ["bug","ui"] },
  { id: "TKT-006", subject: "How do I set up two-factor authentication?", status: "resolved", priority: "low", requester: "Tom Bradley", assignedTo: "Aisha Khan", channel: "Email", createdAt: "2 days ago", slaMinutes: 9999, tags: ["security","how-to"] },
  { id: "TKT-007", subject: "Mobile app crashes on iOS 17.4", status: "open", priority: "high", requester: "Lisa Wang", assignedTo: "Tom Wei", channel: "Portal", createdAt: "6 hours ago", slaMinutes: 30, tags: ["mobile","bug"] },
  { id: "TKT-008", subject: "Payment declined but account was charged", status: "open", priority: "urgent", requester: "James Park", assignedTo: "Jane Smith", channel: "Phone", createdAt: "1 hour ago", slaMinutes: -5, tags: ["billing","urgent"] },
];

const slaAtRisk = allTickets.filter((t) => t.slaMinutes < 60 && t.status !== "resolved");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slaLabel(mins: number) {
  if (mins < 0) return { text: `${Math.abs(mins)}m overdue`, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" };
  if (mins < 60) return { text: `${mins}m left`, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" };
  const h = Math.floor(mins / 60);
  return { text: `${h}h left`, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" };
}

function priorityColor(p: string) {
  if (p === "urgent") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (p === "high") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (p === "low") return "bg-muted/40 text-muted-foreground border-border";
  return "bg-blue-500/15 text-blue-400 border-blue-500/30";
}

function statusColor(s: string) {
  if (s === "open") return "bg-primary/15 text-primary border-primary/30";
  if (s === "pending") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (s === "resolved") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  return "bg-muted/40 text-muted-foreground border-border";
}

// ─── Component ────────────────────────────────────────────────────────────────

function HelpdeskDashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignModal, setAssignModal] = useState<string | null>(null); // ticket id
  const [bulkAssignAgent, setBulkAssignAgent] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return allTickets.filter((t) => {
      const matchSearch =
        !search ||
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.requester.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [search, statusFilter, priorityFilter]);

  const allSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id));
  const someSelected = selected.size > 0;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t.id)));
    }
  }

  function bulkResolve() {
    setSelected(new Set());
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-xl text-foreground">Helpdesk</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allTickets.filter((t) => t.status === "open").length} open tickets ·{" "}
            {slaAtRisk.length} at SLA risk
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Link to="/app/helpdesk/tickets">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard title="Open Tickets" value="47" trend="-12% vs yesterday" icon={<Ticket className="h-4 w-4" />} color="text-primary" positive={true} />
        <MetricCard title="Avg Response Time" value="2.4 hrs" trend="-18% vs last week" icon={<Clock className="h-4 w-4" />} color="text-violet-400" positive={true} />
        <MetricCard title="CSAT Score" value="94.2%" trend="+2.1% vs last month" icon={<TrendingUp className="h-4 w-4" />} color="text-emerald-400" positive={true} />
        <MetricCard title="Resolution Rate" value="87.5%" trend="+5.3% vs last month" icon={<LifeBuoy className="h-4 w-4" />} color="text-amber-400" positive={true} />
      </div>

      {/* ── SLA At Risk Banner ── */}
      {slaAtRisk.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-sm font-semibold text-red-400">
              {slaAtRisk.length} ticket{slaAtRisk.length > 1 ? "s" : ""} at SLA risk
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {slaAtRisk.map((t) => {
              const sla = slaLabel(t.slaMinutes);
              return (
                <div key={t.id} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${sla.bg}`}>
                  <span className="font-mono font-semibold text-foreground/80">{t.id}</span>
                  <span className="text-foreground/70 truncate max-w-[180px]">{t.subject}</span>
                  <span className={`font-bold shrink-0 ${sla.color}`}>{sla.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Ticket Volume — Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", fontSize: "11px" }} />
                  <Bar dataKey="tickets" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Received" />
                  <Bar dataKey="resolved" fill="#34d399" radius={[4, 4, 0, 0]} name="Resolved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Channel Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={2} dataKey="value">
                    {channelDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5">
              {channelDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Ticket Queue ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Ticket Queue
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-48 rounded-lg border border-border bg-muted/30 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Filters
                <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
              <Link to="/app/helpdesk/tickets">
                <Button size="sm" variant="ghost" className="h-8 text-xs">
                  View All <BarChart3 className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Filter pills */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status:</span>
                {["all", "open", "pending", "resolved"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold border transition-colors ${statusFilter === s ? "bg-primary/20 text-primary border-primary/40" : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"}`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priority:</span>
                {["all", "urgent", "high", "medium", "low"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold border transition-colors ${priorityFilter === p ? "bg-primary/20 text-primary border-primary/40" : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"}`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardHeader>

        {/* Bulk Action Bar */}
        {someSelected && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
            <span className="text-xs font-semibold text-primary">{selected.size} selected</span>
            <div className="flex-1" />
            <div className="flex items-center gap-1.5">
              <select
                value={bulkAssignAgent}
                onChange={(e) => setBulkAssignAgent(e.target.value)}
                className="h-7 rounded-md border border-border bg-card text-xs px-2 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Assign to…</option>
                {agents.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {bulkAssignAgent && (
                <button
                  onClick={() => { setBulkAssignAgent(""); setSelected(new Set()); }}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 h-7 text-xs font-semibold text-primary-foreground"
                >
                  <UserCheck className="h-3 w-3" /> Assign
                </button>
              )}
              <button
                onClick={bulkResolve}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 px-3 h-7 text-xs font-semibold text-emerald-400"
              >
                <CheckCircle2 className="h-3 w-3" /> Resolve
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="inline-flex items-center gap-1 rounded-md bg-muted/40 border border-border px-3 h-7 text-xs font-medium text-muted-foreground"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subject</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priority</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SLA</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Requester</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assigned To</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Created</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No tickets match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((ticket) => {
                  const sla = slaLabel(ticket.slaMinutes);
                  return (
                    <tr
                      key={ticket.id}
                      className={`border-b border-border transition-colors cursor-pointer ${selected.has(ticket.id) ? "bg-primary/5" : "hover:bg-muted/30"}`}
                    >
                      <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleSelect(ticket.id); }}>
                        <input type="checkbox" checked={selected.has(ticket.id)} onChange={() => toggleSelect(ticket.id)} className="rounded border-border" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-muted-foreground">{ticket.id}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                        <div className="flex gap-1 mt-1">
                          {ticket.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="rounded-full bg-muted/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${priorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ticket.status !== "resolved" ? (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${sla.bg} ${sla.color}`}>
                            <Clock className="h-2.5 w-2.5" />
                            {sla.text}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{ticket.requester}</td>
                      <td className="px-4 py-3">
                        {ticket.assignedTo === "Unassigned" ? (
                          <button
                            onClick={() => setAssignModal(ticket.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            <Plus className="h-2.5 w-2.5" /> Assign
                          </button>
                        ) : (
                          <button
                            onClick={() => setAssignModal(ticket.id)}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {ticket.assignedTo}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{ticket.createdAt}</td>
                      <td className="px-4 py-3">
                        <Link to="/app/helpdesk/tickets">
                          <button className="rounded-md p-1.5 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                            <Zap className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">{filtered.length} of {allTickets.length} tickets</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Showing all</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Assign Modal ── */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-foreground mb-1">Assign Ticket</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {allTickets.find((t) => t.id === assignModal)?.id} — {allTickets.find((t) => t.id === assignModal)?.subject.slice(0, 50)}…
            </p>
            <div className="space-y-2 mb-5">
              {agents.map((agent) => (
                <button
                  key={agent}
                  onClick={() => setAssignModal(null)}
                  className="flex items-center gap-3 w-full rounded-xl border border-border p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {agent.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <span className="text-sm font-medium text-foreground">{agent}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setAssignModal(null)}
              className="w-full rounded-xl border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { to: "/app/helpdesk/tickets", icon: <Ticket className="h-5 w-5" />, label: "All Tickets", sub: "View & manage", color: "bg-primary/10 text-primary" },
          { to: "/app/helpdesk/queue", icon: <Headphones className="h-5 w-5" />, label: "Queue View", sub: "Agent queue", color: "bg-violet-500/10 text-violet-400" },
          { to: "/app/helpdesk/knowledge", icon: <Search className="h-5 w-5" />, label: "Knowledge Base", sub: "Articles & docs", color: "bg-emerald-500/10 text-emerald-400" },
          { to: "/app/helpdesk/surveys", icon: <MessageSquare className="h-5 w-5" />, label: "CSAT Surveys", sub: "Feedback", color: "bg-amber-500/10 text-amber-400" },
        ].map((a) => (
          <Link key={a.label} to={a.to}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.color}`}>{a.icon}</div>
                <div>
                  <p className="font-medium text-sm">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.sub}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({
  title, value, trend, icon, color, positive,
}: {
  title: string; value: string; trend: string; icon: React.ReactNode; color: string; positive: boolean;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            <div className="mt-1 flex items-center gap-1">
              {positive ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : <TrendingDown className="h-3 w-3 text-rose-400" />}
              <span className={`text-[10px] font-bold ${positive ? "text-emerald-400" : "text-rose-400"}`}>{trend}</span>
            </div>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
