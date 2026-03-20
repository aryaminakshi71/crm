import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  FileText,
  Heart,
  TrendingUp,
  Target,
  Clock,
  Edit,
  Download,
  MoreVertical,
  User,
  Users,
  Star,
  Award,
  GraduationCap,
  Briefcase,
  Home,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/app/hrm/employees/$id")({
  component: EmployeeProfile,
});

const employeeData: Record<string, any> = {
  "1": {
    id: "1",
    name: "Sarah Chen",
    role: "Senior Software Engineer",
    dept: "Engineering",
    email: "sarah.chen@nucleo.one",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    status: "Active",
    avatar: "SC",
    startDate: "Jan 15, 2023",
    manager: "David Park",
    managerId: "999",
    employeeId: "EMP-001",
    salary: "$145,000",
    employmentType: "Full-time",
    bio: "Experienced software engineer with 8+ years building scalable web applications. Passionate about clean code, mentoring junior developers, and adopting new technologies.",
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "Docker"],
    education: [
      { degree: "M.S. Computer Science", school: "Stanford University", year: "2018" },
      { degree: "B.S. Computer Science", school: "UC Berkeley", year: "2016" },
    ],
    documents: [
      { name: "Resume", type: "PDF", uploadedAt: "Jan 10, 2026" },
      { name: "Offer Letter", type: "PDF", uploadedAt: "Jan 12, 2023" },
      { name: "NDA", type: "PDF", uploadedAt: "Jan 12, 2023" },
      { name: "W-4 Form", type: "PDF", uploadedAt: "Jan 14, 2023" },
    ],
    benefits: [
      { name: "Health Insurance", status: "Enrolled", provider: "Blue Shield" },
      { name: "Dental Insurance", status: "Enrolled", provider: "Delta Dental" },
      { name: "401(k)", status: "Enrolled", contribution: "6%" },
      { name: "Life Insurance", status: "Enrolled", coverage: "$200,000" },
    ],
    leave: {
      pto: { total: 20, used: 8, remaining: 12 },
      sick: { total: 10, used: 3, remaining: 7 },
      personal: { total: 3, used: 1, remaining: 2 },
    },
    performance: {
      overall: 4.5,
      reviews: [
        { period: "2025 H2", rating: 4.5, status: "Completed", date: "Dec 15, 2025" },
        { period: "2025 H1", rating: 4.2, status: "Completed", date: "Jun 20, 2025" },
        { period: "2024 H2", rating: 4.0, status: "Completed", date: "Dec 18, 2024" },
      ],
    },
    okrs: [
      { objective: "Improve System Performance", keyResults: ["Reduce API latency by 30%", "Achieve 99.9% uptime", "Complete migration to GraphQL"], progress: 75, status: "On Track" },
      { objective: "Mentor Junior Developers", keyResults: ["Conduct 4 code reviews weekly", "Lead 2 technical sessions", "Onboard 2 new team members"], progress: 60, status: "On Track" },
    ],
  },
};

