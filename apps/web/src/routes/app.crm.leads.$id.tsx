/**
 * CRM Lead Detail
 *
 * Detailed view of a single lead with score breakdown and activities.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Progress } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageSquarePlus,
  MoreHorizontal,
  Phone,
  Star,
  Target,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { leadsApi } from "@/lib/api";

export const Route = createFileRoute("/app/crm/leads/$id")({
  component: LeadDetail,
});

function LeadDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = Route.useParams();

  // ── Edit state ─────────────────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    jobTitle: "",
    status: "" as string,
    notes: "",
  });

  // ── Add note state ─────────────────────────────────────────────────────────
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");

  // ── Convert confirm state ──────────────────────────────────────────────────
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data: apiLead, isLoading, isError } = useQuery({
    queryKey: ["leads", id],
    queryFn: () => leadsApi.get(id),
    placeholderData: (prev) => prev,
    retry: false,
    enabled: !!id,
  });

  // ── updateLead mutation ────────────────────────────────────────────────────
  const updateLead = useMutation({
    mutationFn: (data: Parameters<typeof leadsApi.update>[1]) => leadsApi.update(id, data),
    onSuccess: () => {
      toast.success("Lead updated");
      queryClient.invalidateQueries({ queryKey: ["leads", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setShowEditModal(false);
    },
    onError: () => toast.error("Failed to update lead"),
  });

  // ── addNote mutation (via update notes field) ──────────────────────────────
  const addNote = useMutation({
    mutationFn: (note: string) => {
      if (!note.trim()) throw new Error("Note cannot be empty");
      const existingNotes = (lead as any).notes ?? "";
      const timestamp = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const combined = existingNotes
        ? `${existingNotes}\n\n[${timestamp}] ${note.trim()}`
        : `[${timestamp}] ${note.trim()}`;
      return leadsApi.update(id, { notes: combined });
    },
    onSuccess: () => {
      toast.success("Note added");
      queryClient.invalidateQueries({ queryKey: ["leads", id] });
      setShowNoteModal(false);
      setNoteText("");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add note"),
  });

  // ── convertToContact mutation ──────────────────────────────────────────────
  const convertToContact = useMutation({
    mutationFn: () =>
      leadsApi.convert(id, {
        createContact: true,
        createDeal: false,
      }),
    onSuccess: () => {
      toast.success("Lead converted to contact successfully");
      queryClient.invalidateQueries({ queryKey: ["leads", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setShowConvertConfirm(false);
      navigate({ to: "/app/crm/contacts" });
    },
    onError: () => toast.error("Failed to convert lead"),
  });

  // ── deleteLead mutation ────────────────────────────────────────────────────
  const deleteLead = useMutation({
    mutationFn: () => leadsApi.delete(id),
    onSuccess: () => {
      toast.success("Lead deleted");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      navigate({ to: "/app/crm/leads" });
    },
    onError: () => toast.error("Failed to delete lead"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-7 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
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

  const raw = (apiLead as any) ?? null;

  const lead = {
    id: (raw as any)?.id ?? id,
    name: (raw as any)?.firstName && (raw as any).lastName
      ? `${(raw as any).firstName} ${(raw as any).lastName}`
      : (raw as any)?.firstName ?? (raw as any)?.lastName ?? (raw as any)?.name ?? "",
    email: (raw as any)?.email ?? "",
    phone: (raw as any)?.phone ?? "",
    company: (raw as any)?.companyName ?? (raw as any)?.company ?? "",
    jobTitle: (raw as any)?.jobTitle ?? "",
    location: (raw as any)?.location ?? "",
    website: (raw as any)?.website ?? "",
    source: (raw as any)?.source ?? "",
    status: ((raw as any)?.status ?? "new") as "new" | "contacted" | "qualified" | "unqualified",
    score: (raw as any)?.score ?? 0,
    scoreBreakdown: (raw as any)?.scoreBreakdown ?? { engagement: { score: 0, max: 0, label: "", description: "" }, firmographics: { score: 0, max: 0, label: "", description: "" }, demographic: { score: 0, max: 0, label: "", description: "" } },
    assignedTo: (raw as any)?.assignedToName ?? (raw as any)?.assignedTo ?? "",
    createdAt: (raw as any)?.createdAt ? String((raw as any).createdAt).slice(0, 10) : "",
    lastActivity: (raw as any)?.updatedAt ? String((raw as any).updatedAt).slice(0, 10) : "",
    estimatedValue: (raw as any)?.estimatedValue ?? 0,
    notes: (raw as any)?.notes ?? "",
    tags: (raw as any)?.tags ?? [],
    activities: (raw as any)?.activities ?? [],
    deals: (raw as any)?.deals ?? [],
  };

  const statusConfig = {
    new: { label: "New", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Zap },
    contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Mail },
    qualified: { label: "Qualified", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
    unqualified: { label: "Unqualified", color: "bg-gray-100 text-gray-700 border-gray-200", icon: XCircle },
  };

  const activityIcons: Record<string, React.ReactNode> = {
    page_view: <Globe className="h-4 w-4 text-blue-600" />,
    email: <Mail className="h-4 w-4 text-purple-600" />,
    download: <TrendingUp className="h-4 w-4 text-green-600" />,
    form: <Target className="h-4 w-4 text-orange-600" />,
    call: <Phone className="h-4 w-4 text-green-600" />,
    meeting: <Calendar className="h-4 w-4 text-purple-600" />,
  };

  function openEditModal() {
    const parts = lead.name.split(" ");
    setEditForm({
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
      email: lead.email,
      phone: lead.phone,
      companyName: lead.company,
      jobTitle: lead.jobTitle,
      status: lead.status,
      notes: lead.notes,
    });
    setShowEditModal(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/crm/leads" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-2xl text-foreground">{lead.name}</h1>
            <Badge variant="outline" className={statusConfig[lead.status].color}>
              {statusConfig[lead.status].label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {lead.jobTitle} at {lead.company}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button variant="outline" onClick={openEditModal}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteLead.mutate()}
            disabled={deleteLead.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteLead.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Score Card */}
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Lead Score</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      lead.score >= 80
                        ? "bg-green-100 text-green-700 border-green-200"
                        : lead.score >= 50
                        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                        : "bg-red-100 text-red-700 border-red-200"
                    }
                  >
                    {lead.score >= 80 ? "Hot Lead" : lead.score >= 50 ? "Warm Lead" : "Cold Lead"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="12"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={
                        lead.score >= 80
                          ? "#22c55e"
                          : lead.score >= 50
                          ? "#eab308"
                          : "#ef4444"
                      }
                      strokeWidth="12"
                      strokeDasharray={`${(lead.score / 100) * 352} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{lead.score}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold">Total Score: {lead.score}/100</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on engagement, firmographics, and demographic factors
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Star className="h-4 w-4 mr-2" />
                    Recalculate Score
                  </Button>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-4">
                {Object.entries(lead.scoreBreakdown).map(([key, data]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-sm">{(data as any).label}</span>
                        <p className="text-xs text-muted-foreground">{(data as any).description}</p>
                      </div>
                      <span className="text-sm font-semibold">
                        {(data as any).score}/{(data as any).max}
                      </span>
                    </div>
                    <Progress value={((data as any).score / (data as any).max) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${lead.email}`} className="text-sm hover:text-primary">
                      {lead.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <a href={`tel:${lead.phone}`} className="text-sm hover:text-primary">
                      {lead.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    <a
                      href={`https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary flex items-center gap-1"
                    >
                      {lead.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm">{lead.location}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag: any) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lead.activities.map((activity: any, index: any) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-muted p-2">
                        {activityIcons[activity.type]}
                      </div>
                      {index < lead.activities.length - 1 && (
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
                        {activity.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowNoteModal(true)}
              >
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-primary hover:text-primary"
                onClick={() => setShowConvertConfirm(true)}
                disabled={convertToContact.isPending}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {convertToContact.isPending ? "Converting..." : "Convert to Contact"}
              </Button>
            </CardContent>
          </Card>

          {/* Lead Stats */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Lead Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Source</span>
                <Badge variant="secondary">{lead.source}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Assigned To</span>
                <span className="text-sm font-medium">{lead.assignedTo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{lead.createdAt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Est. Value</span>
                <span className="text-sm font-semibold">
                  ${(lead.estimatedValue / 1000).toFixed(0)}K
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setShowNoteModal(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Deal */}
          {lead.deals.length > 0 && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Related Deal</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  to={`/app/crm/deals/${lead.deals[0].id}` as string}
                  className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium text-sm">{lead.deals[0].name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline">{lead.deals[0].stage}</Badge>
                    <span className="font-semibold">
                      ${(lead.deals[0].value / 1000).toFixed(0)}K
                    </span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border shadow-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Edit Lead</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowEditModal(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <input
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <input
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editForm.phone}
                onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Company</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editForm.companyName}
                onChange={(e) => setEditForm((p) => ({ ...p, companyName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Job Title</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editForm.jobTitle}
                onChange={(e) => setEditForm((p) => ({ ...p, jobTitle: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={editForm.status}
                onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="unqualified">Unqualified</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                value={editForm.notes}
                onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button
                onClick={() =>
                  updateLead.mutate({
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    email: editForm.email,
                    phone: editForm.phone,
                    companyName: editForm.companyName,
                    jobTitle: editForm.jobTitle,
                    status: editForm.status,
                    notes: editForm.notes,
                  })
                }
                disabled={updateLead.isPending}
              >
                {updateLead.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Add Note</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowNoteModal(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <textarea
              rows={5}
              placeholder="Write your note here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNoteModal(false)}>Cancel</Button>
              <Button
                onClick={() => addNote.mutate(noteText)}
                disabled={addNote.isPending}
              >
                {addNote.isPending ? "Saving..." : "Add Note"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Confirmation */}
      {showConvertConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-bold text-lg">Convert Lead to Contact</h2>
            <p className="text-sm text-muted-foreground">
              This will create a new contact from <strong>{lead.name}</strong> and mark the lead as
              converted. You will be redirected to the contacts page.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConvertConfirm(false)}>Cancel</Button>
              <Button
                onClick={() => convertToContact.mutate()}
                disabled={convertToContact.isPending}
              >
                {convertToContact.isPending ? "Converting..." : "Convert"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
