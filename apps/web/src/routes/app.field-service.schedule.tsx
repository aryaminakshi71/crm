import { createFileRoute } from "@tanstack/react-router";
import { Button,
  Card,
  CardContent,
} from "@crm/ui";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  Filter,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/field-service/schedule")({
  component: Schedule,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM

function Schedule() {
  const scheduleQuery = useQuery({
    queryKey: ["field-service", "schedule"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/field-service/dispatch`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch schedule");
      return res.json() as Promise<any>;
    },
    placeholderData: (prev) => prev,
    retry: false,
  });
  if (scheduleQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => scheduleQuery.refetch()}>Retry</Button>
    </div>
  );

  const jobs = (scheduleQuery as any).data?.jobs ?? [];
  const technicians = (scheduleQuery as any).data?.technicians?.map((t: any) => t.name).filter(Boolean) ?? [];

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dates = ["2026-03-16", "2026-03-17", "2026-03-18", "2026-03-19", "2026-03-20", "2026-03-21", "2026-03-22"];

  const getJobsForDate = (date: string) => jobs.filter((job: any) => job.date === date);

  const getJobsForTechnicianAndDate = (tech: string, date: string) =>
    jobs.filter((job: any) => job.technician === tech && job.date === date);

  if (scheduleQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted/40 rounded animate-pulse" />
        <div className="h-96 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Job Scheduling Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Plan and manage technician schedules
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-medium min-w-[200px] text-center">
              March 2026
            </span>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Calendar className="h-4 w-4" />
            Today
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Schedule Job
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Week View
          </button>
          <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            Day View
          </button>
          <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            Technician View
          </button>
        </div>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Week Calendar Grid */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-8 border-b border-border/60">
            <div className="p-3 bg-muted/30 border-r border-border/60">
              <p className="text-xs font-medium text-muted-foreground">Technician</p>
            </div>
            {weekDays.map((day, idx) => (
              <div
                key={day}
                className={`p-3 text-center border-r border-border/60 last:border-r-0 ${
                  dates[idx] === "2026-03-20" ? "bg-primary/5" : "bg-muted/30"
                }`}
              >
                <p className="text-xs font-medium text-muted-foreground">{day}</p>
                <p className={`text-lg font-bold ${
                  dates[idx] === "2026-03-20" ? "text-primary" : "text-foreground"
                }`}>
                  {new Date(dates[idx]).getDate()}
                </p>
              </div>
            ))}
          </div>

          {/* Technician Rows */}
          {technicians.map((tech: any, techIdx: any) => (
            <div
              key={tech}
              className={`grid grid-cols-8 border-b border-border/60 last:border-b-0 ${
                techIdx % 2 === 0 ? "bg-background" : "bg-muted/10"
              }`}
            >
              <div className="p-3 border-r border-border/60">
                <p className="text-sm font-medium text-foreground">{tech}</p>
                <p className="text-xs text-muted-foreground">
                  {getJobsForDate("2026-03-20").filter((j: any) => j.technician === tech).length} jobs today
                </p>
              </div>
              {dates.map((date, dateIdx) => {
                const dayJobs = getJobsForTechnicianAndDate(tech, date);
                return (
                  <div
                    key={date}
                    className={`p-2 border-r border-border/60 last:border-r-0 min-h-[80px] ${
                      date === "2026-03-20" ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      {dayJobs.slice(0, 2).map((job: any) => (
                        <div
                          key={job.id}
                          className={`p-1 rounded text-xs truncate ${
                            job.status === "completed" ? "bg-green-500/20 text-green-600" :
                            job.status === "in_progress" ? "bg-blue-500/20 text-blue-600" :
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {job.time} {job.title.split(" ")[0]}
                        </div>
                      ))}
                      {dayJobs.length > 2 && (
                        <p className="text-xs text-muted-foreground">+{dayJobs.length - 2} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Daily Schedule */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Today's Schedule - March 20, 2026</h3>
          <div className="space-y-3">
            {jobs.filter((j: any) => j.date === "2026-03-20").map((job: any) => (
              <div
                key={job.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  job.status === "completed" ? "border-green-500/20 bg-green-500/5" :
                  job.status === "in_progress" ? "border-blue-500/20 bg-blue-500/5" :
                  "border-border/40"
                }`}
              >
                <div className="w-20 text-center">
                  <p className="text-sm font-medium">{job.time}</p>
                  <p className="text-xs text-muted-foreground">{job.duration}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  job.status === "completed" ? "bg-green-500" :
                  job.status === "in_progress" ? "bg-blue-500" :
                  "bg-muted-foreground"
                }`} />
                <div className="flex-1">
                  <p className="font-medium">{job.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {job.technician}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Manhattan
                    </span>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  job.status === "completed" ? "bg-green-500/10 text-green-500" :
                  job.status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
                  "bg-amber-500/10 text-amber-500"
                }`}>
                  {job.status.replace("_", " ")}
                </span>
                <span className="px-2 py-1 rounded bg-muted text-xs capitalize">
                  {job.type}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
