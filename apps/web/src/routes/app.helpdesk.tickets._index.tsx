import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Textarea,
} from "@crm/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  LifeBuoy,
  Plus,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { helpdeskApi } from "@/lib/api";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  status: z.string().optional().default("all"),
  priority: z.string().optional().default("all"),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/helpdesk/tickets/_index")({
  validateSearch: searchSchema,
  component: HelpdeskTicketsPage,
});

const PRIORITY_COLORS: Record<string, string> = {
  high: "destructive",
  medium: "warning",
  low: "outline",
  urgent: "destructive",
};

const STATUS_COLORS: Record<string, string> = {
  open: "success",
  in_progress: "primary",
  resolved: "outline",
  closed: "outline",
};


function exportToCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 50;

function HelpdeskTicketsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { q: search, status: statusFilter, priority: priorityFilter, page } = useSearch({ from: Route.id });
  const setSearch = (q: string) => navigate({ search: (prev) => ({ ...prev, q, page: 1 }) });
  const setStatusFilter = (status: string) => navigate({ search: (prev) => ({ ...prev, status, page: 1 }) });
  const setPriorityFilter = (priority: string) => navigate({ search: (prev) => ({ ...prev, priority, page: 1 }) });
  const setPage = (page: number) => navigate({ search: (prev) => ({ ...prev, page }) });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "medium",
    category: "",
    contactEmail: "",
    contactName: "",
  });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["helpdesk-tickets-page", statusFilter, priorityFilter, page],
    queryFn: () =>
      helpdeskApi.tickets.list({
        page,
        limit: PAGE_SIZE,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
      }),
  });

  const TICKETS_KEY = ["helpdesk-tickets-page"] as const;

  const createTicket = useMutation({
    mutationFn: (payload: typeof newTicket) => helpdeskApi.tickets.create(payload),
    onMutate: async (newItem) => {
      await qc.cancelQueries({ queryKey: TICKETS_KEY });
      const previous = qc.getQueryData([...TICKETS_KEY, statusFilter, priorityFilter, page]);
      qc.setQueryData([...TICKETS_KEY, statusFilter, priorityFilter, page], (old: any) => ({
        ...old,
        data: [{ ...newItem, id: `temp-${Date.now()}`, createdAt: new Date().toISOString() }, ...(old?.data ?? [])],
      }));
      return { previous };
    },
    onSuccess: () => {
      toast.success("Ticket created");
      setIsCreateOpen(false);
      setNewTicket({ subject: "", description: "", priority: "medium", category: "", contactEmail: "", contactName: "" });
    },
    onError: (e: Error, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData([...TICKETS_KEY, statusFilter, priorityFilter, page], ctx.previous);
      toast.error(e.message || "Failed to create ticket");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: TICKETS_KEY }),
  });

  const deleteTicket = useMutation({
    mutationFn: (id: string) => helpdeskApi.tickets.delete(id),
    onSuccess: () => {
      toast.success("Ticket deleted");
      qc.invalidateQueries({ queryKey: TICKETS_KEY });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete ticket"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => helpdeskApi.tickets.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: TICKETS_KEY });
      const previous = qc.getQueryData([...TICKETS_KEY, statusFilter, priorityFilter, page]);
      qc.setQueryData([...TICKETS_KEY, statusFilter, priorityFilter, page], (old: any) => ({
        ...old,
        data: (old?.data ?? []).map((item: any) => item.id === id ? { ...item, status } : item),
      }));
      return { previous };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TICKETS_KEY });
    },
    onError: (e: Error, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData([...TICKETS_KEY, statusFilter, priorityFilter, page], ctx.previous);
      toast.error(e.message || "Failed to update ticket");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: TICKETS_KEY }),
  });

  const tickets: any[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const openCount = tickets.filter((t: any) => t.status === "open").length;
  const inProgressCount = tickets.filter((t: any) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length;
  const highPriorityCount = tickets.filter((t: any) => t.priority === "high" || t.priority === "urgent").length;

  const filtered = useMemo(() => {
    if (!search.trim()) return tickets;
    const s = search.toLowerCase();
    return tickets.filter((t: any) =>
      [t.subject, t.description, t.queue, t.category, t.contactEmail, t.contactName, t.assigneeId]
        .some((v) => String(v ?? "").toLowerCase().includes(s))
    );
  }, [tickets, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((t: any) => selectedIds.has(t.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t: any) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExport = () => {
    const headers = ["Ticket ID", "Subject", "Priority", "Status", "Queue", "Created Date"];
    const rows = filtered.map((t: any) => [
      t.id ?? "",
      t.subject ?? "",
      t.priority ?? "",
      t.status ?? "",
      t.queue ?? "",
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "",
    ]);
    exportToCsv("tickets.csv", headers, rows);
  };

    const handleBulkExport = () => {
    const selected = filtered.filter((t: any) => selectedIds.has(t.id));
    const csv = [
      ["ID", "Subject", "Priority", "Status", "Created"].join(","),
      ...selected.map((t: any) =>
        [
          t.id ?? "",
          t.subject ?? "",
          t.priority ?? "",
          t.status ?? "",
          t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "",
        ].map((v) => `"${v}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tickets.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkClose = async () => {
    const count = selectedIds.size;
    for (const id of Array.from(selectedIds)) {
      await helpdeskApi.tickets.update(id, { status: "closed" });
    }
    qc.invalidateQueries({ queryKey: ["helpdesk-tickets-page"] });
    setSelectedIds(new Set());
    toast.success(`Closed ${count} ticket(s)`);
  };

  if (isLoading) return (
    <div className="space-y-6">
      <SkeletonTable rows={8} cols={5} />
    </div>
  );

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Ticket?"
        description={`This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { deleteTicket.mutate(deleteTarget!.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <LifeBuoy className="h-6 w-6" /> Tickets
          </h1>
          <p className="text-muted-foreground text-sm">Manage and resolve customer support tickets.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExport}
          >
            Export CSV
          </Button>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            New Ticket
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric title="Open" value={openCount} icon={<LifeBuoy className="h-4 w-4" />} color="text-primary" />
        <Metric title="In Progress" value={inProgressCount} icon={<Clock className="h-4 w-4" />} color="text-amber-400" />
        <Metric title="Resolved" value={resolvedCount} icon={<CheckCircle2 className="h-4 w-4" />} color="text-emerald-400" />
        <Metric title="High Priority" value={highPriorityCount} icon={<AlertTriangle className="h-4 w-4" />} color="text-destructive" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subject, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button variant="outline" size="sm" onClick={handleBulkExport}>
            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkClose}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Close
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<LifeBuoy className="h-12 w-12" />}
              title="No tickets found"
              description={search || statusFilter !== "all" ? "Try adjusting your filters." : "Create your first support ticket."}
              action={<Button onClick={() => setIsCreateOpen(true)}>New Ticket</Button>}
            />
          ) : (
            <div className="divide-y divide-border">
              {/* Select All header */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/10">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  aria-label="Select all tickets"
                />
                <span className="text-xs text-muted-foreground font-medium">Select all</span>
              </div>
              {filtered.map((ticket: any) => (
                <div key={ticket.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(ticket.id)}
                        onChange={() => toggleSelect(ticket.id)}
                        className="h-4 w-4 mt-0.5 rounded border-border accent-primary cursor-pointer shrink-0"
                        aria-label={`Select ticket: ${ticket.subject}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{ticket.subject}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {ticket.contactName && (
                            <span className="text-xs text-muted-foreground">{ticket.contactName}</span>
                          )}
                          {ticket.contactEmail && (
                            <span className="text-xs text-muted-foreground">{ticket.contactEmail}</span>
                          )}
                          {ticket.queue && (
                            <span className="text-xs text-muted-foreground">Queue: {ticket.queue}</span>
                          )}
                          {ticket.category && (
                            <span className="text-xs text-muted-foreground">Category: {ticket.category}</span>
                          )}
                          {ticket.createdAt && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(ticket.createdAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={(PRIORITY_COLORS[ticket.priority] ?? "outline") as any}>
                        {ticket.priority ?? "medium"}
                      </Badge>
                      <select
                        className="h-6 rounded border border-border bg-card text-[10px] px-1"
                        value={ticket.status ?? "open"}
                        onChange={(e) => updateStatus.mutate({ id: ticket.id, status: e.target.value })}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <Badge variant={(STATUS_COLORS[ticket.status] ?? "outline") as any}>
                        {ticket.status ?? "open"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={() => setDeleteTarget({ id: ticket.id, name: ticket.subject ?? ticket.id })}
                        loading={deleteTicket.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {ticket.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ticket.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Ticket"
        submitText="Create Ticket"
        loading={createTicket.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTicket.subject.trim()) {
            toast.error("Subject is required");
            return;
          }
          createTicket.mutate(newTicket);
        }}
      >
        <div className="space-y-4">
          <FormField label="Subject" required>
            <Input
              value={newTicket.subject}
              onChange={(e) => setNewTicket((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Customer cannot log in"
              required
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newTicket.description}
              onChange={(e) => setNewTicket((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe the issue in detail..."
              rows={4}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Priority">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newTicket.priority}
                onChange={(e) => setNewTicket((p) => ({ ...p, priority: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </FormField>
            <FormField label="Category">
              <Input
                value={newTicket.category}
                onChange={(e) => setNewTicket((p) => ({ ...p, category: e.target.value }))}
                placeholder="billing, technical..."
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Contact Name">
              <Input
                value={newTicket.contactName}
                onChange={(e) => setNewTicket((p) => ({ ...p, contactName: e.target.value }))}
                placeholder="Jane Doe"
              />
            </FormField>
            <FormField label="Contact Email">
              <Input
                type="email"
                value={newTicket.contactEmail}
                onChange={(e) => setNewTicket((p) => ({ ...p, contactEmail: e.target.value }))}
                placeholder="jane@example.com"
              />
            </FormField>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color ?? "text-primary"}`}>
            {icon ?? <Zap className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
