import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Star,
  CheckCircle2,
  Clock,
  MoreVertical,
  Download,
  Target,
  MessageSquare,
  Users,
  Calendar,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/app/hrm/performance")({
  component: PerformanceReviews,
});

const reviews = [
  {
    id: "1",
    employee: "Sarah Chen",
    avatar: "SC",
    dept: "Engineering",
    role: "Senior Software Engineer",
    reviewer: "David Park",
    period: "2026 H1",
    status: "In Progress",
    rating: 4.5,
    dueDate: "Mar 31, 2026",
    submittedAt: null,
  },
  {
    id: "2",
    employee: "Marcus Johnson",
    avatar: "MJ",
    dept: "Product",
    role: "Product Manager",
    reviewer: "Emily Watson",
    period: "2026 H1",
    status: "Scheduled",
    rating: null,
    dueDate: "Mar 31, 2026",
    submittedAt: null,
  },
  {
    id: "3",
    employee: "Jessica Lee",
    avatar: "JL",
    dept: "Engineering",
    role: "Data Analyst",
    reviewer: "David Park",
    period: "2026 H1",
    status: "Completed",
    rating: 4.2,
    dueDate: "Mar 15, 2026",
    submittedAt: "Mar 12, 2026",
  },
  {
    id: "4",
    employee: "David Kim",
    avatar: "DK",
    dept: "Sales",
    role: "Sales Executive",
    reviewer: "Robert Chen",
    period: "2026 H1",
    status: "Completed",
    rating: 4.0,
    dueDate: "Mar 10, 2026",
    submittedAt: "Mar 8, 2026",
  },
  {
    id: "5",
    employee: "Emily Rodriguez",
    avatar: "ER",
    dept: "Design",
    role: "UX Designer",
    reviewer: "Lisa Park",
    period: "2026 H1",
    status: "In Progress",
    rating: 4.3,
    dueDate: "Mar 31, 2026",
    submittedAt: null,
  },
  {
    id: "6",
    employee: "Michael Brown",
    avatar: "MB",
    dept: "Marketing",
    role: "Marketing Manager",
    reviewer: "Sarah Miller",
    period: "2026 H1",
    status: "Pending",
    rating: null,
    dueDate: "Mar 31, 2026",
    submittedAt: null,
  },
];

const feedback360 = [
  {
    id: "1",
    from: "Peer",
    fromName: "Rachel Green",
    to: "Sarah Chen",
    strengths: "Excellent technical leadership, great at explaining complex concepts",
    areasForImprovement: "Could be more proactive in sharing updates with the team",
    rating: 4.5,
  },
  {
    id: "2",
    from: "Manager",
    fromName: "David Park",
    to: "Sarah Chen",
    strengths: "Consistently delivers high-quality work, mentors junior developers well",
    areasForImprovement: "Could take on more cross-team initiatives",
    rating: 4.7,
  },
  {
    id: "3",
    from: "Direct Report",
    fromName: "Jessica Lee",
    to: "Sarah Chen",
    strengths: "Great mentor, always available to help, provides clear feedback",
    areasForImprovement: "Sometimes too focused on details",
    rating: 4.3,
  },
];

const competencies = [
  { name: "Technical Skills", avgRating: 4.4, distribution: { 5: 45, 4: 35, 3: 15, 2: 4, 1: 1 } },
  { name: "Communication", avgRating: 4.1, distribution: { 5: 30, 4: 45, 3: 20, 2: 4, 1: 1 } },
  { name: "Teamwork", avgRating: 4.6, distribution: { 5: 55, 4: 30, 3: 12, 2: 2, 1: 1 } },
  { name: "Leadership", avgRating: 3.9, distribution: { 5: 25, 4: 40, 3: 25, 2: 8, 1: 2 } },
  { name: "Problem Solving", avgRating: 4.5, distribution: { 5: 50, 4: 35, 3: 12, 2: 2, 1: 1 } },
];

