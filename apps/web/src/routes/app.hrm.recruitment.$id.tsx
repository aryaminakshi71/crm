import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Download,
  MoreVertical,
  User,
  Briefcase,
  MessageSquare,
  FileCheck,
  ChevronRight,
  Globe,
  Link,
} from "lucide-react";

export const Route = createFileRoute("/app/hrm/recruitment/$id")({
  component: CandidateDetail,
});

const candidateData: Record<string, any> = {
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
  const [activeTab, setActiveTab] = useState("overview");
  const [showActions, setShowActions] = useState(false);

  const candidate = candidateData[params.id] || candidateData["1"];

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "interviews", label: "Interviews", icon: MessageSquare },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  const getActionColor = (type: string) => {
    switch (type) {
      case "application": return "bg-blue-500";
      case "review": return "bg-purple-500";
      case "interview": return "bg-amber-500";
      case "progress": return "bg-emerald-500";
      case "referral": return "bg-teal-500";
      default: return "bg-gray-500";
    }
  };

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
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {candidate.location}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    {candidate.experience}
                  </span>
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
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-foreground">{candidate.rating}/5.0</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Candidate Rating</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-sm font-semibold text-foreground">{candidate.salary}</p>
              <p className="text-xs text-muted-foreground mt-1">Expected Salary</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-sm font-semibold text-foreground">{candidate.source}</p>
              <p className="text-xs text-muted-foreground mt-1">Source</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-sm font-semibold text-foreground">{candidate.interviews.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Interviews</p>
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
        {activeTab === "timeline" && <TimelineTab candidate={candidate} getActionColor={getActionColor} />}
        {activeTab === "interviews" && <InterviewsTab candidate={candidate} />}
        {activeTab === "documents" && <DocumentsTab candidate={candidate} />}
      </div>
    </div>
  );
}

function OverviewTab({ candidate }: { candidate: any }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Skills */}
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {candidate.skills.map((skill: string) => (
            <span key={skill} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Experience</h3>
        <div className="space-y-4">
          {candidate.previousCompanies.map((company: any, idx: number) => (
            <div key={idx} className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{company.role}</p>
                <p className="text-xs text-muted-foreground">{company.name} · {company.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Education</h3>
        <div className="space-y-4">
          {candidate.education.map((edu: any, idx: number) => (
            <div key={idx} className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{edu.degree}</p>
                <p className="text-xs text-muted-foreground">{edu.school} · {edu.year}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Contact</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${candidate.email}`} className="text-sm text-primary hover:underline">
              {candidate.email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${candidate.phone}`} className="text-sm text-foreground">
              {candidate.phone}
            </a>
          </div>
          {candidate.portfolio?.url && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a href={`https://${candidate.portfolio.url}`} target="_blank" className="text-sm text-primary hover:underline">
                {candidate.portfolio.url}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineTab({ candidate, getActionColor }: { candidate: any; getActionColor: (type: string) => string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <div className="border-b border-border/60 px-6 py-4">
        <h3 className="font-semibold text-foreground">Application Timeline</h3>
      </div>
      <div className="p-6">
        <div className="space-y-0">
          {candidate.timeline.map((event: any, idx: number) => (
            <div key={idx} className="relative pl-6 pb-6">
              {/* Connector line */}
              {idx < candidate.timeline.length - 1 && (
                <div className="absolute left-[9px] top-6 bottom-0 w-px bg-border" />
              )}
              {/* Dot */}
              <div className={`absolute left-0 top-1.5 h-[18px] w-[18px] rounded-full ${getActionColor(event.type)} flex items-center justify-center`}>
                {event.type === "interview" && <MessageSquare className="h-3 w-3 text-white" />}
                {event.type === "review" && <FileCheck className="h-3 w-3 text-white" />}
                {event.type === "progress" && <ChevronRight className="h-3 w-3 text-white" />}
                {event.type === "application" && <FileText className="h-3 w-3 text-white" />}
                {event.type === "referral" && <Link className="h-3 w-3 text-white" />}
              </div>
              {/* Content */}
              <div>
                <p className="font-medium text-foreground text-sm">{event.action}</p>
                <p className="text-xs text-muted-foreground">{event.date}</p>
                {event.note && (
                  <p className="mt-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                    {event.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InterviewsTab({ candidate }: { candidate: any }) {
  return (
    <div className="space-y-6">
      {candidate.interviews.map((interview: any, idx: number) => (
        <div key={idx} className="rounded-lg border border-border/60 bg-card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">{interview.round}</h3>
              <p className="text-sm text-muted-foreground">with {interview.interviewer}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              interview.status === "Completed"
                ? "bg-emerald-500/10 text-emerald-500"
                : interview.status === "Scheduled"
                  ? "bg-blue-500/10 text-blue-500"
                  : "bg-amber-500/10 text-amber-500"
            }`}>
              {interview.status}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium text-foreground">{interview.date}</p>
            </div>
            {interview.rating && (
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground">Rating</p>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-foreground">{interview.rating}</span>
                </div>
              </div>
            )}
          </div>
          {interview.notes && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{interview.notes}</p>
            </div>
          )}
          {interview.status === "Scheduled" && (
            <div className="flex gap-2 mt-4">
              <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                Reschedule
              </button>
              <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                Join Meeting
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Schedule New Interview */}
      <div className="rounded-lg border border-dashed border-border/60 bg-card p-6 text-center">
        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Schedule the next interview</p>
        <button className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Schedule Interview
        </button>
      </div>
    </div>
  );
}

function DocumentsTab({ candidate }: { candidate: any }) {
  return (
    <div className="space-y-4">
      {candidate.resume && (
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{candidate.resume.name}</p>
              <p className="text-xs text-muted-foreground">Uploaded {candidate.resume.uploadedAt}</p>
            </div>
          </div>
          <button className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      )}
      {candidate.coverLetter && (
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{candidate.coverLetter.name}</p>
              <p className="text-xs text-muted-foreground">Uploaded {candidate.coverLetter.uploadedAt}</p>
            </div>
          </div>
          <button className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      )}
      {candidate.portfolio && (
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{candidate.portfolio.name}</p>
              <p className="text-xs text-muted-foreground">Portfolio Website</p>
            </div>
          </div>
          <a href={`https://${candidate.portfolio.url}`} target="_blank" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Link className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
