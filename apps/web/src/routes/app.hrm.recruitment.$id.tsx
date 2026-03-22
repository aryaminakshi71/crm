import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Mail,
  MessageSquare,
  MoreVertical,
  Phone,
  Star,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/hrm/recruitment/$id")({
  component: CandidateDetail,
});

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Unused legacy mock data kept here to avoid large diff
const _legacyCandidateData: Record<string, any> = {
  "1": {
    id: "1",
    name: "Alex Rivera",
    role: "Senior Frontend Developer",
    dept: "Engineering",
    email: "alex.rivera@email.com",
    phone: "+1 (555) 789-0123",
    location: "San Francisco, CA",
    stage: "Technical Interview",
    status: "Active",
    rating: 4.5,
    appliedDate: "Mar 15, 2026",
    source: "LinkedIn",
    avatar: "AR",
    experience: "8 years",
    salary: "$150,000 - $170,000",
    timeline: [
      { date: "Mar 15, 2026", action: "Applied", type: "application" },
      { date: "Mar 16, 2026", action: "Resume Screened", type: "review" },
      { date: "Mar 18, 2026", action: "Phone Screen Scheduled", type: "interview" },
      { date: "Mar 19, 2026", action: "Phone Screen Completed", type: "interview", note: "Strong communication skills, good technical foundation" },
      { date: "Mar 20, 2026", action: "Moved to Technical Interview", type: "progress" },
    ],
    interviews: [
      { round: "Phone Screen", interviewer: "Sarah Chen", date: "Mar 19, 2026", status: "Completed", rating: 4.5, notes: "Good cultural fit, solid React expertise" },
      { round: "Technical Interview", interviewer: "David Park", date: "Mar 22, 2026", status: "Scheduled", rating: null, notes: null },
    ],
    resume: { name: "Alex_Rivera_Resume.pdf", uploadedAt: "Mar 15, 2026" },
    coverLetter: { name: "Cover_Letter.pdf", uploadedAt: "Mar 15, 2026" },
    skills: ["React", "TypeScript", "Node.js", "GraphQL", "AWS", "Docker", "CSS", "Jest"],
    education: [
      { degree: "B.S. Computer Science", school: "Stanford University", year: "2018" },
    ],
    previousCompanies: [
      { name: "TechCorp Inc.", role: "Senior Frontend Developer", duration: "2021 - Present" },
      { name: "StartupXYZ", role: "Frontend Developer", duration: "2018 - 2021" },
    ],
    notes: [
      { author: "Sarah Chen", date: "Mar 19, 2026", content: "Strong candidate with 8 years of experience. Excellent React knowledge and good communication skills." },
    ],
  },
  "2": {
    id: "2",
    name: "Maya Patel",
    role: "Product Designer",
    dept: "Design",
    email: "maya.patel@email.com",
    phone: "+1 (555) 890-1234",
    location: "Remote",
    stage: "Design Challenge",
    status: "Active",
    rating: 4.8,
    appliedDate: "Mar 12, 2026",
    source: "Referral",
    avatar: "MP",
    experience: "6 years",
    salary: "$130,000 - $150,000",
    timeline: [
      { date: "Mar 12, 2026", action: "Applied", type: "application" },
      { date: "Mar 13, 2026", action: "Referral from Lisa Park", type: "referral" },
      { date: "Mar 14, 2026", action: "Resume Approved", type: "review" },
      { date: "Mar 15, 2026", action: "Phone Screen Scheduled", type: "interview" },
      { date: "Mar 17, 2026", action: "Phone Screen Completed", type: "interview", note: "Excellent portfolio, great design thinking" },
      { date: "Mar 19, 2026", action: "Moved to Design Challenge", type: "progress" },
    ],
    interviews: [
      { round: "Phone Screen", interviewer: "Lisa Park", date: "Mar 17, 2026", status: "Completed", rating: 4.8, notes: "Outstanding portfolio, strong UX background" },
      { round: "Design Challenge", interviewer: "TBD", date: "Mar 24 - 26, 2026", status: "In Progress", rating: null, notes: "Design a mobile checkout flow" },
    ],
    resume: { name: "Maya_Patel_Resume.pdf", uploadedAt: "Mar 12, 2026" },
    portfolio: { name: "Portfolio URL", url: "mayapatel.design" },
    skills: ["Figma", "Sketch", "Adobe XD", "User Research", "Prototyping", "Design Systems", "HTML/CSS"],
    education: [
      { degree: "M.F.A. Interaction Design", school: "Rhode Island School of Design", year: "2020" },
      { degree: "B.A. Visual Arts", school: "UC Santa Barbara", year: "2018" },
    ],
    previousCompanies: [
      { name: "DesignStudio", role: "Senior Product Designer", duration: "2022 - Present" },
      { name: "AgencyCo", role: "Product Designer", duration: "2020 - 2022" },
    ],
    notes: [],
  },
};

