import { Button } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import { hrmApi } from "@/lib/api";

export const Route = createFileRoute("/app/hrm/leave")({
  component: LeaveManagement,
});

const defaultLeaveRequests = [
  { id: "1", name: "Alex Thompson", type: "Annual Leave", days: 5, startDate: "Mar 25, 2026", endDate: "Mar 29, 2026", status: "Pending", dept: "Engineering", avatar: "AT" },
  { id: "2", name: "Jessica Lee", type: "Sick Leave", days: 2, startDate: "Mar 22, 2026", endDate: "Mar 23, 2026", status: "Pending", dept: "Engineering", avatar: "JL" },
  { id: "3", name: "Michael Brown", type: "Annual Leave", days: 10, startDate: "Apr 1, 2026", endDate: "Apr 10, 2026", status: "Pending", dept: "Marketing", avatar: "MB" },
  { id: "4", name: "Amanda White", type: "Personal Day", days: 1, startDate: "Mar 24, 2026", endDate: "Mar 24, 2026", status: "Pending", dept: "Operations", avatar: "AW" },
  { id: "5", name: "David Kim", type: "Annual Leave", days: 3, startDate: "Mar 18, 2026", endDate: "Mar 20, 2026", status: "Approved", dept: "Sales", avatar: "DK" },
  { id: "6", name: "Emily Rodriguez", type: "Sick Leave", days: 1, startDate: "Mar 15, 2026", endDate: "Mar 15, 2026", status: "Approved", dept: "Design", avatar: "ER" },
  { id: "7", name: "Chris Martinez", type: "Annual Leave", days: 7, startDate: "Feb 10, 2026", endDate: "Feb 16, 2026", status: "Rejected", dept: "Engineering", avatar: "CM" },
  { id: "8", name: "Lisa Wang", type: "Personal Day", days: 2, startDate: "Mar 12, 2026", endDate: "Mar 13, 2026", status: "Approved", dept: "Marketing", avatar: "LW" },
];

const leaveTypes = [
  { name: "Annual Leave", color: "bg-blue-500", count: 45 },
  { name: "Sick Leave", color: "bg-amber-500", count: 12 },
  { name: "Personal Day", color: "bg-purple-500", count: 8 },
  { name: "Bereavement", color: "bg-gray-500", count: 2 },
  { name: "Jury Duty", color: "bg-teal-500", count: 1 },
];

function LeaveManagement() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [showActions, setShowActions] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const { data: queryData, isLoading, isError, refetch } = useQuery({
    queryKey: ["hrm-leave-requests"],
    queryFn: () => hrmApi.leaveRequests.list({ limit: 100 }),
    retry: false,
  });

  const rawData = (queryData as any)?.data ?? defaultLeaveRequests;

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await hrmApi.leaveRequests.updateStatus(id, "approved");
      queryClient.invalidateQueries({ queryKey: ["hrm-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["hrm-summary"] });
    } catch (e) {
      toast.error("Failed to approve leave");
    }
    setProcessing(null);
    setShowActions(null);
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      await hrmApi.leaveRequests.updateStatus(id, "rejected");
      queryClient.invalidateQueries({ queryKey: ["hrm-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["hrm-summary"] });
    } catch (e) {
      toast.error("Failed to reject leave");
    }
    setProcessing(null);
    setShowActions(null);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded bg-muted" />
            <div className="h-9 w-32 rounded bg-muted" />
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card h-64" />
      </div>
    );
  }

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const leaveRequestsList = rawData.map((lr: any) => ({
    id: lr.id,
    name: lr.employeeName || "Employee",
    type: lr.leaveType || "Leave",
    days: lr.days || lr.numberOfDays || 1,
    startDate: lr.startDate ? new Date(lr.startDate).toLocaleDateString() : "N/A",
    endDate: lr.endDate ? new Date(lr.endDate).toLocaleDateString() : "N/A",
    status: lr.status || "Pending",
    dept: lr.department || "General",
    avatar: (lr.employeeName || "E").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
  }));

  const filteredRequests = leaveRequestsList.filter((req: any) => {
    const matchesSearch = req.name.toLowerCase().includes(search.toLowerCase()) || req.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || req.status === statusFilter;
    const matchesType = typeFilter === "All Types" || req.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCount = leaveRequestsList.filter((r: any) => r.status === "Pending").length;
  const approvedCount = leaveRequestsList.filter((r: any) => r.status === "Approved").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Leave Management</h2>
          <p className="text-sm text-muted-foreground">
            {pendingCount} pending · {approvedCount} approved this month
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/app/hrm/leave/calendar"
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === "calendar"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:bg-muted/50"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </a>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Request Leave
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5">
        {leaveTypes.map((type) => (
          <div key={type.name} className="rounded-lg border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${type.color}`} />
              <span className="text-sm text-muted-foreground">{type.name}</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{type.count}</p>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search requests..."
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
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="All Types">All Types</option>
            <option value="Annual Leave">Annual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Personal Day">Personal Day</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/60 bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Dates</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Days</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request: any) => (
              <tr key={request.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {request.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{request.name}</p>
                      <p className="text-xs text-muted-foreground">{request.dept}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{request.type}</td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <p className="text-foreground">{request.startDate}</p>
                    <p className="text-xs text-muted-foreground">to {request.endDate}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{request.days}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    request.status === "Approved"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : request.status === "Rejected"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {request.status === "Approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {request.status === "Rejected" && <XCircle className="h-3 w-3 mr-1" />}
                    {request.status === "Pending" && <Clock className="h-3 w-3 mr-1" />}
                    {request.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {request.status === "Pending" ? (
                    <div className="relative inline-block">
                      <button
                        onClick={() => setShowActions(showActions === request.id ? null : request.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {showActions === request.id && (
                        <div className="absolute right-0 mt-2 w-36 rounded-lg border border-border/60 bg-card shadow-lg z-10">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={processing === request.id}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-500/10 disabled:opacity-50"
                          >
                            {processing === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processing === request.id}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {processing === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors opacity-50 cursor-not-allowed">
                      <FileText className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No leave requests found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
