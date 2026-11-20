import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { activitiesApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
});

export const Route = createFileRoute("/app/crm/activities/_index")({
  validateSearch: searchSchema,
  component: CrmActivitiesPage,
});

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <CalendarDays className="h-4 w-4" />,
  task: <CheckCircle2 className="h-4 w-4" />,
  note: <MessageSquare className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  call: "text-blue-400",
  email: "text-violet-400",
  meeting: "text-amber-400",
  task: "text-emerald-400",
  note: "text-slate-400",
};

function CrmActivitiesPage() {
  const { q: search = "", type: typeFilter = "all" } = useSearch({ from: "/app/crm/activities/_index" });
  const navigate = useNavigate({ from: "/app/crm/activities/_index" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setTypeFilter = (v: string) => navigate({ search: (p) => ({ ...p, type: v }) });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: "call",
    title: "",
    description: "",
    contactId: "",
    dealId: "",
  });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["crm-activities"],
    queryFn: () => activitiesApi.list({ page: 1, limit: 200 }),
  });

  const createActivity = useMutation({
    mutationFn: (payload: typeof newActivity) => activitiesApi.create(payload),
    onSuccess: () => {
      toast.success("Activity logged");
      qc.invalidateQueries({ queryKey: ["crm-activities"] });
      setIsCreateOpen(false);
      setNewActivity({ type: "call", title: "", description: "", contactId: "", dealId: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create activity"),
  });

  const deleteActivity = useMutation({
    mutationFn: (id: string) => activitiesApi.delete(id),
    onSuccess: () => {
      toast.success("Activity deleted");
      qc.invalidateQueries({ queryKey: ["crm-activities"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete activity"),
  });

  const activities: any[] = (data as any)?.data ?? [];

  const callCount = activities.filter((a: any) => a.type === "call").length;
  const emailCount = activities.filter((a: any) => a.type === "email").length;
  const meetingCount = activities.filter((a: any) => a.type === "meeting").length;
  const taskCount = activities.filter((a: any) => a.type === "task").length;

  const filtered = useMemo(() => {
    return activities.filter((a: any) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return [a.title, a.description, a.type, a.contactId, a.dealId]
        .some((v) => String(v ?? "").toLowerCase().includes(s));
    });
  }, [activities, search, typeFilter]);

  if (isLoading) return <Loading text="Loading activities..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Activity className="h-6 w-6" /> CRM Activities
          </h1>
          <p className="text-muted-foreground text-sm">Log and track calls, emails, meetings, and tasks.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          Log Activity
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric title="Calls" value={callCount} icon={<Phone className="h-4 w-4" />} color="text-blue-400" />
        <Metric title="Emails" value={emailCount} icon={<Mail className="h-4 w-4" />} color="text-violet-400" />
        <Metric title="Meetings" value={meetingCount} icon={<CalendarDays className="h-4 w-4" />} color="text-amber-400" />
        <Metric title="Tasks" value={taskCount} icon={<CheckCircle2 className="h-4 w-4" />} color="text-emerald-400" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="meeting">Meeting</option>
          <option value="task">Task</option>
          <option value="note">Note</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-12 w-12" />}
              title="No activities found"
              description={search || typeFilter !== "all" ? "Try adjusting filters." : "Log your first activity to track engagement."}
              action={<Button onClick={() => setIsCreateOpen(true)}>Log Activity</Button>}
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((activity: any) => (
                <div key={activity.id} className="flex items-start justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 shrink-0 ${ACTIVITY_COLORS[activity.type] ?? "text-muted-foreground"}`}>
                      {ACTIVITY_ICONS[activity.type] ?? <Activity className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {activity.title ?? activity.subject ?? `${activity.type} activity`}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {activity.contactId && (
                          <span className="text-xs text-muted-foreground">Contact: {activity.contactId.slice(0, 8)}…</span>
                        )}
                        {activity.dealId && (
                          <span className="text-xs text-muted-foreground">Deal: {activity.dealId.slice(0, 8)}…</span>
                        )}
                        {activity.createdAt && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(activity.createdAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge variant="outline">{activity.type ?? "activity"}</Badge>
                    {activity.status && <Badge variant="outline">{activity.status}</Badge>}
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => deleteActivity.mutate(activity.id)}
                      loading={deleteActivity.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log Activity"
        submitText="Save Activity"
        loading={createActivity.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newActivity.title.trim()) {
            toast.error("Activity title is required");
            return;
          }
          createActivity.mutate(newActivity);
        }}
      >
        <div className="space-y-4">
          <FormField label="Type">
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newActivity.type}
              onChange={(e) => setNewActivity((p) => ({ ...p, type: e.target.value }))}
            >
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="task">Task</option>
              <option value="note">Note</option>
            </select>
          </FormField>
          <FormField label="Title" required>
            <Input
              value={newActivity.title}
              onChange={(e) => setNewActivity((p) => ({ ...p, title: e.target.value }))}
              placeholder="Follow-up call with Jane"
              required
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newActivity.description}
              onChange={(e) => setNewActivity((p) => ({ ...p, description: e.target.value }))}
              placeholder="Notes from the activity..."
              rows={3}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Contact ID">
              <Input
                value={newActivity.contactId}
                onChange={(e) => setNewActivity((p) => ({ ...p, contactId: e.target.value }))}
                placeholder="Optional"
              />
            </FormField>
            <FormField label="Deal ID">
              <Input
                value={newActivity.dealId}
                onChange={(e) => setNewActivity((p) => ({ ...p, dealId: e.target.value }))}
                placeholder="Optional"
              />
            </FormField>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color ?? "text-primary"}`}>
            {icon ?? <Zap className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
