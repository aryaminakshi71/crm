import { Button } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Calendar,
  Heart,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Loader2,
} from "lucide-react";
import { hrmApi } from "@/lib/api";

export const Route = createFileRoute("/app/hrm/_index")({
  component: HrmDashboard,
});

// ─── Leave Balance Data ───────────────────────────────────────────────────────

const leaveBalances = [
  {
    employee: "Sarah Chen",
    avatar: "SC",
    balances: [
      { type: "Annual", used: 6, total: 20 },
      { type: "Sick", used: 2, total: 10 },
      { type: "Personal", used: 1, total: 5 },
    ],
  },
  {
    employee: "Marcus Johnson",
    avatar: "MJ",
    balances: [
      { type: "Annual", used: 14, total: 20 },
      { type: "Sick", used: 5, total: 10 },
      { type: "Personal", used: 3, total: 5 },
    ],
  },
  {
    employee: "Emily Rodriguez",
    avatar: "ER",
    balances: [
      { type: "Annual", used: 3, total: 20 },
      { type: "Sick", used: 0, total: 10 },
      { type: "Personal", used: 2, total: 5 },
    ],
  },
];

const leaveTypeColors: Record<string, string> = {
  Annual: "bg-blue-500",
  Sick: "bg-amber-500",
  Personal: "bg-purple-500",
};

// ─── Onboarding Checklist Items ───────────────────────────────────────────────

const ONBOARDING_ITEMS = [
  "Complete profile",
  "IT setup",
  "Meet team",
  "First 1:1",
  "Review handbook",
];

