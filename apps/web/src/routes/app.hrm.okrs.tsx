import { Button } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Target,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MoreVertical,
  Download,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Users,
  Calendar,
  Edit,
  Trash2,
  AlertCircle
} from "lucide-react";

export const Route = createFileRoute("/app/hrm/okrs")({
  component: OKRTracking,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
function getOrgHeader(): Record<string, string> {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
}

const MOCK_OKR_DATA = [
  {
    id: "1",
    objective: "Improve System Performance",
    owner: "Sarah Chen",
    avatar: "SC",
    dept: "Engineering",
    status: "On Track",
    progress: 75,
    dueDate: "Jun 30, 2026",
    keyResults: [
      { id: "kr1", title: "Reduce API latency by 30%", progress: 80, status: "On Track" },
      { id: "kr2", title: "Achieve 99.9% uptime", progress: 70, status: "On Track" },
      { id: "kr3", title: "Complete migration to GraphQL", progress: 60, status: "At Risk" },
    ],
  },
  {
    id: "2",
    objective: "Increase Customer Satisfaction",
    owner: "Marcus Johnson",
    avatar: "MJ",
    dept: "Product",
    status: "On Track",
    progress: 65,
    dueDate: "Jun 30, 2026",
    keyResults: [
      { id: "kr4", title: "NPS score above 50", progress: 55, status: "On Track" },
      { id: "kr5", title: "Reduce support ticket volume by 20%", progress: 70, status: "On Track" },
      { id: "kr6", title: "Launch customer feedback system", progress: 65, status: "On Track" },
    ],
  },
  {
    id: "3",
    objective: "Expand Market Presence",
    owner: "David Kim",
    avatar: "DK",
    dept: "Sales",
    status: "At Risk",
    progress: 35,
    dueDate: "Jun 30, 2026",
    keyResults: [
      { id: "kr7", title: "Enter 3 new markets", progress: 33, status: "At Risk" },
      { id: "kr8", title: "Increase MQLs by 50%", progress: 40, status: "On Track" },
      { id: "kr9", title: "Partner with 5 resellers", progress: 25, status: "Behind" },
    ],
  },
  {
    id: "4",
    objective: "Enhance Brand Awareness",
    owner: "Michael Brown",
    avatar: "MB",
    dept: "Marketing",
    status: "On Track",
    progress: 58,
    dueDate: "Jun 30, 2026",
    keyResults: [
      { id: "kr10", title: "Increase social following by 100%", progress: 65, status: "On Track" },
      { id: "kr11", title: "Publish 20 thought leadership articles", progress: 50, status: "On Track" },
      { id: "kr12", title: "Launch referral program", progress: 45, status: "On Track" },
    ],
  },
  {
    id: "5",
    objective: "Build High-Performing Team",
    owner: "Emily Rodriguez",
    avatar: "ER",
    dept: "Design",
    status: "Completed",
    progress: 100,
    dueDate: "Mar 31, 2026",
    keyResults: [
      { id: "kr13", title: "Complete design system", progress: 100, status: "Completed" },
      { id: "kr14", title: "Conduct user research weekly", progress: 100, status: "Completed" },
      { id: "kr15", title: "Ship 10 major features", progress: 100, status: "Completed" },
    ],
  },
];

const MOCK_COMPANY_OKRS = {
  objective: "Achieve Market Leadership",
  progress: 52,
  status: "On Track",
  owner: "CEO",
  dueDate: "Dec 31, 2026",
  initiatives: [
    { title: "Product Innovation", progress: 60 },
    { title: "Customer Success", progress: 55 },
    { title: "Revenue Growth", progress: 45 },
    { title: "Team Excellence", progress: 50 },
  ],
};

function OKRTracking() {
  const [viewMode, setViewMode] = useState<"all" | "my" | "team">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [expandedOKR, setExpandedOKR] = useState<string | null>(null);

  const okrsQuery = useQuery({
    queryKey: ["hrm", "okrs"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/hrm/okrs`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch OKRs");
      return res.json();
    },
    retry: false,
  });
  if (okrsQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => okrsQuery.refetch()}>Retry</Button>
    </div>
  );

  const companyOKRsQuery = useQuery({
    queryKey: ["hrm", "company-okrs"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/hrm/okrs/company`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch company OKRs");
      return res.json();
    },
    retry: false,
  });

  const okrData = okrsQuery.data?.data ?? MOCK_OKR_DATA;
  const companyOKRs = companyOKRsQuery.data?.data ?? MOCK_COMPANY_OKRS;

  const filteredOKRs = okrData.filter((okr: any) => {
    const matchesSearch = okr.objective.toLowerCase().includes(search.toLowerCase()) || okr.owner.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || okr.status === statusFilter;
    const matchesDept = deptFilter === "All Departments" || okr.dept === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const statuses = ["All", "On Track", "At Risk", "Behind", "Completed"];
  const departments = ["All Departments", "Engineering", "Design", "Product", "Sales", "Marketing", "Operations"];

  const avgProgress = okrData.length > 0
    ? Math.round(okrData.reduce((acc: number, o: any) => acc + o.progress, 0) / okrData.length)
    : 0;
  const onTrackCount = okrData.filter((o: any) => o.status === "On Track").length;
  const atRiskCount = okrData.filter((o: any) => o.status === "At Risk" || o.status === "Behind").length;

  const isLoading = okrsQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">OKR Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Objectives and Key Results for the organization
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New OKR
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Progress</p>
              <p className="text-xl font-bold text-foreground">{avgProgress}%</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On Track</p>
              <p className="text-xl font-bold text-foreground">{onTrackCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">At Risk</p>
              <p className="text-xl font-bold text-foreground">{atRiskCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total OKRs</p>
              <p className="text-xl font-bold text-foreground">{okrData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Company OKR */}
      <div className="rounded-lg border border-border/60 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-primary mb-1">Company OKR</p>
            <h3 className="text-lg font-semibold text-foreground">{companyOKRs.objective}</h3>
            <p className="text-sm text-muted-foreground mt-1">Owned by {companyOKRs.owner}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-2xl font-bold text-primary">{companyOKRs.progress}%</span>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
              {companyOKRs.status}
            </span>
          </div>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary rounded-full" style={{ width: `${companyOKRs.progress}%` }} />
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {companyOKRs.initiatives.map((initiative: any, idx: number) => (
            <div key={idx} className="bg-card/50 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground mb-2">{initiative.title}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${initiative.progress}%` }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{initiative.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {["all", "my", "team"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === mode
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "all" ? "All OKRs" : mode === "my" ? "My OKRs" : "Team OKRs"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search OKRs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
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

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-card p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="h-8 w-32 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OKRs List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredOKRs.map((okr: any) => (
            <div key={okr.id} className="rounded-lg border border-border/60 bg-card">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedOKR(expandedOKR === okr.id ? null : okr.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {okr.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{okr.objective}</p>
                    <p className="text-xs text-muted-foreground">{okr.owner} · {okr.dept}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="text-sm font-medium text-foreground">{okr.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-2 w-32">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          okr.status === "Completed" ? "bg-emerald-500" :
                          okr.status === "On Track" ? "bg-blue-500" :
                          "bg-amber-500"
                        }`}
                        style={{ width: `${okr.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-10">{okr.progress}%</span>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    okr.status === "Completed"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : okr.status === "On Track"
                        ? "bg-blue-500/10 text-blue-500"
                        : okr.status === "At Risk"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                  }`}>
                    {okr.status}
                  </span>
                  {expandedOKR === okr.id ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              {expandedOKR === okr.id && (
                <div className="border-t border-border/40 bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Key Results</p>
                  <div className="space-y-3">
                    {(okr.keyResults ?? []).map((kr: any) => (
                      <div key={kr.id} className="flex items-center gap-4 bg-card rounded-lg p-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{kr.title}</p>
                        </div>
                        <div className="flex items-center gap-2 w-32">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                kr.status === "Completed" ? "bg-emerald-500" :
                                kr.status === "On Track" ? "bg-blue-500" :
                                "bg-amber-500"
                              }`}
                              style={{ width: `${kr.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-foreground w-8">{kr.progress}%</span>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          kr.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : kr.status === "On Track"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-amber-500/10 text-amber-500"
                        }`}>
                          {kr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                      <Edit className="h-3 w-3 inline mr-1" />
                      Edit OKR
                    </button>
                    <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                      <Plus className="h-3 w-3 inline mr-1" />
                      Add Key Result
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredOKRs.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No OKRs found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
