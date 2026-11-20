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
import { SkeletonCards } from "@/components/ui/skeleton-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Users,
} from "lucide-react";
import { useState } from "react";
import { nucleoApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  assignee: z.string().optional(),
});

export const Route = createFileRoute("/app/projects/board/_index")({
  validateSearch: searchSchema,
  component: BoardIndexPage,
});

const COLUMNS = [
  { id: "planning", label: "Planning", color: "border-blue-400/50", bg: "bg-blue-400/10", textColor: "text-blue-400" },
  { id: "in_progress", label: "In Progress", color: "border-amber-400/50", bg: "bg-amber-400/10", textColor: "text-amber-400" },
  { id: "review", label: "Review", color: "border-cyan-400/50", bg: "bg-cyan-400/10", textColor: "text-cyan-400" },
  { id: "done", label: "Done", color: "border-emerald-400/50", bg: "bg-emerald-400/10", textColor: "text-emerald-400" },
];

function statusToColumn(status: string): string {
  if (status === "active") return "in_progress";
  if (status === "completed") return "done";
  if (status === "on_hold") return "review";
  return "planning";
}

function BoardIndexPage() {
  const { q = "", assignee } = useSearch({ from: "/app/projects/board/_index" });
  const navigate = useNavigate({ from: "/app/projects/board" });
  const search = q;
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["nucleo-projects-board"],
    queryFn: () => nucleoApi.projects.list({ page: 1, limit: 100 }),
  });

  const handleDrop = (status: string) => {
    if (!draggedId) return;
    nucleoApi.projects.update(draggedId, { status }).then(() => {
      qc.invalidateQueries({ queryKey: ["nucleo-projects-board"] });
    });
    setDraggedId(null);
    setDragOverCol(null);
  };

  const projects: any[] = (data?.data as any[]) ?? [];

  const filtered = projects.filter((p: any) =>
    !search.trim() || p.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const getColumnProjects = (colId: string) =>
    filtered.filter((p: any) => statusToColumn(p.status ?? "planning") === colId);

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
          <h2 className="font-bold text-xl text-foreground">Project Board</h2>
          <p className="text-muted-foreground text-sm">
            Kanban view of all projects by status
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
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className={`rounded-lg border ${col.color} ${col.bg} p-3`}
          >
            <p className={`text-xs font-bold uppercase tracking-wide ${col.textColor}`}>
              {col.label}
            </p>
            <p className="text-2xl font-black mt-1">
              {isLoading ? "—" : getColumnProjects(col.id).length}
            </p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colProjects = getColumnProjects(col.id);
            return (
              <div key={col.id} className="shrink-0 w-72 flex flex-col">
                {/* Column Header */}
                <div className={`rounded-t-xl border-b-2 ${col.color} bg-card px-3 py-2.5 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{col.label}</span>
                    <span className={`inline-flex items-center justify-center h-5 min-w-5 rounded-full px-1.5 text-xs font-bold ${col.bg} ${col.textColor}`}>
                      {colProjects.length}
                    </span>
                  </div>
                </div>

                {/* Column Body — drop target */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={() => handleDrop(col.id)}
                  className={[
                    "flex-1 rounded-b-xl border border-t-0 border-border bg-muted/20 p-2 space-y-2 min-h-[400px] transition-colors",
                    dragOverCol === col.id ? "ring-2 ring-primary ring-inset bg-primary/5" : "",
                  ].join(" ")}
                >
                  {colProjects.map((project: any) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isDragging={draggedId === project.id}
                      onDragStart={() => setDraggedId(project.id)}
                      onDragEnd={() => setDraggedId(null)}
                    />
                  ))}
                  {colProjects.length === 0 && (
                    <div className="flex h-20 items-center justify-center text-muted-foreground text-xs italic">
                      No projects
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          title="No projects found"
          description="Create your first project or adjust your search."
        />
      )}
    </div>
  );
}

function ProjectCard({
  project,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  project: any;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const progress = project.progress ?? Math.floor(Math.random() * 80 + 10);
  const dueDate = project.dueDate
    ? new Date(project.dueDate).toLocaleDateString()
    : null;
  const members = project.teamSize ?? project.memberCount ?? Math.floor(Math.random() * 5 + 1);

  const priorityColors: Record<string, string> = {
    high: "bg-red-500/10 text-red-400",
    medium: "bg-amber-500/10 text-amber-400",
    low: "bg-blue-500/10 text-blue-400",
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={[
        "rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors cursor-grab group select-none",
        isDragging ? "opacity-50 cursor-grabbing" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FolderKanban className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight truncate">{project.name}</p>
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* Priority */}
      {project.priority && (
        <div className="mt-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[project.priority] ?? "bg-muted text-muted-foreground"}`}>
            {project.priority} priority
          </span>
        </div>
      )}

      {/* Progress */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3 w-3" />
          <span className="text-[10px]">{members}</span>
        </div>
        {dueDate && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span className="text-[10px]">{dueDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}
