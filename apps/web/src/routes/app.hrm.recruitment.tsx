import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  UserPlus,
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Briefcase,
  Users,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronRight,
  Star,
  Send,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/app/hrm/recruitment")({
  component: RecruitmentPipeline,
});

const candidates = [
  { id: "1", name: "Alex Rivera", role: "Senior Frontend Developer", dept: "Engineering", stage: "Technical Interview", status: "Active", rating: 4.5, appliedDate: "Mar 15, 2026", source: "LinkedIn", avatar: "AR" },
  { id: "2", name: "Maya Patel", role: "Product Designer", dept: "Design", stage: "Design Challenge", status: "Active", rating: 4.8, appliedDate: "Mar 12, 2026", source: "Referral", avatar: "MP" },
  { id: "3", name: "Jordan Lee", role: "Backend Developer", dept: "Engineering", stage: "Phone Screen", status: "Active", rating: 4.2, appliedDate: "Mar 10, 2026", source: "Indeed", avatar: "JL" },
  { id: "4", name: "Taylor Smith", role: "Sales Manager", dept: "Sales", stage: "Final Round", status: "Active", rating: 4.6, appliedDate: "Mar 5, 2026", source: "LinkedIn", avatar: "TS" },
  { id: "5", name: "Casey Brown", role: "Marketing Specialist", dept: "Marketing", stage: "Offer", status: "Offer Sent", rating: 4.7, appliedDate: "Feb 28, 2026", source: "Website", avatar: "CB" },
  { id: "6", name: "Morgan Davis", role: "DevOps Engineer", dept: "Engineering", stage: "Technical Interview", status: "Active", rating: 4.3, appliedDate: "Mar 8, 2026", source: "Referral", avatar: "MD" },
  { id: "7", name: "Riley Wilson", role: "Data Scientist", dept: "Engineering", stage: "Applied", status: "New", rating: null, appliedDate: "Mar 18, 2026", source: "LinkedIn", avatar: "RW" },
  { id: "8", name: "Jamie Garcia", role: "Account Executive", dept: "Sales", stage: "Phone Screen", status: "Active", rating: 4.0, appliedDate: "Mar 14, 2026", source: "Website", avatar: "JG" },
];

const jobs = [
  { id: "1", title: "Senior Frontend Developer", dept: "Engineering", location: "San Francisco, CA", type: "Full-time", salary: "$140K - $180K", applicants: 45, openDate: "Mar 1, 2026" },
  { id: "2", title: "Product Designer", dept: "Design", location: "Remote", type: "Full-time", salary: "$120K - $160K", applicants: 32, openDate: "Mar 5, 2026" },
  { id: "3", title: "Sales Manager", dept: "Sales", location: "New York, NY", type: "Full-time", salary: "$100K - $140K + Commission", applicants: 28, openDate: "Feb 20, 2026" },
  { id: "4", title: "Backend Developer", dept: "Engineering", location: "Remote", type: "Full-time", salary: "$130K - $170K", applicants: 52, openDate: "Mar 8, 2026" },
  { id: "5", title: "Marketing Specialist", dept: "Marketing", location: "Austin, TX", type: "Full-time", salary: "$70K - $90K", applicants: 18, openDate: "Feb 15, 2026" },
];

const stages = ["Applied", "Phone Screen", "Technical Interview", "Design Challenge", "Final Round", "Offer"];

const pipelineStats = [
  { stage: "Applied", count: 8, color: "bg-gray-500" },
  { stage: "Phone Screen", count: 2, color: "bg-blue-500" },
  { stage: "Technical Interview", count: 2, color: "bg-purple-500" },
  { stage: "Design Challenge", count: 1, color: "bg-amber-500" },
  { stage: "Final Round", count: 1, color: "bg-teal-500" },
  { stage: "Offer", count: 1, color: "bg-emerald-500" },
];

function RecruitmentPipeline() {
  const [viewMode, setViewMode] = useState<"pipeline" | "jobs" | "candidates">("pipeline");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All Departments");

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === "All" || c.stage === stageFilter;
    const matchesDept = deptFilter === "All Departments" || c.dept === deptFilter;
    return matchesSearch && matchesStage && matchesDept;
  });

  const departments = ["All Departments", "Engineering", "Design", "Product", "Sales", "Marketing", "Operations"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Recruitment Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Track candidates and manage your hiring pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Post Job
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Candidates</p>
              <p className="text-xl font-bold text-foreground">{candidates.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open Positions</p>
              <p className="text-xl font-bold text-foreground">{jobs.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Interviews This Week</p>
              <p className="text-xl font-bold text-foreground">5</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Time to Hire</p>
              <p className="text-xl font-bold text-foreground">18 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/60">
        {[
          { id: "pipeline", label: "Pipeline", icon: ArrowRight },
          { id: "jobs", label: "Open Jobs", icon: Briefcase },
          { id: "candidates", label: "All Candidates", icon: Users },
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

      {/* Pipeline View */}
      {viewMode === "pipeline" && (
        <>
          {/* Pipeline Stats */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {pipelineStats.map((stat) => (
              <div key={stat.stage} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 whitespace-nowrap">
                <div className={`h-2 w-2 rounded-full ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.stage}</span>
                <span className="text-sm font-semibold text-foreground">{stat.count}</span>
              </div>
            ))}
          </div>

          {/* Kanban Board */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageCandidates = candidates.filter((c) => c.stage === stage);
              return (
                <div key={stage} className="flex-shrink-0 w-72">
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground text-sm">{stage}</h3>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {stageCandidates.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {stageCandidates.map((candidate) => (
                        <a
                          key={candidate.id}
                          href={`/app/hrm/recruitment/${candidate.id}`}
                          className="block rounded-lg border border-border/60 bg-card p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {candidate.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{candidate.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{candidate.role}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {candidate.rating && (
                                <>
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span className="text-xs font-medium text-foreground">{candidate.rating}</span>
                                </>
                              )}
                            </div>
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {candidate.source}
                            </span>
                          </div>
                        </a>
                      ))}
                      {stageCandidates.length === 0 && (
                        <div className="flex items-center justify-center rounded-lg border border-dashed border-border/60 py-6 text-xs text-muted-foreground">
                          No candidates
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Jobs View */}
      {viewMode === "jobs" && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-lg border border-border/60 bg-card">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{job.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {job.dept}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {job.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{job.salary}</p>
                    <p className="text-xs text-muted-foreground">{job.applicants} applicants</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                      View Applicants
                    </button>
                    <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidates View */}
      {viewMode === "candidates" && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="All">All Stages</option>
                {stages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Candidate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Applied</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Source</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <a href={`/app/hrm/recruitment/${candidate.id}`} className="flex items-center gap-3 hover:text-primary">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {candidate.avatar}
                        </div>
                        <span className="font-medium text-foreground">{candidate.name}</span>
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {candidate.role}
                      <span className="ml-1 text-xs text-muted-foreground">({candidate.dept})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                        {candidate.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {candidate.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium text-foreground">{candidate.rating}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{candidate.appliedDate}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{candidate.source}</td>
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
        </>
      )}

      {/* Empty State */}
      {filteredCandidates.length === 0 && viewMode === "candidates" && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No candidates found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
