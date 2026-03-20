import { Outlet, useNavigate } from "@tanstack/react-router";
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
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
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
  Search,
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
import { z } from "zod";
import { aiApi, nucleoApi } from "../lib/api";

const MilestoneIcon = Milestone;

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects")({
  validateSearch: z.object({
    view: z.enum(["board", "timeline", "milestones", "resources"]).optional(),
  }),
  component: ProjectsLayout,
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
  allocation: number;
  startDate: string;
  endDate?: string;
};

// ─── Main Layout ────────────────────────────────────────────────────────────────

function ProjectsLayout() {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["nucleo-projects", statusFilter],
    queryFn: () =>
      nucleoApi.projects.list({
        page: 1,
        limit: 100,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  const projects = (data?.data as any[]) || [];

  const filteredProjects = useMemo(
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

  if (isLoading) return <Loading text="Loading projects..." />;

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar */}
      <div className="w-72 shrink-0 space-y-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Manage projects, tasks, and resources
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<LayoutGrid className="h-4 w-4" />}
            onClick={() => navigate({ to: "/app/projects/board" })}
            className="justify-start"
          >
            Board
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<GanttChart className="h-4 w-4" />}
            onClick={() => navigate({ to: "/app/projects/timeline" })}
            className="justify-start"
          >
            Timeline
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Flag className="h-4 w-4" />}
            onClick={() => navigate({ to: "/app/projects/risks" })}
            className="justify-start"
          >
            Risks
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Calendar className="h-4 w-4" />}
            onClick={() => navigate({ to: "/app/projects/capacity" })}
            className="justify-start"
          >
            Capacity
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
          />
        </div>

        {/* Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>

        {/* Project List */}
        <div className="space-y-2">
          <p className="mb-1 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
            Projects ({filteredProjects.length})
          </p>
          {filteredProjects.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="h-10 w-10" />}
              title="No projects"
              action={{
                label: "Create",
                onClick: () => {},
              }}
            />
          ) : (
            filteredProjects.map((project: any) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  selectedProjectId === project.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                }`}
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

        {/* Navigation Links */}
        <div className="space-y-1 border-t border-border pt-4">
          <NavLink icon={<ListTodo className="h-4 w-4" />} label="Sprints" to="/app/projects/sprints" />
          <NavLink icon={<Clock className="h-4 w-4" />} label="Time Tracking" to="/app/projects/time" />
          <NavLink icon={<DollarSign className="h-4 w-4" />} label="Budget" to="/app/projects/budget" />
          <NavLink icon={<FileText className="h-4 w-4" />} label="Templates" to="/app/projects/templates" />
          <NavLink icon={<Link2 className="h-4 w-4" />} label="Client Portal" to="/app/projects/client-portal" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

// ─── Nav Link Component ──────────────────────────────────────────────────────

function NavLink({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  const navigate = useNavigate();
  const currentPath = Route.useMatch({ strict: false })?.requestedPath || "";

  return (
    <button
      type="button"
      onClick={() => navigate({ to })}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        currentPath === to
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Priority Badge ──────────────────────────────────────────────────────────

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

// ─── Metric Card ─────────────────────────────────────────────────────────────

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

export { Metric, PriorityBadge };
