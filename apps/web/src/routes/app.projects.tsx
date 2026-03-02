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
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { aiApi, nucleoApi } from "../lib/api";

export const Route = createFileRoute("/app/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
  });
  const [projectRiskById, setProjectRiskById] = useState<
    Record<
      string,
      {
        riskScore: number;
        riskLevel: "low" | "medium" | "high";
        blockers: string[];
        nextActions: string[];
      }
    >
  >({});
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
    mutationFn: (payload: {
      name: string;
      description?: string;
      dueDate?: string;
      priority?: "low" | "medium" | "high";
    }) => nucleoApi.projects.create(payload),
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: ["nucleo-projects"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
      setIsCreateModalOpen(false);
      setNewProject({
        name: "",
        description: "",
        priority: "medium",
        dueDate: "",
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to create project"),
  });

  const assessProjectRiskMutation = useMutation({
    mutationFn: (project: any) =>
      aiApi.assessProjectRisk({
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        dueDate: project.dueDate,
      }),
    onSuccess: (response, project) => {
      if (!response.result) {
        toast.error("AI project risk unavailable");
        return;
      }
      setProjectRiskById((prev) => ({ ...prev, [project.id]: response.result! }));
      toast.success("Project risk assessed");
    },
    onError: () => {
      toast.error("Failed to assess project risk");
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.projects.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-projects"] });
      toast.success("Project updated");
    },
    onError: () => toast.error("Failed to update project"),
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => nucleoApi.projects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-projects"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
      toast.success("Project deleted");
    },
    onError: () => toast.error("Failed to delete project"),
  });

  const projects = (data?.data as any[]) || [];
  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(projects.map((project: any) => String(project.status || "planning"))),
    );
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project: any) => {
      if (priorityFilter !== "all" && project.priority !== priorityFilter) {
        return false;
      }
      if (!search.trim()) return true;
      const searchLower = search.toLowerCase();
      return (
        String(project.name || "").toLowerCase().includes(searchLower) ||
        String(project.description || "").toLowerCase().includes(searchLower) ||
        String(project.status || "").toLowerCase().includes(searchLower)
      );
    });
  }, [projects, search, priorityFilter]);

  const planningCount = projects.filter(
    (project: any) => project.status === "planning",
  ).length;
  const activeCount = projects.filter(
    (project: any) => project.status === "active",
  ).length;
  const completedCount = projects.filter(
    (project: any) => project.status === "completed",
  ).length;

  if (isLoading) return <Loading text="Loading projects..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Projects</h1>
          <p className="text-muted-foreground">
            Project workspace for planning, delivery timelines, and priorities.
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Planning</p>
            <p className="font-bold text-2xl text-warning">{planningCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Active</p>
            <p className="font-bold text-2xl text-primary">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Completed</p>
            <p className="font-bold text-2xl text-success">{completedCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project name or description..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-12 w-12" />}
          title="No projects found"
          description="Create your first project or adjust your filters."
          action={{ label: "Create Project", onClick: () => setIsCreateModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project: any) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="line-clamp-1 text-base">
                      {project.name}
                    </CardTitle>
                    <Badge
                      variant={
                        project.priority === "high"
                          ? "danger"
                          : project.priority === "medium"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {project.priority}
                    </Badge>
                  </div>
                  <Badge variant="outline">{project.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="line-clamp-3 text-muted-foreground">
                  {project.description || "No description provided"}
                </p>
                <p className="text-muted-foreground">
                  Due:{" "}
                  <span className="text-foreground">
                    {project.dueDate
                      ? new Date(project.dueDate).toLocaleDateString()
                      : "No due date"}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Updated:{" "}
                  <span className="text-foreground">
                    {project.updatedAt
                      ? new Date(project.updatedAt).toLocaleDateString()
                      : "-"}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <select
                    className="flex h-8 rounded-md border border-border bg-card px-2 text-xs"
                    value={project.status}
                    onChange={(e) =>
                      updateProject.mutate({
                        id: project.id,
                        data: { status: e.target.value },
                      })
                    }
                  >
                    <option value="planning">planning</option>
                    <option value="active">active</option>
                    <option value="on_hold">on_hold</option>
                    <option value="completed">completed</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteProject.mutate(project.id)}
                  >
                    Delete
                  </Button>
                </div>
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Sparkles className="h-4 w-4" />}
                    loading={assessProjectRiskMutation.isPending}
                    onClick={() => assessProjectRiskMutation.mutate(project)}
                  >
                    AI Risk Scan
                  </Button>
                </div>
                {projectRiskById[project.id] ? (
                  <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-2 text-xs">
                    <p className="font-medium text-foreground">
                      Risk: {projectRiskById[project.id].riskLevel} (
                      {projectRiskById[project.id].riskScore})
                    </p>
                    <p className="text-muted-foreground">
                      Blockers: {projectRiskById[project.id].blockers.join(" | ")}
                    </p>
                    <p className="text-muted-foreground">
                      Next: {projectRiskById[project.id].nextActions.join(" | ")}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Project"
        submitText="Create Project"
        loading={createProject.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          const name = newProject.name.trim();
          if (!name) {
            toast.error("Project name is required");
            return;
          }

          let dueDateIso: string | undefined;
          if (newProject.dueDate) {
            const due = new Date(newProject.dueDate);
            if (Number.isNaN(due.getTime())) {
              toast.error("Invalid due date");
              return;
            }
            dueDateIso = due.toISOString();
          }

          createProject.mutate({
            name,
            description: newProject.description.trim() || undefined,
            priority: newProject.priority,
            dueDate: dueDateIso,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Project Name" required>
            <Input
              value={newProject.name}
              onChange={(e) =>
                setNewProject((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Website Revamp - Q2"
              required
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newProject.description}
              onChange={(e) =>
                setNewProject((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="What should this project deliver?"
              rows={5}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Priority">
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={newProject.priority}
                onChange={(e) =>
                  setNewProject((prev) => ({
                    ...prev,
                    priority: e.target.value as "low" | "medium" | "high",
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </FormField>
            <FormField label="Due Date">
              <Input
                type="date"
                value={newProject.dueDate}
                onChange={(e) =>
                  setNewProject((prev) => ({ ...prev, dueDate: e.target.value }))
                }
              />
            </FormField>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
