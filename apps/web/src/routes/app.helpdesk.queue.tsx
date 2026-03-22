import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ListOrdered, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/helpdesk/queue")({
  component: QueuePage,
});

function QueuePage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [counterDrafts, setCounterDrafts] = useState<Record<string, string>>(
    {},
  );
  const [form, setForm] = useState({ serviceType: "general", ticketId: "" });
  const queryClient = useQueryClient();

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ["nucleo-tickets", "all", "all"],
    queryFn: () => nucleoApi.tickets.list({ page: 1, limit: 200 }),
  });

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ["nucleo-queue", statusFilter],
    queryFn: () =>
      nucleoApi.queue.list({
        page: 1,
        limit: 200,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { serviceType: string; ticketId?: string }) =>
      nucleoApi.queue.create(payload),
    onSuccess: () => {
      toast.success("Queue token created");
      queryClient.invalidateQueries({ queryKey: ["nucleo-queue"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
      setIsCreateOpen(false);
      setForm({ serviceType: "general", ticketId: "" });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to create queue token"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      counter,
    }: {
      id: string;
      status: string;
      counter?: string;
    }) => nucleoApi.queue.updateStatus(id, status, counter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-queue"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to update queue token"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => nucleoApi.queue.delete(id),
    onSuccess: () => {
      toast.success("Queue token deleted");
      queryClient.invalidateQueries({ queryKey: ["nucleo-queue"] });
    },
    onError: () => toast.error("Failed to delete queue token"),
  });

  if (queueLoading || ticketsLoading) return <Loading text="Loading queue..." />;

  const queueTokens: any[] = queueData?.data ?? [];
  const tickets: any[] = ticketsData?.data ?? [];

  // Unassigned tickets = open and not in any queue token
  const tokenTicketIds = new Set(
    queueTokens.map((t: any) => t.ticketId).filter(Boolean),
  );
  const unassignedTickets = tickets.filter(
    (t: any) => t.status !== "closed" && !tokenTicketIds.has(t.id),
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return queueTokens;
    const s = search.toLowerCase();
    return queueTokens.filter(
      (t: any) =>
        String(t.tokenNumber || "").includes(s) ||
        String(t.serviceType || "").toLowerCase().includes(s) ||
        String(t.counter || "").toLowerCase().includes(s),
    );
  }, [queueTokens, search]);

  const waitingCount = queueTokens.filter(
    (t: any) => t.status === "waiting",
  ).length;
  const calledCount = queueTokens.filter(
    (t: any) => t.status === "called",
  ).length;
  const completedCount = queueTokens.filter(
    (t: any) => t.status === "completed",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Queue</h1>
          <p className="text-muted-foreground">
            Manage live service queue tokens and track agent availability.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          New Token
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
              Waiting
            </p>
            <p className="text-3xl font-black text-foreground mt-1">
              {waitingCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
              Called
            </p>
            <p className="text-3xl font-black text-primary mt-1">
              {calledCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
              Completed
            </p>
            <p className="text-3xl font-black text-emerald-400 mt-1">
              {completedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {unassignedTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Unassigned Open Tickets ({unassignedTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unassignedTickets.slice(0, 10).map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{ticket.subject}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      [{ticket.queue}]
                    </span>
                  </div>
                  <Badge
                    variant={
                      ticket.priority === "high"
                        ? "destructive"
                        : ticket.priority === "medium"
                          ? "warning"
                          : "outline"
                    }
                    className="text-[10px]"
                  >
                    {ticket.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Queue Tokens</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tokens..."
                className="w-48"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="waiting">Waiting</option>
                <option value="called">Called</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<ListOrdered className="h-12 w-12" />}
              title="No queue tokens"
              description="Create a token to begin queue operations."
              action={{
                label: "New Token",
                onClick: () => setIsCreateOpen(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((token: any) => {
                const nextStatus =
                  token.status === "waiting"
                    ? "called"
                    : token.status === "called"
                      ? "completed"
                      : "waiting";
                const actionLabel =
                  token.status === "waiting"
                    ? "Call"
                    : token.status === "called"
                      ? "Complete"
                      : "Reopen";

                return (
                  <div
                    key={token.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        Token #{token.tokenNumber} — {token.serviceType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {token.createdAt
                          ? new Date(token.createdAt).toLocaleTimeString()
                          : "-"}
                        {token.counter && ` · Counter: ${token.counter}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          token.status === "completed"
                            ? "success"
                            : token.status === "called"
                              ? "primary"
                              : "outline"
                        }
                      >
                        {token.status}
                      </Badge>
                      <Input
                        className="w-36"
                        value={counterDrafts[token.id] ?? token.counter ?? ""}
                        onChange={(e) =>
                          setCounterDrafts((prev) => ({
                            ...prev,
                            [token.id]: e.target.value,
                          }))
                        }
                        placeholder="Desk-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: token.id,
                            status: nextStatus,
                            counter:
                              nextStatus === "called"
                                ? counterDrafts[token.id] ||
                                  token.counter ||
                                  "Desk-1"
                                : token.counter || undefined,
                          })
                        }
                        loading={updateStatusMutation.isPending}
                      >
                        {actionLabel}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => deleteMutation.mutate(token.id)}
                        loading={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Queue Token"
        submitText="Create Token"
        loading={createMutation.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          const serviceType = form.serviceType.trim();
          if (!serviceType) {
            toast.error("Service type is required");
            return;
          }
          createMutation.mutate({
            serviceType,
            ticketId: form.ticketId.trim() || undefined,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Service Type" required>
            <Input
              value={form.serviceType}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, serviceType: e.target.value }))
              }
              placeholder="general"
              required
            />
          </FormField>
          <FormField label="Related Ticket ID">
            <Input
              value={form.ticketId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ticketId: e.target.value }))
              }
              placeholder="Optional ticket UUID"
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
