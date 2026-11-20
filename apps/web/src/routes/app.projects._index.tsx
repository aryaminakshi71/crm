import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Brain,
  Briefcase,
  Calendar,
  ChartBar,
  Clock,
  DollarSign,
  FileText,
  Flag,
  FolderKanban,
  GanttChart,
  LayoutGrid,
  Link2,
  ListTodo,
  Milestone,
  Plus,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { nucleoApi } from "@/lib/api";

// ─── Route ──────────────────────────────────────────────────────────────────

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/projects/_index")({
  validateSearch: searchSchema,
  component: ProjectsIndexPage,
});

function ProjectsIndexPage() {
  const { q = "", status, page = 1 } = useSearch({ from: "/app/projects/_index" });
  const navigate = useNavigate({ from: "/app/projects" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["nucleo-projects"],
    queryFn: () => nucleoApi.projects.list({ page: 1, limit: 100 }),
  });

  const projects = (data?.data as any[]) || [];

  const activeProjects = projects.filter((p: any) => p.status === "active");
  const completedProjects = projects.filter((p: any) => p.status === "completed");
  const planningProjects = projects.filter((p: any) => p.status === "planning");

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load data. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Projects Overview</h2>
          <p className="text-muted-foreground text-sm">
            Dashboard with project metrics and status
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {}}
        >
          New Project
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          title="Active Projects"
          value={activeProjects.length}
          icon={<Briefcase className="h-4 w-4" />}
          trend={`${planningProjects.length} planning`}
          color="text-primary"
        />
        <MetricCard
          title="Completed Projects"
          value={completedProjects.length}
          icon={<Target className="h-4 w-4" />}
          trend="All time"
          color="text-success"
        />
        <MetricCard
          title="Total Projects"
          value={projects.length}
          icon={<Users className="h-4 w-4" />}
          trend={`${projects.length > 0 ? "projects loaded" : "no projects"}`}
          color="text-warning"
        />
        <MetricCard
          title="In Planning"
          value={planningProjects.length}
          icon={<DollarSign className="h-4 w-4" />}
          trend="In pipeline"
          color="text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Project Velocity Chart */}
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
                  data={projects.slice(0, 6).map((p: any, i: number) => ({
                    name: p.name?.substring(0, 8) ?? `Project ${i + 1}`,
                    progress: p.progress ?? Math.round(Math.random() * 80 + 10),
                  }))}
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
                    dataKey="progress"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorVel)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Active", value: activeProjects.length, color: "#22d3ee" },
                      { name: "Planning", value: planningProjects.length, color: "#f59e0b" },
                      { name: "Completed", value: completedProjects.length, color: "#22c55e" },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {[
                      { color: "#22d3ee" },
                      { color: "#f59e0b" },
                      { color: "#22c55e" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: "Active", value: activeProjects.length, color: "bg-primary" },
                { label: "Planning", value: planningProjects.length, color: "bg-warning" },
                { label: "Completed", value: completedProjects.length, color: "bg-success" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${item.color}`} />
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <QuickAccessCard
          icon={<LayoutGrid className="h-6 w-6 text-primary" />}
          title="Kanban Board"
          description="Visualize task workflow"
          onClick={() => navigate({ to: "/app/projects/board" })}
        />
        <QuickAccessCard
          icon={<GanttChart className="h-6 w-6 text-cyan-400" />}
          title="Timeline"
          description="View project schedule"
          onClick={() => navigate({ to: "/app/projects/timeline" })}
        />
        <QuickAccessCard
          icon={<Flag className="h-6 w-6 text-emerald-400" />}
          title="Milestones"
          description="Track key dates"
          onClick={() => navigate({ to: "/app/projects/risks" })}
        />
        <QuickAccessCard
          icon={<Calendar className="h-6 w-6 text-amber-400" />}
          title="Capacity"
          description="Plan team capacity"
          onClick={() => navigate({ to: "/app/projects/capacity" })}
        />
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">Recent Projects</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => navigate({ to: "/app/projects" })}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.slice(0, 5).map((project: any) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate({ to: `/app/projects/${project.id}` })}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{project.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {project.description || "No description"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  <Badge
                    variant={
                      project.priority === "high"
                        ? "danger"
                        : project.priority === "medium"
                          ? "warning"
                          : "default"
                    }
                  >
                    {project.priority}
                  </Badge>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No projects yet. Create your first project to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Risk Overview</CardTitle>
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
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
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
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Quick Access Card ───────────────────────────────────────────────────────

function QuickAccessCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="mb-3">{icon}</div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-muted-foreground text-xs">{description}</p>
    </button>
  );
}
