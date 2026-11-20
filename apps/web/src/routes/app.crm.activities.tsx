import {
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
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  FileText,
  History,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { activitiesApi } from "@/lib/api";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/crm/activities")({
  component: CrmActivitiesPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTIVITY_TYPES = [
  { id: "note", label: "Note", icon: FileText, color: "text-sky-400" },
  { id: "call", label: "Call", icon: Phone, color: "text-violet-400" },
  { id: "email", label: "Email", icon: Mail, color: "text-amber-400" },
  { id: "meeting", label: "Meeting", icon: Calendar, color: "text-success" },
  { id: "task", label: "Task", icon: Activity, color: "text-primary" },
  { id: "message", label: "Message", icon: MessageSquare, color: "text-orange-400" },
] as const;

type ActivityType = (typeof ACTIVITY_TYPES)[number]["id"];

function ActivityIcon({ type }: { type: string }) {
  const found = ACTIVITY_TYPES.find((t) => t.id === type);
  const Icon = found?.icon ?? History;
  const color = found?.color ?? "text-muted-foreground";
  return <Icon className={`h-4 w-4 ${color}`} />;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function CrmActivitiesPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: "note" as ActivityType,
    title: "",
    description: "",
  });

  const queryClient = useQueryClient();

  // ─── Query ─────────────────────────────────────────────────────────────────

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["crm-activities", typeFilter],
    queryFn: () => activitiesApi.list({ limit: 100 }),
  });

  const activities = (data?.data as any[]) ?? [];
  const filtered = typeFilter === "all"
    ? activities
    : activities.filter((a: any) => a.type === typeFilter);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createActivity = useMutation({
    mutationFn: () => {
      if (!newActivity.title.trim()) throw new Error("Title is required");
      return activitiesApi.create({
        type: newActivity.type,
        title: newActivity.title.trim(),
        description: newActivity.description.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Activity logged");
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      setIsCreateOpen(false);
      setNewActivity({ type: "note", title: "", description: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to log activity"),
  });

  const deleteActivity = useMutation({
    mutationFn: (id: string) => activitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      toast.success("Activity deleted");
    },
    onError: () => toast.error("Failed to delete activity"),
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  if (isError) return (
    <EmptyState variant="error" title="Something went wrong" description="Failed to load data. Please try again." action={<Button onClick={() => refetch()}>Retry</Button>} />
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/app/crm" className="hover:text-foreground transition-colors">CRM</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Activities</span>
          </div>
          <h1 className="font-bold text-2xl text-foreground">Activity Timeline</h1>
          <p className="text-muted-foreground text-sm">
            Log calls, emails, meetings, and notes across your CRM.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          Log Activity
        </Button>
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => setTypeFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors border ${
            typeFilter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {ACTIVITY_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTypeFilter(t.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors border flex items-center gap-1 ${
              typeFilter === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <Loading text="Loading activities..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No activities yet"
          description="Log calls, meetings, emails, and notes to track your interactions."
          action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>Log Activity</Button>}
        />
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border/60" />
          <div className="space-y-3">
            {filtered.map((activity: any) => (
              <div key={activity.id} className="flex gap-4 pl-12 relative">
                {/* Icon bubble */}
                <div className="absolute left-3 top-3 rounded-full border border-border bg-card p-1.5 z-10">
                  <ActivityIcon type={activity.type} />
                </div>
                <Card className="flex-1 border-border/60 hover:border-primary/40 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">
                          {activity.title || activity.subject || "Untitled"}
                        </p>
                        {(activity.description || activity.body) && (
                          <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                            {activity.description || activity.body}
                          </p>
                        )}
                        <p className="text-muted-foreground/60 text-[10px] mt-2">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteActivity.mutate(activity.id)}
                        disabled={deleteActivity.isPending}
                        className="p-1.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log Activity"
        onSubmit={() => createActivity.mutate()}
        isLoading={createActivity.isPending}
        submitText="Log Activity"
      >
        <FormField label="Type">
          <select
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={newActivity.type}
            onChange={(e) => setNewActivity((p) => ({ ...p, type: e.target.value as ActivityType }))}
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Title *">
          <Input
            placeholder="Follow-up call with prospect..."
            value={newActivity.title}
            onChange={(e) => setNewActivity((p) => ({ ...p, title: e.target.value }))}
          />
        </FormField>
        <FormField label="Notes / Description">
          <Textarea
            placeholder="Details about this activity..."
            value={newActivity.description}
            onChange={(e) => setNewActivity((p) => ({ ...p, description: e.target.value }))}
            rows={4}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