function CandidateDetail() {
  const params = Route.useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showActions, setShowActions] = useState(false);

  // Fetch all candidates and find this one
  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ["hrm-candidates"],
    queryFn: () => nucleoApi.hrm.recruitment.candidates.list({ page: 1, limit: 200 }),
  });

  const allCandidates: any[] = candidatesData?.data ?? [];
  const rawCandidate = allCandidates.find((c) => c.id === params.id) ?? allCandidates[0];

  const updateStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      nucleoApi.hrm.recruitment.candidates.update(id, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm-candidates"] });
      toast.success("Stage updated");
    },
    onError: () => toast.error("Failed to update stage"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!rawCandidate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Candidate not found</p>
        <a href="/app/hrm/recruitment" className="text-primary hover:underline text-sm">
          Back to Recruitment
        </a>
      </div>
    );
  }

  const candidate = {
    id: rawCandidate.id,
    name: rawCandidate.fullName ?? rawCandidate.name ?? "Unknown",
    role: rawCandidate.requisitionTitle ?? "Position",
    dept: "",
    email: rawCandidate.email ?? "",
    phone: rawCandidate.phone ?? "",
    location: "",
    stage: rawCandidate.stage ?? "applied",
    status: "Active",
    rating: rawCandidate.score ?? null,
    appliedDate: rawCandidate.createdAt ? new Date(rawCandidate.createdAt).toLocaleDateString() : "",
    source: rawCandidate.source ?? "Direct",
    avatar: getInitials(rawCandidate.fullName ?? rawCandidate.name ?? "?"),
    notes: rawCandidate.notes ? [{ author: "System", date: "", content: rawCandidate.notes }] : [],
    resumeUrl: rawCandidate.resumeUrl ?? null,
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "notes", label: "Notes", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <a href="/app/hrm/recruitment" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Recruitment
      </a>

      {/* Candidate Header */}
      <div className="rounded-lg border border-border/60 bg-card">
        <div className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                {candidate.avatar}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{candidate.name}</h1>
                <p className="text-muted-foreground">{candidate.role}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {candidate.email && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {candidate.email}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Applied {candidate.appliedDate}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                    {candidate.stage}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
                <Mail className="h-4 w-4" />
                Send Email
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border/60 bg-card shadow-lg z-10">
                    <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/50">
                      <CheckCircle2 className="h-4 w-4" />
                      Move to Next Stage
                    </button>
                    <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/50">
                      <XCircle className="h-4 w-4" />
                      Reject Candidate
                    </button>
                    <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/50">
                      <Star className="h-4 w-4" />
                      Add to Shortlist
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {candidate.rating !== null && (
              <div className="rounded-lg bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-foreground">{candidate.rating}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Score</p>
              </div>
            )}
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-sm font-semibold text-foreground">{candidate.source}</p>
              <p className="text-xs text-muted-foreground mt-1">Source</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-sm font-semibold text-foreground">{candidate.appliedDate}</p>
              <p className="text-xs text-muted-foreground mt-1">Applied</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-border/60">
          <div className="flex overflow-x-auto px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && <OverviewTab candidate={candidate} />}
        {activeTab === "notes" && <NotesTab candidate={candidate} />}
      </div>
    </div>
  );
}

function OverviewTab({ candidate }: { candidate: any }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Contact */}
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Contact Information</h3>
        <div className="space-y-3">
          {candidate.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${candidate.email}`} className="text-sm text-primary hover:underline">
                {candidate.email}
              </a>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${candidate.phone}`} className="text-sm text-foreground">
                {candidate.phone}
              </a>
            </div>
          )}
          {candidate.resumeUrl && (
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                View Resume
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Application Details */}
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Application Details</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Position</span>
            <span className="text-sm font-medium text-foreground">{candidate.role || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Stage</span>
            <span className="text-sm font-medium text-foreground capitalize">{candidate.stage?.replace(/_/g, " ") || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Source</span>
            <span className="text-sm font-medium text-foreground capitalize">{candidate.source?.replace(/_/g, " ") || "—"}</span>
          </div>
          {candidate.rating != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Score</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-foreground">{candidate.rating}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotesTab({ candidate }: { candidate: any }) {
  // notes may be an array of objects {author, date, content} or strings, or a bare string
  const rawNotes = candidate.notes ?? [];
  const notes: Array<{ content: string; author?: string; date?: string }> = Array.isArray(rawNotes)
    ? rawNotes.map((n: any) =>
        typeof n === "string" ? { content: n } : { content: n.content ?? String(n), author: n.author, date: n.date }
      )
    : [{ content: String(rawNotes) }];

  const hasNotes = notes.length > 0 && notes.some((n) => n.content);

  return (
    <div className="rounded-lg border border-border/60 bg-card p-6">
      <h3 className="font-semibold text-foreground mb-4">Notes</h3>
      {!hasNotes ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No notes recorded for this candidate.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.filter((n) => n.content).map((note, idx) => (
            <div key={idx} className="rounded-lg bg-muted/30 p-4 text-sm text-foreground whitespace-pre-wrap">
              {note.author && (
                <p className="text-xs text-muted-foreground mb-1 font-medium">{note.author}{note.date ? ` · ${note.date}` : ""}</p>
              )}
              {note.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
