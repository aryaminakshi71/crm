import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare, Paperclip, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/helpdesk/tickets/$id")({
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { id } = useParams({ from: "/app/helpdesk/tickets/$id" });
  const [commentDraft, setCommentDraft] = useState("");
  const queryClient = useQueryClient();

  // Fetch all tickets and find the one matching :id
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ["nucleo-tickets", "all", "all"],
    queryFn: () => nucleoApi.tickets.list({ page: 1, limit: 500 }),
  });

  // Fetch comments for this ticket
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["ops-ticket-comments", id],
    queryFn: () =>
      nucleoApi.operations.ticketComments.list({
        page: 1,
        limit: 200,
        ticketId: id,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      nucleoApi.tickets.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Ticket status updated");
      queryClient.invalidateQueries({ queryKey: ["nucleo-tickets"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const addCommentMutation = useMutation({
    mutationFn: (message: string) =>
      nucleoApi.operations.ticketComments.create({ ticketId: id, message }),
    onSuccess: () => {
      toast.success("Comment added");
      setCommentDraft("");
      queryClient.invalidateQueries({ queryKey: ["ops-ticket-comments", id] });
    },
    onError: () => toast.error("Failed to add comment"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      nucleoApi.operations.ticketComments.delete(commentId),
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["ops-ticket-comments", id] });
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  if (ticketsLoading || commentsLoading) {
    return <Loading text="Loading ticket..." />;
  }

  const tickets: any[] = ticketsData?.data ?? [];
  const ticket = tickets.find((t: any) => t.id === id);
  const comments: any[] = commentsData?.data ?? [];

  if (!ticket) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-12 w-12" />}
        title="Ticket not found"
        description={`No ticket with ID ${id} exists in this organization.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => history.back()}
        >
          Back
        </Button>
        <div>
          <h1 className="font-bold text-xl text-foreground">
            {ticket.subject}
          </h1>
          <p className="text-muted-foreground text-sm">
            #{ticket.id.slice(-8).toUpperCase()} · {ticket.queue}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.description ? (
                <p className="text-sm text-foreground">{ticket.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No description provided.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Timeline / Comments ({comments.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {comments.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="h-8 w-8" />}
                  title="No comments yet"
                  description="Add the first internal note or customer reply."
                />
              ) : (
                <div className="space-y-3">
                  {comments.map((comment: any) => (
                    <div
                      key={comment.id}
                      className="rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {comment.isInternal ? (
                              <Badge variant="outline" className="text-[10px]">
                                Internal
                              </Badge>
                            ) : (
                              <Badge variant="primary" className="text-[10px]">
                                Reply
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {comment.createdAt
                                ? new Date(
                                    comment.createdAt,
                                  ).toLocaleString()
                                : "-"}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">
                            {comment.message}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Trash2 className="h-3 w-3" />}
                          onClick={() =>
                            deleteCommentMutation.mutate(comment.id)
                          }
                          loading={deleteCommentMutation.isPending}
                          className="h-7 px-2 text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Add internal note or reply..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      const msg = commentDraft.trim();
                      if (msg) addCommentMutation.mutate(msg);
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const msg = commentDraft.trim();
                    if (!msg) {
                      toast.error("Comment is required");
                      return;
                    }
                    addCommentMutation.mutate(msg);
                  }}
                  loading={addCommentMutation.isPending}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Paperclip className="h-8 w-8" />}
                title="No attachments"
                description="File attachment support is coming soon."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                  Status
                </p>
                <select
                  className="flex h-9 w-full rounded-lg border border-border bg-card px-3 py-1 text-sm"
                  value={ticket.status}
                  onChange={(e) =>
                    updateStatusMutation.mutate(e.target.value)
                  }
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                  Priority
                </p>
                <Badge
                  variant={
                    ticket.priority === "high"
                      ? "destructive"
                      : ticket.priority === "medium"
                        ? "warning"
                        : "outline"
                  }
                >
                  {ticket.priority}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                  Queue
                </p>
                <p className="font-medium text-foreground">{ticket.queue}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                  Created
                </p>
                <p className="text-foreground">
                  {ticket.createdAt
                    ? new Date(ticket.createdAt).toLocaleString()
                    : "-"}
                </p>
              </div>
              {ticket.closedAt && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Closed
                  </p>
                  <p className="text-foreground">
                    {new Date(ticket.closedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
