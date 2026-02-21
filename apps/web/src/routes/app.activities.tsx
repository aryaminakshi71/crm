/**
 * Activities Route
 *
 * Activity timeline and management.
 */

import { Pagination } from "@/components/pagination";
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
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { activitiesApi } from "../lib/api";

export const Route = createFileRoute("/app/activities")({
  component: ActivitiesPage,
});

const ACTIVITY_TYPES = [
  { value: "call", label: "Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: Calendar },
  { value: "note", label: "Note", icon: FileText },
  { value: "task", label: "Task", icon: CheckCircle },
  { value: "demo", label: "Demo", icon: Calendar },
];

function ActivitiesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [newActivity, setNewActivity] = useState({
    type: "call",
    subject: "",
    description: "",
    dueDate: "",
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => activitiesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newActivity) => {
      // Validate required fields
      if (!data.subject.trim()) {
        throw new Error("Subject is required");
      }
      // Note: dueDate is not in the API schema, so we'll exclude it
      return activitiesApi.create({
        type: data.type,
        subject: data.subject.trim(),
        description: data.description.trim() || undefined,
        // dueDate is not supported by API yet
      });
    },
    onSuccess: () => {
      toast.success("Activity created successfully");
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      setIsModalOpen(false);
      setNewActivity({
        type: "call",
        subject: "",
        description: "",
        dueDate: "",
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to create activity";
      toast.error(errorMessage);
      console.error("Activity creation error:", error);
    },
  });

  const activities = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages =
    data?.totalPages ||
    (data?.total && data?.limit ? Math.ceil(data.total / data.limit) : 1);

  // Filter activities
  const pendingActivities = activities.filter((a: any) => !a.completedAt);
  const completedActivities = activities.filter((a: any) => a.completedAt);

  // For display, use paginated activities from API
  const paginatedActivities = activities;

  const getActivityIcon = (type: string) => {
    const activityType = ACTIVITY_TYPES.find((t) => t.value === type);
    const Icon = activityType?.icon || FileText;
    return <Icon className="h-5 w-5" />;
  };

  if (isLoading) {
    return <Loading text="Loading activities..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Activities</h1>
          <p className="text-muted-foreground">
            Track your interactions and tasks
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Log Activity
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Pending</p>
                <p className="font-bold text-2xl text-foreground">
                  {pendingActivities.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Completed</p>
                <p className="font-bold text-2xl text-foreground">
                  {completedActivities.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">This Week</p>
                <p className="font-bold text-2xl text-foreground">
                  {activities.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities List */}
      {activities.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No activities yet"
          description="Start logging your interactions with contacts."
          action={{
            label: "Log Activity",
            onClick: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paginatedActivities.map((activity: any) => {
                  const isPending = !activity.completedAt;
                  return (
                    <div
                      key={activity.id}
                      className={`flex items-start gap-4 rounded-lg p-3 ${isPending ? "bg-warning/15" : "bg-muted"}`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${isPending ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}
                      >
                        {isPending ? (
                          getActivityIcon(activity.type)
                        ) : (
                          <CheckCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {activity.subject}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline">{activity.type}</Badge>
                          {isPending && activity.dueDate && (
                            <span className="text-muted-foreground text-xs">
                              Due:{" "}
                              {new Date(activity.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {!isPending && activity.completedAt && (
                            <span className="text-muted-foreground text-xs">
                              Completed:{" "}
                              {new Date(
                                activity.completedAt,
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
            />
          )}
        </>
      )}

      {/* Create Activity Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(newActivity);
        }}
        title="Log Activity"
        submitText="Create Activity"
        loading={createMutation.isPending}
      >
        <div className="space-y-4">
          <FormField label="Type" required>
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newActivity.type}
              onChange={(e) =>
                setNewActivity({ ...newActivity, type: e.target.value })
              }
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Subject" required>
            <Input
              value={newActivity.subject}
              onChange={(e) =>
                setNewActivity({ ...newActivity, subject: e.target.value })
              }
              required
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newActivity.description}
              onChange={(e) =>
                setNewActivity({ ...newActivity, description: e.target.value })
              }
            />
          </FormField>
          <FormField label="Due Date">
            <Input
              type="datetime-local"
              value={newActivity.dueDate}
              onChange={(e) =>
                setNewActivity({ ...newActivity, dueDate: e.target.value })
              }
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
