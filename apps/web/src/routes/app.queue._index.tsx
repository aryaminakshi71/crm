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
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Inbox,
  Loader2,
  Plus,
  Search,
  User,
  Zap,
} from "lucide-react";
import { useMemo } from "react";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  priority: z.enum(["all", "urgent", "high", "medium", "low"]).optional().default("all"),
  status: z.enum(["all", "pending", "in_progress", "completed", "failed", "paused"]).optional().default("all"),
});

export const Route = createFileRoute("/app/queue/_index")({
  validateSearch: searchSchema,
  component: QueueIndexPage,
});

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-400 border-red-400/30",
  high: "bg-orange-500/10 text-orange-400 border-orange-400/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-400/30",
  low: "bg-blue-500/10 text-blue-400 border-blue-400/30",
};

const STATUS_BADGE: Record<string, "danger" | "warning" | "primary" | "success" | "default"> = {
  pending: "warning",
  in_progress: "primary",
  completed: "success",
  failed: "danger",
  paused: "default",
};

const FALLBACK_QUEUE: any[] = [
  { id: "q1", title: "Process invoice batch #INV-2024-03", assignedTo: "Billing Bot", priority: "high", dueDate: "2026-03-25", status: "in_progress", type: "billing" },
  { id: "q2", title: "Send welcome emails to new signups", assignedTo: "Email Worker", priority: "medium", dueDate: "2026-03-24", status: "pending", type: "email" },
  { id: "q3", title: "Sync CRM contacts with marketing list", assignedTo: "Sync Service", priority: "low", dueDate: "2026-03-26", status: "completed", type: "sync" },
  { id: "q4", title: "Generate monthly payroll report", assignedTo: "Report Worker", priority: "urgent", dueDate: "2026-03-24", status: "pending", type: "report" },
  { id: "q5", title: "Archive old project files", assignedTo: "Storage Worker", priority: "low", dueDate: "2026-03-28", status: "paused", type: "storage" },
  { id: "q6", title: "Send payment reminders", assignedTo: "Notification Bot", priority: "high", dueDate: "2026-03-24", status: "in_progress", type: "notification" },
  { id: "q7", title: "Rebuild search index", assignedTo: "Search Worker", priority: "medium", dueDate: "2026-03-27", status: "failed", type: "maintenance" },
  { id: "q8", title: "Export compliance report Q1", assignedTo: "Compliance Bot", priority: "urgent", dueDate: "2026-03-24", status: "pending", type: "report" },
];

function QueueIndexPage() {
  const { q: search, priority: priorityFilter, status: statusFilter } = useSearch({ from: "/app/queue/_index" });
  const navigate = useNavigate({ from: "/app/queue/_index" });

  const setSearch = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, q: value || undefined }) });
  const setPriorityFilter = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, priority: value as any }) });
  const setStatusFilter = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, status: value as any }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["queue-items"],
    queryFn: async () => {
      const res = await fetch("/api/v1/queue", {
        headers: {
          "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch queue");
      return res.json();
    },
    retry: false,
  });

  const rawItems: any[] = ((data as any)?.data as any[]) ?? [];
  const items = rawItems.length > 0 ? rawItems : FALLBACK_QUEUE;

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.assignedTo?.toLowerCase().includes(search.toLowerCase());
      const matchPriority = priorityFilter === "all" || item.priority === priorityFilter;
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      return matchSearch && matchPriority && matchStatus;
    });
  }, [items, search, priorityFilter, statusFilter]);

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const inProgressCount = items.filter((i) => i.status === "in_progress").length;
  const completedCount = items.filter((i) => i.status === "completed").length;
  const failedCount = items.filter((i) => i.status === "failed").length;

  if (isError && rawItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load queue. Please try again.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Work Queue</h2>
          <p className="text-muted-foreground text-sm">
            Background tasks, jobs, and scheduled work items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queue..."
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="paused">Paused</option>
          </select>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Pending", value: isLoading ? "—" : pendingCount, color: "text-amber-400", icon: <Clock className="h-4 w-4" /> },
          { label: "In Progress", value: isLoading ? "—" : inProgressCount, color: "text-primary", icon: <Loader2 className="h-4 w-4" /> },
          { label: "Completed", value: isLoading ? "—" : completedCount, color: "text-emerald-400", icon: <CheckCircle2 className="h-4 w-4" /> },
          { label: "Failed", value: isLoading ? "—" : failedCount, color: failedCount > 0 ? "text-red-400" : "text-muted-foreground", icon: <AlertCircle className="h-4 w-4" /> },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-black mt-0.5 ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-xl bg-muted/30 p-2.5 ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Queue Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-sm font-bold">
            Queue Items ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse divide-y divide-border/40">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-4 py-3 flex gap-4 items-center">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted/60 rounded" />
                  <div className="h-5 w-16 bg-muted/50 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex justify-center">
              <EmptyState title="No queue items" description="The work queue is empty." />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-4">Task</div>
                <div className="col-span-2">Assigned To</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-2">Status</div>
              </div>
              {filtered.map((item) => (
                <QueueRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QueueRow({ item }: { item: any }) {
  const dueDate = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—";
  const isOverdue =
    item.dueDate &&
    item.status !== "completed" &&
    new Date(item.dueDate) < new Date();

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-4">
        <p className="font-medium text-sm truncate">{item.title}</p>
        {item.type && (
          <p className="text-[10px] text-muted-foreground capitalize">{item.type}</p>
        )}
      </div>
      <div className="col-span-2 flex items-center gap-1.5">
        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground truncate">{item.assignedTo ?? "—"}</p>
      </div>
      <div className="col-span-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${PRIORITY_COLORS[item.priority] ?? "bg-muted text-muted-foreground border-transparent"}`}
        >
          {item.priority}
        </span>
      </div>
      <div className="col-span-2">
        <div className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs">{dueDate}</span>
        </div>
      </div>
      <div className="col-span-2">
        <Badge variant={STATUS_BADGE[item.status] ?? "default"}>
          {item.status?.replace("_", " ")}
        </Badge>
      </div>
    </div>
  );
}
