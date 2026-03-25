import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Calendar, CalendarDays, Clock, User, Zap } from "lucide-react";
import { fieldServiceApi } from "@/lib/api";
import { z } from "zod";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/field-service/schedule/_index")({
  validateSearch: searchSchema,
  component: SchedulePage,
});

function SchedulePage() {
  const { q = "", page = 1 } = useSearch({ from: "/app/field-service/schedule/_index" });
  const navigate = useNavigate({ from: "/app/field-service/schedule/_index" });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ["field-service", "schedule", page],
    queryFn: () => fieldServiceApi.schedule.list({ page, limit: PAGE_SIZE }),
  });

  const { data: techData } = useQuery({
    queryKey: ["field-service", "technicians"],
    queryFn: () => fieldServiceApi.technicians.list(),
  });

  const { data: jobsData } = useQuery({
    queryKey: ["field-service", "jobs", page],
    queryFn: () => fieldServiceApi.jobs.list({ page, limit: PAGE_SIZE }),
  });

  const jobs: any[] = (jobsData as any)?.data ?? (Array.isArray(jobsData) ? jobsData : []);
  const total = (jobsData as any)?.total ?? (jobsData as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const technicians: any[] = (techData as any)?.data ?? (Array.isArray(techData) ? techData : []);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const todayStr = today.toDateString();
  const tomorrowStr = tomorrow.toDateString();

  const todayJobs = jobs.filter((j: any) => {
    if (!j.scheduledStart) return false;
    return new Date(j.scheduledStart).toDateString() === todayStr;
  });

  const tomorrowJobs = jobs.filter((j: any) => {
    if (!j.scheduledStart) return false;
    return new Date(j.scheduledStart).toDateString() === tomorrowStr;
  });

  const thisWeekJobs = jobs.filter((j: any) => {
    if (!j.scheduledStart) return false;
    const d = new Date(j.scheduledStart);
    return d > tomorrow && d <= weekEnd;
  });

  const availableTechs = technicians.filter(
    (t: any) => t.status === "available" || !t.status,
  ).length;

  const utilization =
    technicians.length > 0
      ? Math.round(((technicians.length - availableTechs) / technicians.length) * 100)
      : 0;

  function JobRow({ job }: { job: any }) {
    const tech = technicians.find((t: any) => t.id === job.technicianId);
    const start = job.scheduledStart
      ? new Date(job.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "—";

    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
          <p className="text-xs text-muted-foreground">
            {job.customerName ?? "No customer"} — {job.customerAddress ?? "No address"}
          </p>
        </div>
        <div className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" />
          {tech?.name ?? "Unassigned"}
        </div>
        <div className="shrink-0 font-mono text-xs text-muted-foreground">{start}</div>
        <Badge
          variant={
            job.status === "completed"
              ? "success"
              : job.status === "in_progress"
                ? "warning"
                : "secondary"
          }
        >
          {(job.status ?? "scheduled").replace("_", " ")}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Schedule
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Jobs Today</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{todayJobs.length}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-cyan-500">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Available Technicians</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{availableTechs}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-emerald-500">
                <User className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Utilization</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{utilization}%</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Zap className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Loading />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs scheduled"
          description="No jobs are scheduled this week."
        />
      ) : (
        <div className="space-y-6">
          {todayJobs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Today ({todayJobs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {todayJobs.map((j: any) => <JobRow key={j.id} job={j} />)}
              </CardContent>
            </Card>
          )}

          {tomorrowJobs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Tomorrow ({tomorrowJobs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tomorrowJobs.map((j: any) => <JobRow key={j.id} job={j} />)}
              </CardContent>
            </Card>
          )}

          {thisWeekJobs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  This Week ({thisWeekJobs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {thisWeekJobs.map((j: any) => <JobRow key={j.id} job={j} />)}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
