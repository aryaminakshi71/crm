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
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  ListTodo,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Trash2,
  User,
  X,
  AlertCircle
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { nucleoApi } from "@/lib/api";
import { PriorityBadge } from "./app.projects";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/$id/tasks")({
  component: TasksListPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type Task = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignee?: { id: string; name: string; avatar?: string };
  dueDate?: string;
  createdAt: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  comments?: { id: string; author: string; text: string; createdAt: string }[];
  attachments?: { id: string; name: string; size: string; type: string }[];
  timeLogged?: number;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function TasksListPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    status: "todo" as Task["status"],
    assignee: "",
    dueDate: "",
  });

  // Fetch tasks
  const { data: tasksData, isLoading, isError, refetch} = useQuery({
    queryKey: ["nucleo-project-tasks", id],
    queryFn: () => nucleoApi.projects.tasks.list(id),
    enabled: !!id,
  });

  const tasks = ((tasksData as any)?.data || []) as Task[];

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all" && t.status !== statusFilter) {
        return false;
      }
      if (priorityFilter !== "all" && t.priority !== priorityFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    return {
      todo: filteredTasks.filter((t) => t.status === "todo"),
      in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
      review: filteredTasks.filter((t) => t.status === "review"),
      done: filteredTasks.filter((t) => t.status === "done"),
    };
  }, [filteredTasks]);

  // Mutations
  const createTaskMut = useMutation({
    mutationFn: (data: any) => nucleoApi.projects.tasks.create(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-tasks", id] });
      toast.success("Task created");
      setIsCreateModalOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        status: "todo",
        assignee: "",
        dueDate: "",
      });
    },
    onError: () => toast.error("Failed to create task"),
  });

  const updateTaskMut = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) =>
      nucleoApi.projects.tasks.update(id, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-tasks", id] });
      toast.success("Task updated");
    },
    onError: () => toast.error("Failed to update task"),
  });

  const deleteTaskMut = useMutation({
    mutationFn: (taskId: string) => nucleoApi.projects.tasks.delete(id, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-tasks", id] });
      toast.success("Task deleted");
      setSelectedTask(null);
      setIsDetailOpen(false);
    },
    onError: () => toast.error("Failed to delete task"),
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;
    createTaskMut.mutate({
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      assigneeId: newTask.assignee || undefined,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
    });
  };

  const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
    updateTaskMut.mutate({ taskId, data: { status: newStatus } });
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  // Status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "done":
        return "success";
      case "in_progress":
        return "warning";
      case "review":
        return "info";
      default:
        return "default";
    }
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Tasks</h2>
          <p className="text-muted-foreground text-sm">
            Manage and track all project tasks
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="To Do"
          count={groupedTasks.todo.length}
          color="bg-primary/70"
        />
        <StatCard
          label="In Progress"
          count={groupedTasks.in_progress.length}
          color="bg-warning"
        />
        <StatCard
          label="Review"
          count={groupedTasks.review.length}
          color="bg-cyan-400"
        />
        <StatCard
          label="Done"
          count={groupedTasks.done.length}
          color="bg-success"
        />
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ListTodo className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">No tasks found</p>
            <p className="text-muted-foreground text-sm mt-1">
              {search || statusFilter !== "all" || priorityFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first task to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-border">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => openTaskDetail(task)}
              >
                {/* Status Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(
                      task.id,
                      task.status === "done" ? "todo" : "done"
                    );
                  }}
                  className="shrink-0"
                >
                  {task.status === "done" ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </button>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-medium text-sm ${
                        task.status === "done" ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.subtasks && task.subtasks.length > 0 && (
                      <Badge variant="outline" size="sm">
                        {task.subtasks.filter((s) => s.completed).length}/
                        {task.subtasks.length}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge variant={getStatusVariant(task.status)} size="sm">
                      {task.status.replace("_", " ")}
                    </Badge>
                    <PriorityBadge priority={task.priority} />
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    {task.comments && task.comments.length > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <MessageSquare className="h-3 w-3" />
                        {task.comments.length}
                      </div>
                    )}
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Paperclip className="h-3 w-3" />
                        {task.attachments.length}
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignee */}
                {task.assignee && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {task.assignee.avatar ? (
                        <img
                          src={task.assignee.avatar}
                          alt={task.assignee.name}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        task.assignee.name?.charAt(0)
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {task.assignee.name}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show menu
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create Task Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Task"
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateTask();
        }}
      >
        <div className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={newTask.title}
              onChange={(e) =>
                setNewTask((t) => ({ ...t, title: e.target.value }))
              }
              placeholder="Enter task title..."
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newTask.description}
              onChange={(e) =>
                setNewTask((t) => ({ ...t, description: e.target.value }))
              }
              placeholder="Enter task description..."
              rows={3}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Status">
              <select
                value={newTask.status}
                onChange={(e) =>
                  setNewTask((t) => ({
                    ...t,
                    status: e.target.value as Task["status"],
                  }))
                }
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </FormField>
            <FormField label="Priority">
              <select
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask((t) => ({
                    ...t,
                    priority: e.target.value as Task["priority"],
                  }))
                }
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </FormField>
          </div>
          <FormField label="Due Date">
            <Input
              type="date"
              value={newTask.dueDate}
              onChange={(e) =>
                setNewTask((t) => ({ ...t, dueDate: e.target.value }))
              }
            />
          </FormField>
        </div>
      </FormModal>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedTask(null);
          }}
          onDelete={() => deleteTaskMut.mutate(selectedTask.id)}
          onUpdate={(data) => updateTaskMut.mutate({ taskId: selectedTask.id, data })}
        />
      )}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${color}`} />
          <div>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Task Detail Modal ───────────────────────────────────────────────────────

function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onDelete,
  onUpdate,
}: {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (data: any) => void;
}) {
  const [newComment, setNewComment] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full max-w-2xl rounded-xl bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border p-4">
            <div>
              <h3 className="font-semibold text-lg">{task.title}</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {task.description || "No description"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Task Meta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Status
                </p>
                <select
                  value={task.status}
                  onChange={(e) =>
                    onUpdate({ status: e.target.value })
                  }
                  className="mt-1 flex h-9 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Priority
                </p>
                <select
                  value={task.priority}
                  onChange={(e) =>
                    onUpdate({ priority: e.target.value })
                  }
                  className="mt-1 flex h-9 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Assignee & Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Assignee
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {task.assignee ? (
                    <>
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {task.assignee.name?.charAt(0)}
                      </div>
                      <span className="text-sm">{task.assignee.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Due Date
                </p>
                <p className="mt-1 text-sm">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "No due date"}
                </p>
              </div>
            </div>

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Subtasks ({task.subtasks.filter((s) => s.completed).length}/
                  {task.subtasks.length})
                </p>
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <div
                        className={`h-4 w-4 rounded border ${
                          subtask.completed
                            ? "bg-success border-success"
                            : "border-muted-foreground/30"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          subtask.completed
                            ? "line-through text-muted--foreground"
                            : ""
                        }`}
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Comments
              </p>
              <div className="space-y-3">
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {comment.author.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {comment.author}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm mt-0.5">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No comments yet
                  </p>
                )}

                {/* Add Comment */}
                <div className="flex gap-3 pt-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    You
                  </div>
                  <div className="flex-1">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="mb-2"
                    />
                    <Button size="sm" onClick={() => setNewComment("")}>
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Attachments
                </p>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {attachment.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {attachment.size}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border p-4">
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={onDelete}
            >
              Delete
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
