import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
  LoadingSkeleton,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock3, Plus, Search, Trash2, UserRoundCog, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/hrm")({
  component: HrmPage,
});

type HrmView =
  | "directory"
  | "attendance"
  | "leave"
  | "performance"
  | "recruitment"
  | "training"
  | "payroll";

function formatDate(value: unknown): string {
  if (!value) return "-";
  const dt = new Date(String(value));
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toISOString().slice(0, 10);
}

function toIsoDateTime(date: string): string {
  const normalized = (date || "").trim();
  if (!normalized) return new Date().toISOString();
  return new Date(`${normalized}T00:00:00.000Z`).toISOString();
}

function HrmPage() {
  const [view, setView] = useState<HrmView>("directory");
  const [search, setSearch] = useState("");
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const [newEmployee, setNewEmployee] = useState({
    fullName: "",
    workEmail: "",
    department: "Engineering",
    jobTitle: "",
    managerName: "",
    location: "",
  });

  const [newRequisition, setNewRequisition] = useState({
    title: "",
    department: "Engineering",
    openings: "1",
  });
  const [newCandidate, setNewCandidate] = useState({
    requisitionId: "",
    fullName: "",
    email: "",
  });
  const [newProgram, setNewProgram] = useState({
    title: "",
    category: "General",
    durationHours: "8",
  });
  const [newTrainingRecord, setNewTrainingRecord] = useState({
    employeeId: "",
    programId: "",
    progress: "0",
  });
  const [newPayrollRun, setNewPayrollRun] = useState({
    periodLabel: "",
    payDate: "",
  });
  const [newPayrollEntry, setNewPayrollEntry] = useState({
    payrollRunId: "",
    employeeId: "",
    grossPay: "",
    deductions: "0",
  });

  const summaryQuery = useQuery({
    queryKey: ["hrm-summary"],
    queryFn: () => nucleoApi.hrm.summary(),
  });

  const employeesQuery = useQuery({
    queryKey: ["hrm-employees", search],
    queryFn: () =>
      nucleoApi.hrm.employees.list({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
      }),
  });

  const attendanceQuery = useQuery({
    queryKey: ["hrm-attendance"],
    queryFn: () => nucleoApi.hrm.attendance.list({ page: 1, limit: 100 }),
  });

  const leaveQuery = useQuery({
    queryKey: ["hrm-leave-requests"],
    queryFn: () => nucleoApi.hrm.leaveRequests.list({ page: 1, limit: 100 }),
  });

  const reviewsQuery = useQuery({
    queryKey: ["hrm-reviews"],
    queryFn: () => nucleoApi.hrm.reviews.list({ page: 1, limit: 100 }),
  });

  const requisitionsQuery = useQuery({
    queryKey: ["hrm-requisitions"],
    queryFn: () => nucleoApi.hrm.recruitment.requisitions.list({ page: 1, limit: 100 }),
  });

  const candidatesQuery = useQuery({
    queryKey: ["hrm-candidates"],
    queryFn: () => nucleoApi.hrm.recruitment.candidates.list({ page: 1, limit: 100 }),
  });

  const trainingProgramsQuery = useQuery({
    queryKey: ["hrm-training-programs"],
    queryFn: () => nucleoApi.hrm.training.programs.list({ page: 1, limit: 100 }),
  });

  const trainingRecordsQuery = useQuery({
    queryKey: ["hrm-training-records"],
    queryFn: () => nucleoApi.hrm.training.records.list({ page: 1, limit: 100 }),
  });

  const payrollRunsQuery = useQuery({
    queryKey: ["hrm-payroll-runs"],
    queryFn: () => nucleoApi.hrm.payroll.runs.list({ page: 1, limit: 100 }),
  });

  const payrollEntriesQuery = useQuery({
    queryKey: ["hrm-payroll-entries"],
    queryFn: () => nucleoApi.hrm.payroll.entries.list({ page: 1, limit: 200 }),
  });

  const createEmployee = useMutation({
    mutationFn: (payload: {
      fullName: string;
      workEmail: string;
      department: string;
      jobTitle?: string;
      managerName?: string;
      location?: string;
    }) =>
      nucleoApi.hrm.employees.create({
        ...payload,
        joinDate: new Date().toISOString(),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-employees"] }),
      ]);
      toast.success("Employee profile added");
    },
    onError: () => toast.error("Failed to add employee"),
  });

  const approveLeave = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.leaveRequests.updateStatus(id, "approved"),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-leave-requests"] }),
      ]);
      toast.success("Leave approved");
    },
  });

  const rejectLeave = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.leaveRequests.updateStatus(id, "rejected"),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-leave-requests"] }),
      ]);
      toast.success("Leave rejected");
    },
  });

  const updateEmployeeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.hrm.employees.update(id, { status }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-employees"] }),
      ]);
      toast.success("Employee updated");
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.employees.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-employees"] }),
      ]);
      toast.success("Employee removed");
    },
  });

  const completeReview = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.reviews.update(id, { status: "completed" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-reviews"] }),
      ]);
      toast.success("Review completed");
    },
  });

  const deleteReview = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.reviews.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-reviews"] }),
      ]);
      toast.success("Review deleted");
    },
  });

  const createRequisition = useMutation({
    mutationFn: (payload: { title: string; department: string; openings: number }) =>
      nucleoApi.hrm.recruitment.requisitions.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-requisitions"] }),
      ]);
      toast.success("Requisition created");
    },
  });

  const updateRequisition = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.hrm.recruitment.requisitions.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hrm-requisitions"] }),
  });

  const deleteRequisition = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.recruitment.requisitions.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hrm-requisitions"] }),
  });

  const createCandidate = useMutation({
    mutationFn: (payload: { requisitionId?: string; fullName: string; email: string }) =>
      nucleoApi.hrm.recruitment.candidates.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-candidates"] }),
      ]);
      toast.success("Candidate added");
    },
  });

  const updateCandidate = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      nucleoApi.hrm.recruitment.candidates.update(id, { stage }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hrm-candidates"] }),
  });

  const deleteCandidate = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.recruitment.candidates.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hrm-candidates"] }),
  });

  const createTrainingProgram = useMutation({
    mutationFn: (payload: { title: string; category: string; durationHours: number }) =>
      nucleoApi.hrm.training.programs.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-training-programs"] }),
      ]);
      toast.success("Training program created");
    },
  });

  const updateTrainingProgram = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.hrm.training.programs.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hrm-training-programs"] }),
  });

  const deleteTrainingProgram = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.training.programs.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hrm-training-programs"] }),
  });

  const createTrainingRecord = useMutation({
    mutationFn: (payload: { employeeId: string; programId: string; progress: number }) =>
      nucleoApi.hrm.training.records.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-training-records"] }),
      ]);
      toast.success("Training assignment created");
    },
  });

  const updateTrainingRecord = useMutation({
    mutationFn: ({ id, completionStatus, progress }: { id: string; completionStatus: string; progress?: number }) =>
      nucleoApi.hrm.training.records.update(id, { completionStatus, progress }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hrm-training-records"] }),
  });

  const deleteTrainingRecord = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.training.records.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hrm-training-records"] }),
  });

  const createPayrollRun = useMutation({
    mutationFn: (payload: { periodLabel: string; payDate: string }) =>
      nucleoApi.hrm.payroll.runs.create({
        periodLabel: payload.periodLabel,
        payDate: payload.payDate,
        status: "draft",
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-payroll-runs"] }),
      ]);
      toast.success("Payroll run created");
    },
  });

  const updatePayrollRun = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.hrm.payroll.runs.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hrm-payroll-runs"] }),
  });

  const deletePayrollRun = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.payroll.runs.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hrm-payroll-runs"] }),
  });

  const createPayrollEntry = useMutation({
    mutationFn: (payload: {
      payrollRunId: string;
      employeeId?: string;
      grossPay: number;
      deductions: number;
      netPay: number;
    }) =>
      nucleoApi.hrm.payroll.entries.create({
        ...payload,
        status: "draft",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm-payroll-entries"] });
      toast.success("Payroll entry created");
    },
  });

  const updatePayrollEntry = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      nucleoApi.hrm.payroll.entries.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hrm-payroll-entries"] }),
  });

  const deletePayrollEntry = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.payroll.entries.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hrm-payroll-entries"] }),
  });

  const employees = useMemo(() => employeesQuery.data?.data || [], [employeesQuery.data]);
  const attendance = useMemo(() => attendanceQuery.data?.data || [], [attendanceQuery.data]);
  const leaveRequests = useMemo(() => leaveQuery.data?.data || [], [leaveQuery.data]);
  const reviews = useMemo(() => reviewsQuery.data?.data || [], [reviewsQuery.data]);
  const requisitions = useMemo(() => requisitionsQuery.data?.data || [], [requisitionsQuery.data]);
  const candidates = useMemo(() => candidatesQuery.data?.data || [], [candidatesQuery.data]);
  const trainingPrograms = useMemo(() => trainingProgramsQuery.data?.data || [], [trainingProgramsQuery.data]);
  const trainingRecords = useMemo(() => trainingRecordsQuery.data?.data || [], [trainingRecordsQuery.data]);
  const payrollRuns = useMemo(() => payrollRunsQuery.data?.data || [], [payrollRunsQuery.data]);
  const payrollEntries = useMemo(() => payrollEntriesQuery.data?.data || [], [payrollEntriesQuery.data]);

  const isLoadingAny =
    summaryQuery.isLoading ||
    employeesQuery.isLoading ||
    attendanceQuery.isLoading ||
    leaveQuery.isLoading ||
    reviewsQuery.isLoading ||
    requisitionsQuery.isLoading ||
    candidatesQuery.isLoading ||
    trainingProgramsQuery.isLoading ||
    trainingRecordsQuery.isLoading ||
    payrollRunsQuery.isLoading ||
    payrollEntriesQuery.isLoading;

  const summary = summaryQuery.data || {
    headcount: employees.length,
    presentToday: attendance.filter((item: any) => item.status === "present").length,
    pendingLeave: leaveRequests.filter((item: any) => item.status === "pending").length,
    avgGoalProgress: 0,
    requisitions: requisitions.length,
    candidates: candidates.length,
    trainingPrograms: trainingPrograms.length,
    payrollRuns: payrollRuns.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">HRM</h1>
          <p className="text-muted-foreground">
            Full personnel suite: directory, attendance, leave, performance, recruitment, training, and payroll.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsEmployeeModalOpen(true)}
        >
          Add Employee
        </Button>
      </div>

      {isLoadingAny ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <LoadingSkeleton key={idx} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
          <Metric title="Headcount" value={summary.headcount || 0} />
          <Metric title="Present" value={summary.presentToday || 0} />
          <Metric title="Pending Leave" value={summary.pendingLeave || 0} />
          <Metric title="Goal Progress" value={`${summary.avgGoalProgress || 0}%`} />
          <Metric title="Reqs" value={summary.requisitions || 0} />
          <Metric title="Candidates" value={summary.candidates || 0} />
          <Metric title="Training" value={summary.trainingPrograms || 0} />
          <Metric title="Payroll Runs" value={summary.payrollRuns || 0} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {([
          ["directory", "Directory"],
          ["attendance", "Attendance"],
          ["leave", "Leave"],
          ["performance", "Performance"],
          ["recruitment", "Recruitment"],
          ["training", "Training"],
          ["payroll", "Payroll"],
        ] as const).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={view === key ? "primary" : "outline"}
            onClick={() => setView(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {view === "directory" ? (
        <>
          <div className="relative w-full max-w-sm">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees"
            />
          </div>

          {employees.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No employees found"
              description="Add personnel records to build your HR directory."
              action={{ label: "Add Employee", onClick: () => setIsEmployeeModalOpen(true) }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {employees.map((employee: any) => (
                <Card key={employee.id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{employee.fullName}</p>
                        <p className="text-muted-foreground text-sm">{employee.jobTitle || "Team Member"}</p>
                        <p className="text-muted-foreground text-sm">
                          {employee.department} | {employee.location || "Remote"}
                        </p>
                      </div>
                      <Badge variant={employee.status === "active" ? "success" : "outline"}>
                        {employee.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {employee.workEmail} | Manager: {employee.managerName || "-"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <select
                        className="flex h-8 rounded border border-border bg-card px-2 text-xs"
                        value={employee.status || "active"}
                        onChange={(e) =>
                          updateEmployeeStatus.mutate({ id: employee.id, status: e.target.value })
                        }
                      >
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                        <option value="on_leave">on_leave</option>
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => deleteEmployee.mutate(employee.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : null}

      {view === "attendance" ? (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Ledger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attendance.map((item: any) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium text-foreground">{item.employee || "Unknown"}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(item.date)} | {Number(item.hours || 0)}h logged
                  </p>
                </div>
                <Badge variant={item.status === "present" ? "success" : item.status === "late" ? "warning" : "outline"}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {view === "leave" ? (
        <Card>
          <CardHeader>
            <CardTitle>Leave Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaveRequests.map((request: any) => (
              <div key={request.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{request.employee || "Unknown"}</p>
                    <p className="text-muted-foreground text-sm">
                      {request.leaveType} leave | {formatDate(request.startDate)} to {formatDate(request.endDate)}
                    </p>
                    <p className="text-muted-foreground text-xs">{request.reason || "No reason provided"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={request.status === "approved" ? "success" : request.status === "pending" ? "warning" : "outline"}>
                      {request.status}
                    </Badge>
                    {request.status === "pending" ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => approveLeave.mutate(request.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectLeave.mutate(request.id)}>
                          Reject
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {view === "performance" ? (
        <Card>
          <CardHeader>
            <CardTitle>Performance Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.map((review: any) => (
              <div key={review.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{review.employee || "Unknown"}</p>
                    <p className="text-muted-foreground text-sm">
                      Cycle: {review.reviewCycle} | Rating: {review.rating}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Goals progress: {Number(review.goalsProgress || 0)}%
                    </p>
                  </div>
                  <Badge variant={review.status === "in_review" ? "warning" : "outline"}>
                    {review.status}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {review.status !== "completed" ? (
                    <Button size="sm" variant="outline" onClick={() => completeReview.mutate(review.id)}>
                      Mark Completed
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => deleteReview.mutate(review.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {view === "recruitment" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Job Requisitions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <Input
                  placeholder="Role title"
                  value={newRequisition.title}
                  onChange={(e) => setNewRequisition((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  placeholder="Department"
                  value={newRequisition.department}
                  onChange={(e) => setNewRequisition((prev) => ({ ...prev, department: e.target.value }))}
                />
                <Input
                  type="number"
                  min="1"
                  placeholder="Openings"
                  value={newRequisition.openings}
                  onChange={(e) => setNewRequisition((prev) => ({ ...prev, openings: e.target.value }))}
                />
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  if (!newRequisition.title.trim()) {
                    toast.error("Requisition title is required");
                    return;
                  }
                  createRequisition.mutate(
                    {
                      title: newRequisition.title.trim(),
                      department: newRequisition.department || "General",
                      openings: Math.max(1, Number(newRequisition.openings || 1)),
                    },
                    {
                      onSuccess: () =>
                        setNewRequisition({ title: "", department: "Engineering", openings: "1" }),
                    },
                  );
                }}
              >
                Create Requisition
              </Button>

              {requisitions.map((req: any) => (
                <div key={req.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{req.title}</p>
                      <p className="text-muted-foreground text-xs">{req.department} | openings: {req.openings}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteRequisition.mutate(req.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <select
                    className="mt-2 flex h-8 rounded border border-border bg-card px-2 text-xs"
                    value={req.status || "open"}
                    onChange={(e) => updateRequisition.mutate({ id: req.id, status: e.target.value })}
                  >
                    <option value="open">open</option>
                    <option value="on_hold">on_hold</option>
                    <option value="closed">closed</option>
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidate Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Input
                  placeholder="Candidate name"
                  value={newCandidate.fullName}
                  onChange={(e) => setNewCandidate((prev) => ({ ...prev, fullName: e.target.value }))}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate((prev) => ({ ...prev, email: e.target.value }))}
                />
                <select
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  value={newCandidate.requisitionId}
                  onChange={(e) => setNewCandidate((prev) => ({ ...prev, requisitionId: e.target.value }))}
                >
                  <option value="">Assign requisition (optional)</option>
                  {requisitions.map((req: any) => (
                    <option key={req.id} value={req.id}>{req.title}</option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!newCandidate.fullName.trim() || !newCandidate.email.trim()) {
                      toast.error("Candidate name and email are required");
                      return;
                    }
                    createCandidate.mutate(
                      {
                        requisitionId: newCandidate.requisitionId || undefined,
                        fullName: newCandidate.fullName.trim(),
                        email: newCandidate.email.trim(),
                      },
                      {
                        onSuccess: () =>
                          setNewCandidate({ requisitionId: "", fullName: "", email: "" }),
                      },
                    );
                  }}
                >
                  Add Candidate
                </Button>
              </div>

              {candidates.map((candidate: any) => (
                <div key={candidate.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{candidate.fullName}</p>
                      <p className="text-muted-foreground text-xs">{candidate.email}</p>
                      <p className="text-muted-foreground text-xs">{candidate.requisitionTitle || "Unassigned"}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteCandidate.mutate(candidate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <select
                    className="mt-2 flex h-8 rounded border border-border bg-card px-2 text-xs"
                    value={candidate.stage || "sourced"}
                    onChange={(e) => updateCandidate.mutate({ id: candidate.id, stage: e.target.value })}
                  >
                    <option value="sourced">sourced</option>
                    <option value="screening">screening</option>
                    <option value="interview">interview</option>
                    <option value="offer">offer</option>
                    <option value="hired">hired</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {view === "training" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Programs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <Input
                  placeholder="Program title"
                  value={newProgram.title}
                  onChange={(e) => setNewProgram((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  placeholder="Category"
                  value={newProgram.category}
                  onChange={(e) => setNewProgram((prev) => ({ ...prev, category: e.target.value }))}
                />
                <Input
                  type="number"
                  min="1"
                  placeholder="Duration hrs"
                  value={newProgram.durationHours}
                  onChange={(e) => setNewProgram((prev) => ({ ...prev, durationHours: e.target.value }))}
                />
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  if (!newProgram.title.trim()) {
                    toast.error("Program title is required");
                    return;
                  }
                  createTrainingProgram.mutate(
                    {
                      title: newProgram.title.trim(),
                      category: newProgram.category || "General",
                      durationHours: Math.max(1, Number(newProgram.durationHours || 1)),
                    },
                    {
                      onSuccess: () =>
                        setNewProgram({ title: "", category: "General", durationHours: "8" }),
                    },
                  );
                }}
              >
                Create Program
              </Button>

              {trainingPrograms.map((program: any) => (
                <div key={program.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{program.title}</p>
                      <p className="text-muted-foreground text-xs">{program.category} | {program.durationHours}h</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteTrainingProgram.mutate(program.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <select
                    className="mt-2 flex h-8 rounded border border-border bg-card px-2 text-xs"
                    value={program.status || "active"}
                    onChange={(e) => updateTrainingProgram.mutate({ id: program.id, status: e.target.value })}
                  >
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="completed">completed</option>
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employee Training Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <select
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  value={newTrainingRecord.employeeId}
                  onChange={(e) => setNewTrainingRecord((prev) => ({ ...prev, employeeId: e.target.value }))}
                >
                  <option value="">Select employee</option>
                  {employees.map((employee: any) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </select>
                <select
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  value={newTrainingRecord.programId}
                  onChange={(e) => setNewTrainingRecord((prev) => ({ ...prev, programId: e.target.value }))}
                >
                  <option value="">Select program</option>
                  {trainingPrograms.map((program: any) => (
                    <option key={program.id} value={program.id}>{program.title}</option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Progress %"
                  value={newTrainingRecord.progress}
                  onChange={(e) => setNewTrainingRecord((prev) => ({ ...prev, progress: e.target.value }))}
                />
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!newTrainingRecord.employeeId || !newTrainingRecord.programId) {
                      toast.error("Employee and program are required");
                      return;
                    }
                    createTrainingRecord.mutate(
                      {
                        employeeId: newTrainingRecord.employeeId,
                        programId: newTrainingRecord.programId,
                        progress: Math.max(0, Math.min(100, Number(newTrainingRecord.progress || 0))),
                      },
                      {
                        onSuccess: () =>
                          setNewTrainingRecord({ employeeId: "", programId: "", progress: "0" }),
                      },
                    );
                  }}
                >
                  Assign Program
                </Button>
              </div>

              {trainingRecords.map((record: any) => (
                <div key={record.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{record.employee || "Unknown"}</p>
                      <p className="text-muted-foreground text-xs">{record.program || "Program"} | {record.progress}%</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteTrainingRecord.mutate(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <select
                    className="mt-2 flex h-8 rounded border border-border bg-card px-2 text-xs"
                    value={record.completionStatus || "assigned"}
                    onChange={(e) =>
                      updateTrainingRecord.mutate({
                        id: record.id,
                        completionStatus: e.target.value,
                        progress: e.target.value === "completed" ? 100 : Number(record.progress || 0),
                      })
                    }
                  >
                    <option value="assigned">assigned</option>
                    <option value="in_progress">in_progress</option>
                    <option value="completed">completed</option>
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {view === "payroll" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Runs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Input
                  placeholder="Period label (e.g. Mar 2026)"
                  value={newPayrollRun.periodLabel}
                  onChange={(e) => setNewPayrollRun((prev) => ({ ...prev, periodLabel: e.target.value }))}
                />
                <Input
                  type="date"
                  value={newPayrollRun.payDate}
                  onChange={(e) => setNewPayrollRun((prev) => ({ ...prev, payDate: e.target.value }))}
                />
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  if (!newPayrollRun.periodLabel.trim() || !newPayrollRun.payDate) {
                    toast.error("Period label and pay date are required");
                    return;
                  }
                  createPayrollRun.mutate(
                    {
                      periodLabel: newPayrollRun.periodLabel.trim(),
                      payDate: toIsoDateTime(newPayrollRun.payDate),
                    },
                    {
                      onSuccess: () => setNewPayrollRun({ periodLabel: "", payDate: "" }),
                    },
                  );
                }}
              >
                Create Payroll Run
              </Button>

              {payrollRuns.map((run: any) => (
                <div key={run.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{run.periodLabel}</p>
                      <p className="text-muted-foreground text-xs">Pay date: {formatDate(run.payDate)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deletePayrollRun.mutate(run.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <select
                    className="mt-2 flex h-8 rounded border border-border bg-card px-2 text-xs"
                    value={run.status || "draft"}
                    onChange={(e) => updatePayrollRun.mutate({ id: run.id, status: e.target.value })}
                  >
                    <option value="draft">draft</option>
                    <option value="approved">approved</option>
                    <option value="paid">paid</option>
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payroll Entries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <select
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  value={newPayrollEntry.payrollRunId}
                  onChange={(e) => setNewPayrollEntry((prev) => ({ ...prev, payrollRunId: e.target.value }))}
                >
                  <option value="">Select payroll run</option>
                  {payrollRuns.map((run: any) => (
                    <option key={run.id} value={run.id}>{run.periodLabel}</option>
                  ))}
                </select>
                <select
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  value={newPayrollEntry.employeeId}
                  onChange={(e) => setNewPayrollEntry((prev) => ({ ...prev, employeeId: e.target.value }))}
                >
                  <option value="">Select employee</option>
                  {employees.map((employee: any) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </select>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Gross pay"
                    value={newPayrollEntry.grossPay}
                    onChange={(e) => setNewPayrollEntry((prev) => ({ ...prev, grossPay: e.target.value }))}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Deductions"
                    value={newPayrollEntry.deductions}
                    onChange={(e) => setNewPayrollEntry((prev) => ({ ...prev, deductions: e.target.value }))}
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    const gross = Number(newPayrollEntry.grossPay || 0);
                    const deductions = Number(newPayrollEntry.deductions || 0);
                    if (!newPayrollEntry.payrollRunId || !Number.isFinite(gross) || gross <= 0) {
                      toast.error("Payroll run and gross pay are required");
                      return;
                    }
                    const net = Math.max(0, gross - deductions);
                    createPayrollEntry.mutate(
                      {
                        payrollRunId: newPayrollEntry.payrollRunId,
                        employeeId: newPayrollEntry.employeeId || undefined,
                        grossPay: gross,
                        deductions,
                        netPay: net,
                      },
                      {
                        onSuccess: () =>
                          setNewPayrollEntry({ payrollRunId: "", employeeId: "", grossPay: "", deductions: "0" }),
                      },
                    );
                  }}
                >
                  Add Entry
                </Button>
              </div>

              {payrollEntries.map((entry: any) => (
                <div key={entry.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{entry.employeeName || "Unassigned"}</p>
                      <p className="text-muted-foreground text-xs">
                        Gross {Number(entry.grossPay || 0).toLocaleString()} | Net {Number(entry.netPay || 0).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deletePayrollEntry.mutate(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <select
                    className="mt-2 flex h-8 rounded border border-border bg-card px-2 text-xs"
                    value={entry.status || "draft"}
                    onChange={(e) => updatePayrollEntry.mutate({ id: entry.id, status: e.target.value })}
                  >
                    <option value="draft">draft</option>
                    <option value="approved">approved</option>
                    <option value="paid">paid</option>
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <FormModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title="Add Employee"
        submitText="Create Employee"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newEmployee.fullName.trim() || !newEmployee.workEmail.trim()) {
            toast.error("Name and email are required");
            return;
          }

          createEmployee.mutate(
            {
              fullName: newEmployee.fullName.trim(),
              workEmail: newEmployee.workEmail.trim(),
              department: newEmployee.department,
              jobTitle: newEmployee.jobTitle.trim() || undefined,
              managerName: newEmployee.managerName.trim() || undefined,
              location: newEmployee.location.trim() || undefined,
            },
            {
              onSuccess: () => {
                setNewEmployee({
                  fullName: "",
                  workEmail: "",
                  department: "Engineering",
                  jobTitle: "",
                  managerName: "",
                  location: "",
                });
                setIsEmployeeModalOpen(false);
              },
            },
          );
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Full Name" required>
            <Input value={newEmployee.fullName} onChange={(e) => setNewEmployee((prev) => ({ ...prev, fullName: e.target.value }))} />
          </FormField>
          <FormField label="Work Email" required>
            <Input type="email" value={newEmployee.workEmail} onChange={(e) => setNewEmployee((prev) => ({ ...prev, workEmail: e.target.value }))} />
          </FormField>
          <FormField label="Department">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newEmployee.department}
              onChange={(e) => setNewEmployee((prev) => ({ ...prev, department: e.target.value }))}
            >
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
            </select>
          </FormField>
          <FormField label="Role">
            <Input value={newEmployee.jobTitle} onChange={(e) => setNewEmployee((prev) => ({ ...prev, jobTitle: e.target.value }))} />
          </FormField>
          <FormField label="Manager">
            <Input value={newEmployee.managerName} onChange={(e) => setNewEmployee((prev) => ({ ...prev, managerName: e.target.value }))} />
          </FormField>
          <FormField label="Location">
            <Input value={newEmployee.location} onChange={(e) => setNewEmployee((prev) => ({ ...prev, location: e.target.value }))} />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs">{title}</p>
            <p className="font-bold text-xl text-foreground">{value}</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            {title.includes("Headcount") ? (
              <Users className="h-4 w-4 text-primary" />
            ) : title.includes("Present") ? (
              <Clock3 className="h-4 w-4 text-success" />
            ) : title.includes("Leave") ? (
              <CalendarDays className="h-4 w-4 text-warning" />
            ) : (
              <UserRoundCog className="h-4 w-4 text-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
