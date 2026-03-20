import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { nucleoApi } from "../lib/api";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/sprints")({
  component: SprintsPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type Sprint = {
  id: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "completed";
  tasksTotal: number;
  tasksCompleted: number;
  velocity?: number;
};

type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assignee?: string;
  storyPoints?: number;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function SprintsPage() {
  const navigate = useNavigate();
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);

  // Mock sprints data
  const sprints: Sprint[] = [
    {
      id: "s1",
      name: "Sprint 1",
      goal: "Complete user authentication",
      startDate: "2024-01-01",
      endDate: "2024-01-14",
      status: "completed",
      tasksTotal: 12,
      tasksCompleted: 12,
      velocity: 34,
    },
    {
      id: "s2",
      name: "Sprint 2",
      goal: "Build dashboard UI",
      startDate: "2024-01-15",
      endDate: "2024-01-28",
      status: "completed",
      tasksTotal: 15,
      tasksCompleted: 14,
      velocity: 38,
    },
    {
      id: "s3",
      name: "Sprint 3",
      goal: "API integration",
      startDate: "2024-01-29",
      endDate: "2024-02-11",
      status: "active",
      tasksTotal: 18,
      tasksCompleted: 8,
      velocity: 24,
    },
    {
      id: "s4",
      name: "Sprint 4",
      goal: "Performance optimization",
      startDate: "2024-02-12",
      endDate: "2024-02-25",
      status: "planning",
      tasksTotal: 0,
      tasksCompleted: 0,
    },
  ];

  // Mock tasks for selected sprint
  const sprintTasks: Task[] = selectedSprint === "s3" ? [
    { id: "t1", title: "Set up API client", status: "done", priority: "high", assignee: "Sarah", storyPoints: 3 },
    { id: "t2", title: "Create user endpoints", status: "done", priority: "high", assignee: "Sarah", storyPoints: 5 },
    { id: "t3", title: "Implement auth middleware", status: "done", priority: "high", assignee: "Mike", storyPoints: 8 },
    { id: "t4", title: "Build REST adapter", status: "in_progress", priority: "medium", assignee: "Emily", storyPoints: 5 },
    { id: "t5", title: "Add error handling", status: "todo", priority: "medium", assignee: "Emily", storyPoints: 3 },
    { id: "t6", title: "Write API tests", status: "todo", priority: "high", assignee: "Sarah", storyPoints: 5 },
    { id: "t7", title: "Document endpoints", status: "todo", priority: "low", assignee: "Mike", storyPoints: 2 },
    { id: "t8", title: "Performance benchmarks", status: "todo", priority: "medium", assignee: "Emily", storyPoints: 3 },
  ] : [];

  const activeSprint = sprints.find((s) => s.status === "active");
  const planningSprints = sprints.filter((s) => s.status === "planning");
  const completedSprints = sprints.filter((s) => s.status === "completed");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil(
      (new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const currentSprint = activeSprint;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Sprint Planning</h2>
          <p className="text-muted-foreground text-sm">
            Plan and track development sprints
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {}}
        >
          Create Sprint
        </Button>
      </div>

      {/* Active Sprint Overview */}
      {activeSprint && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary">Active</Badge>
                  <h3 className="text-xl font-bold">{activeSprint.name}</h3>
                </div>
                <p className="text-muted-foreground mt-1">{activeSprint.goal}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(activeSprint.startDate)} - {formatDate(activeSprint.endDate)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getDaysRemaining(activeSprint.endDate)} days remaining
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{activeSprint.tasksCompleted}/{activeSprint.tasksTotal}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{activeSprint.velocity || 0}</p>
                  <p className="text-xs text-muted-foreground">Velocity</p>
                </div>
              </div>
            </div>

            {/* Sprint Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Completion</span>
                <span>
                  {Math.round((activeSprint.tasksCompleted / activeSprint.tasksTotal) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(activeSprint.tasksCompleted / activeSprint.tasksTotal) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sprint Board */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold">Sprint Board</CardTitle>
            <div className="flex gap-2">
              {sprints.map((sprint) => (
                <button
                  key={sprint.id}
                  onClick={() => setSelectedSprint(sprint.id)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    selectedSprint === sprint.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {sprint.name}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {selectedSprint === "s3" || !selectedSprint ? (
              <div className="grid grid-cols-3 gap-4">
                {/* To Do */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      To Do
                    </h4>
                    <Badge variant="default" size="sm">
                      {sprintTasks.filter((t) => t.status === "todo").length}
                    </Badge>
                  </div>
                  {sprintTasks
                    .filter((t) => t.status === "todo")
                    .map((task) => (
                      <SprintTaskCard key={task.id} task={task} />
                    ))}
                </div>

                {/* In Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-warning">
                      In Progress
                    </h4>
                    <Badge variant="warning" size="sm">
                      {sprintTasks.filter((t) => t.status === "in_progress").length}
                    </Badge>
                  </div>
                  {sprintTasks
                    .filter((t) => t.status === "in_progress")
                    .map((task) => (
                      <SprintTaskCard key={task.id} task={task} />
                    ))}
                </div>

                {/* Done */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-success">
                      Done
                    </h4>
                    <Badge variant="success" size="sm">
                      {sprintTasks.filter((t) => t.status === "done").length}
                    </Badge>
                  </div>
                  {sprintTasks
                    .filter((t) => t.status === "done")
                    .map((task) => (
                      <SprintTaskCard key={task.id} task={task} />
                    ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                Select a sprint to view board
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sprint Stats */}
        <div className="space-y-4">
          {/* Velocity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Velocity Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[150px] w-full">
                <div className="flex items-end justify-between gap-2 h-full">
                  {completedSprints.map((sprint, i) => (
                    <div key={sprint.id} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/20 rounded-t"
                        style={{ height: `${(sprint.velocity || 0) * 2}%` }}
                      >
                        <div className="w-full bg-primary rounded-t h-full" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        S{i + 1}
                      </span>
                      <span className="text-xs font-bold">{sprint.velocity}</span>
                    </div>
                  ))}
                  {activeSprint && (
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-warning/20 rounded-t"
                        style={{ height: `${(activeSprint.velocity || 0) * 2}%` }}
                      >
                        <div className="w-full bg-warning rounded-t h-full" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        S{completedSprints.length + 1}
                      </span>
                      <span className="text-xs font-bold">{activeSprint.velocity}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sprint Goal */}
          {activeSprint && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Current Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm">{activeSprint.goal}</p>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    3 developers
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {activeSprint.tasksTotal} stories
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Sprints */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Planning</CardTitle>
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {planningSprints.map((sprint) => (
                  <div
                    key={sprint.id}
                    className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{sprint.name}</span>
                      <Badge variant="outline" size="sm">
                        {formatDate(sprint.startDate)}
                      </Badge>
                    </div>
                    {sprint.goal && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {sprint.goal}
                      </p>
                    )}
                  </div>
                ))}
                {planningSprints.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground text-xs">
                    No sprints in planning
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Sprint Task Card ────────────────────────────────────────────────────────

function SprintTaskCard({ task }: { task: Task }) {
  const priorityColors = {
    high: "border-l-destructive",
    medium: "border-l-warning",
    low: "border-l-success",
  };

  return (
    <div
      className={`p-3 rounded-lg border border-border bg-card border-l-4 ${priorityColors[task.priority]} hover:shadow-md transition-shadow cursor-pointer`}
    >
      <p className="text-sm font-medium">{task.title}</p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
              {task.assignee.charAt(0)}
            </div>
          )}
          {task.storyPoints && (
            <Badge variant="outline" size="sm">
              {task.storyPoints} pts
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
