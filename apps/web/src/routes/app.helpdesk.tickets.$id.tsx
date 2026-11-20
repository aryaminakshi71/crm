import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare, Paperclip, Trash2,
  AlertCircle, Loader2, Download
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { helpdeskApi } from "@/lib/api";

export const Route = createFileRoute("/app/helpdesk/tickets/$id")({
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { id } = useParams({ from: "/app/helpdesk/tickets/$id" });
  const [commentDraft, setCommentDraft] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: ticket, isLoading: ticketLoading, isError, refetch} = useQuery({
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ticketId", id);
    try {
      await fetch(`/api/v1/helpdesk/tickets/${id}/attachments`, {
        method: "POST",
        headers: { "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "" },
        body: formData,
      });
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "ticket", id] });
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const res = await fetch(`/api/v1/helpdesk/tickets/${id}/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: { "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "" },
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Attachment deleted");
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "ticket", id] });
    },
    onError: () => toast.error("Failed to delete attachment"),
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

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
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
                  {comments.map((comment: any) => {
                    const authorName: string =
                      comment.authorName ?? comment.author ?? comment.createdBy ?? "Team";
                    const initials = authorName
                      .split(" ")
                      .map((p: string) => p[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    return (
                      <div
                        key={comment.id}
                        className={`rounded-lg border p-3 flex gap-3 ${
                          comment.isInternal
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-muted/30 border-border"
                        }`}
                      >
                        {/* Author initials avatar */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {initials}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">
                              {authorName}
                            </span>
                            <Badge
                              variant={comment.isInternal ? "outline" : "primary"}
                              className="text-[10px]"
                            >
                              {comment.isInternal ? "Internal Note" : "Reply"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {comment.createdAt
                                ? new Date(comment.createdAt).toLocaleString()
                                : "-"}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{comment.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-border">
                {/* Reply / Internal Note toggle */}
                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setIsInternal(false)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      !isInternal
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Reply to Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternal(true)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      isInternal
                        ? "bg-yellow-100 shadow-sm text-yellow-800"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Internal Note
                  </button>
                </div>

                <div
                  className={`rounded-lg border p-2 transition-colors ${
                    isInternal
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-background border-border"
                  }`}
                >
                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder={
                      isInternal
                        ? "Add internal note (not visible to customer)..."
                        : "Add reply to customer..."
                    }
                    rows={3}
                    className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        const msg = commentDraft.trim();
                        if (msg) addCommentMutation.mutate({ body: msg, isInternal });
                      }
                    }}
                  />
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      variant={isInternal ? "outline" : "primary"}
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
                      {isInternal ? "Add Internal Note" : "Send Reply"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(ticket.attachments ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No attachments yet.</p>
              ) : (
                <div className="space-y-2">
                  {(ticket.attachments ?? []).map((att: any) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/20 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{att.filename ?? att.name}</p>
                          {att.size != null && (
                            <p className="text-xs text-muted-foreground">
                              {att.size < 1024
                                ? `${att.size} B`
                                : att.size < 1024 * 1024
                                ? `${(att.size / 1024).toFixed(1)} KB`
                                : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {att.url && (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
                          </a>
                        )}
                        <button
                          onClick={() => deleteAttachmentMutation.mutate(att.id)}
                          disabled={deleteAttachmentMutation.isPending}
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-destructive/10 transition-colors"
                          title="Delete attachment"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-border">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 w-full justify-center rounded-lg border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Paperclip className="h-4 w-4" />
                      Attach file
                    </>
                  )}
                </button>
              </div>
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
                  <Badge variant="danger" className="text-[10px]">
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
