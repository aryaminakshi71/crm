import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";

export const Route = createFileRoute("/app/hrm/_index")({
  component: HrmDashboard,
});

function HrmDashboard() {
  const stats = [
    {
      label: "Total Employees",
      value: "248",
      change: "+12",
      positive: true,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "New Hires (Month)",
      value: "8",
      change: "+3",
      positive: true,
      icon: UserPlus,
      color: "text-emerald-500",
    },
    {
      label: "Pending Leave Requests",
      value: "14",
      change: "-2",
      positive: false,
      icon: Calendar,
      color: "text-amber-500",
    },
    {
      label: "Open Positions",
      value: "6",
      change: "+1",
      positive: true,
      icon: Briefcase,
      color: "text-purple-500",
    },
    {
      label: "Payroll (Monthly)",
      value: "$1.24M",
      change: "+5%",
      positive: true,
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      label: "Avg. Performance Score",
      value: "4.2",
      change: "+0.3",
      positive: true,
      icon: TrendingUp,
      color: "text-cyan-500",
    },
  ];

  const recentHires = [
    { id: "1", name: "Sarah Chen", role: "Senior Engineer", dept: "Engineering", startDate: "Mar 15, 2026", avatar: "SC" },
    { id: "2", name: "Marcus Johnson", role: "Product Manager", dept: "Product", startDate: "Mar 10, 2026", avatar: "MJ" },
    { id: "3", name: "Emily Rodriguez", role: "UX Designer", dept: "Design", startDate: "Mar 8, 2026", avatar: "ER" },
    { id: "4", name: "David Kim", role: "Sales Executive", dept: "Sales", startDate: "Mar 1, 2026", avatar: "DK" },
  ];

  const pendingLeave = [
    { id: "1", name: "Alex Thompson", type: "Annual Leave", days: 5, startDate: "Mar 25, 2026", status: "Pending" },
    { id: "2", name: "Jessica Lee", type: "Sick Leave", days: 2, startDate: "Mar 22, 2026", status: "Pending" },
    { id: "3", name: "Michael Brown", type: "Annual Leave", days: 10, startDate: "Apr 1, 2026", status: "Pending" },
    { id: "4", name: "Amanda White", type: "Personal Day", days: 1, startDate: "Mar 24, 2026", status: "Pending" },
  ];

  const upcomingReviews = [
    { id: "1", name: "Chris Martinez", dept: "Engineering", dueDate: "Mar 25, 2026", status: "Scheduled" },
    { id: "2", name: "Lisa Wang", dept: "Marketing", dueDate: "Mar 28, 2026", status: "Scheduled" },
    { id: "3", name: "James Wilson", dept: "Sales", dueDate: "Apr 2, 2026", status: "Scheduled" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
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
                    {review.name.split(" ").map((n) => n[0]).join("")}
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
