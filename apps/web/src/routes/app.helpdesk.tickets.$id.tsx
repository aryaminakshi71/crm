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
import { helpdeskApi } from "../lib/api";

export const Route = createFileRoute("/app/helpdesk/tickets/$id")({
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { id } = useParams({ from: "/app/helpdesk/tickets/$id" });
  const [commentDraft, setCommentDraft] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const queryClient = useQueryClient();

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ["helpdesk", "ticket", id],
    queryFn: () => helpdeskApi.tickets.get(id),
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["helpdesk", "ticket-comments", id],
    queryFn: () => helpdeskApi.ticketComments.list(id, { page: 1, limit: 200 }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, any>) =>
      helpdeskApi.tickets.update(id, data),
    onSuccess: () => {
      toast.success("Ticket updated");
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "tickets"] });
    },
    onError: () => toast.error("Failed to update ticket"),
  });

  const addCommentMutation = useMutation({
    mutationFn: (data: { body: string; isInternal: boolean }) =>
      helpdeskApi.ticketComments.create(id, data),
    onSuccess: () => {
      toast.success("Comment added");
      setCommentDraft("");
      queryClient.invalidateQueries({
        queryKey: ["helpdesk", "ticket-comments", id],
      });
    },
    onError: () => toast.error("Failed to add comment"),
  });

  if (ticketLoading || commentsLoading) {
    return <Loading text="Loading ticket..." />;
  }

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
            #{ticket.id.slice(-8).toUpperCase()} · {ticket.source ?? "web"}
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
                  Comments ({comments.length})
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
                            <Badge
                              variant={
                                comment.isInternal ? "outline" : "primary"
                              }
                              className="text-[10px]"
                            >
                              {comment.isInternal ? "Internal" : "Reply"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {comment.createdAt
                                ? new Date(comment.createdAt).toLocaleString()
                                : "-"}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">
                            {comment.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="internal-note"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="internal-note"
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    Internal note (not visible to customer)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder={
                      isInternal
                        ? "Add internal note..."
                        : "Add reply to customer..."
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        const msg = commentDraft.trim();
                        if (msg)
                          addCommentMutation.mutate({
                            body: msg,
                            isInternal,
                          });
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
                      addCommentMutation.mutate({ body: msg, isInternal });
                    }}
                    loading={addCommentMutation.isPending}
                  >
                    Add
                  </Button>
                </div>
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
                    updateMutation.mutate({ status: e.target.value })
                  }
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                  Priority
                </p>
                <select
                  className="flex h-9 w-full rounded-lg border border-border bg-card px-3 py-1 text-sm"
                  value={ticket.priority}
                  onChange={(e) =>
                    updateMutation.mutate({ priority: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              {ticket.category && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Category
                  </p>
                  <p className="font-medium text-foreground">
                    {ticket.category}
                  </p>
                </div>
              )}
              {ticket.contactName && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Contact
                  </p>
                  <p className="font-medium text-foreground">
                    {ticket.contactName}
                  </p>
                  {ticket.contactEmail && (
                    <p className="text-xs text-muted-foreground">
                      {ticket.contactEmail}
                    </p>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                  Source
                </p>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {ticket.source ?? "web"}
                </Badge>
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
              {ticket.firstResponseAt && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    First Response
                  </p>
                  <p className="text-foreground">
                    {new Date(ticket.firstResponseAt).toLocaleString()}
                  </p>
                </div>
              )}
              {ticket.resolvedAt && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Resolved
                  </p>
                  <p className="text-foreground">
                    {new Date(ticket.resolvedAt).toLocaleString()}
                  </p>
                </div>
              )}
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
              {ticket.slaBreached && (
                <div>
                  <Badge variant="destructive" className="text-[10px]">
                    SLA Breached
                  </Badge>
                </div>
              )}
              {ticket.satisfaction && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Satisfaction
                  </p>
                  <p className="font-medium text-foreground">
                    {ticket.satisfaction}/5
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
