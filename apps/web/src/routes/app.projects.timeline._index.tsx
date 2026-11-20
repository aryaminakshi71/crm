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
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  GanttChart,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { nucleoApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/projects/timeline/_index")({
  validateSearch: searchSchema,
  component: TimelineIndexPage,
});

// ── Status styling ────────────────────────────────────────────────────────────

const STATUS_BAR_CLASS: Record<string, string> = {
  active: "bg-blue-500",
  in_progress: "bg-blue-500",
  planning: "bg-gray-400",
  not_started: "bg-gray-400",
  on_hold: "bg-amber-400",
  at_risk: "bg-orange-500",
  completed: "bg-emerald-500",
};

const STATUS_BADGE: Record<string, "success" | "primary" | "warning" | "default"> = {
  active: "primary",
  in_progress: "primary",
  planning: "default",
  not_started: "default",
  on_hold: "warning",
  at_risk: "warning",
  completed: "success",
};

const LEGEND = [
  { label: "In Progress", className: "bg-blue-500" },
  { label: "Completed", className: "bg-emerald-500" },
  { label: "Not Started", className: "bg-gray-400" },
  { label: "At Risk", className: "bg-orange-500" },
  { label: "On Hold", className: "bg-amber-400" },
];

// ── Date math ─────────────────────────────────────────────────────────────────

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** Returns an array of { label, leftPct } for week/month header ticks */
function buildTimelineHeader(rangeStart: Date, rangeEnd: Date): { label: string; leftPct: number }[] {
  const total = rangeEnd.getTime() - rangeStart.getTime();
  const ticks: { label: string; leftPct: number }[] = [];

  const cursor = new Date(rangeStart);
  cursor.setDate(1); // snap to month start

  while (cursor <= rangeEnd) {
    const leftPct = ((cursor.getTime() - rangeStart.getTime()) / total) * 100;
    if (leftPct >= 0 && leftPct <= 100) {
      ticks.push({
        label: cursor.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        leftPct: Math.max(0, leftPct),
      });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return ticks;
}

function getBarStyle(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  rangeStart: Date,
  rangeEnd: Date,
  fallbackStart?: string | null,
): React.CSSProperties {
  const total = rangeEnd.getTime() - rangeStart.getTime();
  const rawStart = startDate ?? fallbackStart ?? rangeStart.toISOString();
  const rawEnd = endDate ?? rangeEnd.toISOString();
  const taskStart = Math.max(new Date(rawStart).getTime(), rangeStart.getTime());
  const taskEnd = Math.min(new Date(rawEnd).getTime(), rangeEnd.getTime());
  const left = ((taskStart - rangeStart.getTime()) / total) * 100;
  const width = ((taskEnd - taskStart) / total) * 100;
  return {
    position: "absolute",
    left: `${Math.max(0, left)}%`,
    width: `${Math.max(0.5, width)}%`,
  };
}

function todayMarkerStyle(rangeStart: Date, rangeEnd: Date): React.CSSProperties | null {
  const now = Date.now();
  const total = rangeEnd.getTime() - rangeStart.getTime();
  if (now < rangeStart.getTime() || now > rangeEnd.getTime()) return null;
  const left = ((now - rangeStart.getTime()) / total) * 100;
  return {
    position: "absolute",
    left: `${left}%`,
    top: 0,
    bottom: 0,
    width: 2,
    pointerEvents: "none" as const,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

function TimelineIndexPage() {
  const { q = "", page = 1 } = useSearch({ from: "/app/projects/timeline/_index" });
  const navigate = useNavigate({ from: "/app/projects/timeline" });
  const search = q;
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [statusFilter, setStatusFilter] = useState("all");

  // Controlled visible date range: defaults to a 3-month window around today
  const [windowStart, setWindowStart] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1); // prev month
  });
  const WINDOW_MONTHS = 3;

  const rangeStart = windowStart;
  const rangeEnd = useMemo(
    () => addMonths(windowStart, WINDOW_MONTHS),
    [windowStart],
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["nucleo-projects-timeline"],
    queryFn: () => nucleoApi.projects.list({ page: 1, limit: 100 }),
  });

  const projects: any[] = (data?.data as any[]) ?? [];

  const filtered = useMemo(() => {
    return projects.filter((p: any) => {
      const matchSearch =
        !search.trim() || p.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  const headerTicks = useMemo(
    () => buildTimelineHeader(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  );

  const todayStyle = useMemo(
    () => todayMarkerStyle(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  );

  function handlePrevMonth() {
    setWindowStart((d) => addMonths(d, -1));
  }

  function handleNextMonth() {
    setWindowStart((d) => addMonths(d, 1));
  }

  function handleToday() {
    const now = new Date();
    setWindowStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load projects. Please try again.</p>
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
          <h2 className="font-bold text-xl text-foreground">Project Timeline</h2>
          <p className="text-muted-foreground text-sm">
            Gantt-style view of project schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="planning">Planning</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="active">Active</option>
            <option value="at_risk">At Risk</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Projects", value: projects.length, color: "text-primary" },
          {
            label: "Active",
            value: projects.filter(
              (p: any) => p.status === "active" || p.status === "in_progress",
            ).length,
            color: "text-blue-500",
          },
          {
            label: "Planning",
            value: projects.filter(
              (p: any) => p.status === "planning" || p.status === "not_started",
            ).length,
            color: "text-gray-400",
          },
          {
            label: "Completed",
            value: projects.filter((p: any) => p.status === "completed").length,
            color: "text-emerald-500",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </p>
              <p className={`text-2xl font-black mt-0.5 ${stat.color}`}>
                {isLoading ? "—" : stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline Card */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GanttChart className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">
                Timeline &mdash;{" "}
                {rangeStart.toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })}{" "}
                to{" "}
                {rangeEnd.toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })}
              </CardTitle>
            </div>
            {/* Navigation controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                title="Previous month"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev Month
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                title="Next month"
              >
                Next Month
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse space-y-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 border-b border-border/40"
                >
                  <div className="w-48 h-4 bg-muted rounded" />
                  <div className="flex-1 h-6 bg-muted/50 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex justify-center">
              <EmptyState
                title="No projects found"
                description="Try adjusting your filters."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Month header */}
              <div className="flex min-w-[800px]">
                <div className="w-[200px] shrink-0 border-b border-border/60 bg-muted/50" />
                <div className="flex-1 relative h-8 border-b border-border/60 bg-muted/50">
                  {headerTicks.map((tick) => (
                    <span
                      key={tick.label}
                      className="absolute top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                      style={{ left: `${tick.leftPct}%`, paddingLeft: 6 }}
                    >
                      {tick.label}
                    </span>
                  ))}
                  {/* Today line in header */}
                  {todayStyle && (
                    <div
                      className="bg-red-500 opacity-60"
                      style={{ ...todayStyle, top: 0, bottom: 0 }}
                    />
                  )}
                </div>
              </div>

              {/* Rows */}
              {filtered.map((project: any) => {
                const barStyle = getBarStyle(
                  project.startDate,
                  project.dueDate,
                  rangeStart,
                  rangeEnd,
                  project.createdAt,
                );
                const progress = project.progress ?? 0;
                const startDate = project.startDate
                  ? new Date(project.startDate).toLocaleDateString()
                  : project.createdAt
                    ? new Date(project.createdAt).toLocaleDateString()
                    : "—";
                const endDate = project.dueDate
                  ? new Date(project.dueDate).toLocaleDateString()
                  : "—";
                const barClass =
                  STATUS_BAR_CLASS[project.status ?? "not_started"] ??
                  "bg-gray-400";

                return (
                  <div
                    key={project.id}
                    className="flex items-center border-b border-border/40 hover:bg-muted/30 transition-colors min-w-[800px]"
                  >
                    {/* Task name column */}
                    <div className="w-[200px] shrink-0 px-4 py-3">
                      <p className="font-semibold text-sm truncate" title={project.name}>
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant={STATUS_BADGE[project.status ?? "not_started"] ?? "default"}
                        >
                          {project.status ?? "not_started"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-bold">
                          {progress}%
                        </span>
                      </div>
                    </div>

                    {/* Bar area */}
                    <div className="flex-1 relative h-12 border-l border-border/30">
                      {/* Background track */}
                      <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-2 bg-muted/60" />

                      {/* Today vertical marker */}
                      {todayStyle && (
                        <div
                          className="bg-red-500 opacity-40"
                          style={{ ...todayStyle }}
                        />
                      )}

                      {/* Project bar */}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-full ${barClass} opacity-90 transition-all`}
                        style={barStyle}
                        title={`${startDate} → ${endDate}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Legend
        </span>
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-full ${item.className}`} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-0.5 bg-red-500 rounded" />
          <span className="text-xs text-muted-foreground">Today</span>
        </div>
      </div>
    </div>
  );
}
