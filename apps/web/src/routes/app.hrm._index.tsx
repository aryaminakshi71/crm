import { Button } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
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


function HrmDashboard() {

  const summaryQuery = useQuery({
    queryKey: ["hrm-summary"],
    queryFn: () => hrmApi.getSummary(),
    placeholderData: (prev) => prev,
    retry: false,
  });

  const employeesQuery = useQuery({
    queryKey: ["hrm-employees-dashboard"],
    queryFn: () => hrmApi.employees.list({ limit: 5 }),
    placeholderData: (prev) => prev,
    retry: false,
  });

  const leaveQuery = useQuery({
    queryKey: ["hrm-leave-dashboard"],
    queryFn: () => hrmApi.leaveRequests.list({ status: "pending", limit: 5 }),
    placeholderData: (prev) => prev,
    retry: false,
  });

  const reviewsQuery = useQuery({
    queryKey: ["hrm-reviews-dashboard"],
    queryFn: () => hrmApi.reviews.list({ limit: 5 }),
    placeholderData: (prev) => prev,
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

  const summary = (summaryQuery.data as any) ?? { headcount: 0, pendingLeave: 0, requisitions: 0, candidates: 0, avgGoalProgress: 0 };

  const stats = [
    {
      label: "Total Employees",
      value: String(summary.headcount || 0),
      change: "—",
      positive: true,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Open Positions",
      value: String(summary.requisitions || 0),
      change: "—",
      positive: true,
      icon: UserPlus,
      color: "text-emerald-500",
    },
    {
      label: "Pending Leave Requests",
      value: String(summary.pendingLeave || 0),
      change: "—",
      positive: false,
      icon: Calendar,
      color: "text-amber-500",
    },
    {
      label: "Active Candidates",
      value: String(summary.candidates || 0),
      change: "—",
      positive: true,
      icon: Briefcase,
      color: "text-purple-500",
    },
    {
      label: "Goal Progress",
      value: `${Math.round(summary.avgGoalProgress || 0)}%`,
      change: "—",
      positive: true,
      icon: Clock,
      color: "text-cyan-500",
    },
    {
      label: "Avg Tenure",
      value: "—",
      change: "—",
      positive: true,
      icon: TrendingUp,
      color: "text-green-500",
    },
  ];

  const recentHires = ((employeesQuery.data as any)?.data ?? []).slice(0, 4).map((emp: any) => ({
    id: emp.id,
    name: emp.fullName || `${emp.firstName} ${emp.lastName}`,
    role: emp.jobTitle || "Employee",
    dept: emp.department || "General",
    startDate: emp.startDate ? new Date(emp.startDate).toLocaleDateString() : "N/A",
    avatar: (emp.firstName?.[0] || "") + (emp.lastName?.[0] || ""),
  }));

  const pendingLeaveData = (leaveQuery.data as any)?.data ?? [];
  const pendingLeave = pendingLeaveData.map((lr: any) => ({
    id: lr.id,
    name: lr.employeeName || "Employee",
    type: lr.leaveType || "Leave",
    days: lr.days || 1,
    startDate: lr.startDate ? new Date(lr.startDate).toLocaleDateString() : "N/A",
    status: lr.status || "Pending",
  }));

  const employees: any[] = (employeesQuery.data as any)?.data ?? [];
  const departmentCounts: Record<string, number> = employees.reduce((acc: Record<string, number>, emp: any) => {
    const dept = emp.department || "Other";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const reviewsData = (reviewsQuery.data as any)?.data ?? [];
  const upcomingReviews = reviewsData.map((r: any) => ({
    id: r.id,
    name: r.employeeName || "Employee",
    dept: r.department || "General",
    dueDate: r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "N/A",
    status: r.status || "Scheduled",
  }));

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
              {recentHires.map((hire: any) => (
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
              {pendingLeave.map((leave: any) => (
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


      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Performance Reviews */}
        <div className="rounded-lg border border-border/60 bg-card">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="font-semibold text-foreground">Upcoming Reviews</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingReviews.map((review: any) => (
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
              {Object.entries(departmentCounts).slice(0, 6).map(([dept, count]) => {
                const total = employees.length || 1;
                const pct = Math.round(((count as number) / total) * 100);
                return (
                  <div key={dept}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{dept}</span>
                      <span className="text-xs font-medium text-foreground">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(departmentCounts).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No employee data available</p>
              )}
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
