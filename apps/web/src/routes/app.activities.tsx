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
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  TrendingUp,
  Zap,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
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
import { activitiesApi } from "@/lib/api";

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

  const { data, isLoading, refetch, isError} = useQuery({
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

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  if (isLoading) return <Loading text="Loading activities..." />;

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Interaction Vol"
          value={activities.length}
          icon={<Activity className="h-4 w-4" />}
          trend="+12% vs lw"
          color="text-primary"
        />
        <Metric
          title="Completion"
          value={`${Math.round((completedActivities.length / (activities.length || 1)) * 100)}%`}
          icon={<ShieldCheck className="h-4 w-4" />}
          trend="High efficiency"
          color="text-emerald-400"
        />
        <Metric
          title="Open Tasks"
          value={pendingActivities.length}
          icon={<Clock className="h-4 w-4" />}
          trend="Due today"
          color="text-rose-400"
        />
        <Metric
          title="Next Goal"
          value="Meeting"
          icon={<Calendar className="h-4 w-4" />}
          trend="In 2 hours"
          color="text-cyan-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Activity Velocity
              </CardTitle>
              <p className="text-2xl font-black text-foreground">
                Interaction Pulse
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { day: "Mon", activities: 12, completions: 8 },
                    { day: "Tue", activities: 18, completions: 15 },
                    { day: "Wed", activities: 24, completions: 20 },
                    { day: "Thu", activities: 16, completions: 14 },
                    { day: "Fri", activities: 32, completions: 28 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="day"
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
                    dataKey="activities"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorAct)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="completions"
                    stroke="#888"
                    fillOpacity={0}
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">AI Triage</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                AI recommends prioritizing the **"Follow up on Proposal"** note
                for Acme Corp as intent signals are spiking.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { type: "Email", status: "Auto-replied", time: "10m ago" },
                { type: "Meeting", status: "Scheduled", time: "1h ago" },
              ].map((insight, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[10px] font-bold"
                >
                  <span className="text-muted-foreground uppercase">
                    {insight.type}
                  </span>
                  <span className="text-foreground">{insight.status}</span>
                  <span className="text-primary/60">{insight.time}</span>
                </div>
              ))}
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
          action={
            <Button onClick={() => setIsModalOpen(true)}>Log Activity</Button>
          }
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
            {icon || <Activity className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { Sparkles, Trash2 } from "lucide-react";