function EmployeeProfile() {
  const params = Route.useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [showActions, setShowActions] = useState(false);

  const employee = employeeData[params.id] || employeeData["1"];

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "benefits", label: "Benefits", icon: Heart },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "okrs", label: "OKRs", icon: Target },
    { id: "leave", label: "Leave", icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <a href="/app/hrm/directory" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Directory
      </a>

      {/* Profile Header */}
      <div className="rounded-lg border border-border/60 bg-card">
        <div className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                {employee.avatar}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{employee.name}</h1>
                <p className="text-muted-foreground">{employee.role}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {employee.dept}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {employee.location}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Joined {employee.startDate}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    employee.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {employee.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
                <Edit className="h-4 w-4" />
                Edit
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
                    <a href={`mailto:${employee.email}`} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/50">
                      <Mail className="h-4 w-4" />
                      Send Email
                    </a>
                    <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted/50">
                      <Download className="h-4 w-4" />
                      Download Profile
                    </button>
                    <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted/50">
                      <XCircle className="h-4 w-4" />
                      Terminate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="mt-4 text-sm text-muted-foreground">{employee.bio}</p>

          {/* Skills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {employee.skills.map((skill: string) => (
              <span key={skill} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {skill}
              </span>
            ))}
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
        {activeTab === "overview" && <OverviewTab employee={employee} />}
        {activeTab === "documents" && <DocumentsTab employee={employee} />}
        {activeTab === "benefits" && <BenefitsTab employee={employee} />}
        {activeTab === "performance" && <PerformanceTab employee={employee} />}
        {activeTab === "okrs" && <OKRsTab employee={employee} />}
        {activeTab === "leave" && <LeaveTab employee={employee} />}
      </div>
    </div>
  );
}

function OverviewTab({ employee }: { employee: any }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Contact Information */}
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Contact Information</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${employee.email}`} className="text-sm text-primary hover:underline">
              {employee.email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${employee.phone}`} className="text-sm text-foreground">
              {employee.phone}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{employee.location}</span>
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Employment Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Employee ID</span>
            <span className="text-sm font-medium text-foreground">{employee.employeeId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Department</span>
            <span className="text-sm font-medium text-foreground">{employee.dept}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Manager</span>
            <a href={`/app/hrm/employees/${employee.managerId}`} className="text-sm text-primary hover:underline">
              {employee.manager}
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Employment Type</span>
            <span className="text-sm font-medium text-foreground">{employee.employmentType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Salary</span>
            <span className="text-sm font-medium text-foreground">{employee.salary}</span>
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Education</h3>
        <div className="space-y-4">
          {employee.education.map((edu: any, idx: number) => (
            <div key={idx} className="flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{edu.degree}</p>
                <p className="text-xs text-muted-foreground">{edu.school} · {edu.year}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Reports */}
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Direct Reports</h3>
        <div className="space-y-3">
          {["Jessica Lee", "Rachel Green", "Kevin Zhang"].map((name) => (
            <a key={name} href="/app/hrm/employees/1" className="flex items-center gap-3 hover:bg-muted/30 rounded-lg p-2 -mx-2 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                {name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">Software Engineer</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ employee }: { employee: any }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <div className="border-b border-border/60 px-6 py-4 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Documents</h3>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <FileText className="h-4 w-4" />
          Upload
        </button>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {employee.documents.map((doc: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between rounded-lg border border-border/60 p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.type} · Uploaded {doc.uploadedAt}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BenefitsTab({ employee }: { employee: any }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {employee.benefits.map((benefit: any, idx: number) => (
        <div key={idx} className="rounded-lg border border-border/60 bg-card p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{benefit.name}</p>
                <p className="text-xs text-muted-foreground">{benefit.provider || benefit.contribution || benefit.coverage}</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {benefit.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PerformanceTab({ employee }: { employee: any }) {
  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Overall Performance Rating</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl font-bold text-primary">{employee.performance.overall}</span>
          </div>
          <div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${star <= Math.round(employee.performance.overall) ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Based on {employee.performance.reviews.length} reviews</p>
          </div>
        </div>
      </div>

      {/* Review History */}
      <div className="rounded-lg border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-4">
          <h3 className="font-semibold text-foreground">Review History</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {employee.performance.reviews.map((review: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-border/40 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 font-semibold">
                    {review.rating}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{review.period}</p>
                    <p className="text-xs text-muted-foreground">Completed on {review.date}</p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                  {review.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OKRsTab({ employee }: { employee: any }) {
  return (
    <div className="space-y-6">
      {employee.okrs.map((okr: any, idx: number) => (
        <div key={idx} className="rounded-lg border border-border/60 bg-card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">{okr.objective}</h3>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-2 ${
                okr.status === "On Track" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
              }`}>
                {okr.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{okr.progress}%</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${okr.progress}%` }} />
          </div>
          <div className="space-y-2">
            {okr.keyResults.map((kr: string, krIdx: number) => (
              <div key={krIdx} className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${okr.progress > 50 ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                <span className="text-sm text-muted-foreground">{kr}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaveTab({ employee }: { employee: any }) {
  const leaveTypes = [
    { name: "PTO", ...employee.leave.pto, color: "bg-blue-500" },
    { name: "Sick Leave", ...employee.leave.sick, color: "bg-amber-500" },
    { name: "Personal", ...employee.leave.personal, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Leave Balances */}
      <div className="grid gap-4 sm:grid-cols-3">
        {leaveTypes.map((leave) => (
          <div key={leave.name} className="rounded-lg border border-border/60 bg-card p-6">
            <h3 className="font-medium text-foreground mb-4">{leave.name}</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">{leave.remaining}</span>
              <span className="text-sm text-muted-foreground mb-1">/ {leave.total} days</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mt-3">
              <div
                className={`h-full ${leave.color} rounded-full`}
                style={{ width: `${(leave.remaining / leave.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{leave.used} days used</p>
          </div>
        ))}
      </div>

      {/* Recent Leave */}
      <div className="rounded-lg border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-4">
          <h3 className="font-semibold text-foreground">Recent Leave Requests</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {[
              { type: "PTO", dates: "Mar 15-19, 2026", days: 5, status: "Approved" },
              { type: "Sick Leave", dates: "Feb 28, 2026", days: 1, status: "Approved" },
              { type: "Personal", dates: "Feb 14, 2026", days: 1, status: "Approved" },
            ].map((leave, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-border/40 p-4">
                <div>
                  <p className="font-medium text-foreground">{leave.type}</p>
                  <p className="text-xs text-muted-foreground">{leave.dates} · {leave.days} day(s)</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
