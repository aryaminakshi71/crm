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
import { BookOpenText, LifeBuoy, ListOrdered, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { aiApi, nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/helpdesk")({
  component: HelpdeskPage,
});

function HelpdeskPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [queueFilter, setQueueFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queueSearch, setQueueSearch] = useState("");
  const [queueStatusFilter, setQueueStatusFilter] = useState("all");
  const [counterDrafts, setCounterDrafts] = useState<Record<string, string>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: "",
    category: "General",
    content: "",
  });
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

  const { data, isLoading } = useQuery({
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

  const { data: articlesData, isLoading: isArticlesLoading } = useQuery({
    queryKey: ["ops-knowledge-articles"],
    queryFn: () =>
      nucleoApi.operations.knowledgeArticles.list({
        page: 1,
        limit: 200,
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

  const createArticle = useMutation({
    mutationFn: (payload: { title: string; category: string; content: string }) =>
      nucleoApi.operations.knowledgeArticles.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-knowledge-articles"] });
      toast.success("Knowledge article created");
      setIsArticleModalOpen(false);
      setNewArticle({ title: "", category: "General", content: "" });
    },
    onError: () => toast.error("Failed to create article"),
  });

  const updateArticle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.operations.knowledgeArticles.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-knowledge-articles"] });
      toast.success("Article updated");
    },
  });

  const deleteArticle = useMutation({
    mutationFn: (id: string) => nucleoApi.operations.knowledgeArticles.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-knowledge-articles"] });
      toast.success("Article deleted");
    },
  });

  const tickets = data?.data || [];
  const queueTokens = queueData?.data || [];
  const comments = commentsData?.data || [];
  const knowledgeArticles = articlesData?.data || [];
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket: any) => {
      if (priorityFilter !== "all" && ticket.priority !== priorityFilter) {
        return false;
      }
      if (!search.trim()) return true;
      const searchLower = search.toLowerCase();
      return (
        String(ticket.subject || "").toLowerCase().includes(searchLower) ||
        String(ticket.description || "").toLowerCase().includes(searchLower) ||
        String(ticket.queue || "").toLowerCase().includes(searchLower)
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
    const searchLower = queueSearch.toLowerCase();
    return queueTokens.filter((token: any) => {
      const tokenNumber = String(token.tokenNumber || "").toLowerCase();
      const serviceType = String(token.serviceType || "").toLowerCase();
      const counter = String(token.counter || "").toLowerCase();
      return (
        tokenNumber.includes(searchLower) ||
        serviceType.includes(searchLower) ||
        counter.includes(searchLower)
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

  if (isLoading || isQueueLoading || isCommentsLoading || isArticlesLoading) {
    return <Loading text="Loading helpdesk workspace..." />;
  }

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Open</p>
            <p className="font-bold text-2xl text-warning">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">In Progress</p>
            <p className="font-bold text-2xl text-primary">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Closed</p>
            <p className="font-bold text-2xl text-success">{closedCount}</p>
          </CardContent>
        </Card>
      </div>

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
          action={{ label: "Create Ticket", onClick: () => setIsCreateModalOpen(true) }}
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
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-base">{ticket.subject}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          ticket.status === "closed"
                            ? "outline"
                            : ticket.status === "in_progress"
                              ? "primary"
                              : "success"
                        }
                      >
                        {ticket.status}
                      </Badge>
                      <Badge
                        variant={
                          ticket.priority === "high"
                            ? "danger"
                            : ticket.priority === "medium"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {ticket.description ? (
                    <p className="text-foreground">{ticket.description}</p>
                  ) : null}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <p className="text-muted-foreground">
                      Queue: <span className="text-foreground">{ticket.queue}</span>
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
                    <p className="mb-2 font-medium text-foreground text-sm">Ticket Notes</p>
                    <div className="space-y-2">
                      {(commentsByTicket[ticket.id] || []).slice(0, 4).map((comment: any) => (
                        <div key={comment.id} className="flex items-start justify-between gap-2 rounded-md border border-border bg-card p-2">
                          <p className="text-muted-foreground text-xs">{comment.message}</p>
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
                            const message = (commentDrafts[ticket.id] || "").trim();
                            if (!message) {
                              toast.error("Comment is required");
                              return;
                            }
                            addComment.mutate(
                              { ticketId: ticket.id, message },
                              {
                                onSuccess: () => {
                                  setCommentDrafts((prev) => ({ ...prev, [ticket.id]: "" }));
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
                  Queue is now merged into Helpdesk for a single support workflow.
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
                Waiting: <span className="ml-1 font-semibold">{waitingCount}</span>
              </div>
              <div className="flex items-center rounded-lg border border-border px-3 py-2 text-sm">
                Called: <span className="ml-1 font-semibold">{calledCount}</span>
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
                            value={counterDrafts[token.id] ?? token.counter ?? ""}
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
                                    ? (counterDrafts[token.id] ||
                                      token.counter ||
                                      "Desk-1")
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

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Knowledge Base</CardTitle>
              <p className="text-muted-foreground text-sm">
                Reusable resolution articles for faster ticket handling.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<BookOpenText className="h-4 w-4" />}
              onClick={() => setIsArticleModalOpen(true)}
            >
              New Article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {knowledgeArticles.length === 0 ? (
            <EmptyState
              icon={<BookOpenText className="h-10 w-10" />}
              title="No knowledge articles"
              description="Create articles for recurring support issues."
            />
          ) : (
            <div className="space-y-3">
              {knowledgeArticles.map((article: any) => (
                <div key={article.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{article.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {article.category} | {article.status}
                      </p>
                      <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                        {article.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="flex h-8 rounded-md border border-border bg-card px-2 text-xs"
                        value={article.status}
                        onChange={(e) =>
                          updateArticle.mutate({
                            id: article.id,
                            status: e.target.value,
                          })
                        }
                      >
                        <option value="draft">draft</option>
                        <option value="published">published</option>
                        <option value="archived">archived</option>
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => deleteArticle.mutate(article.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
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
              Use AI to classify priority, queue, and SLA target from ticket context.
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
                  toast.error("Add subject and description before AI triage");
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
                setNewToken((prev) => ({ ...prev, serviceType: e.target.value }))
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

      <FormModal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        title="Create Knowledge Article"
        submitText="Create Article"
        loading={createArticle.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newArticle.title.trim() || !newArticle.content.trim()) {
            toast.error("Title and content are required");
            return;
          }
          createArticle.mutate({
            title: newArticle.title.trim(),
            category: newArticle.category,
            content: newArticle.content.trim(),
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={newArticle.title}
              onChange={(e) =>
                setNewArticle((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Category">
            <Input
              value={newArticle.category}
              onChange={(e) =>
                setNewArticle((prev) => ({ ...prev, category: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Content" required>
            <Textarea
              rows={5}
              value={newArticle.content}
              onChange={(e) =>
                setNewArticle((prev) => ({ ...prev, content: e.target.value }))
              }
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
