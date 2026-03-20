import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Play,
  Clock,
  Users,
  BookOpen,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Video,
  FileText,
  BarChart3,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/app/hrm/training")({
  component: TrainingPrograms,
});

const programs = [
  {
    id: "1",
    title: "React Fundamentals",
    description: "Master React from the ground up. Learn components, hooks, state management, and modern React patterns.",
    type: "Technical",
    format: "Video",
    duration: "8 hours",
    modules: 12,
    enrolled: 86,
    completed: 72,
    rating: 4.8,
    status: "Active",
    nextSession: "Mar 25, 2026",
    instructor: "Sarah Chen",
    icon: Code,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "2",
    title: "Leadership Essentials",
    description: "Develop critical leadership skills including communication, delegation, and team motivation.",
    type: "Leadership",
    format: "Workshop",
    duration: "4 hours",
    modules: 6,
    enrolled: 45,
    completed: 38,
    rating: 4.6,
    status: "Active",
    nextSession: "Mar 28, 2026",
    instructor: "Jennifer Walsh",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "3",
    title: "Data Privacy & Compliance",
    description: "Annual compliance training covering GDPR, CCPA, and company data handling policies.",
    type: "Compliance",
    format: "Document",
    duration: "2 hours",
    modules: 4,
    enrolled: 248,
    completed: 215,
    rating: 4.2,
    status: "Mandatory",
    nextSession: "Due Mar 31, 2026",
    instructor: "Legal Team",
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "4",
    title: "Product Design Thinking",
    description: "Learn human-centered design methodology and apply it to real product challenges.",
    type: "Design",
    format: "Workshop",
    duration: "6 hours",
    modules: 8,
    enrolled: 32,
    completed: 24,
    rating: 4.9,
    status: "Active",
    nextSession: "Apr 2, 2026",
    instructor: "Emily Rodriguez",
    icon: Lightbulb,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "5",
    title: "Sales Techniques Mastery",
    description: "Advanced sales training covering consultative selling, negotiation, and closing strategies.",
    type: "Sales",
    format: "Video",
    duration: "10 hours",
    modules: 15,
    enrolled: 52,
    completed: 45,
    rating: 4.5,
    status: "Active",
    nextSession: "Self-paced",
    instructor: "David Kim",
    icon: TrendingUp,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "6",
    title: "AWS Cloud Architecture",
    description: "Deep dive into AWS services, architecture patterns, and best practices for cloud-native applications.",
    type: "Technical",
    format: "Video",
    duration: "12 hours",
    modules: 18,
    enrolled: 38,
    completed: 28,
    rating: 4.7,
    status: "Active",
    nextSession: "Self-paced",
    instructor: "Chris Martinez",
    icon: Cloud,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

const trainingRecords = [
  { id: "1", employee: "Sarah Chen", program: "React Fundamentals", status: "Completed", score: 95, completedAt: "Mar 15, 2026", duration: "8 hours" },
  { id: "2", employee: "Marcus Johnson", program: "Leadership Essentials", status: "In Progress", score: null, completedAt: null, duration: "2/4 hours" },
  { id: "3", employee: "Jessica Lee", program: "Data Privacy & Compliance", status: "Completed", score: 88, completedAt: "Mar 10, 2026", duration: "2 hours" },
  { id: "4", employee: "David Kim", program: "Sales Techniques Mastery", status: "Completed", score: 92, completedAt: "Mar 8, 2026", duration: "10 hours" },
  { id: "5", employee: "Emily Rodriguez", program: "Product Design Thinking", status: "In Progress", score: null, completedAt: null, duration: "4/6 hours" },
];

function TrainingPrograms() {
  const [viewMode, setViewMode] = useState<"programs" | "records">("programs");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = program.title.toLowerCase().includes(search.toLowerCase()) || program.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "All Types" || program.type === typeFilter;
    const matchesStatus = statusFilter === "All Status" || program.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const types = ["All Types", "Technical", "Leadership", "Compliance", "Design", "Sales"];
  const statuses = ["All Status", "Active", "Mandatory", "Completed"];
  const totalEnrolled = programs.reduce((acc, p) => acc + p.enrolled, 0);
  const totalCompleted = programs.reduce((acc, p) => acc + p.completed, 0);
  const completionRate = Math.round((totalCompleted / totalEnrolled) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Training Programs</h2>
          <p className="text-sm text-muted-foreground">
            Learning and development for your team
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export Records
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Create Program
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Programs</p>
              <p className="text-xl font-bold text-foreground">{programs.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Enrolled</p>
              <p className="text-xl font-bold text-foreground">{totalEnrolled}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completions</p>
              <p className="text-xl font-bold text-foreground">{totalCompleted}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-xl font-bold text-foreground">{completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/60">
        {[
          { id: "programs", label: "Programs", icon: BookOpen },
          { id: "records", label: "Training Records", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as any)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              viewMode === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Programs View */}
      {viewMode === "programs" && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search programs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {types.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Programs Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((program) => (
              <div key={program.id} className="rounded-lg border border-border/60 bg-card p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${program.bgColor}`}>
                    <program.icon className={`h-6 w-6 ${program.color}`} />
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    program.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : program.status === "Mandatory"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-gray-500/10 text-gray-500"
                  }`}>
                    {program.status}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{program.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{program.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {program.type}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {program.format}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {program.duration}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">{program.enrolled}</p>
                      <p className="text-[10px] text-muted-foreground">Enrolled</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">{program.completed}</p>
                      <p className="text-[10px] text-muted-foreground">Completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-foreground">{program.rating}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50">
                    View Details
                  </button>
                  <button className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                    Enroll
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Training Records View */}
      {viewMode === "records" && (
        <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Program</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Completed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainingRecords.map((record) => (
                <tr key={record.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-sm">{record.employee}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{record.program}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      record.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {record.score ? (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-foreground">{record.score}%</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{record.duration}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{record.completedAt || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredPrograms.length === 0 && viewMode === "programs" && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card py-12">
          <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No programs found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

// Missing icon components
function Code({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function Lightbulb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

function Cloud({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

function TrendingUp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
