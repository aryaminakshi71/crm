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
  SkeletonListPage,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  Brain,
  Flag,
  FolderKanban,
  GanttChart,
  LayoutGrid,
  Milestone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
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
import { z } from "zod";
import { aiApi, nucleoApi } from "../lib/api";

const MilestoneIcon = Milestone;

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects")({
  validateSearch: z.object({
    view: z.enum(["board", "timeline", "milestones", "resources"]).optional(),
  }),
  component: ProjectsPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type Task = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignee?: string;
  dueDate?: string;
  createdAt: string;
};

type Milestone = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: "pending" | "completed" | "overdue";
  createdAt: string;
};

type Resource = {
  id: string;
  projectId: string;
  name: string;
  role: string;
  allocation: number; // 0-100 %
  startDate: string;
  endDate?: string;
};

const LS_TASKS = "nucleo_project_tasks";
const LS_MILESTONES = "nucleo_project_milestones";
const LS_RESOURCES = "nucleo_project_resources";

function lsRead<T>(key: string): T[] {
  return [];
}
function lsWrite<T>(key: string, data: T[]) {
  // no-op
}

// ─── Priority badge ──────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: "bg-destructive/15 text-destructive",
    medium: "bg-warning/15 text-warning",
    low: "bg-success/15 text-success",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[priority] ?? "bg-muted text-muted-foreground"}`}
    >
      {priority}
    </span>
  );
}

const KANBAN_COLS: { id: Task["status"]; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "border-muted-foreground/30" },
  { id: "todo", label: "To Do", color: "border-primary/40" },
  { id: "in_progress", label: "In Progress", color: "border-warning/50" },
  { id: "review", label: "Review", color: "border-cyan-400/50" },
  { id: "done", label: "Done", color: "border-success/50" },
];

type ProjectView = "board" | "timeline" | "milestones" | "resources";

const VIEW_TABS: { id: ProjectView; label: string; icon: React.ElementType }[] =
  [
    { id: "board", label: "Kanban Board", icon: LayoutGrid },
    { id: "timeline", label: "Timeline", icon: GanttChart },
    { id: "milestones", label: "Milestones", icon: Flag },
    { id: "resources", label: "Resources", icon: Users },
  ];

// ─── Main Page ────────────────────────────────────────────────────────────────

function ProjectsPage() {
  const { view: viewParam } = Route.useSearch();
  const [view, setView] = useState<ProjectView>(viewParam ?? "board");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
  });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    assignee: "",
    dueDate: "",
    status: "todo" as Task["status"],
  });

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    name: "",
    role: "",
    allocation: "100",
    startDate: "",
    endDate: "",
  });

  const [projectRisk, setProjectRisk] = useState<Record<string, any>>({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["nucleo-projects", statusFilter],
    queryFn: () =>
      nucleoApi.projects.list({
        page: 1,
        limit: 100,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  const createProject = useMutation({
    mutationFn: (payload: any) => nucleoApi.projects.create(payload),
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: ["nucleo-projects"] });
      setIsCreateModalOpen(false);
      setNewProject({
        name: "",
        description: "",
        priority: "medium",
        dueDate: "",
      });
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.projects.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-projects"] });
      toast.success("Project updated");
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => nucleoApi.projects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-projects"] });
      setSelectedProject(null);
      toast.success("Project deleted");
    },
  });

  const aiRisk = useMutation({
    mutationFn: (project: any) =>
      aiApi.assessProjectRisk({
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        dueDate: project.dueDate,
      }),
    onSuccess: (res, project) => {
      if (res.result)
        setProjectRisk((p) => ({ ...p, [project.id]: res.result }));
      toast.success("AI risk assessed");
    },
    onError: () => toast.error("AI risk failed"),
  });

  const { data: rawTasks } = useQuery({
    queryKey: ["nucleo-project-tasks", selectedProject?.id],
    queryFn: () => nucleoApi.projects.tasks.list(selectedProject!.id),
    enabled: !!selectedProject,
  });
  const tasks = rawTasks?.data || [];

  const { data: rawMilestones } = useQuery({
    queryKey: ["nucleo-project-milestones", selectedProject?.id],
    queryFn: () => nucleoApi.projects.milestones.list(selectedProject!.id),
    enabled: !!selectedProject,
  });
  const milestones = rawMilestones?.data || [];

  const { data: rawResources } = useQuery({
    queryKey: ["nucleo-project-resources", selectedProject?.id],
    queryFn: () => nucleoApi.projects.resources.list(selectedProject!.id),
    enabled: !!selectedProject,
  });
  const resources = rawResources?.data || [];

  const projects = (data?.data as any[]) || [];
  const filtered = useMemo(
    () =>
      projects.filter((p: any) => {
        if (!search.trim()) return true;
        return (
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [projects, search],
  );

  const planningCount = projects.filter(
    (p: any) => p.status === "planning",
  ).length;
  const activeCount = projects.filter((p: any) => p.status === "active").length;
  const completedCount = projects.filter(
    (p: any) => p.status === "completed",
  ).length;

  const projectTasks = (pid: string) => tasks;
  
  const createTaskMut = useMutation({
    mutationFn: (data: any) => nucleoApi.projects.tasks.create(selectedProject!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-tasks", selectedProject?.id] });
      toast.success("Task added");
      setIsTaskModalOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        assignee: "",
        dueDate: "",
        status: "todo",
      });
    },
    onError: (e) => toast.error(e.message || "Failed to add task")
  });
  const updateTaskMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => nucleoApi.projects.tasks.update(selectedProject!.id, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nucleo-project-tasks", selectedProject?.id] }),
  });
  const deleteTaskMut = useMutation({
    mutationFn: (id: string) => nucleoApi.projects.tasks.delete(selectedProject!.id, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nucleo-project-tasks", selectedProject?.id] }),
  });

  const addTask = () => {
    if (!selectedProject) return;
    createTaskMut.mutate({
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      assigneeId: newTask.assignee || undefined,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
    });
  };
  const moveTask = (taskId: string, status: Task["status"]) => {
    updateTaskMut.mutate({ id: taskId, data: { status } });
  };
  const deleteTask = (taskId: string) => {
    deleteTaskMut.mutate(taskId);
  };

  const projectMilestones = (pid: string) => milestones;
  
  const createMilestoneMut = useMutation({
    mutationFn: (data: any) => nucleoApi.projects.milestones.create(selectedProject!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-milestones", selectedProject?.id] });
      toast.success("Milestone added");
      setIsMilestoneModalOpen(false);
      setNewMilestone({ title: "", description: "", dueDate: "" });
    },
    onError: (e) => toast.error(e.message || "Failed")
  });
  const updateMilestoneMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => nucleoApi.projects.milestones.update(selectedProject!.id, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nucleo-project-milestones", selectedProject?.id] }),
  });
  const deleteMilestoneMut = useMutation({
    mutationFn: (id: string) => nucleoApi.projects.milestones.delete(selectedProject!.id, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nucleo-project-milestones", selectedProject?.id] }),
  });

  const addMilestone = () => {
    if (!selectedProject) return;
    createMilestoneMut.mutate({
      title: newMilestone.title,
      targetDate: newMilestone.dueDate ? new Date(newMilestone.dueDate).toISOString() : undefined,
    });
  };
  const toggleMilestone = (id: string) => {
    const m = milestones.find((m: any) => m.id === id);
    if (!m) return;
    updateMilestoneMut.mutate({ id, data: { status: m.status === "completed" ? "pending" : "completed" } });
  };
  const deleteMilestone = (id: string) => {
    deleteMilestoneMut.mutate(id);
  };

  const projectResources = (pid: string) => resources;
  
  const createResourceMut = useMutation({
    mutationFn: (data: any) => nucleoApi.projects.resources.create(selectedProject!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-resources", selectedProject?.id] });
      toast.success("Resource added");
      setIsResourceModalOpen(false);
      setNewResource({
        name: "",
        role: "",
        allocation: "100",
        startDate: "",
        endDate: "",
      });
    },
    onError: (e) => toast.error(e.message || "Failed")
  });
  const deleteResourceMut = useMutation({
    mutationFn: (id: string) => nucleoApi.projects.resources.delete(selectedProject!.id, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nucleo-project-resources", selectedProject?.id] }),
  });

  const addResource = () => {
    if (!selectedProject) return;
    createResourceMut.mutate({
      name: newResource.name,
      role: newResource.role,
      allocation: Number(newResource.allocation) || 100,
      startDate: newResource.startDate ? new Date(newResource.startDate).toISOString() : undefined,
      endDate: newResource.endDate ? new Date(newResource.endDate).toISOString() : undefined,
    });
  };
  const deleteResource = (id: string) => {
    deleteResourceMut.mutate(id);
  };

  if (isLoading) return <div className="p-6"><SkeletonListPage /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Kanban board, timeline, milestones & resource allocation.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateModalOpen(true)}
          loading={createProject.isPending}
        >
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Active Tasks"
          value={tasks.filter((t: any) => t.status !== "done").length}
          icon={<Activity className="h-4 w-4" />}
          trend="High Load"
          color="text-primary"
        />
        <Metric
          title="Milestone Health"
          value="84%"
          icon={<ShieldCheck className="h-4 w-4" />}
          trend="2 on track"
          color="text-cyan-400"
        />
        <Metric
          title="Project ROI"
          value="4.2x"
          icon={<Zap className="h-4 w-4" />}
          trend="Exceeding"
          color="text-emerald-400"
        />
        <Metric
          title="Resource Cap"
          value="92%"
          icon={<Users className="h-4 w-4" />}
          trend="Near peak"
          color="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Project Velocity
              </CardTitle>
              <p className="text-2xl font-black text-foreground">
                Burnup Progress
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { week: "W1", ideal: 20, actual: 18 },
                    { week: "W2", ideal: 40, actual: 35 },
                    { week: "W3", ideal: 60, actual: 62 },
                    { week: "W4", ideal: 80, actual: 85 },
                    { week: "W5", ideal: 100, actual: 105 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorVel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
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
                    dataKey="actual"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorVel)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="ideal"
                    stroke="#888"
                    fillOpacity={0}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Risk Matrix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[
                { label: "Scope Creep", val: 30, color: "bg-emerald-400" },
                { label: "Resource Deficit", val: 65, color: "bg-amber-400" },
                { label: "Timeline Slippage", val: 12, color: "bg-primary" },
              ].map((risk) => (
                <div key={risk.label} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>{risk.label}</span>
                    <span>{risk.val}%</span>
                  </div>
                  <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${risk.color}`}
                      style={{ width: `${risk.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-3 w-3 text-destructive" />
                <span className="text-[10px] font-bold uppercase text-destructive">
                  Critical Path Alert
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Resource exhaustion detected on **UX Phase**. Reallocation
                recommended within 24h.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Two-pane layout */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          <p className="mb-1 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
            Projects ({filtered.length})
          </p>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="h-10 w-10" />}
              title="No projects"
              action={<Button onClick={() => setIsCreateModalOpen(true)}>Create</Button>}
            />
          ) : (
            filtered.map((project: any) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProject(project)}
                className={`w-full rounded-xl border p-3 text-left transition-all ${selectedProject?.id === project.id ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 font-medium text-foreground text-sm">
                    {project.name}
                  </p>
                  <PriorityBadge priority={project.priority} />
                </div>
                <div className="mt-1 flex items-center gap-2">
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
                </div>
              </button>
            ))
          )}
        </div>

        <div className="space-y-4">
          {selectedProject ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div>
                  <h2 className="font-bold text-foreground text-xl">
                    {selectedProject.name}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {selectedProject.description || "No description"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      variant={
                        selectedProject.status === "active"
                          ? "primary"
                          : selectedProject.status === "completed"
                            ? "success"
                            : "outline"
                      }
                    >
                      {selectedProject.status}
                    </Badge>
                    <PriorityBadge priority={selectedProject.priority} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Sparkles className="h-4 w-4" />}
                    onClick={() => aiRisk.mutate(selectedProject)}
                    loading={aiRisk.isPending}
                  >
                    AI Health
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => deleteProject.mutate(selectedProject.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* AI Insights Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="py-2.5">
                    <CardTitle className="text-[10px] font-bold uppercase text-primary flex items-center gap-2">
                      <Brain className="h-3.5 w-3.5" /> Project IQ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 pt-0">
                    <p className="text-xs font-semibold">
                      Stability: <span className="text-success">Prime</span>
                    </p>
                    <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: "82%" }}
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={`${projectRisk[selectedProject.id]?.riskLevel === "High" ? "border-destructive/30 bg-destructive/5" : ""}`}
                >
                  <CardHeader className="py-2.5">
                    <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" /> Risk Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 pt-0">
                    <p className="text-xs font-semibold text-foreground">
                      {projectRisk[selectedProject.id]?.riskLevel || "Nominal"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      SLA Breach Probability: 4%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2.5">
                    <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                      <Target className="h-3.5 w-3.5" /> Velocity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 pt-0">
                    <p className="text-xs font-semibold">
                      12.4 <span className="text-success ml-1">↑ 8%</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Tasks finalized per week
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* View Tabs */}
              <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
                {VIEW_TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setView(id)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${view === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* View Rendering */}
              {view === "board" && (
                <div className="grid gap-3 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2">
                  {KANBAN_COLS.map((col) => {
                    const colTasks = projectTasks(selectedProject.id).filter(
                      (t) => t.status === col.id,
                    );
                    return (
                      <div
                        key={col.id}
                        className={`rounded-xl border border-border bg-muted/20 p-3 space-y-2`}
                      >
                        <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground px-1">
                          {col.label}
                        </p>
                        {colTasks.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-lg border border-border bg-card p-2.5 shadow-sm space-y-2"
                          >
                            <p className="text-xs font-semibold leading-tight">
                              {t.title}
                            </p>
                            <div className="flex items-center justify-between">
                              <PriorityBadge priority={t.priority} />
                              <div className="flex gap-1">
                                {KANBAN_COLS.filter((c) => c.id !== t.status)
                                  .slice(0, 1)
                                  .map((c) => (
                                    <button
                                      key={c.id}
                                      onClick={() => moveTask(t.id, c.id)}
                                      className="text-[9px] text-muted-foreground hover:text-primary"
                                    >
                                      → {c.label}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {view === "timeline" && (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30 border-b border-border text-muted-foreground font-bold">
                      <tr>
                        <th className="px-4 py-2.5 text-left">Task</th>
                        <th className="px-4 py-2.5 text-left">Assignee</th>
                        <th className="px-4 py-2.5 text-left">Status</th>
                        <th className="px-4 py-2.5 text-left">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {projectTasks(selectedProject.id).map((t) => (
                        <tr key={t.id} className="hover:bg-muted/10">
                          <td className="px-4 py-2.5 font-medium">{t.title}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {t.assignee || "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className="h-5 text-[9px]">
                              {t.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width:
                                    t.status === "done"
                                      ? "100%"
                                      : t.status === "review"
                                        ? "80%"
                                        : t.status === "in_progress"
                                          ? "40%"
                                          : "5%",
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {view === "milestones" && (
                <div className="space-y-3">
                  {projectMilestones(selectedProject.id).map((m) => (
                    <div
                      key={m.id}
                      className="flex gap-3 items-start p-3 border border-border rounded-xl bg-card"
                    >
                      <div
                        className={`mt-1 h-3 w-3 rounded-full ${m.status === "completed" ? "bg-success" : "bg-primary"}`}
                      />
                      <div className="flex-1">
                        <p className="text-xs font-bold">{m.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Due: {new Date(m.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleMilestone(m.id)}
                        className="text-[10px] font-bold text-primary"
                      >
                        {m.status === "completed" ? "Reopen" : "Done"}
                      </button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsMilestoneModalOpen(true)}
                  >
                    Add Milestone
                  </Button>
                </div>
              )}

              {view === "resources" && (
                <div className="grid grid-cols-1 gap-3">
                  {projectResources(selectedProject.id).map((r) => (
                    <div
                      key={r.id}
                      className="p-3 border border-border rounded-xl bg-card flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {r.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{r.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {r.role}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xs font-bold ${r.allocation > 100 ? "text-danger" : "text-foreground"}`}
                        >
                          {r.allocation}%
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsResourceModalOpen(true)}
                  >
                    Add Resource
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 text-muted-foreground text-sm italic">
              Select a project to see details
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="New Project"
        onSubmit={(e) => {
          e.preventDefault();
          createProject.mutate(newProject);
        }}
      >
        <div className="space-y-3">
          <FormField label="Name">
            <Input
              value={newProject.name}
              onChange={(e) =>
                setNewProject((p) => ({ ...p, name: e.target.value }))
              }
            />
          </FormField>
        </div>
      </FormModal>
      <FormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="New Task"
        onSubmit={(e) => {
          e.preventDefault();
          addTask();
        }}
      >
        <div className="space-y-3">
          <FormField label="Title">
            <Input
              value={newTask.title}
              onChange={(e) =>
                setNewTask((t) => ({ ...t, title: e.target.value }))
              }
            />
          </FormField>
        </div>
      </FormModal>
      <FormModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title="New Milestone"
        onSubmit={(e) => {
          e.preventDefault();
          addMilestone();
        }}
      >
        <div className="space-y-3">
          <FormField label="Title">
            <Input
              value={newMilestone.title}
              onChange={(e) =>
                setNewMilestone((m) => ({ ...m, title: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Due Date">
            <Input
              type="date"
              value={newMilestone.dueDate}
              onChange={(e) =>
                setNewMilestone((m) => ({ ...m, dueDate: e.target.value }))
              }
            />
          </FormField>
        </div>
      </FormModal>
      <FormModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        title="New Resource"
        onSubmit={(e) => {
          e.preventDefault();
          addResource();
        }}
      >
        <div className="space-y-3">
          <FormField label="Name">
            <Input
              value={newResource.name}
              onChange={(e) =>
                setNewResource((r) => ({ ...r, name: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Role">
            <Input
              value={newResource.role}
              onChange={(e) =>
                setNewResource((r) => ({ ...r, role: e.target.value }))
              }
            />
          </FormField>
        </div>
      </FormModal>
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
            {icon || <FolderKanban className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
