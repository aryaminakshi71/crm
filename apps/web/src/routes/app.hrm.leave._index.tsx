import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  ThumbsDown,
  ThumbsUp,
  User,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { hrmApi } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/hrm/leave/_index")({
  validateSearch: searchSchema,
  component: LeaveIndexPage,
});

const LEAVE_TYPE_COLORS: Record<string, string> = {
  annual: "bg-blue-500/10 text-blue-400",
  sick: "bg-red-500/10 text-red-400",
  personal: "bg-purple-500/10 text-purple-400",
  maternity: "bg-pink-500/10 text-pink-400",
  paternity: "bg-cyan-500/10 text-cyan-400",
  parental: "bg-emerald-500/10 text-emerald-400",
  unpaid: "bg-muted text-muted-foreground",
};

const STATUS_BADGE: Record<string, "warning" | "success" | "danger" | "default"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "default",
};

const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "personal", label: "Personal Leave" },
  { value: "parental", label: "Parental Leave" },
];

function calcDays(start: string, end: string): number {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(diffMs / 86400000) + 1);
}

// ── Request Leave Modal ────────────────────────────────────────────────────────

interface RequestLeaveModalProps {
  onClose: () => void;
  onOptimisticAdd: (req: any) => void;
}

function RequestLeaveModal({ onClose, onOptimisticAdd }: RequestLeaveModalProps) {
  const queryClient = useQueryClient();
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const days = startDate && endDate ? calcDays(startDate, endDate) : 0;

  const createMut = useMutation({
    mutationFn: () =>
      hrmApi.leaveRequests.create({
        employeeId: "me",
        leaveType,
        startDate,
        endDate,
        reason: notes || undefined,
      }),
    onMutate: () => {
      // Optimistic update — prepend with status "pending"
      const optimistic = {
        id: `opt-${Date.now()}`,
        leaveType,
        startDate,
        endDate,
        days,
        notes,
        status: "pending",
        employeeName: "You",
        _optimistic: true,
      };
      onOptimisticAdd(optimistic);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm-leave-index"] });
      toast.success("Leave request submitted");
      onClose();
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm-leave-index"] });
      toast.error("Failed to submit leave request");
    },
  });

  const canSubmit =
    leaveType && startDate && endDate && days > 0 && !createMut.isPending;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Request Leave
            </h2>
          </div>

          {/* Form */}
          <div className="px-6 py-5 flex flex-col gap-4">
            {/* Leave Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Leave Type
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value > endDate) setEndDate(e.target.value);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Day count */}
            {days > 0 && (
              <p className="text-sm text-muted-foreground -mt-1">
                Duration:{" "}
                <span className="font-semibold text-foreground">
                  {days} day{days !== 1 ? "s" : ""}
                </span>
              </p>
            )}

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Notes{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for leave, any additional info..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={onClose} disabled={createMut.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => createMut.mutate()}
              disabled={!canSubmit}
            >
              {createMut.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Reject Dialog ──────────────────────────────────────────────────────────────

interface RejectDialogProps {
  open: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}

function RejectDialog({ open, onConfirm, onCancel, isPending }: RejectDialogProps) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <XCircle className="h-5 w-5 mt-0.5 shrink-0 text-destructive" />
          <div>
            <h2 className="font-semibold text-foreground">Reject Leave Request</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Optionally provide a reason for rejection. The employee will be notified.
            </p>
          </div>
        </div>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)..."
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-destructive/30 placeholder:text-muted-foreground mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onConfirm(reason)}
            disabled={isPending}
          >
            {isPending ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Leave Row ──────────────────────────────────────────────────────────────────

function LeaveRow({
  req,
  onApprove,
  onReject,
  isApprovePending,
  isRejectPending,
}: {
  req: any;
  onApprove: () => void;
  onReject: () => void;
  isApprovePending: boolean;
  isRejectPending: boolean;
}) {
  const name = req.employeeName || req.employee?.name || "Unknown";
  const leaveType = req.leaveType || req.type || "annual";
  const startDate = req.startDate ? new Date(req.startDate).toLocaleDateString() : "—";
  const endDate = req.endDate ? new Date(req.endDate).toLocaleDateString() : "—";
  const days = req.days ?? (req.startDate && req.endDate ? calcDays(req.startDate, req.endDate) : "—");
  const typeColor = LEAVE_TYPE_COLORS[leaveType] ?? "bg-muted text-muted-foreground";

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-2 flex items-center gap-1.5">
        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <p className="text-sm font-medium truncate">{name}</p>
      </div>
      <div className="col-span-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeColor}`}>
          {leaveType}
        </span>
      </div>
      <div className="col-span-2">
        <p className="text-sm text-muted-foreground">{startDate}</p>
      </div>
      <div className="col-span-2">
        <p className="text-sm text-muted-foreground">{endDate}</p>
      </div>
      <div className="col-span-1">
        <p className="text-sm font-medium">{days}</p>
      </div>
      <div className="col-span-1">
        <Badge variant={STATUS_BADGE[req.status] ?? "default"}>
          {req.status}
        </Badge>
      </div>
      <div className="col-span-2 flex justify-end gap-1.5">
        {req.status === "pending" && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10"
              onClick={onApprove}
              disabled={isApprovePending || isRejectPending}
              title="Approve"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-red-400 border-red-400/30 hover:bg-red-400/10"
              onClick={onReject}
              disabled={isApprovePending || isRejectPending}
              title="Reject"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function LeaveIndexPage() {
  const queryClient = useQueryClient();
  const { q = "", status, page = 1 } = useSearch({ from: "/app/hrm/leave/_index" });
  const navigate = useNavigate({ from: "/app/hrm/leave" });
  const search = q;
  const statusFilter = status ?? "all";
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setStatusFilter = (v: string) => navigate({ search: (p) => ({ ...p, status: v === "all" ? undefined : v, page: 1 }) });
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [optimisticRequests, setOptimisticRequests] = useState<any[]>([]);

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hrm-leave-index"],
    queryFn: () => hrmApi.leaveRequests.list({ page: 1, limit: 50 }),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) =>
      hrmApi.leaveRequests.updateStatus(id, "approved"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm-leave-index"] });
      toast.success("Leave request approved");
    },
    onError: () => toast.error("Failed to approve request"),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      hrmApi.leaveRequests.updateStatus(id, "rejected", reason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm-leave-index"] });
      setRejectTarget(null);
      toast.success("Leave request rejected");
    },
    onError: () => toast.error("Failed to reject request"),
  });

  const serverRequests: any[] = ((data as any)?.data as any[]) ?? [];

  // Merge optimistic entries (remove if server data has caught up)
  const serverIds = new Set(serverRequests.map((r) => r.id));
  const activeOptimistic = optimisticRequests.filter((r) => !serverIds.has(r.id));
  const requests = [...activeOptimistic, ...serverRequests];

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const name = r.employeeName || r.employee?.name || "";
      const matchSearch =
        !search.trim() || name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, search, statusFilter]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const approvedThisMonth = requests.filter((r) => {
    if (r.status !== "approved") return false;
    const date = new Date(r.startDate ?? r.createdAt ?? "");
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load leave requests. Please try again.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Leave Management</h2>
          <p className="text-muted-foreground text-sm">
            Manage employee leave requests and approvals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRequestModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Request Leave
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Pending Requests", value: isLoading ? "—" : pendingCount, color: "text-amber-400", icon: <Clock className="h-4 w-4" /> },
          { label: "Approved This Month", value: isLoading ? "—" : approvedThisMonth, color: "text-emerald-400", icon: <CheckCircle2 className="h-4 w-4" /> },
          { label: "Total Requests", value: isLoading ? "—" : requests.length, color: "text-primary", icon: <Calendar className="h-4 w-4" /> },
          { label: "Rejected", value: isLoading ? "—" : requests.filter((r) => r.status === "rejected").length, color: "text-red-400", icon: <XCircle className="h-4 w-4" /> },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-black mt-0.5 ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-xl bg-muted/30 p-2.5 ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leave Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-sm font-bold">
            Leave Requests ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse divide-y divide-border/40">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-4 py-3 flex gap-4 items-center">
                  <div className="h-4 w-36 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted/60 rounded" />
                  <div className="h-5 w-16 bg-muted/50 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex justify-center">
              <EmptyState
                title="No leave requests"
                description="No leave requests match your filters."
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-2">Employee</div>
                <div className="col-span-2">Leave Type</div>
                <div className="col-span-2">Start Date</div>
                <div className="col-span-2">End Date</div>
                <div className="col-span-1">Days</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {filtered.map((req) => (
                <LeaveRow
                  key={req.id}
                  req={req}
                  onApprove={() => approveMut.mutate(req.id)}
                  onReject={() => setRejectTarget(req.id)}
                  isApprovePending={approveMut.isPending && approveMut.variables === req.id}
                  isRejectPending={rejectMut.isPending && rejectMut.variables?.id === req.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Leave Modal */}
      {requestModalOpen && (
        <RequestLeaveModal
          onClose={() => setRequestModalOpen(false)}
          onOptimisticAdd={(req) => setOptimisticRequests((prev) => [req, ...prev])}
        />
      )}

      {/* Reject Dialog */}
      <RejectDialog
        open={rejectTarget !== null}
        onConfirm={(reason) => {
          if (rejectTarget) rejectMut.mutate({ id: rejectTarget, reason });
        }}
        onCancel={() => setRejectTarget(null)}
        isPending={rejectMut.isPending}
      />
    </div>
  );
}
