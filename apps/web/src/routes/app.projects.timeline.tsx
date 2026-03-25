import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  GanttChart,
  Plus,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useMemo, useState } from "react";
import { nucleoApi } from "@/lib/api";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/timeline")({
  component: TimelinePage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type Task = {
  id: string;
  projectId: string;
  title: string;
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignee?: { id: string; name: string; avatar?: string };
  startDate?: string;
  dueDate?: string;
  progress?: number;
};

type Milestone = {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  status: "pending" | "completed" | "overdue";
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function TimelinePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get all projects
  const { data: projectsData, isError: projectsError, refetch: projectsRefetch } = useQuery({
    queryKey: ["nucleo-projects"],
    queryFn: () => nucleoApi.projects.list({ page: 1, limit: 100 }),
  });

  const projects = (projectsData?.data as any[]) || [];
  const selectedProject = projects[0];

  // Get tasks for selected project
  const { data: tasksData } = useQuery({
    queryKey: ["nucleo-project-tasks", selectedProject?.id],
    queryFn: () => nucleoApi.projects.tasks.list(selectedProject!.id),
    enabled: !!selectedProject,
  });

  const tasks = ((tasksData as any)?.data as Task[]) || [];

  // Get milestones
  const { data: milestonesData } = useQuery({
    queryKey: ["nucleo-project-milestones", selectedProject?.id],
    queryFn: () => nucleoApi.projects.milestones.list(selectedProject!.id),
    enabled: !!selectedProject,
  });

  const milestones = ((milestonesData as any)?.data as Milestone[]) || [];

  // Filter tasks by search
  const filteredTasks = useMemo(() => {
    if (!search.trim()) return tasks;
    return tasks.filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search]);

  // Calculate date range for timeline
  const dateRange = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    const end = new Date(today);
    end.setDate(end.getDate() + 60);
    return { start, end };
  }, []);

  // Generate timeline columns
  const timelineColumns = useMemo(() => {
    const columns: Date[] = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      columns.push(new Date(current));
      if (zoom === "day") {
        current.setDate(current.getDate() + 1);
      } else if (zoom === "week") {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return columns;
  }, [dateRange, zoom]);

  // Calculate task position on timeline
  const getTaskStyle = (task: Task) => {
    const start = task.startDate ? new Date(task.startDate) : new Date();
    const end = task.dueDate ? new Date(task.dueDate) : new Date(start);
    end.setDate(end.getDate() + 1);

    const totalDays =
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const taskStartDays =
      (start.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const taskDuration =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    const left = (taskStartDays / totalDays) * 100;
    const width = (taskDuration / totalDays) * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - left, width)}%`,
    };
  };

  // Get milestone position
  const getMilestoneStyle = (milestone: Milestone) => {
    const date = new Date(milestone.dueDate);
    const totalDays =
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const daysFromStart =
      (date.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const left = (daysFromStart / totalDays) * 100;

    return {
      left: `${left}%`,
    };
  };

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (zoom === "day") newDate.setDate(newDate.getDate() - 7);
    else if (zoom === "week") newDate.setDate(newDate.getDate() - 14);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (zoom === "day") newDate.setDate(newDate.getDate() + 7);
    else if (zoom === "week") newDate.setDate(newDate.getDate() + 14);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Status colors
  const statusColors: Record<string, string> = {
    backlog: "bg-muted",
    todo: "bg-primary/70",
    in_progress: "bg-warning",
    review: "bg-cyan-400",
    done: "bg-success",
  };

  // Priority colors
  const priorityColors: Record<string, string> = {
    low: "text-success",
    medium: "text-warning",
    high: "text-destructive",
  };

  if (projectsError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => projectsRefetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Timeline</h2>
          <p className="text-muted-foreground text-sm">
            Gantt chart view of project schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
            />
          </div>
          <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
            Filter
          </Button>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Add Task
          </Button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {projects.map((project: any) => (
          <button
            key={project.id}
            type="button"
            onClick={() => {}}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              selectedProject?.id === project.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            {project.name}
          </button>
        ))}
      </div>

      {/* Timeline Controls */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-2 text-sm font-medium">
                {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Zoom:</span>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(["day", "week", "month"] as const).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoom(z)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      zoom === z
                        ? "bg-primary text-primary-foreground"
                        : "bg-card hover:bg-muted"
                    }`}
                  >
                    {z.charAt(0).toUpperCase() + z.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border">
              <div className="flex">
                {/* Task Name Header */}
                <div className="w-64 shrink-0 border-r border-border px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Task Name
                  </span>
                </div>

                {/* Date Headers */}
                <div className="flex-1 flex">
                  {timelineColumns.map((date, i) => (
                    <div
                      key={i}
                      className="flex-1 min-w-[40px] px-2 py-3 text-center border-r border-border/50 last:border-r-0"
                    >
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {zoom === "day"
                          ? date.toLocaleDateString(undefined, { weekday: "short" })
                          : zoom === "week"
                            ? `Week ${Math.ceil(date.getDate() / 7)}`
                            : date.toLocaleDateString(undefined, { month: "short" })}
                      </span>
                      <br />
                      <span className="text-xs font-bold">
                        {zoom === "day"
                          ? date.getDate().toString()
                          : zoom === "week"
                            ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                            : date.getFullYear().toString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today Marker */}
              <div className="relative h-1 bg-primary">
                <div
                  className="absolute -top-3 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary"
                  style={{
                    left: `${
                      ((new Date().getTime() - dateRange.start.getTime()) /
                        (dateRange.end.getTime() - dateRange.start.getTime())) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-border/50">
              {filteredTasks.map((task) => {
                const style = getTaskStyle(task);
                return (
                  <div key={task.id} className="flex hover:bg-muted/30 transition-colors">
                    {/* Task Info */}
                    <div className="w-64 shrink-0 border-r border-border px-4 py-3">
                      <div className="flex items-center gap-2">
                        <GanttChart className={`h-4 w-4 shrink-0 ${priorityColors[task.priority]}`} />
                        <span className="text-sm font-medium truncate">{task.title}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" size="sm">
                          {task.status}
                        </Badge>
                        {task.assignee && (
                          <span className="text-[10px] text-muted-foreground">
                            {task.assignee.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="flex-1 relative py-3 px-2">
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-full ${statusColors[task.status]} flex items-center px-2 min-w-[20px]`}
                        style={style}
                      >
                        <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white/50 rounded-full"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Grid lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {timelineColumns.map((_, i) => (
                          <div key={i} className="flex-1 border-r border-border/20 last:border-r-0" />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Milestones */}
              {milestones.map((milestone) => {
                const style = getMilestoneStyle(milestone);
                return (
                  <div key={milestone.id} className="flex bg-warning/5 hover:bg-warning/10 transition-colors">
                    <div className="w-64 shrink-0 border-r border-border px-4 py-3">
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-warning shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        <span className="text-sm font-bold">{milestone.title}</span>
                      </div>
                      <span className="mt-1 text-[10px] text-warning">Milestone</span>
                    </div>
                    <div className="flex-1 relative py-3 px-2">
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-warning border-2 border-background shadow"
                        style={style}
                      />
                    </div>
                  </div>
                );
              })}

              {filteredTasks.length === 0 && milestones.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No tasks or milestones to display
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-muted" />
              <span className="text-xs text-muted-foreground">Backlog</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary/70" />
              <span className="text-xs text-muted-foreground">To Do</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-warning" />
              <span className="text-xs text-muted-foreground">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-cyan-400" />
              <span className="text-xs text-muted-foreground">Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Done</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-warning border-2 border-background" />
              <span className="text-xs text-muted-foreground">Milestone</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
