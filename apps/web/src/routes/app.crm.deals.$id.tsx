/**
 * CRM Deal Detail
 *
 * Detailed view of a single deal with activity timeline.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Progress } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { dealsApi } from "@/lib/api";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function authorInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const Route = createFileRoute("/app/crm/deals/$id")({
  component: DealDetail,
});

function DealDetail() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [activeTab, setActiveTab] = useState<"timeline" | "details" | "files" | "notes">("timeline");
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const queryClient = useQueryClient();

  const { data: apiDeal, isLoading, isError } = useQuery({
    queryKey: ["deals", id],
    queryFn: () => dealsApi.get(id),
    placeholderData: (prev) => prev,
    retry: false,
    enabled: !!id,
  });

  const { data: notesData } = useQuery({
    queryKey: ["deals", id, "notes"],
    queryFn: async () => {
      const res = await fetch(`/api/v1/crm/deals/${id}/notes`, {
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
        },
      });
      if (!res.ok) throw new Error("notes unavailable");
      return res.json() as Promise<{ data: any[] }>;
    },
    placeholderData: (prev) => prev,
    retry: false,
    enabled: !!id,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/v1/crm/deals/${id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Note added");
      setNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["deals", id, "notes"] });
    },
    onError: () => toast.error("Failed to add note"),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/v1/crm/deals/${id}/notes/${noteId}`, {
        method: "DELETE",
        headers: {
          "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
        },
      });
      if (!res.ok) throw new Error("Failed to delete note");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Note deleted");
      queryClient.invalidateQueries({ queryKey: ["deals", id, "notes"] });
    },
    onError: () => toast.error("Failed to delete note"),
  });

  const notes: any[] = (notesData as any)?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-7 w-64 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="h-48 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="h-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const raw = (apiDeal as any) ?? null;

  const deal: {
    id: string;
    title: string;
    company: string;
    contact: string;
    contactEmail: string;
    contactPhone: string;
    value: number;
    stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
    probability: number;
    expectedClose: string;
    createdAt: string;
    lastActivity: string;
    owner: string;
    description: string;
    nextStep: string;
    tags: string[];
    activities: Array<{ id: string; type: string; title: string; description?: string; date: string; user: string }>;
    timeline: Array<{ date: string; title: string; stage: string }>;
  } = {
    id: (raw as any)?.id ?? id,
    title: (raw as any)?.name ?? "",
    company: (raw as any)?.companyName ?? (raw as any)?.company ?? "",
    contact: (raw as any)?.contactName ?? (raw as any)?.contact ?? "",
    contactEmail: (raw as any)?.contactEmail ?? "",
    contactPhone: (raw as any)?.contactPhone ?? "",
    value: typeof (raw as any)?.value === "string" ? parseFloat(raw.value) || 0 : ((raw as any)?.value ?? 0),
    stage: (raw as any)?.stage ?? "lead",
    probability: (raw as any)?.probability ?? 0,
    expectedClose: (raw as any)?.expectedCloseDate ?? (raw as any)?.expectedClose ?? "",
    createdAt: (raw as any)?.createdAt ? String((raw as any).createdAt).slice(0, 10) : "",
    lastActivity: (raw as any)?.updatedAt ? String((raw as any).updatedAt).slice(0, 10) : "",
    owner: (raw as any)?.ownerName ?? (raw as any)?.owner ?? "",
    description: (raw as any)?.notes ?? (raw as any)?.description ?? "",
    nextStep: (raw as any)?.nextStep ?? "",
    tags: (raw as any)?.tags ?? [],
    activities: (raw as any)?.activities ?? [],
    timeline: (raw as any)?.timeline ?? [],
  };

  const stageColors: Record<string, string> = {
    lead: "bg-purple-500",
    qualified: "bg-blue-500",
    proposal: "bg-cyan-500",
    negotiation: "bg-yellow-500",
    closed_won: "bg-green-500",
    closed_lost: "bg-red-500",
  };

  const stageLabels: Record<string, string> = {
    lead: "Lead",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    closed_won: "Closed Won",
    closed_lost: "Closed Lost",
  };

  const activityIcons: Record<string, React.ReactNode> = {
    stage_change: <TrendingUp className="h-4 w-4 text-blue-600" />,
    meeting: <Calendar className="h-4 w-4 text-purple-600" />,
    email: <Mail className="h-4 w-4 text-green-600" />,
    call: <Phone className="h-4 w-4 text-orange-600" />,
    note: <MessageSquare className="h-4 w-4 text-gray-600" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/crm/deals" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-2xl text-foreground">{deal.title}</h1>
            <Badge
              variant="outline"
              className={
                deal.stage === "closed_won"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : deal.stage === "closed_lost"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
              }
            >
              {stageLabels[deal.stage]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {deal.company} · {deal.contact}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stage Progress */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Deal Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold">${(deal.value / 1000).toFixed(0)}K</span>
                <span className="text-sm text-muted-foreground">
                  {deal.probability}% probability
                </span>
              </div>
              <Progress value={deal.probability} className="h-3 mb-6" />

              {/* Timeline */}
              <div className="flex items-center justify-between">
                {deal.timeline.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="text-center">
                      <div
                        className={`w-8 h-8 rounded-full ${stageColors[item.stage]} flex items-center justify-center`}
                      >
                        {index === deal.timeline.length - 1 ? (
                          <Clock className="h-4 w-4 text-white" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <p className="text-xs mt-2 font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    {index < deal.timeline.length - 1 && (
                      <div className="w-[80px] h-0.5 bg-border mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="border-b border-border">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "timeline"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Activity Timeline
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Deal Details
              </button>
              <button
                onClick={() => setActiveTab("files")}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "files"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Files & Documents
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "notes"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Notes & Activity
              </button>
            </nav>
          </div>

          {/* Activity Timeline Tab */}
          {activeTab === "timeline" && (
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {deal.activities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-muted p-2">
                          {activityIcons[activity.type]}
                        </div>
                        {index < deal.activities.length - 1 && (
                          <div className="w-px h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{activity.title}</p>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.date} · {activity.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Deal Details Tab */}
          {activeTab === "details" && (
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{deal.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Next Step</p>
                    <p className="text-sm text-muted-foreground">{deal.nextStep}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Expected Close</p>
                      <p className="text-sm text-muted-foreground">{deal.expectedClose}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Created</p>
                      <p className="text-sm text-muted-foreground">{deal.createdAt}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {deal.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files Tab */}
          {activeTab === "files" && (
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No files uploaded yet</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes & Activity Tab */}
          {activeTab === "notes" && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Notes & Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Activity timeline */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Recent Activity
                  </p>
                  <div className="space-y-3">
                    {deal.activities.map((activity, index) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="rounded-full bg-muted p-1.5">
                            {activityIcons[activity.type] ?? <MessageSquare className="h-3 w-3 text-gray-600" />}
                          </div>
                          {index < deal.activities.length - 1 && (
                            <div className="w-px flex-1 bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <p className="text-sm font-medium">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {activity.date} · {activity.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Add note composer */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Add Note
                  </p>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write a note about this deal..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      disabled={!noteContent.trim() || addNoteMutation.isPending}
                      onClick={() => {
                        const content = noteContent.trim();
                        if (content) addNoteMutation.mutate(content);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {addNoteMutation.isPending ? "Saving..." : "Add Note"}
                    </Button>
                  </div>
                </div>

                {/* Notes list */}
                {notes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                      Notes ({notes.length})
                    </p>
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="flex gap-3 p-3 rounded-lg border border-border bg-muted/20"
                        >
                          {/* Author initials circle */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {authorInitials(note.author)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {editingNoteId === note.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  rows={2}
                                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingNoteId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      toast.info("Edit saved locally");
                                      setEditingNoteId(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-xs font-medium text-foreground">
                                    {note.author}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">
                                      {timeAgo(note.createdAt)}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditingNoteId(note.id);
                                        setEditingContent(note.content);
                                      }}
                                      className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                      title="Edit note"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => deleteNoteMutation.mutate(note.id)}
                                      className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                                      title="Delete note"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-sm text-foreground">{note.content}</p>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deal Value */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold">${(deal.value / 1000).toFixed(0)}K</p>
                <p className="text-sm text-muted-foreground mt-1">Deal Value</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-lg font-semibold">${((deal.value * deal.probability) / 100 / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-muted-foreground">Weighted</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{deal.probability}%</p>
                  <p className="text-xs text-muted-foreground">Probability</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                to={`/app/crm/contacts/${deal.contact}` as string}
                className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{deal.contact}</p>
                  <p className="text-xs text-muted-foreground">{deal.company}</p>
                </div>
              </Link>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${deal.contactEmail}`} className="hover:text-primary">
                  {deal.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${deal.contactPhone}`} className="hover:text-primary">
                  {deal.contactPhone}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Log Call
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Deal Info */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Deal Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Owner</span>
                <span className="text-sm font-medium">{deal.owner}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expected Close</span>
                <span className="text-sm">{deal.expectedClose}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Activity</span>
                <span className="text-sm">{deal.lastActivity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{deal.createdAt}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
