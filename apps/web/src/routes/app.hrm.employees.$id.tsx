import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Edit,
  FileText,
  GraduationCap,
  Heart,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Star,
  Target,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/hrm/employees/$id")({
  component: EmployeeProfile,
});

function formatDate(value: unknown): string {
  if (!value) return "-";
  const dt = new Date(String(value));
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function EmployeeProfile() {
  const params = Route.useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [showActions, setShowActions] = useState(false);

  // Fetch all employees then find the one matching :id
  const { data: employeesData, isLoading, refetch, isError} = useQuery({
    queryKey: ["hrm-employees-all"],
    queryFn: () => nucleoApi.hrm.employees.list({ page: 1, limit: 200 }),
  });

  const { data: leaveData } = useQuery({
    queryKey: ["hrm-leave-requests"],
    queryFn: () => nucleoApi.hrm.leaveRequests.list({ page: 1, limit: 100 }),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["hrm-reviews"],
    queryFn: () => nucleoApi.hrm.reviews.list({ page: 1, limit: 100 }),
  });

  const employees: any[] = employeesData?.data ?? [];
  const rawEmployee = employees.find((e) => e.id === params.id) ?? employees[0];

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!rawEmployee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Employee not found</p>
        <a href="/app/hrm/directory" className="text-primary hover:underline text-sm">
          Back to Directory
        </a>
      </div>
    );
  }

  // Map API fields to display shape
  const allLeave: any[] = leaveData?.data ?? [];
  const empLeave = allLeave.filter((l) => l.employeeId === rawEmployee.id);

  const allReviews: any[] = reviewsData?.data ?? [];
  const empReviews = allReviews.filter((r) => r.employeeId === rawEmployee.id);

  const employee = {
    id: rawEmployee.id,
    name: rawEmployee.fullName ?? rawEmployee.name ?? "Unknown",
    role: rawEmployee.jobTitle ?? "Employee",
    dept: rawEmployee.department ?? "General",
    email: rawEmployee.workEmail ?? rawEmployee.email ?? "",
    phone: rawEmployee.phone ?? "",
    location: rawEmployee.location ?? "",
    status: rawEmployee.status ?? "active",
    avatar: getInitials(rawEmployee.fullName ?? rawEmployee.name ?? "?"),
    startDate: formatDate(rawEmployee.joinDate),
    manager: rawEmployee.managerName ?? "",
    employmentType: rawEmployee.employmentType ?? "full_time",
    leaveRequests: empLeave,
    reviews: empReviews,
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "performance", label: "Performance", icon: TrendingUp },
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
        {activeTab === "performance" && <PerformanceTab employee={employee} />}
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
          {employee.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${employee.email}`} className="text-sm text-primary hover:underline">
                {employee.email}
              </a>
            </div>
          )}
          {employee.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${employee.phone}`} className="text-sm text-foreground">
                {employee.phone}
              </a>
            </div>
          )}
          {employee.location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{employee.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Employment Details */}
      <div className="rounded-lg border border-border/60 bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Employment Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Department</span>
            <span className="text-sm font-medium text-foreground">{employee.dept}</span>
          </div>
          {employee.manager && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Manager</span>
              <span className="text-sm font-medium text-foreground">{employee.manager}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Employment Type</span>
            <span className="text-sm font-medium text-foreground capitalize">
              {employee.employmentType.replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Join Date</span>
            <span className="text-sm font-medium text-foreground">{employee.startDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerformanceTab({ employee }: { employee: any }) {
  const reviews: any[] = employee.reviews ?? [];

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-12 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No performance reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review History */}
      <div className="rounded-lg border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-4">
          <h3 className="font-semibold text-foreground">Review History</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="flex items-center justify-between rounded-lg border border-border/40 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 font-semibold text-sm">
                    {review.goalsProgress ?? 0}%
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{review.reviewCycle ?? "Review"}</p>
                    <p className="text-xs text-muted-foreground">
                      Rating: {review.rating ?? "not_rated"} · Goals: {review.goalsProgress ?? 0}%
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  review.status === "completed"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-amber-500/10 text-amber-500"
                }`}>
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

function LeaveTab({ employee }: { employee: any }) {
  const leaveRequests: any[] = employee.leaveRequests ?? [];

  return (
    <div className="space-y-6">
      {/* Leave Requests */}
      <div className="rounded-lg border border-border/60 bg-card">
        <div className="border-b border-border/60 px-6 py-4">
          <h3 className="font-semibold text-foreground">Leave Requests</h3>
        </div>
        <div className="p-6">
          {leaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No leave requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((leave: any) => (
                <div key={leave.id} className="flex items-center justify-between rounded-lg border border-border/40 p-4">
                  <div>
                    <p className="font-medium text-foreground capitalize">{leave.leaveType?.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                    </p>
                    {leave.reason && (
                      <p className="text-xs text-muted-foreground mt-1">{leave.reason}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    leave.status === "approved"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : leave.status === "rejected"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {leave.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
