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
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  Brain,
  Briefcase,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  Heart,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { toast } from "sonner";
import { z } from "zod";
import { CsvImportModal } from "../components/CsvImportModal";
import { nucleoApi } from "@/lib/api";

export const Route = createFileRoute("/app/hrm")({
  validateSearch: z.object({
    view: z
      .enum([
        "directory",
        "attendance",
        "leave",
        "performance",
        "recruitment",
        "training",
        "payroll",
      ])
      .optional(),
  }),
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
  const location = useLocation();
  if (location.pathname !== "/app/hrm") return <Outlet />;
  const { view: viewParam } = Route.useSearch();
  const [view, setView] = useState<HrmView>(viewParam ?? "directory");
  const [search, setSearch] = useState("");
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const onCsvImport = async (data: any) => {
    await createCandidate.mutateAsync({
      fullName: data.fullName,
      email: data.email,
    });
  };

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
    queryFn: () =>
      nucleoApi.hrm.recruitment.requisitions.list({ page: 1, limit: 100 }),
  });

  const candidatesQuery = useQuery({
    queryKey: ["hrm-candidates"],
    queryFn: () =>
      nucleoApi.hrm.recruitment.candidates.list({ page: 1, limit: 100 }),
  });

  const trainingProgramsQuery = useQuery({
    queryKey: ["hrm-training-programs"],
    queryFn: () =>
      nucleoApi.hrm.training.programs.list({ page: 1, limit: 100 }),
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
    mutationFn: (id: string) =>
      nucleoApi.hrm.leaveRequests.updateStatus(id, "approved"),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-leave-requests"] }),
      ]);
      toast.success("Leave approved");
    },
  });

  const rejectLeave = useMutation({
    mutationFn: (id: string) =>
      nucleoApi.hrm.leaveRequests.updateStatus(id, "rejected"),
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
    mutationFn: (id: string) =>
      nucleoApi.hrm.reviews.update(id, { status: "completed" }),
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
    mutationFn: (payload: {
      title: string;
      department: string;
      openings: number;
    }) => nucleoApi.hrm.recruitment.requisitions.create(payload),
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hrm-requisitions"] }),
  });

  const deleteRequisition = useMutation({
    mutationFn: (id: string) =>
      nucleoApi.hrm.recruitment.requisitions.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hrm-requisitions"] }),
  });

  const createCandidate = useMutation({
    mutationFn: (payload: {
      requisitionId?: string;
      fullName: string;
      email: string;
    }) => nucleoApi.hrm.recruitment.candidates.create(payload),
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hrm-candidates"] }),
  });

  const deleteCandidate = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.recruitment.candidates.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hrm-candidates"] }),
  });

  const createTrainingProgram = useMutation({
    mutationFn: (payload: {
      title: string;
      category: string;
      durationHours: number;
    }) => nucleoApi.hrm.training.programs.create(payload),
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hrm-training-programs"] }),
  });

  const deleteTrainingProgram = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.training.programs.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hrm-training-programs"] }),
  });

  const createTrainingRecord = useMutation({
    mutationFn: (payload: {
      employeeId: string;
      programId: string;
      progress: number;
    }) => nucleoApi.hrm.training.records.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hrm-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["hrm-training-records"] }),
      ]);
      toast.success("Training assignment created");
    },
  });

  const updateTrainingRecord = useMutation({
    mutationFn: ({
      id,
      completionStatus,
      progress,
    }: { id: string; completionStatus: string; progress?: number }) =>
      nucleoApi.hrm.training.records.update(id, { completionStatus, progress }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hrm-training-records"] }),
  });

  const deleteTrainingRecord = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.training.records.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hrm-training-records"] }),
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hrm-payroll-runs"] }),
  });

  const deletePayrollRun = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.payroll.runs.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hrm-payroll-runs"] }),
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hrm-payroll-entries"] }),
  });

  const deletePayrollEntry = useMutation({
    mutationFn: (id: string) => nucleoApi.hrm.payroll.entries.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["hrm-payroll-entries"] }),
  });

  const employees = useMemo(
    () => employeesQuery.data?.data || [],
    [employeesQuery.data],
  );
  const attendance = useMemo(
    () => attendanceQuery.data?.data || [],
    [attendanceQuery.data],
  );
  const leaveRequests = useMemo(
    () => leaveQuery.data?.data || [],
    [leaveQuery.data],
  );
  const reviews = useMemo(
    () => reviewsQuery.data?.data || [],
    [reviewsQuery.data],
  );
  const requisitions = useMemo(
    () => requisitionsQuery.data?.data || [],
    [requisitionsQuery.data],
  );
  const candidates = useMemo(
    () => candidatesQuery.data?.data || [],
    [candidatesQuery.data],
  );
  const trainingPrograms = useMemo(
    () => trainingProgramsQuery.data?.data || [],
    [trainingProgramsQuery.data],
  );
  const trainingRecords = useMemo(
    () => trainingRecordsQuery.data?.data || [],
    [trainingRecordsQuery.data],
  );
  const payrollRuns = useMemo(
    () => payrollRunsQuery.data?.data || [],
    [payrollRunsQuery.data],
  );
  const payrollEntries = useMemo(
    () => payrollEntriesQuery.data?.data || [],
    [payrollEntriesQuery.data],
  );

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
    presentToday: attendance.filter((item: any) => item.status === "present")
      .length,
    pendingLeave: leaveRequests.filter((item: any) => item.status === "pending")
      .length,
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
            Full personnel suite: directory, attendance, leave, performance,
            recruitment, training, and payroll.
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Metric
              title="Headcount"
              value={summary.headcount || 0}
              icon={<Users className="h-4 w-4" />}
              trend="Current Staff"
              color="text-primary"
            />
            <Metric
              title="Presence"
              value={summary.presentToday || 0}
              icon={<CalendarDays className="h-4 w-4" />}
              trend="Active today"
              color="text-emerald-400"
            />
            <Metric
              title="Pending Leave"
              value={summary.pendingLeave || 0}
              icon={<Clock3 className="h-4 w-4" />}
              trend="Awaiting review"
              color="text-amber-400"
            />
            <Metric
              title="Succession"
              value="84%"
              icon={<TrendingUp className="h-4 w-4" />}
              trend="Growth index"
              color="text-violet-400"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Metric
              title="Openings"
              value={summary.requisitions || 0}
              icon={<Briefcase className="h-4 w-4" />}
              trend="Talent pipe"
              color="text-sky-400"
            />
            <Metric
              title="Candidates"
              value={summary.candidates || 0}
              icon={<Users className="h-4 w-4" />}
              trend="In pipeline"
              color="text-cyan-400"
            />
            <Metric
              title="Training"
              value={summary.trainingPrograms || 0}
              icon={<GraduationCap className="h-4 w-4" />}
              trend="Live programs"
              color="text-indigo-400"
            />
            <Metric
              title="Health Score"
              value="92"
              icon={<Heart className="h-4 w-4" />}
              trend="Wellness rating"
              color="text-rose-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Brain className="h-4 w-4" /> AI Workforce Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">
                        Churn Risk Analysis
                      </p>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs">Engineering</span>
                        <span className="text-xs font-bold text-success">
                          Low (2.4%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full">
                        <div
                          className="h-full bg-success rounded-full"
                          style={{ width: "2.4%" }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-3 mb-1">
                        <span className="text-xs">Sales</span>
                        <span className="text-xs font-bold text-warning">
                          Medium (12.8%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full">
                        <div
                          className="h-full bg-warning rounded-full"
                          style={{ width: "12.8%" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-card border border-border h-full">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">
                        Departmental Sentiment
                      </p>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: "Eng", val: 88, color: "#3b82f6" },
                              { name: "Sales", val: 74, color: "#eab308" },
                              { name: "Ops", val: 92, color: "#22c55e" },
                              { name: "HR", val: 81, color: "#a855f7" },
                            ]}
                          >
                            <XAxis
                              dataKey="name"
                              fontSize={10}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              cursor={{ fill: "transparent" }}
                              contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              }}
                            />
                            <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                              {[0, 1, 2, 3].map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    [
                                      "#3b82f6",
                                      "#eab308",
                                      "#22c55e",
                                      "#a855f7",
                                    ][index]
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4" /> System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-2 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-warning">
                      Compliance Warning
                    </p>
                    <p className="text-[10px] text-warning/80">
                      3 employee contracts are expiring next week.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Briefcase className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-primary">
                      New Hire Onboarding
                    </p>
                    <p className="text-[10px] text-primary/80">
                      4 candidates accepted offers today.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["directory", "Directory"],
            ["attendance", "Attendance"],
            ["leave", "Leave"],
            ["performance", "Performance"],
            ["recruitment", "Recruitment"],
            ["training", "Training"],
            ["payroll", "Payroll"],
          ] as const
        ).map(([key, label]) => (
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
              action={
                <Button onClick={() => setIsEmployeeModalOpen(true)}>
                  Add Employee
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {employees.map((employee: any) => (
                <Card key={employee.id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {employee.fullName}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {employee.jobTitle || "Team Member"}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {employee.department} |{" "}
                          {employee.location || "Remote"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          employee.status === "active" ? "success" : "outline"
                        }
                      >
                        {employee.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {employee.workEmail} | Manager:{" "}
                      {employee.managerName || "-"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <select
                        className="flex h-8 rounded border border-border bg-card px-2 text-xs"
                        value={employee.status || "active"}
                        onChange={(e) =>
                          updateEmployeeStatus.mutate({
                            id: employee.id,
                            status: e.target.value,
                          })
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">
                    Daily Presence Matrix
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                    Last 14 Days Tracking
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] h-5">
                  Rolling Window
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[500px]">
                    <div className="flex gap-1 mb-2">
                      <div className="w-32 shrink-0" />
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 text-center text-[9px] font-black text-muted-foreground/40"
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    {employees.slice(0, 8).map((e: any) => (
                      <div key={e.id} className="flex gap-1 mb-1 group">
                        <div className="w-32 shrink-0 text-xs truncate font-semibold flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-success" />{" "}
                          {e.fullName}
                        </div>
                        {Array.from({ length: 14 }).map((_, i) => {
                          const status =
                            i === 4 || i === 11
                              ? "late"
                              : Math.random() > 0.9
                                ? "absent"
                                : "present";
                          return (
                            <div
                              key={i}
                              className={`flex-1 h-5 rounded border border-border/50 transition-all hover:scale-110 cursor-pointer ${
                                status === "present"
                                  ? "bg-success/20 border-success/20"
                                  : status === "late"
                                    ? "bg-warning/20 border-warning/20"
                                    : "bg-destructive/10 border-destructive/20"
                              }`}
                              title={status}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-6 text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-32">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-success/20" /> Present
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-warning/20" /> Late /
                    Partial
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-destructive/10" />{" "}
                    Absent
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-sm font-bold">
                  Attendance Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Overall Punctuality
                    </span>
                    <span className="font-bold text-success">94.2%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full">
                    <div
                      className="h-full bg-success rounded-full"
                      style={{ width: "94.2%" }}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">
                      Weekly Summary
                    </p>
                    <div className="grid grid-cols-5 gap-1 pt-1">
                      {["M", "T", "W", "T", "F"].map((d, i) => (
                        <div key={d + i} className="text-center space-y-1">
                          <div
                            className={`h-8 rounded-sm ${i === 4 ? "bg-warning/20" : "bg-primary/20"}`}
                          />
                          <span className="text-[9px] font-bold text-muted-foreground">
                            {d}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-tighter">
                  Recent Logs
                </CardTitle>
                <Button size="sm" variant="ghost" className="text-[10px] h-7">
                  View Full Ledger
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 pt-4">
              {attendance.slice(0, 5).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/10 transition-colors border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${item.status === "present" ? "bg-success" : "bg-warning"}`}
                    />
                    <div>
                      <p className="text-xs font-bold leading-none">
                        {item.employee || "Unknown"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDate(item.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">
                      {Number(item.hours || 0)}h
                    </p>
                    <Badge
                      className="text-[8px] h-4 py-0"
                      variant={
                        item.status === "present" ? "success" : "outline"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {view === "leave" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">
                  Leave Approval Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {leaveRequests.filter((r: any) => r.status === "pending")
                  .length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-10 w-10 text-success/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No pending leave requests
                    </p>
                  </div>
                ) : (
                  leaveRequests
                    .filter((r: any) => r.status === "pending")
                    .map((request: any) => (
                      <div
                        key={request.id}
                        className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all group"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {request.employee?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">
                                {request.employee || "Unknown"}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {request.leaveType} ·{" "}
                                {formatDate(request.startDate)} to{" "}
                                {formatDate(request.endDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success hover:bg-success/10 border-success/20"
                              onClick={() => approveLeave.mutate(request.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10 border-destructive/20"
                              onClick={() => rejectLeave.mutate(request.id)}
                            >
                              Reject
                            </Button>
                          </div>
                          <Badge variant="warning">pending</Badge>
                        </div>
                        <div className="mt-3 p-2 bg-muted/30 rounded text-xs italic text-muted-foreground">
                          "{request.reason || "No reason provided"}"
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
                  History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leaveRequests
                  .filter((r: any) => r.status !== "pending")
                  .slice(0, 5)
                  .map((request: any) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-2 border-b border-border/50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {request.employee}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {request.leaveType}
                        </span>
                      </div>
                      <Badge
                        variant={
                          request.status === "approved" ? "success" : "outline"
                        }
                        className="text-[9px]"
                      >
                        {request.status}
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-sm font-bold">
                Leave Policy Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Annual Leave Utilized
                  </span>
                  <span className="font-bold text-primary">72%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: "72%" }}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                  Upcoming Absences
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-sm bg-muted flex flex-col items-center justify-center text-[10px]">
                      <span className="font-bold">24</span>
                      <span className="text-[8px]">DEC</span>
                    </div>
                    <p className="text-xs">Company Holiday (Christmas)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {view === "performance" ? (
        <Card>
          <CardHeader>
            <CardTitle>Performance Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.map((review: any) => (
              <div
                key={review.id}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {review.employee || "Unknown"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Cycle: {review.reviewCycle} | Rating: {review.rating}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Goals progress: {Number(review.goalsProgress || 0)}%
                    </p>
                  </div>
                  <Badge
                    variant={
                      review.status === "in_review" ? "warning" : "outline"
                    }
                  >
                    {review.status}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {review.status !== "completed" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => completeReview.mutate(review.id)}
                    >
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Sourcing",
                count: 24,
                progress: 100,
                color: "bg-primary",
              },
              {
                label: "Interview",
                count: 8,
                progress: 65,
                color: "bg-warning",
              },
              { label: "Offer", count: 3, progress: 30, color: "bg-success" },
              {
                label: "Hired",
                count: 12,
                progress: 15,
                color: "bg-muted-foreground",
              },
            ].map((step, i) => (
              <Card key={step.label} className="relative overflow-hidden">
                <CardContent className="p-4 pt-6 text-center">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    {step.label}
                  </p>
                  <p className="text-2xl font-black">{step.count}</p>
                  <div className="absolute bottom-0 left-0 h-1 bg-muted w-full">
                    <div
                      className={`h-full ${step.color}`}
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                  {i < 3 && (
                    <div className="absolute top-1/2 -right-2 -translate-y-1/2 z-10 text-muted-foreground/30">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold">
                  Active Requisitions
                </CardTitle>
                <Badge variant="outline">{requisitions.length} Open</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <Input
                    placeholder="Role title"
                    className="h-8 text-xs"
                    value={newRequisition.title}
                    onChange={(e) =>
                      setNewRequisition((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Department"
                    className="h-8 text-xs"
                    value={newRequisition.department}
                    onChange={(e) =>
                      setNewRequisition((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (!newRequisition.title.trim()) {
                        toast.error("Requisition title is required");
                        return;
                      }
                      createRequisition.mutate(
                        {
                          title: newRequisition.title.trim(),
                          department: newRequisition.department || "General",
                          openings: 1,
                        },
                        {
                          onSuccess: () =>
                            setNewRequisition({
                              title: "",
                              department: "Engineering",
                              openings: "1",
                            }),
                        },
                      );
                    }}
                  >
                    Post Job
                  </Button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {requisitions.map((req: any) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-border bg-muted/10 p-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-sm text-foreground">
                            {req.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className="text-[9px] h-4 py-0"
                              variant="outline"
                            >
                              {req.department}
                            </Badge>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">
                              1 Opening
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <select
                            className="h-6 rounded border border-border bg-card px-1 text-[10px]"
                            value={req.status || "open"}
                            onChange={(e) =>
                              updateRequisition.mutate({
                                id: req.id,
                                status: e.target.value,
                              })
                            }
                          >
                            <option value="open">open</option>
                            <option value="on_hold">hold</option>
                            <option value="closed">closed</option>
                          </select>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteRequisition.mutate(req.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold">
                  Candidate Sourcing
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px]"
                  leftIcon={<Plus className="h-3 w-3" />}
                  onClick={() => setIsImportModalOpen(true)}
                >
                  Import CSV
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Input
                    placeholder="Candidate name"
                    className="h-8 text-xs"
                    value={newCandidate.fullName}
                    onChange={(e) =>
                      setNewCandidate((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Email"
                      type="email"
                      className="h-8 text-xs flex-1"
                      value={newCandidate.email}
                      onChange={(e) =>
                        setNewCandidate((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        if (
                          !newCandidate.fullName.trim() ||
                          !newCandidate.email.trim()
                        ) {
                          toast.error("Required fields");
                          return;
                        }
                        createCandidate.mutate(
                          {
                            fullName: newCandidate.fullName.trim(),
                            email: newCandidate.email.trim(),
                          },
                          {
                            onSuccess: () =>
                              setNewCandidate({
                                requisitionId: "",
                                fullName: "",
                                email: "",
                              }),
                          },
                        );
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {candidates.map((candidate: any) => (
                    <div
                      key={candidate.id}
                      className="rounded-xl border border-border p-3 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                          {candidate.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-xs">
                            {candidate.fullName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {candidate.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] h-5">
                          {candidate.stage || "Sourced"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteCandidate.mutate(candidate.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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
                  className="h-8 text-xs"
                  placeholder="Program title"
                  value={newProgram.title}
                  onChange={(e) =>
                    setNewProgram((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
                <Input
                  className="h-8 text-xs"
                  placeholder="Category"
                  value={newProgram.category}
                  onChange={(e) =>
                    setNewProgram((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!newProgram.title.trim()) {
                      toast.error("Program title is required");
                      return;
                    }
                    createTrainingProgram.mutate(
                      {
                        title: newProgram.title.trim(),
                        category: newProgram.category || "General",
                        durationHours: 8,
                      },
                      {
                        onSuccess: () =>
                          setNewProgram({
                            title: "",
                            category: "General",
                            durationHours: "8",
                          }),
                      },
                    );
                  }}
                >
                  Create
                </Button>
              </div>

              <div className="space-y-2">
                {trainingPrograms.map((program: any) => (
                  <div
                    key={program.id}
                    className="rounded-xl border border-border p-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-sm text-foreground">
                          {program.title}
                        </p>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">
                          {program.category} · {program.durationHours}h
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteTrainingProgram.mutate(program.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employee Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <select
                  className="w-full h-8 rounded border border-border bg-card px-2 text-xs"
                  value={newTrainingRecord.employeeId}
                  onChange={(e) =>
                    setNewTrainingRecord((prev) => ({
                      ...prev,
                      employeeId: e.target.value,
                    }))
                  }
                >
                  <option value="">Assign Employee</option>
                  {employees.map((employee: any) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    className="flex-1 h-8 rounded border border-border bg-card px-2 text-xs"
                    value={newTrainingRecord.programId}
                    onChange={(e) =>
                      setNewTrainingRecord((prev) => ({
                        ...prev,
                        programId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Program</option>
                    {trainingPrograms.map((program: any) => (
                      <option key={program.id} value={program.id}>
                        {program.title}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (
                        !newTrainingRecord.employeeId ||
                        !newTrainingRecord.programId
                      ) {
                        toast.error("Required fields missing");
                        return;
                      }
                      createTrainingRecord.mutate(
                        {
                          employeeId: newTrainingRecord.employeeId,
                          programId: newTrainingRecord.programId,
                          progress: 0,
                        },
                        {
                          onSuccess: () =>
                            setNewTrainingRecord({
                              employeeId: "",
                              programId: "",
                              progress: "0",
                            }),
                        },
                      );
                    }}
                  >
                    Assign
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {trainingRecords.map((record: any) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-border p-3"
                  >
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div>
                        <p className="font-bold text-xs">{record.employee}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {record.program}
                        </p>
                      </div>
                      <Badge
                        variant={
                          record.completionStatus === "completed"
                            ? "success"
                            : "outline"
                        }
                        className="text-[9px]"
                      >
                        {record.completionStatus}
                      </Badge>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${record.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {view === "payroll" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payroll Runs</CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px]"
                leftIcon={<Plus className="h-3 w-3" />}
              >
                New Period
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Input
                  className="h-8 text-xs"
                  placeholder="Period (e.g. Mar 2026)"
                  value={newPayrollRun.periodLabel}
                  onChange={(e) =>
                    setNewPayrollRun((prev) => ({
                      ...prev,
                      periodLabel: e.target.value,
                    }))
                  }
                />
                <Input
                  className="h-8 text-xs"
                  type="date"
                  value={newPayrollRun.payDate}
                  onChange={(e) =>
                    setNewPayrollRun((prev) => ({
                      ...prev,
                      payDate: e.target.value,
                    }))
                  }
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (!newPayrollRun.periodLabel || !newPayrollRun.payDate) {
                    toast.error("Missing fields");
                    return;
                  }
                  createPayrollRun.mutate(
                    {
                      periodLabel: newPayrollRun.periodLabel,
                      payDate: toIsoDateTime(newPayrollRun.payDate),
                    },
                    {
                      onSuccess: () =>
                        setNewPayrollRun({ periodLabel: "", payDate: "" }),
                    },
                  );
                }}
              >
                Initalize Payroll
              </Button>

              <div className="space-y-2">
                {payrollRuns.map((run: any) => (
                  <div
                    key={run.id}
                    className="rounded-xl border border-border p-3 flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-bold text-sm">{run.periodLabel}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                        Pay Date: {formatDate(run.payDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={run.status === "paid" ? "success" : "warning"}
                        className="text-[9px] h-5"
                      >
                        {run.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => deletePayrollRun.mutate(run.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribution Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/20 border border-border text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                  Total Net Disbursement
                </p>
                <p className="text-2xl font-black text-foreground">
                  $142,500.00
                </p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground font-bold">
                      STAFF
                    </p>
                    <p className="text-xs font-bold">42</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground font-bold">
                      STATUS
                    </p>
                    <p className="text-xs font-bold text-warning">Draft</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {payrollEntries.slice(0, 5).map((entry: any) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2 border-b border-border/50 last:border-0 hover:bg-muted/10"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                        {entry.employeeName?.charAt(0)}
                      </div>
                      <span className="text-xs font-medium">
                        {entry.employeeName}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">
                        ${Number(entry.netPay || 0).toLocaleString()}
                      </p>
                      <p className="text-[8px] text-muted-foreground uppercase">
                        Net Pay
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
            <Input
              value={newEmployee.fullName}
              onChange={(e) =>
                setNewEmployee((prev) => ({
                  ...prev,
                  fullName: e.target.value,
                }))
              }
            />
          </FormField>
          <FormField label="Work Email" required>
            <Input
              type="email"
              value={newEmployee.workEmail}
              onChange={(e) =>
                setNewEmployee((prev) => ({
                  ...prev,
                  workEmail: e.target.value,
                }))
              }
            />
          </FormField>
          <FormField label="Department">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newEmployee.department}
              onChange={(e) =>
                setNewEmployee((prev) => ({
                  ...prev,
                  department: e.target.value,
                }))
              }
            >
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
            </select>
          </FormField>
          <FormField label="Role">
            <Input
              value={newEmployee.jobTitle}
              onChange={(e) =>
                setNewEmployee((prev) => ({
                  ...prev,
                  jobTitle: e.target.value,
                }))
              }
            />
          </FormField>
          <FormField label="Manager">
            <Input
              value={newEmployee.managerName}
              onChange={(e) =>
                setNewEmployee((prev) => ({
                  ...prev,
                  managerName: e.target.value,
                }))
              }
            />
          </FormField>
          <FormField label="Location">
            <Input
              value={newEmployee.location}
              onChange={(e) =>
                setNewEmployee((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
            />
          </FormField>
        </div>
      </FormModal>

      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={onCsvImport}
        title="Import Candidates"
        fields={[
          { key: "fullName", label: "Full Name", required: true },
          { key: "email", label: "Email", required: true },
          { key: "phone", label: "Phone" },
          { key: "jobTitle", label: "Current Role" },
          { key: "location", label: "Location" },
          { key: "notes", label: "Notes" },
        ]}
      />
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">
              {value}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <Users className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
