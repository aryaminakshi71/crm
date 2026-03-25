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
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { fieldServiceApi } from "@/lib/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/field-service/jobs/_index")({
  validateSearch: searchSchema,
  component: FieldServiceJobsPage,
});

type JobStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "";

function statusVariant(status: string) {
  if (status === "completed") return "success";
  if (status === "in_progress") return "warning";
  if (status === "scheduled") return "secondary";
  if (status === "cancelled") return "destructive";
  return "outline";
}

function priorityVariant(priority: string) {
  if (priority === "urgent") return "destructive";
  if (priority === "high") return "warning";
  if (priority === "medium") return "secondary";
  return "outline";
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
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}>
            {icon || <Briefcase className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const PAGE_SIZE = 50;

function FieldServiceJobsPage() {
  const { q = "", status = "", page = 1 } = useSearch({ from: "/app/field-service/jobs/_index" });
  const navigate = useNavigate({ from: "/app/field-service/jobs/_index" });
  const search = q;
  const statusFilter = status as JobStatus;
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    priority: "medium",
    scheduledStart: "",
    description: "",
  });

  const queryClient = useQueryClient();

  const { data: jobsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["field-service", "jobs", statusFilter, page],
    queryFn: () => fieldServiceApi.jobs.list(),
  });

  const createJob = useMutation({
    mutationFn: (payload: Record<string, unknown>) => fieldServiceApi.jobs.create(payload),
    onSuccess: () => {
      toast.success("Job created");
      queryClient.invalidateQueries({ queryKey: ["field-service", "jobs"] });
      setIsCreateOpen(false);
      setNewJob({
        title: "",
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        priority: "medium",
        scheduledStart: "",
        description: "",
      });
    },
    onError: () => toast.error("Failed to create job"),
  });

  const jobs = (jobsData as any)?.data ?? (Array.isArray(jobsData) ? jobsData : []);
  const jobsTotal = (jobsData as any)?.total ?? (jobsData as any)?.pagination?.total ?? 0;
  const jobsTotalPages = Math.ceil(jobsTotal / PAGE_SIZE);

  const filtered = jobs.filter((j: any) => {
    const matchSearch =
      !search ||
      (j.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (j.jobNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (j.customerName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const today = new Date().toDateString();
  const openJobs = jobs.filter(
    (j: any) => j.status === "scheduled" || j.status === "in_progress",
  ).length;
  const completedToday = jobs.filter(
    (j: any) =>
      j.status === "completed" &&
      j.actualEnd &&
      new Date(j.actualEnd).toDateString() === today,
  ).length;

  const STATUS_TABS: { value: JobStatus; label: string }[] = [
    { value: "", label: "All" },
    { value: "scheduled", label: "Scheduled" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  if (isError) {
    return (
      <EmptyState
        variant="error"
        title="Something went wrong"

        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Field service work orders and job tracking
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Metric
          title="Open Jobs"
          value={openJobs}
          icon={<Briefcase className="h-4 w-4" />}
          color="text-cyan-500"
          trend="Scheduled + in progress"
        />
        <Metric
          title="Completed Today"
          value={completedToday}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="text-emerald-500"
          trend="Jobs finished"
        />
        <Metric
          title="Total Jobs"
          value={jobs.length}
          icon={<Clock className="h-4 w-4" />}
          color="text-violet-500"
          trend="All time"
        />
      </div>

      {/* Jobs by Status donut chart */}
      {(() => {
        const STATUS_COLORS = ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444"];
        const statusKeys = ["pending", "in_progress", "completed", "cancelled"];
        const statusCounts = statusKeys.map((s) => ({
          name: s.replace("_", " "),
          value: jobs.filter((j: any) => j.status === s).length,
        }));
        const hasData = statusCounts.some((s) => s.value > 0);
        return (
          <Card className="border-border/60 w-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Jobs by Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <ResponsiveContainer width={220} height={160}>
                <PieChart>
                  <Pie
                    data={hasData ? statusCounts : [{ name: "No data", value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={hasData ? 3 : 0}
                    dataKey="value"
                  >
                    {(hasData ? statusCounts : [{ name: "No data", value: 1 }]).map(
                      (_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={hasData ? STATUS_COLORS[index % STATUS_COLORS.length] : "hsl(var(--muted))"}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                {statusCounts.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }}
                    />
                    <span className="text-[10px] capitalize text-muted-foreground">
                      {s.name} ({s.value})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit flex-wrap">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === t.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-8 w-8" />}
          title="No jobs found"

          action={
            <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Job
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-muted/30">
              <tr>
                {["Job #", "Title", "Customer", "Technician", "Priority", "Status", "Scheduled"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-background">
              {filtered.map((job: any) => (
                <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {job.jobNumber || `#${job.id?.slice(0, 6)}`}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground max-w-[200px]">
                    <p className="truncate">{job.title}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {job.customerName || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {job.technicianName || job.technicianId ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {job.technicianName || "Assigned"}
                      </span>
                    ) : (
                      <span className="text-amber-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={priorityVariant(job.priority) as any}>
                      {job.priority || "medium"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(job.status) as any}>
                      {(job.status || "scheduled").replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {job.scheduledStart
                      ? new Date(job.scheduledStart).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={jobsTotalPages} onPageChange={setPage} />

      {/* Create modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Job"

        onSubmit={() => {
          if (!newJob.title.trim()) {
            toast.error("Job title is required");
            return;
          }
          createJob.mutate({
            title: newJob.title.trim(),
            customerName: newJob.customerName || undefined,
            customerPhone: newJob.customerPhone || undefined,
            customerAddress: newJob.customerAddress || undefined,
            priority: newJob.priority,
            scheduledStart: newJob.scheduledStart
              ? new Date(newJob.scheduledStart).toISOString()
              : undefined,
            description: newJob.description || undefined,
          });
        }}
        isLoading={createJob.isPending}
        submitText="Create Job"
      >
        <FormField label="Job Title" required>
          <Input
            placeholder="e.g. HVAC Repair - Unit 4B"
            value={newJob.title}
            onChange={(e) => setNewJob((j) => ({ ...j, title: e.target.value }))}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Customer Name">
            <Input
              placeholder="e.g. John Smith"
              value={newJob.customerName}
              onChange={(e) => setNewJob((j) => ({ ...j, customerName: e.target.value }))}
            />
          </FormField>
          <FormField label="Customer Phone">
            <Input
              placeholder="+1 (555) 000-0000"
              value={newJob.customerPhone}
              onChange={(e) => setNewJob((j) => ({ ...j, customerPhone: e.target.value }))}
            />
          </FormField>
        </div>
        <FormField label="Customer Address">
          <Input
            placeholder="e.g. 123 Main St, Springfield, IL"
            value={newJob.customerAddress}
            onChange={(e) => setNewJob((j) => ({ ...j, customerAddress: e.target.value }))}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Priority">
            <select
              value={newJob.priority}
              onChange={(e) => setNewJob((j) => ({ ...j, priority: e.target.value }))}
              className="w-full h-9 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </FormField>
          <FormField label="Scheduled Date">
            <Input
              type="datetime-local"
              value={newJob.scheduledStart}
              onChange={(e) => setNewJob((j) => ({ ...j, scheduledStart: e.target.value }))}
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