function PerformanceReviews() {
  const [viewMode, setViewMode] = useState<"reviews" | "feedback" | "analytics">("reviews");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = review.employee.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || review.status === statusFilter;
    const matchesDept = deptFilter === "All Departments" || review.dept === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const statuses = ["All", "Pending", "Scheduled", "In Progress", "Completed"];
  const departments = ["All Departments", "Engineering", "Design", "Product", "Sales", "Marketing", "Operations"];

  const avgRating = (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.filter((r) => r.rating).length).toFixed(1);
  const completionRate = Math.round((reviews.filter((r) => r.status === "Completed").length / reviews.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Performance Reviews</h2>
          <p className="text-sm text-muted-foreground">
            Manage 360 feedback, OKRs, and performance evaluations
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Review
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Rating</p>
              <p className="text-xl font-bold text-foreground">{avgRating}/5.0</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-xl font-bold text-foreground">{completionRate}%</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
              <p className="text-xl font-bold text-foreground">{reviews.filter((r) => r.status === "Pending" || r.status === "Scheduled").length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">360 Feedback</p>
              <p className="text-xl font-bold text-foreground">{feedback360.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/60">
        {[
          { id: "reviews", label: "Reviews", icon: Star },
          { id: "feedback", label: "360 Feedback", icon: MessageSquare },
          { id: "analytics", label: "Analytics", icon: TrendingUp },
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

      {/* Reviews Tab */}
      {viewMode === "reviews" && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
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

          {/* Reviews List */}
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <div key={review.id} className="rounded-lg border border-border/60 bg-card">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {review.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{review.employee}</p>
                      <p className="text-xs text-muted-foreground">{review.role} · {review.dept}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Period</p>
                      <p className="text-sm font-medium text-foreground">{review.period}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm font-medium text-foreground">{review.dueDate}</p>
                    </div>
                    {review.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-foreground">{review.rating}</span>
                      </div>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      review.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : review.status === "In Progress"
                          ? "bg-blue-500/10 text-blue-500"
                          : review.status === "Scheduled"
                            ? "bg-purple-500/10 text-purple-500"
                            : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {review.status === "Completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {review.status === "In Progress" && <Clock className="h-3 w-3 mr-1" />}
                      {review.status}
                    </span>
                    {expandedReview === review.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {expandedReview === review.id && (
                  <div className="border-t border-border/40 p-4 bg-muted/20">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Reviewer</p>
                        <p className="text-sm font-medium text-foreground">{review.reviewer}</p>
                      </div>
                      {review.submittedAt && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                          <p className="text-sm font-medium text-foreground">{review.submittedAt}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                        View Details
                      </button>
                      {review.status !== "Completed" && (
                        <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                          Continue Review
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 360 Feedback Tab */}
      {viewMode === "feedback" && (
        <div className="space-y-4">
          {feedback360.map((feedback) => (
            <div key={feedback.id} className="rounded-lg border border-border/60 bg-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {feedback.fromName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{feedback.fromName}</p>
                    <p className="text-xs text-muted-foreground">{feedback.from} feedback for {feedback.to}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">{feedback.rating}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-emerald-600 mb-1">Strengths</p>
                  <p className="text-sm text-muted-foreground">{feedback.strengths}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-600 mb-1">Areas for Improvement</p>
                  <p className="text-sm text-muted-foreground">{feedback.areasForImprovement}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {viewMode === "analytics" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Competency Scores */}
          <div className="rounded-lg border border-border/60 bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Competency Scores</h3>
            <div className="space-y-4">
              {competencies.map((comp) => (
                <div key={comp.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">{comp.name}</span>
                    <span className="text-sm font-semibold text-foreground">{comp.avgRating}/5.0</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                    {Object.entries(comp.distribution)
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([rating, count]) => (
                        <div
                          key={rating}
                          className={`h-full ${
                            rating === "5" ? "bg-emerald-500" :
                            rating === "4" ? "bg-blue-500" :
                            rating === "3" ? "bg-amber-500" :
                            rating === "2" ? "bg-orange-500" : "bg-red-500"
                          }`}
                          style={{ width: `${count}%` }}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="rounded-lg border border-border/60 bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Rating Distribution</h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviews.filter((r) => Math.round(r.rating || 0) === rating).length;
                const pct = Math.round((count / reviews.length) * 100);
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium text-foreground">{rating}</span>
                    </div>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
