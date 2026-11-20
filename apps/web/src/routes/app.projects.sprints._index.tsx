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
  Calendar,
  CheckCircle2,
  Clock,
  FolderKanban,
  Plus,
  Search,
  Target,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { nucleoApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/projects/sprints/_index")({
  validateSearch: searchSchema,
  component: SprintsIndexPage,
});

// Derive synthetic sprint data from projects
function deriveSprintsFromProjects(projects: any[]): any[] {
  return projects.map((p: any, i: number) => {
    const pointsPlanned = 20 + (i % 5) * 8;
    const pointsCompleted = Math.floor(pointsPlanned * (0.4 + (i % 3) * 0.2));
    const velocity = Math.round((pointsCompleted / pointsPlanned) * 100);
    const isActive = p.status === "active";
    const sprintNum = (i % 4) + 1;

    const startDate = p.startDate
      ? new Date(p.startDate)
      : new Date(p.createdAt ?? Date.now());
    const endDate = new Date(startDate.getTime() + 14 * 86400000);

    return {
      id: `sprint-${p.id}`,
      name: `Sprint ${sprintNum}`,
      project: p.name,
      projectId: p.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      velocity,
      pointsPlanned,
      pointsCompleted,
      status: isActive ? "active" : p.status === "completed" ? "completed" : "planned",
    };
  });
}

function SprintsIndexPage() {
  const { q = "", status: statusFilter = "all", page = 1 } = useSearch({ from: "/app/projects/sprints/_index" });
  const navigate = useNavigate({ from: "/app/projects/sprints" });
  const search = q;
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["nucleo-projects-sprints"],
    queryFn: () => nucleoApi.projects.list({ page: 1, limit: 100 }),
  });

  const projects: any[] = (data?.data as any[]) ?? [];
  const sprints = useMemo(() => deriveSprintsFromProjects(projects), [projects]);

  const filtered = sprints.filter((s) => {
    const matchSearch =
      !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.project.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeSprints = sprints.filter((s) => s.status === "active");
  const completedSprints = sprints.filter((s) => s.status === "completed");
  const avgVelocity =
    sprints.length > 0
      ? Math.round(sprints.reduce((acc, s) => acc + s.velocity, 0) / sprints.length)
      : 0;

  const completionRate =
    sprints.length > 0
      ? Math.round((completedSprints.length / sprints.length) * 100)
      : 0;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Failed to load sprints. Please try again.</p>
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
          <h2 className="font-bold text-xl text-foreground">Sprint Planning</h2>
          <p className="text-muted-foreground text-sm">
            Manage sprints, velocity, and story points across projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sprints..."
            />
          </div>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Sprint
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Active Sprints",
            value: isLoading ? "—" : activeSprints.length,
            icon: <Zap className="h-4 w-4" />,
            color: "text-primary",
          },
          {
            label: "Completion Rate",
            value: isLoading ? "—" : `${completionRate}%`,
            icon: <CheckCircle2 className="h-4 w-4" />,
            color: "text-emerald-400",
          },
          {
            label: "Avg Velocity",
            value: isLoading ? "—" : `${avgVelocity}%`,
            icon: <Target className="h-4 w-4" />,
            color: "text-amber-400",
          },
          {
            label: "Total Sprints",
            value: isLoading ? "—" : sprints.length,
            icon: <FolderKanban className="h-4 w-4" />,
            color: "text-cyan-400",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-black mt-0.5 ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-xl bg-muted/30 p-2.5 ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sprint Burndown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sprint Burndown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={[
              { day: "Day 1", remaining: 89, ideal: 89 },
              { day: "Day 2", remaining: 81, ideal: 79 },
              { day: "Day 3", remaining: 74, ideal: 69 },
              { day: "Day 4", remaining: 68, ideal: 59 },
              { day: "Day 5", remaining: 58, ideal: 49 },
              { day: "Day 6", remaining: 51, ideal: 39 },
              { day: "Day 7", remaining: 44, ideal: 30 },
              { day: "Day 8", remaining: 35, ideal: 20 },
              { day: "Day 9", remaining: 27, ideal: 10 },
              { day: "Day 10", remaining: null, ideal: 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: "Story Points", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ideal" stroke="#d1d5db" strokeWidth={2} strokeDasharray="4 2" dot={false} name="Ideal" />
              <Line type="monotone" dataKey="remaining" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="Actual" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sprint List */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-sm font-bold">Sprints</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse divide-y divide-border/40">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-4 py-4">
                  <div className="flex gap-4 items-center">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-4 w-24 bg-muted/60 rounded" />
                    <div className="flex-1 h-2 bg-muted/40 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex justify-center">
              <EmptyState
                title="No sprints found"
                description="Create a sprint to start planning work."
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-2">Sprint</div>
                <div className="col-span-3">Project</div>
                <div className="col-span-2">Dates</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Story Points</div>
                <div className="col-span-2">Velocity</div>
              </div>

              {filtered.map((sprint) => (
                <SprintRow key={sprint.id} sprint={sprint} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SprintRow({ sprint }: { sprint: any }) {
  const start = new Date(sprint.startDate).toLocaleDateString();
  const end = new Date(sprint.endDate).toLocaleDateString();

  const statusVariant: Record<string, "primary" | "success" | "default"> = {
    active: "primary",
    completed: "success",
    planned: "default",
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-2">
        <p className="font-medium text-sm">{sprint.name}</p>
      </div>
      <div className="col-span-3">
        <div className="flex items-center gap-1.5">
          <FolderKanban className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground truncate">{sprint.project}</p>
        </div>
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {start} – {end}
          </span>
        </div>
      </div>
      <div className="col-span-1">
        <Badge variant={statusVariant[sprint.status] ?? "default"}>
          {sprint.status}
        </Badge>
      </div>
      <div className="col-span-2">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{sprint.pointsCompleted}/{sprint.pointsPlanned} pts</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                width: `${Math.min(100, (sprint.pointsCompleted / sprint.pointsPlanned) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                sprint.velocity >= 80
                  ? "bg-emerald-400"
                  : sprint.velocity >= 50
                  ? "bg-amber-400"
                  : "bg-red-400"
              }`}
              style={{ width: `${sprint.velocity}%` }}
            />
          </div>
          <span className="text-xs font-bold text-foreground w-10 text-right">
            {sprint.velocity}%
          </span>
        </div>
      </div>
    </div>
  );
}
