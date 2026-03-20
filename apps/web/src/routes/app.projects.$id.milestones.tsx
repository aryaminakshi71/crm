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
  CheckCircle2,
  Clock,
  Flag,
  MoreHorizontal,
  Plus,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { nucleoApi } from "../lib/api";

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/projects/$id/milestones")({
  component: MilestonesPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

type Milestone = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: "pending" | "completed" | "overdue";
  createdAt: string;
  progress?: number;
  tasks?: string[];
};

// ─── Main Page ────────────────────────────────────────────────────────────────

function MilestonesPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  // Fetch milestones
  const { data: milestonesData, isLoading } = useQuery({
    queryKey: ["nucleo-project-milestones", id],
    queryFn: () => nucleoApi.projects.milestones.list(id),
    enabled: !!id,
  });

  const milestones = (milestonesData?.data || []) as Milestone[];

  // Calculate overall progress
  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const overdueCount = milestones.filter((m) => m.status === "overdue").length;
  const pendingCount = milestones.filter((m) => m.status === "pending").length;

  // Mutations
  const createMilestoneMut = useMutation({
    mutationFn: (data: any) => nucleoApi.projects.milestones.create(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-milestones", id] });
      toast.success("Milestone created");
      setIsCreateModalOpen(false);
      setNewMilestone({ title: "", description: "", dueDate: "" });
    },
    onError: () => toast.error("Failed to create milestone"),
  });

  const updateMilestoneMut = useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: any }) =>
      nucleoApi.projects.milestones.update(id, milestoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-milestones", id] });
      toast.success("Milestone updated");
    },
    onError: () => toast.error("Failed to update milestone"),
  });

  const deleteMilestoneMut = useMutation({
    mutationFn: (milestoneId: string) =>
      nucleoApi.projects.milestones.delete(id, milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-project-milestones", id] });
      toast.success("Milestone deleted");
      setSelectedMilestone(null);
    },
    onError: () => toast.error("Failed to delete milestone"),
  });

  const handleCreateMilestone = () => {
    if (!newMilestone.title.trim()) return;
    createMilestoneMut.mutate({
      title: newMilestone.title,
      description: newMilestone.description,
      targetDate: newMilestone.dueDate
        ? new Date(newMilestone.dueDate).toISOString()
        : undefined,
    });
  };

  const handleToggleMilestone = (milestone: Milestone) => {
    const newStatus = milestone.status === "completed" ? "pending" : "completed";
    updateMilestoneMut.mutate({
      milestoneId: milestone.id,
      data: { status: newStatus },
    });
  };

  // Sort milestones by due date
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  // Group milestones by status
  const upcomingMilestones = sortedMilestones.filter(
    (m) => m.status === "pending"
  );
  const completedMilestones = sortedMilestones.filter(
    (m) => m.status === "completed"
  );
  const overdueMilestones = sortedMilestones.filter(
    (m) => m.status === "overdue"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl text-foreground">Milestones</h2>
          <p className="text-muted-foreground text-sm">
            Track key dates and project checkpoints
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Add Milestone
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <X className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueCount}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-success transition-all"
              style={{
                width: `${
                  milestones.length > 0
                    ? (completedCount / milestones.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {completedCount} of {milestones.length} milestones completed
          </p>
        </CardContent>
      </Card>

      {/* Milestones List */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading milestones...
        </div>
      ) : milestones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">No milestones yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Create your first milestone to track key project dates
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcomingMilestones.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Upcoming ({upcomingMilestones.length})
              </h3>
              <div className="space-y-3">
                {upcomingMilestones.map((milestone, index) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    isNext={index === 0}
                    onToggle={() => handleToggleMilestone(milestone)}
                    onDelete={() => deleteMilestoneMut.mutate(milestone.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Overdue */}
          {overdueMilestones.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider text-destructive mb-3">
                Overdue ({overdueMilestones.length})
              </h3>
              <div className="space-y-3">
                {overdueMilestones.map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    isOverdue
                    onToggle={() => handleToggleMilestone(milestone)}
                    onDelete={() => deleteMilestoneMut.mutate(milestone.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedMilestones.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider text-success mb-3">
                Completed ({completedMilestones.length})
              </h3>
              <div className="space-y-3">
                {completedMilestones.map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    onToggle={() => handleToggleMilestone(milestone)}
                    onDelete={() => deleteMilestoneMut.mutate(milestone.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Milestone"
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateMilestone();
        }}
      >
        <div className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={newMilestone.title}
              onChange={(e) =>
                setNewMilestone((m) => ({ ...m, title: e.target.value }))
              }
              placeholder="Enter milestone title..."
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newMilestone.description}
              onChange={(e) =>
                setNewMilestone((m) => ({ ...m, description: e.target.value }))
              }
              placeholder="Enter milestone description..."
              rows={3}
            />
          </FormField>
          <FormField label="Target Date" required>
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
    </div>
  );
}

// ─── Milestone Card ──────────────────────────────────────────────────────────

function MilestoneCard({
  milestone,
  isNext,
  isOverdue,
  onToggle,
  onDelete,
}: {
  milestone: Milestone;
  isNext?: boolean;
  isOverdue?: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const daysUntilDue = Math.ceil(
    (new Date(milestone.dueDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Card
      className={`${
        isNext
          ? "border-primary/30 bg-primary/5"
          : isOverdue
            ? "border-destructive/30 bg-destructive/5"
            : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button
            type="button"
            onClick={onToggle}
            className="mt-1 shrink-0"
          >
            {milestone.status === "completed" ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <div
                className={`h-5 w-5 rounded-full border-2 ${
                  isOverdue
                    ? "border-destructive"
                    : "border-muted-foreground/30"
                }`}
              />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p
                  className={`font-semibold ${
                    milestone.status === "completed"
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {milestone.title}
                </p>
                {milestone.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {milestone.description}
                  </p>
                )}
              </div>

              {/* Menu */}
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 z-10 w-32 rounded-lg border border-border bg-card shadow-lg p-1">
                    <button
                      type="button"
                      onClick={() => {
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

            {/* Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Badge
                variant={
                  milestone.status === "completed"
                    ? "success"
                    : isOverdue
                      ? "danger"
                      : "default"
                }
              >
                {isOverdue
                  ? `${Math.abs(daysUntilDue)} days overdue`
                  : milestone.status === "completed"
                    ? "Completed"
                    : `${daysUntilDue} days left`}
              </Badge>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Calendar className="h-3 w-3" />
                Due: {new Date(milestone.dueDate).toLocaleDateString()}
              </div>
              {isNext && (
                <Badge variant="primary" size="sm">
                  Next
                </Badge>
              )}
            </div>

            {/* Progress bar for tasks */}
            {milestone.tasks && milestone.tasks.length > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Tasks</span>
                  <span>{milestone.progress || 0}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${milestone.progress || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
