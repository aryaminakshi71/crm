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
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BookOpenText,
  CheckCircle2,
  LifeBuoy,
  ListOrdered,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { aiApi, helpdeskApi, nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/helpdesk/")({
  component: HelpdeskIndexPage,
});

function HelpdeskIndexPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [queueFilter, setQueueFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queueSearch, setQueueSearch] = useState("");
  const [queueStatusFilter, setQueueStatusFilter] = useState("all");
  const [counterDrafts, setCounterDrafts] = useState<Record<string, string>>(
    {},
  );
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    queue: "general",
  });
  const [newToken, setNewToken] = useState({
    serviceType: "general",
    ticketId: "",
  });
  const [triageResult, setTriageResult] = useState<{
    priority: "low" | "medium" | "high";
    queue: string;
    summary: string;
    suggestedResponse: string;
    slaHours: number;
    confidence: number;
    rationale: string[];
  } | null>(null);
  const queryClient = useQueryClient();

  const { data: hdStats } = useQuery({
    queryKey: ["helpdesk", "stats"],
    queryFn: () => helpdeskApi.stats(),
    retry: false,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["nucleo-tickets", statusFilter, queueFilter],
    queryFn: () =>
      nucleoApi.tickets.list({
        page: 1,
        limit: 100,
        status: statusFilter !== "all" ? statusFilter : undefined,
        queue: queueFilter !== "all" ? queueFilter : undefined,
      }),
  });

  const { data: queueData, isLoading: isQueueLoading } = useQuery({
    queryKey: ["nucleo-queue", queueStatusFilter],
    queryFn: () =>
      nucleoApi.queue.list({
        page: 1,
        limit: 100,
        status: queueStatusFilter !== "all" ? queueStatusFilter : undefined,
      }),
  });

  const { data: commentsData, isLoading: isCommentsLoading } = useQuery({
    queryKey: ["ops-ticket-comments"],
    queryFn: () =>
      nucleoApi.operations.ticketComments.list({
        page: 1,
        limit: 500,
      }),
  });

  const createTicket = useMutation({
    mutationFn: (payload: {
      subject: string;
      description?: string;
      priority?: "low" | "medium" | "high";
      queue?: string;
    }) => nucleoApi.tickets.create(payload),
    onSuccess: () => {
      toast.success("Ticket created");
      queryClient.invalidateQueries({ queryKey: ["nucleo-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
      setIsCreateModalOpen(false);
      setNewTicket({
        subject: "",
        description: "",
        priority: "medium",
        queue: "general",
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to create ticket"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.tickets.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to update ticket"),
  });

  const deleteTicket = useMutation({
    mutationFn: (id: string) => nucleoApi.tickets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ops-ticket-comments"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
      toast.success("Ticket deleted");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to delete ticket"),
  });

  const createQueueToken = useMutation({
    mutationFn: (payload: { serviceType: string; ticketId?: string }) =>
      nucleoApi.queue.create(payload),
    onSuccess: () => {
      toast.success("Queue token created");
      queryClient.invalidateQueries({ queryKey: ["nucleo-queue"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
      setIsQueueModalOpen(false);
      setNewToken({ serviceType: "general", ticketId: "" });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to create queue token"),
  });

  const aiTriageMutation = useMutation({
    mutationFn: (payload: { subject: string; description: string }) =>
      aiApi.triageTicket(payload),
    onSuccess: (response) => {
      if (!response.result) {
        toast.error("AI triage did not return a result");
        return;
      }
      const result = response.result;
      setNewTicket((prev) => ({
        ...prev,
        priority: result.priority,
        queue: result.queue || prev.queue,
      }));
      setTriageResult(result);
      toast.success("AI triage suggestions applied");
    },
    onError: () => {
      toast.error("Failed to generate AI triage");
    },
  });

  const updateQueueStatus = useMutation({
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

  const deleteQueueToken = useMutation({
    mutationFn: (id: string) => nucleoApi.queue.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-queue"] });
      toast.success("Queue token deleted");
    },
    onError: () => toast.error("Failed to delete queue token"),
  });

  const addComment = useMutation({
    mutationFn: (payload: { ticketId: string; message: string }) =>
      nucleoApi.operations.ticketComments.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-ticket-comments"] });
      toast.success("Comment added");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to add comment"),
  });

  const deleteComment = useMutation({
    mutationFn: (id: string) => nucleoApi.operations.ticketComments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-ticket-comments"] });
      toast.success("Comment deleted");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to delete comment"),
  });

  const tickets = data?.data ?? [];
  const queueTokens = queueData?.data ?? [];
  const comments = commentsData?.data ?? [];

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket: any) => {
      if (priorityFilter !== "all" && ticket.priority !== priorityFilter)
        return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        String(ticket.subject || "").toLowerCase().includes(s) ||
        String(ticket.description || "").toLowerCase().includes(s) ||
        String(ticket.queue || "").toLowerCase().includes(s)
      );
    });
  }, [tickets, search, priorityFilter]);

  const openCount = tickets.filter((t: any) => t.status === "open").length;
  const inProgressCount = tickets.filter(
    (t: any) => t.status === "in_progress",
  ).length;
  const closedCount = tickets.filter((t: any) => t.status === "closed").length;
  const waitingCount = queueTokens.filter(
    (token: any) => token.status === "waiting",
  ).length;
  const calledCount = queueTokens.filter(
    (token: any) => token.status === "called",
  ).length;
  const completedCount = queueTokens.filter(
    (token: any) => token.status === "completed",
  ).length;

  const filteredQueueTokens = useMemo(() => {
    if (!queueSearch.trim()) return queueTokens;
    const s = queueSearch.toLowerCase();
    return queueTokens.filter((token: any) => {
      return (
        String(token.tokenNumber || "").toLowerCase().includes(s) ||
        String(token.serviceType || "").toLowerCase().includes(s) ||
        String(token.counter || "").toLowerCase().includes(s)
      );
    });
  }, [queueSearch, queueTokens]);

  const commentsByTicket = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    for (const comment of comments) {
      const ticketId = String(comment.ticketId || "");
      if (!grouped[ticketId]) grouped[ticketId] = [];
      grouped[ticketId].push(comment);
    }
    return grouped;
  }, [comments]);

  if (isLoading || isQueueLoading || isCommentsLoading) {
    return <Loading text="Loading helpdesk..." />;
  }

  if (isError) return (
    <EmptyState variant="error" title="Something went wrong" description="Failed to load data. Please try again." action={<Button onClick={() => refetch()}>Retry</Button>} />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Helpdesk</h1>
          <p className="text-muted-foreground">
            Support operations with triage, priority, and queue-based ticketing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<ListOrdered className="h-4 w-4" />}
            onClick={() => setIsQueueModalOpen(true)}
            loading={createQueueToken.isPending}
          >
            New Queue Token
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            loading={createTicket.isPending}
          >
            New Ticket
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Critical Tickets"
          value={
            tickets.filter(
              (t: any) => t.priority === "high" && t.status !== "closed",
            ).length
          }
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={`${openCount} open`}
          color="text-destructive"
        />
        <Metric
          title="Active Queue"
          value={waitingCount}
          icon={<Activity className="h-4 w-4" />}
          trend={`${calledCount} called`}
          color="text-primary"
        />
        <Metric
          title="Resolved Rate"
          value={`${Math.round((closedCount / (tickets.length || 1)) * 100)}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          trend={`${closedCount} closed`}
          color="text-emerald-400"
        />
        <Metric
          title="In Progress"
          value={inProgressCount}
          icon={<ShieldCheck className="h-4 w-4" />}
          trend={`${completedCount} completed`}
          color="text-cyan-400"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Support Velocity
            </CardTitle>
            <p className="text-2xl font-black text-foreground">
              Traffic Analysis
            </p>
          </div>
          <Activity className="h-4 w-4 text-muted-foreground/40" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { time: "08:00", open: openCount, closed: closedCount },
                  {
                    time: "Now",
                    open: inProgressCount,
                    closed: completedCount,
                  },
                ]}
              >
                <defs>
                  <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  stroke="#888"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  stroke="#888"
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "11px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="open"
                  stroke="#22d3ee"
                  fillOpacity={1}
                  fill="url(#colorOpen)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="closed"
                  stroke="#22c55e"
                  fillOpacity={0}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject, description, queue..."
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
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={queueFilter}
          onChange={(e) => setQueueFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All queues</option>
          <option value="general">General</option>
          <option value="billing">Billing</option>
          <option value="technical">Technical</option>
        </select>
      </div>

      {filteredTickets.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy className="h-12 w-12" />}
          title="No tickets found"
          description="Create your first support ticket or adjust filters."
          action={{
            label: "Create Ticket",
            onClick: () => setIsCreateModalOpen(true),
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket: any) => {
            const nextStatus =
              ticket.status === "open"
                ? "in_progress"
                : ticket.status === "in_progress"
                  ? "closed"
                  : "open";
            const actionLabel =
              ticket.status === "open"
                ? "Start"
                : ticket.status === "in_progress"
                  ? "Close"
                  : "Reopen";

            return (
              <Card key={ticket.id}>
                <CardHeader className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        {ticket.queue} · #{ticket.id.slice(-4).toUpperCase()}
                      </p>
                      <CardTitle className="text-sm font-bold">
                        {ticket.subject}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="h-6 rounded border border-border bg-card text-[10px]"
                        value={ticket.status}
                        onChange={(e) =>
                          updateStatus.mutate({
                            id: ticket.id,
                            status: e.target.value,
                          })
                        }
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">Working</option>
                        <option value="closed">Closed</option>
                      </select>
                      <Badge
                        variant={
                          ticket.status === "closed"
                            ? "outline"
                            : ticket.status === "in_progress"
                              ? "primary"
                              : "success"
                        }
                        className="text-[9px] py-0 h-5"
                      >
                        {ticket.status}
                      </Badge>
                      <div
                        className={`h-2 w-2 rounded-full ${ticket.priority === "high" ? "bg-destructive animate-pulse" : ticket.priority === "medium" ? "bg-warning" : "bg-muted"}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {ticket.description ? (
                    <p className="text-foreground">{ticket.description}</p>
                  ) : null}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <p className="text-muted-foreground">
                      Queue:{" "}
                      <span className="text-foreground">{ticket.queue}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Created:{" "}
                      <span className="text-foreground">
                        {ticket.createdAt
                          ? new Date(ticket.createdAt).toLocaleString()
                          : "-"}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Closed:{" "}
                      <span className="text-foreground">
                        {ticket.closedAt
                          ? new Date(ticket.closedAt).toLocaleString()
                          : "-"}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateStatus.mutate({
                          id: ticket.id,
                          status: nextStatus,
                        })
                      }
                      loading={updateStatus.isPending}
                    >
                      {actionLabel}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => deleteTicket.mutate(ticket.id)}
                      loading={deleteTicket.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="mb-2 font-medium text-foreground text-sm">
                      Ticket Notes
                    </p>
                    <div className="space-y-2">
                      {(commentsByTicket[ticket.id] || [])
                        .slice(0, 4)
                        .map((comment: any) => (
                          <div
                            key={comment.id}
                            className="flex items-start justify-between gap-2 rounded-md border border-border bg-card p-2"
                          >
                            <p className="text-muted-foreground text-xs">
                              {comment.message}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => deleteComment.mutate(comment.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        ))}
                      <div className="flex items-center gap-2">
                        <Input
                          value={commentDrafts[ticket.id] || ""}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [ticket.id]: e.target.value,
                            }))
                          }
                          placeholder="Add internal note..."
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const message = (
                              commentDrafts[ticket.id] || ""
                            ).trim();
                            if (!message) {
                              toast.error("Comment is required");
                              return;
                            }
                            addComment.mutate(
                              { ticketId: ticket.id, message },
                              {
                                onSuccess: () => {
                                  setCommentDrafts((prev) => ({
                                    ...prev,
                                    [ticket.id]: "",
                                  }));
                                },
                              },
                            );
                          }}
                          loading={addComment.isPending}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Queue Operations</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Manage live service queue tokens alongside tickets.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<ListOrdered className="h-4 w-4" />}
                onClick={() => setIsQueueModalOpen(true)}
              >
                New Queue Token
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Input
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="Search queue tokens..."
              />
              <select
                value={queueStatusFilter}
                onChange={(e) => setQueueStatusFilter(e.target.value)}
                className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="all">All queue statuses</option>
                <option value="waiting">Waiting</option>
                <option value="called">Called</option>
                <option value="completed">Completed</option>
              </select>
              <div className="flex items-center rounded-lg border border-border px-3 py-2 text-sm">
                Waiting:{" "}
                <span className="ml-1 font-semibold">{waitingCount}</span>
              </div>
              <div className="flex items-center rounded-lg border border-border px-3 py-2 text-sm">
                Called:{" "}
                <span className="ml-1 font-semibold">{calledCount}</span>
                <span className="ml-3">Completed:</span>
                <span className="ml-1 font-semibold">{completedCount}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredQueueTokens.length === 0 ? (
            <EmptyState
              icon={<ListOrdered className="h-12 w-12" />}
              title="No queue tokens"
              description="Create a token to start queue operations."
              action={{
                label: "Create Queue Token",
                onClick: () => setIsQueueModalOpen(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {filteredQueueTokens.map((token: any) => {
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
                  <Card key={token.id}>
                    <CardContent className="pt-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            Token #{token.tokenNumber} - {token.serviceType}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Created:{" "}
                            {token.createdAt
                              ? new Date(token.createdAt).toLocaleTimeString()
                              : "-"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
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
                            className="w-40"
                            value={
                              counterDrafts[token.id] ?? token.counter ?? ""
                            }
                            onChange={(e) =>
                              setCounterDrafts((prev) => ({
                                ...prev,
                                [token.id]: e.target.value,
                              }))
                            }
                            placeholder="Counter (Desk-1)"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQueueStatus.mutate({
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
                            loading={updateQueueStatus.isPending}
                          >
                            {actionLabel}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<Trash2 className="h-4 w-4" />}
                            onClick={() => deleteQueueToken.mutate(token.id)}
                            loading={deleteQueueToken.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Ticket"
        submitText="Create Ticket"
        loading={createTicket.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          const subject = newTicket.subject.trim();
          if (!subject) {
            toast.error("Ticket subject is required");
            return;
          }
          createTicket.mutate({
            subject,
            description: newTicket.description.trim() || undefined,
            priority: newTicket.priority,
            queue: newTicket.queue.trim() || "general",
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Subject" required>
            <Input
              value={newTicket.subject}
              onChange={(e) =>
                setNewTicket((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="Customer cannot access billing portal"
              required
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newTicket.description}
              onChange={(e) =>
                setNewTicket((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Add context for support agent..."
              rows={5}
            />
          </FormField>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-muted-foreground text-sm">
              Use AI to classify priority, queue, and SLA target from ticket
              context.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Sparkles className="h-4 w-4" />}
              loading={aiTriageMutation.isPending}
              onClick={() => {
                const subject = newTicket.subject.trim();
                const description = newTicket.description.trim();
                if (!subject || !description) {
                  toast.error(
                    "Add subject and description before AI triage",
                  );
                  return;
                }
                aiTriageMutation.mutate({ subject, description });
              }}
            >
              AI Triage
            </Button>
          </div>
          {triageResult ? (
            <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="font-medium text-foreground">
                AI summary: {triageResult.summary}
              </p>
              <p className="text-muted-foreground">
                Suggested response: {triageResult.suggestedResponse}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">
                  Priority: {triageResult.priority}
                </Badge>
                <Badge variant="outline">Queue: {triageResult.queue}</Badge>
                <Badge variant="warning">SLA: {triageResult.slaHours}h</Badge>
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Priority">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newTicket.priority}
                onChange={(e) =>
                  setNewTicket((prev) => ({
                    ...prev,
                    priority: e.target.value as "low" | "medium" | "high",
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </FormField>
            <FormField label="Queue">
              <Input
                value={newTicket.queue}
                onChange={(e) =>
                  setNewTicket((prev) => ({ ...prev, queue: e.target.value }))
                }
                placeholder="general"
              />
            </FormField>
          </div>
        </div>
      </FormModal>

      <FormModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        title="Create Queue Token"
        submitText="Create Token"
        loading={createQueueToken.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          const serviceType = newToken.serviceType.trim();
          if (!serviceType) {
            toast.error("Service type is required");
            return;
          }
          createQueueToken.mutate({
            serviceType,
            ticketId: newToken.ticketId.trim() || undefined,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Service Type" required>
            <Input
              value={newToken.serviceType}
              onChange={(e) =>
                setNewToken((prev) => ({
                  ...prev,
                  serviceType: e.target.value,
                }))
              }
              placeholder="general"
              required
            />
          </FormField>
          <FormField label="Related Ticket ID">
            <Input
              value={newToken.ticketId}
              onChange={(e) =>
                setNewToken((prev) => ({ ...prev, ticketId: e.target.value }))
              }
              placeholder="Optional ticket UUID"
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">
              {value}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <LifeBuoy className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
