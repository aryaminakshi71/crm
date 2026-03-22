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
import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  CheckSquare,
  Clock,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Square,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";
import { PriorityBadge } from "./app.projects";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/board")({
  component: KanbanBoardPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type Task = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: string;
  createdAt: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  comments?: number;
  attachments?: number;
};

// ─── Kanban Columns ─────────────────────────────────────────────────────────

const KANBAN_COLS: { id: Task["status"]; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "border-muted-foreground/30" },
  { id: "todo", label: "To Do", color: "border-primary/40" },
  { id: "in_progress", label: "In Progress", color: "border-warning/50" },
  { id: "review", label: "Review", color: "border-cyan-400/50" },
  { id: "done", label: "Done", color: "border-success/50" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

function KanbanBoardPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Task["status"] | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Get all projects
  const { data: projectsData } = useQuery({
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

  const tasks = (tasksData?.data as Task[]) || [];

  // Filter tasks by search
  const filteredTasks = useMemo(() => {
    if (!search.trim()) return tasks;
    return tasks.filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search]);

  // Task mutations
  const updateTaskMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      nucleoApi.projects.tasks.update(selectedProject?.id, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-tasks", selectedProject?.id] });
      toast.success("Task updated");
    },
    onError: () => toast.error("Failed to update task"),
  });

  const createTaskMut = useMutation({
    mutationFn: (data: any) =>
      nucleoApi.projects.tasks.create(selectedProject?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-tasks", selectedProject?.id] });
      toast.success("Task created");
    },
    onError: () => toast.error("Failed to create task"),
  });

  const deleteTaskMut = useMutation({
    mutationFn: (id: string) =>
      nucleoApi.projects.tasks.delete(selectedProject?.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-tasks", selectedProject?.id] });
      toast.success("Task deleted");
    },
    onError: () => toast.error("Failed to delete task"),
  });

  // Drag and drop handlers
  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (status: Task["status"]) => {
    if (draggedTask && draggedTask.status !== status) {
      updateTaskMut.mutate({
        id: draggedTask.id,
        data: { status },
      });
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  // Get tasks for a specific column
  const getColumnTasks = (status: Task["status"]) => {
    return filteredTasks.filter((t) => t.status === status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Kanban Board</h2>
          <p className="text-muted-foreground text-sm">
            Drag and drop tasks to update status
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

      {/* Task Detail Slide-Over */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLS.map((col) => (
          <div
            key={col.id}
            className="shrink-0 w-72"
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(col.id)}
          >
            {/* Column Header */}
            <div className={`rounded-t-xl border-b-2 p-3 ${col.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{col.label}</span>
                  <Badge variant="default" size="sm">
                    {getColumnTasks(col.id).length}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => {}}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Column Content */}
            <div
              className={`rounded-b-xl border border-t-0 p-2 space-y-2 min-h-[500px] transition-colors ${
                dragOverColumn === col.id
                  ? "bg-primary/5 border-primary/30"
                  : "bg-muted/20 border-border"
              }`}
            >
              {getColumnTasks(col.id).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={() => handleDragStart(task)}
                  onDragEnd={handleDragEnd}
                  onDelete={() => deleteTaskMut.mutate(task.id)}
                  onOpen={() => setSelectedTask(task)}
                />
              ))}

              {getColumnTasks(col.id).length === 0 && (
                <div className="flex h-24 items-center justify-center text-muted-foreground text-xs italic">
                  No tasks
                </div>
              )}

              {/* Quick Add */}
              <QuickAddTask
                status={col.id}
                projectId={selectedProject?.id}
                onAdd={(title) => {
                  if (!selectedProject) return;
                  createTaskMut.mutate({
                    title,
                    status: col.id,
                    priority: "medium",
                  });
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Task Card ───────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onDragStart,
  onDragEnd,
  onDelete,
  onOpen,
}: {
  task: Task;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className="rounded-lg border border-border bg-card p-3 shadow-sm cursor-pointer active:cursor-grabbing active:shadow-md transition-shadow hover:border-primary/40"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium leading-tight">{task.title}</span>
        </div>
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground"
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 z-10 w-32 rounded-lg border border-border bg-card shadow-lg p-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span className="text-[10px]">
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Subtasks Progress */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>Subtasks</span>
            <span>
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
            </span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${
                  (task.subtasks.filter((s) => s.completed).length /
                    task.subtasks.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50">
        {/* Comments & Attachments */}
        <div className="flex items-center gap-3 text-muted-foreground">
          {task.comments !== undefined && task.comments > 0 && (
            <div className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-[10px]">{task.comments}</span>
            </div>
          )}
          {task.attachments !== undefined && task.attachments > 0 && (
            <div className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-[10px]">{task.attachments}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee && (
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              {task.assignee.avatar ? (
                <img
                  src={task.assignee.avatar}
                  alt={task.assignee.name}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <User className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {task.assignee.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quick Add Task ─────────────────────────────────────────────────────────

function QuickAddTask({
  status,
  projectId,
  onAdd,
}: {
  status: Task["status"];
  projectId?: string;
  onAdd: (title: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title.trim());
      setTitle("");
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add task
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-2 space-y-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") setIsAdding(false);
        }}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="primary" onClick={handleSubmit}>
          Add
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setTitle("");
            setIsAdding(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Task Detail Slide-Over ──────────────────────────────────────────────────

function TaskDetailPanel({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) {
  const [subtasks, setSubtasks] = useState(
    task.subtasks ?? []
  );
  const [logHours, setLogHours] = useState("");
  const [comment, setComment] = useState("");
  const [loggedTime, setLoggedTime] = useState<{ hours: string; at: string }[]>([]);
  const [comments, setComments] = useState<{ text: string; at: string }[]>([]);

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleLogTime = () => {
    if (!logHours || isNaN(Number(logHours)) || Number(logHours) <= 0) return;
    setLoggedTime((prev) => [
      ...prev,
      { hours: logHours, at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setLogHours("");
    toast.success(`Logged ${logHours}h`);
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    setComments((prev) => [
      ...prev,
      { text: comment.trim(), at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setComment("");
  };

  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-blue-100 text-blue-700",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg leading-tight">{task.title}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityColors[task.priority] ?? "bg-gray-100 text-gray-700"}`}
              >
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {task.status.replace("_", " ")}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Description
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Meta row: assignee + due date */}
          <div className="flex items-center gap-6">
            {task.assignee && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Assignee
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{task.assignee.name}</span>
                </div>
              </div>
            )}
            {task.dueDate && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Due Date
                </p>
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Subtasks ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
            </h3>
            {subtasks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No subtasks</p>
            ) : (
              <div className="space-y-2">
                {subtasks.map((sub) => (
                  <label
                    key={sub.id}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSubtask(sub.id)}
                      className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      {sub.completed ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <span
                      className={`text-sm transition-colors ${
                        sub.completed
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {sub.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Log Time */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Log Time
            </h3>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0.25"
                step="0.25"
                placeholder="Hours (e.g. 1.5)"
                value={logHours}
                onChange={(e) => setLogHours(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" variant="outline" onClick={handleLogTime}>
                <Clock className="h-4 w-4 mr-1" />
                Log
              </Button>
            </div>
            {loggedTime.length > 0 && (
              <div className="mt-2 space-y-1">
                {loggedTime.map((entry, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {entry.hours}h logged at {entry.at}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Add Comment */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Comments
            </h3>
            {comments.length > 0 && (
              <div className="mb-3 space-y-2">
                {comments.map((c, i) => (
                  <div key={i} className="rounded-lg bg-muted/40 px-3 py-2">
                    <p className="text-sm">{c.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{c.at}</p>
                  </div>
                ))}
              </div>
            )}
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={handleAddComment}
              disabled={!comment.trim()}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Add Comment
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