const newHires = [
  { id: "1", name: "David Kim", avatar: "DK", startDate: "Mar 1, 2026" },
  { id: "2", name: "Lisa Park", avatar: "LP", startDate: "Mar 10, 2026" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const MOCK_SUMMARY = {
  headcount: 0,
  pendingLeave: 0,
  requisitions: 0,
  candidates: 0,
  avgGoalProgress: 0,
};

const MOCK_EMPLOYEES: any[] = [];
const MOCK_LEAVE_REQUESTS: any[] = [];
const MOCK_REVIEWS: any[] = [];

function HrmDashboard() {
  // Onboarding checklist state: { [hireId]: Set<string> }
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<string>>>(
    () => Object.fromEntries(newHires.map((h) => [h.id, new Set<string>()]))
  );

  const summaryQuery = useQuery({
    queryKey: ["hrm-summary"],
    queryFn: () => hrmApi.getSummary(),
    retry: false,
  });

  const employeesQuery = useQuery({
    queryKey: ["hrm-employees-dashboard"],
    queryFn: () => hrmApi.employees.list({ limit: 5 }),
    retry: false,
  });

  const leaveQuery = useQuery({
    queryKey: ["hrm-leave-dashboard"],
    queryFn: () => hrmApi.leaveRequests.list({ status: "pending", limit: 5 }),
    retry: false,
  });

  const reviewsQuery = useQuery({
    queryKey: ["hrm-reviews-dashboard"],
    queryFn: () => hrmApi.reviews.list({ limit: 5 }),
    retry: false,
  });

  const isLoading =
    summaryQuery.isLoading ||
    employeesQuery.isLoading ||
    leaveQuery.isLoading ||
    reviewsQuery.isLoading;

  const isError =
    summaryQuery.isError ||
    employeesQuery.isError ||
    leaveQuery.isError ||
    reviewsQuery.isError;

  const summary = (summaryQuery.data as any) ?? MOCK_SUMMARY;

  const stats = [
    {
      label: "Total Employees",
      value: String(summary.headcount || 0),
      change: "+0",
      positive: true,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "New Hires (Month)",
      value: "0",
      change: "+0",
      positive: true,
      icon: UserPlus,
      color: "text-emerald-500",
    },
    {
      label: "Pending Leave Requests",
      value: String(summary.pendingLeave || 0),
      change: "0",
      positive: false,
      icon: Calendar,
      color: "text-amber-500",
    },
    {
      label: "Open Positions",
      value: String(summary.requisitions || 0),
      change: "+0",
      positive: true,
      icon: Briefcase,
      color: "text-purple-500",
    },
    {
      label: "Avg Tenure",
      value: "3.2 yrs",
      change: "+0.2",
      positive: true,
      icon: Clock,
      color: "text-cyan-500",
    },
    {
      label: "Turnover Rate",
      value: "4.8%",
      change: "-1.2%",
      positive: true,
      icon: TrendingUp,
      color: "text-green-500",
    },
  ];

  const recentHires = ((employeesQuery.data as any)?.data ?? MOCK_EMPLOYEES).slice(0, 4).map((emp: any) => ({
    id: emp.id,
    name: emp.fullName || `${emp.firstName} ${emp.lastName}`,
    role: emp.jobTitle || "Employee",
    dept: emp.department || "General",
    startDate: emp.startDate ? new Date(emp.startDate).toLocaleDateString() : "N/A",
    avatar: (emp.firstName?.[0] || "") + (emp.lastName?.[0] || ""),
  })) || [
    { id: "1", name: "Sarah Chen", role: "Senior Engineer", dept: "Engineering", startDate: "Mar 15, 2026", avatar: "SC" },
    { id: "2", name: "Marcus Johnson", role: "Product Manager", dept: "Product", startDate: "Mar 10, 2026", avatar: "MJ" },
    { id: "3", name: "Emily Rodriguez", role: "UX Designer", dept: "Design", startDate: "Mar 8, 2026", avatar: "ER" },
    { id: "4", name: "David Kim", role: "Sales Executive", dept: "Sales", startDate: "Mar 1, 2026", avatar: "DK" },
  ];

  const pendingLeaveData = (leaveQuery.data as any)?.data ?? MOCK_LEAVE_REQUESTS;
  const pendingLeave = pendingLeaveData.length > 0 ? pendingLeaveData.map((lr: any) => ({
    id: lr.id,
    name: lr.employeeName || "Employee",
    type: lr.leaveType || "Leave",
    days: lr.days || 1,
    startDate: lr.startDate ? new Date(lr.startDate).toLocaleDateString() : "N/A",
    status: lr.status || "Pending",
  })) : [
    { id: "1", name: "Alex Thompson", type: "Annual Leave", days: 5, startDate: "Mar 25, 2026", status: "Pending" },
    { id: "2", name: "Jessica Lee", type: "Sick Leave", days: 2, startDate: "Mar 22, 2026", status: "Pending" },
    { id: "3", name: "Michael Brown", type: "Annual Leave", days: 10, startDate: "Apr 1, 2026", status: "Pending" },
    { id: "4", name: "Amanda White", type: "Personal Day", days: 1, startDate: "Mar 24, 2026", status: "Pending" },
  ];

  const reviewsData = (reviewsQuery.data as any)?.data ?? MOCK_REVIEWS;
  const upcomingReviews = reviewsData.length > 0 ? reviewsData.map((r: any) => ({
    id: r.id,
    name: r.employeeName || "Employee",
    dept: r.department || "General",
    dueDate: r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "N/A",
    status: r.status || "Scheduled",
  })) : [
    { id: "1", name: "Chris Martinez", dept: "Engineering", dueDate: "Mar 25, 2026", status: "Scheduled" },
    { id: "2", name: "Lisa Wang", dept: "Marketing", dueDate: "Mar 28, 2026", status: "Scheduled" },
    { id: "3", name: "James Wilson", dept: "Sales", dueDate: "Apr 2, 2026", status: "Scheduled" },
  ];

  const toggleChecklist = (hireId: string, item: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev[hireId]);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return { ...prev, [hireId]: next };
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-card p-4 h-24" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-card h-48" />
          <div className="rounded-lg border border-border/60 bg-card h-48" />
        </div>
      </div>
    );
  }

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => { summaryQuery.refetch(); employeesQuery.refetch(); leaveQuery.refetch(); reviewsQuery.refetch(); }}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Quick Stats Row (6 metrics including Avg Tenure & Turnover Rate) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border/60 bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stat.positive ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${stat.positive ? "text-emerald-500" : "text-red-500"}`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Hires */}
        <div className="rounded-lg border border-border/60 bg-card">
          <div className="border-b border-border/60 px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Hires</h2>
            <a href="/app/hrm/directory" className="text-sm text-primary hover:underline">
              View All
            </a>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentHires.map((hire) => (
                <div key={hire.id} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {hire.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{hire.name}</p>
                    <p className="text-xs text-muted-foreground">{hire.role} · {hire.dept}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="text-xs font-medium text-foreground">{hire.startDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="rounded-lg border border-border/60 bg-card">
          <div className="border-b border-border/60 px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Pending Leave Requests</h2>
            <a href="/app/hrm/leave" className="text-sm text-primary hover:underline">
              View All
            </a>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pendingLeave.map((leave) => (
                <div key={leave.id} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{leave.name}</p>
                    <p className="text-xs text-muted-foreground">{leave.type} · {leave.days} days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">From {leave.startDate}</p>
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                      {leave.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balance Tracker + Onboarding Checklist */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leave Balance Tracker */}
        <div className="rounded-lg border border-border/60 bg-card">
          <div className="border-b border-border/60 px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Leave Balance Tracker</h2>
            <a href="/app/hrm/leave" className="text-sm text-primary hover:underline">
              Manage
            </a>
          </div>
          <div className="p-6 space-y-6">
            {leaveBalances.map((emp) => (
              <div key={emp.employee}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {emp.avatar}
                  </div>
                  <p className="text-sm font-medium text-foreground">{emp.employee}</p>
                </div>
                <div className="space-y-2 pl-11">
                  {emp.balances.map((b) => (
                    <div key={b.type}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${leaveTypeColors[b.type]}`}
                          />
                          <span className="text-xs text-muted-foreground">{b.type}</span>
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {b.used}/{b.total} days
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${leaveTypeColors[b.type]}`}
                          style={{ width: `${(b.used / b.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Onboarding Checklist */}
        <div className="rounded-lg border border-border/60 bg-card">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="font-semibold text-foreground">Onboarding Checklist</h2>
            <p className="text-xs text-muted-foreground mt-0.5">New hires in their first 30 days</p>
          </div>
          <div className="p-6 space-y-6">
            {newHires.map((hire) => {
              const checked = checkedItems[hire.id] ?? new Set();
              const progress = Math.round((checked.size / ONBOARDING_ITEMS.length) * 100);
              return (
                <div key={hire.id}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                      {hire.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{hire.name}</p>
                      <p className="text-xs text-muted-foreground">Started {hire.startDate}</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600">{progress}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mb-3 pl-11">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 pl-11">
                    {ONBOARDING_ITEMS.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={checked.has(item)}
                          onChange={() => toggleChecklist(hire.id, item)}
                          className="h-4 w-4 rounded border-border accent-emerald-500 cursor-pointer"
                        />
                        <span
                          className={`text-sm transition-colors ${
                            checked.has(item)
                              ? "line-through text-muted-foreground"
                              : "text-foreground group-hover:text-primary"
                          }`}
                        >
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Performance Reviews */}
        <div className="rounded-lg border border-border/60 bg-card">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="font-semibold text-foreground">Upcoming Reviews</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingReviews.map((review) => (
                <div key={review.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                    {review.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.dept}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{review.dueDate}</p>
                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                      {review.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Headcount by Department */}
        <div className="rounded-lg border border-border/60 bg-card">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="font-semibold text-foreground">Headcount by Department</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {[
                { dept: "Engineering", count: 86, pct: 35 },
                { dept: "Sales", count: 52, pct: 21 },
                { dept: "Marketing", count: 34, pct: 14 },
                { dept: "Product", count: 28, pct: 11 },
                { dept: "Design", count: 18, pct: 7 },
                { dept: "Operations", count: 30, pct: 12 },
              ].map((d) => (
                <div key={d.dept}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{d.dept}</span>
                    <span className="text-xs font-medium text-foreground">{d.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-border/60 bg-card">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="font-semibold text-foreground">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid gap-3">
              <a
                href="/app/hrm/employees/new"
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/50 transition-colors"
              >
                <UserPlus className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Add Employee</span>
              </a>
              <a
                href="/app/hrm/leave"
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/50 transition-colors"
              >
                <Calendar className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium text-foreground">Approve Leave</span>
              </a>
              <a
                href="/app/hrm/recruitment"
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/50 transition-colors"
              >
                <Briefcase className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-foreground">Post Job</span>
              </a>
              <a
                href="/app/hrm/payroll"
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/50 transition-colors"
              >
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-foreground">Run Payroll</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
