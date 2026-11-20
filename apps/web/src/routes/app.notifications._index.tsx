import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  MessageSquare,
  AtSign,
  Settings,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { notificationsApi } from "@/lib/api";

const searchSchema = z.object({
  filter: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/notifications/_index")({
  validateSearch: searchSchema,
  component: NotificationsPage,
});

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  mention: <AtSign className="h-4 w-4 text-blue-500" />,
  comment: <MessageSquare className="h-4 w-4 text-green-500" />,
  task: <CheckCircle2 className="h-4 w-4 text-amber-500" />,
  system: <Settings className="h-4 w-4 text-gray-500" />,
  billing: <CreditCard className="h-4 w-4 text-purple-500" />,
};

const TYPE_LABELS: Record<string, string> = {
  mention: "Mention",
  comment: "Comment",
  task: "Task",
  system: "System",
  billing: "Billing",
};

type TabValue = "all" | "unread" | "mentions" | "system";
type TypeFilter = "all" | "mention" | "comment" | "task" | "system" | "billing";

function NotificationsPage() {
  const { filter = "all", page = 1 } = useSearch({ from: "/app/notifications/_index" });
  const navigate = useNavigate({ from: "/app/notifications" });
  const activeTab = (filter as TabValue) ?? "all";
  const setActiveTab = (v: TabValue) => navigate({ search: (p) => ({ ...p, filter: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const qc = useQueryClient();

  const orgHeader = {
    "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-list", activeTab, typeFilter],
    queryFn: () =>
      notificationsApi.list({ unreadOnly: activeTab === "unread", limit: 50 }),
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to mark as read"),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to mark all as read"),
  });

  const notifications: any[] = (data as any)?.data ?? (data as any)?.notifications ?? (Array.isArray(data) ? data : []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = notifications.filter((n: any) => {
    if (activeTab === "unread" && n.read) return false;
    if (activeTab === "mentions" && n.type !== "mention") return false;
    if (activeTab === "system" && n.type !== "system") return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;
  const todayCount = notifications.filter((n: any) => {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  const TABS: { value: TabValue; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
    { value: "mentions", label: "Mentions" },
    { value: "system", label: "System" },
  ];

  if (isLoading) return <Loading text="Loading notifications..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Bell className="h-6 w-6" /> Notifications
          </h1>
          <p className="text-muted-foreground text-sm">
            Stay up to date with your activity and alerts.
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<CheckCheck className="h-4 w-4" />}
          onClick={() => markAllRead.mutate()}
          loading={markAllRead.isPending}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 max-w-md">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              Unread
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              Today
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">{todayCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Filter row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.value === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-destructive text-destructive-foreground px-1.5 py-0.5 text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="flex h-9 rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
          >
            <option value="all">All types</option>
            <option value="mention">Mentions</option>
            <option value="comment">Comments</option>
            <option value="task">Tasks</option>
            <option value="system">System</option>
            <option value="billing">Billing</option>
          </select>
        </div>
      </div>

      {/* Notifications list */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-12 w-12" />}
              title="No notifications"
              description={
                activeTab !== "all" || typeFilter !== "all"
                  ? "No notifications match your current filters."
                  : "You're all caught up! Check back later."
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markRead.mutate(n.id);
                  }}
                  className={`flex items-start gap-3 p-4 transition-colors cursor-pointer hover:bg-muted/20 ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 shrink-0">
                    {!n.read ? (
                      <span className="block h-2 w-2 rounded-full bg-primary" />
                    ) : (
                      <span className="block h-2 w-2 rounded-full bg-transparent" />
                    )}
                  </div>

                  {/* Type icon */}
                  <div className="mt-0.5 shrink-0">
                    {TYPE_ICONS[n.type] ?? <Bell className="h-4 w-4 text-muted-foreground" />}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "text-foreground"}`}>
                        {n.title ?? n.subject ?? "Notification"}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {n.createdAt ? timeAgo(n.createdAt) : ""}
                        </span>
                        {!n.read && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead.mutate(n.id);
                            }}
                            className="rounded p-1 text-muted-foreground hover:text-primary transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {(n.body ?? n.message) && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body ?? n.message}
                      </p>
                    )}
                    {n.type && (
                      <span className="inline-block mt-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                        {TYPE_LABELS[n.type] ?? n.type}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
