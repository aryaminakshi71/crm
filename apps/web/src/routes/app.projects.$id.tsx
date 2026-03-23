import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  FormModal,
  Input,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Flag,
  FolderKanban,
  GanttChart,
  Link2,
  ListTodo,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Pen,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { aiApi, nucleoApi } from "../lib/api";
import { PriorityBadge } from "./app.projects";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/$id")({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "milestones" | "files" | "activity"
  >("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch project details
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ["nucleo-project", id],
    queryFn: () => nucleoApi.projects.get(id),
    enabled: !!id,
  });

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ["nucleo-project-tasks", id],
    queryFn: () => nucleoApi.projects.tasks.list(id),
    enabled: !!id,
  });

  // Fetch milestones
  const { data: milestonesData } = useQuery({
    queryKey: ["nucleo-project-milestones", id],
    queryFn: () => nucleoApi.projects.milestones.list(id),
    enabled: !!id,
  });

  // Fetch resources
  const { data: resourcesData } = useQuery({
    queryKey: ["nucleo-project-resources", id],
    queryFn: () => nucleoApi.projects.resources.list(id),
    enabled: !!id,
  });

  const project = projectData?.data;
  const tasks = (tasksData?.data || []) as any[];
  const milestones = (milestonesData?.data || []) as any[];
  const resources = (resourcesData?.data || []) as any[];

  // Delete mutation
  const deleteProject = useMutation({
    mutationFn: () => nucleoApi.projects.delete(id),
    onSuccess: () => {
      toast.success("Project deleted");
      navigate({ to: "/app/projects" });
    },
    onError: () => toast.error("Failed to delete project"),
  });

  // Calculate progress
  const completedTasks = tasks.filter((t: any) => t.status === "done").length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Milestone progress
  const completedMilestones = milestones.filter((m: any) => m.status === "completed").length;
  const totalMilestones = milestones.length;

  // Task status breakdown
  const taskStatusBreakdown = useMemo(() => {
    return {
      todo: tasks.filter((t: any) => t.status === "todo").length,
      in_progress: tasks.filter((t: any) => t.status === "in_progress").length,
      review: tasks.filter((t: any) => t.status === "review").length,
      done: tasks.filter((t: any) => t.status === "done").length,
    };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    return tasks.filter((t: any) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  // AI Risk assessment mutation
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const aiRisk = useMutation({
    mutationFn: () =>
      aiApi.assessProjectRisk({
        name: project?.name,
        description: project?.description,
        status: project?.status,
        priority: project?.priority,
        dueDate: project?.dueDate,
      }),
    onSuccess: (res) => {
      if (res.result) setRiskAssessment(res.result);
      toast.success("AI risk assessment complete");
    },
    onError: () => toast.error("AI risk assessment failed"),
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "milestones", label: "Milestones", icon: Flag },
    { id: "files", label: "Files", icon: Paperclip },
    { id: "activity", label: "Activity", icon: Clock },
  ] as const;

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Project not found</p>
        <Button variant="outline" onClick={() => navigate({ to: "/app/projects" })}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderKanban className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-2xl text-foreground">{project.name}</h1>
            <p className="text-muted-foreground mt-1">
              {project.description || "No description provided"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant={
                  project.status === "active"
                    ? "primary"
                    : project.status === "completed"
                      ? "success"
                      : "outline"
                }
              >
                {project.status}
              </Badge>
              <PriorityBadge priority={project.priority} />
              {project.dueDate && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  Due: {new Date(project.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Sparkles className="h-4 w-4" />}
            onClick={() => aiRisk.mutate()}
            loading={aiRisk.isPending}
          >
            AI Health Check
          </Button>
          <Button
            variant="outline"
            leftIcon={<Settings className="h-4 w-4" />}
            onClick={() => {}}
          >
            Settings
          </Button>
          <Button
            variant="danger"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => deleteProject.mutate()}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <QuickStatCard
          title="Tasks Completed"
          value={`${completedTasks}/${totalTasks}`}
          subtitle={`${Math.round(progressPercent)}% done`}
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
        />
        <QuickStatCard
          title="Milestones"
          value={`${completedMilestones}/${totalMilestones}`}
          subtitle="on track"
          icon={<Flag className="h-5 w-5 text-primary" />}
        />
        <QuickStatCard
          title="Team Members"
          value={resources.length}
          subtitle="assigned"
          icon={<Users className="h-5 w-5 text-cyan-400" />}
        />
        <QuickStatCard
          title="Budget"
          value="94%"
          subtitle="utilized"
          icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
        />
      </div>

      {/* AI Insights */}
      {riskAssessment && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              AI Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Risk Level
                </p>
                <p className="font-bold text-lg">{riskAssessment.riskLevel || "Nominal"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Health Score
                </p>
                <p className="font-bold text-lg">{riskAssessment.healthScore || "82"}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Recommendations
                </p>
                <p className="text-sm">{riskAssessment.recommendations || "None"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              activeTab === id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Progress Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Project Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { week: "W1", progress: 15 },
                      { week: "W2", progress: 28 },
                      { week: "W3", progress: 45 },
                      { week: "W4", progress: 62 },
                      { week: "W5", progress: 78 },
                      { week: "W6", progress: 85 },
                    ]}
                  >
                    <defs>
                      <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "11px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="progress"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorProgress)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Task Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Task Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(taskStatusBreakdown).map(([status, count]) => (
                <div key={status} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize text-muted-foreground">
                      {status.replace("_", " ")}
                    </span>
                    <span className="font-bold">{count as number}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        status === "todo"
                          ? "bg-primary/70"
                          : status === "in_progress"
                            ? "bg-warning"
                            : status === "review"
                              ? "bg-cyan-400"
                              : "bg-success"
                      }`}
                      style={{ width: `${totalTasks > 0 ? ((count as number) / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Recent Tasks</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => setActiveTab("tasks")}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          task.status === "done"
                            ? "bg-success"
                            : task.status === "in_progress"
                              ? "bg-warning"
                              : task.status === "review"
                                ? "bg-cyan-400"
                                : "bg-primary/50"
                        }`}
                      />
                      <span className="text-sm font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      {task.assignee && (
                        <span className="text-xs text-muted-foreground">
                          {task.assignee.name || task.assignee}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    No tasks yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Team</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => {}}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resources.slice(0, 4).map((resource: any) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {resource.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{resource.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {resource.role}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" size="sm">
                      {resource.allocation}%
                    </Badge>
                  </div>
                ))}
                {resources.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    No team members
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-4">
          {/* Search and Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
              />
            </div>
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Add Task
            </Button>
          </div>

          {/* Task List */}
          <Card padding="none">
            <div className="divide-y divide-border">
              {filteredTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate({ to: `/app/projects/${id}/tasks` })}
                >
                  <div
                    className={`h-3 w-3 rounded-full shrink-0 ${
                      task.status === "done"
                        ? "bg-success"
                        : task.status === "in_progress"
                          ? "bg-warning"
                          : task.status === "review"
                            ? "bg-cyan-400"
                            : "bg-muted"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.description && (
                      <p className="text-muted-foreground text-xs truncate">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    {task.assignee && (
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {typeof task.assignee === "string"
                          ? task.assignee.charAt(0)
                          : task.assignee.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredTasks.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  {searchQuery ? "No tasks match your search" : "No tasks yet"}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Milestones</h3>
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Add Milestone
            </Button>
          </div>

          <div className="space-y-3">
            {milestones.map((milestone: any, index: number) => (
              <Card key={milestone.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 h-4 w-4 rounded-full shrink-0 ${
                        milestone.status === "completed"
                          ? "bg-success"
                          : milestone.status === "overdue"
                            ? "bg-destructive"
                            : "bg-primary"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{milestone.title}</p>
                          {milestone.description && (
                            <p className="text-muted-foreground text-sm mt-1">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            milestone.status === "completed"
                              ? "success"
                              : milestone.status === "overdue"
                                ? "danger"
                                : "default"
                          }
                        >
                          {milestone.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(milestone.dueDate).toLocaleDateString()}
                        </div>
                        {index < milestones.length - 1 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.ceil(
                              (new Date(milestones[index + 1].dueDate).getTime() -
                                new Date(milestone.dueDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days until next
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {milestones.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No milestones yet. Create your first milestone to track key dates.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "files" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold">Files & Attachments</CardTitle>
            <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />}>
              Upload File
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files uploaded yet</p>
              <p className="text-sm mt-1">
                Upload files to share with your team
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "activity" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  user: "Sarah Chen",
                  action: "completed task",
                  item: "Design review",
                  time: "2 hours ago",
                },
                {
                  user: "Mike Johnson",
                  action: "added comment on",
                  item: "API integration",
                  time: "4 hours ago",
                },
                {
                  user: "Emily Davis",
                  action: "uploaded file",
                  item: "project-spec.pdf",
                  time: "Yesterday",
                },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {activity.user.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{" "}
                      {activity.action}{" "}
                      <span className="font-medium">{activity.item}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Quick Stat Card ─────────────────────────────────────────────────────────

function QuickStatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="font-bold text-xl">{value}</p>
            <p className="text-[10px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
