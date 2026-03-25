import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  Plus,
  RefreshCw,
  Search,
  Users,
  Video,
  X,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/app/communications/video/_index")({
  validateSearch: searchSchema,
  component: VideoPage,
});

function formatDate(val: string | null | undefined): string {
  if (!val) return "—";
  return new Date(val).toLocaleString();
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  ended: "bg-muted text-muted-foreground",
};

function VideoPage() {
  const queryClient = useQueryClient();
  const { q = "", status = "all" } = useSearch({ from: "/app/communications/video/_index" });
  const navigate = useNavigate({ from: "/app/communications/video/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v }) });

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingName, setMeetingName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [scheduledAt, setScheduledAt] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["communications", "video-rooms"],
    queryFn: () =>
      fetch("/api/v1/communications/video-rooms?page=1&limit=50", {
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
      }).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; maxParticipants: number; scheduledAt?: string }) =>
      fetch("/api/v1/communications/video-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "video-rooms"] });
      setShowScheduleModal(false);
      setMeetingName("");
      setScheduledAt("");
    },
  });

  const startMeetingMutation = useMutation({
    mutationFn: () =>
      fetch("/api/v1/communications/video-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
        body: JSON.stringify({ name: `Meeting ${new Date().toLocaleTimeString()}`, maxParticipants: 10 }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "video-rooms"] });
    },
  });

  const allRooms: any[] = (data as any)?.data ?? [];

  const rooms = allRooms.filter((r) => {
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!String(r.name ?? "").toLowerCase().includes(s)) return false;
    }
    if (status !== "all" && r.status !== status) return false;
    return true;
  });

  const today = new Date();
  const meetingsToday = rooms.filter((r) => {
    const d = new Date(r.scheduledAt ?? r.createdAt ?? "");
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }).length;

  const participantCounts = rooms
    .map((r) => r.participantCount ?? r.maxParticipants ?? 0)
    .filter((n) => n > 0);
  const avgParticipants =
    participantCounts.length > 0
      ? Math.round(
          participantCounts.reduce((a: number, b: number) => a + b, 0) /
            participantCounts.length,
        )
      : 0;

  const stats = [
    { label: "Meetings Today", value: meetingsToday, icon: Video, color: "text-purple-400" },
    { label: "Avg Participants", value: avgParticipants || "—", icon: Users, color: "text-blue-400" },
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load video meetings.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Video Meetings</h1>
          <p className="text-muted-foreground mt-1">
            Start or schedule video conferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScheduleModal(true)}
          >
            <Calendar className="h-4 w-4 mr-2" /> Schedule Meeting
          </Button>
          <Button
            size="sm"
            onClick={() => startMeetingMutation.mutate()}
            disabled={startMeetingMutation.isPending}
          >
            <Video className="h-4 w-4 mr-2" />
            {startMeetingMutation.isPending ? "Starting…" : "Start Meeting"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      {/* Meetings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Video Rooms</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 rounded bg-muted" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <Video className="h-8 w-8" />
              <p className="text-sm">No video meetings yet.</p>
              <Button size="sm" onClick={() => startMeetingMutation.mutate()}>
                <Plus className="h-4 w-4 mr-2" /> Start First Meeting
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Meeting</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Max Participants</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Scheduled</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr
                      key={room.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-purple-400" />
                          {room.name ?? "Unnamed Meeting"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {room.maxParticipants ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(room.scheduledAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            STATUS_COLORS[room.status] ??
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {room.status ?? "active"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(room.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Schedule Meeting</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Meeting Name</label>
                <Input
                  placeholder="e.g. Weekly Sync"
                  value={meetingName}
                  onChange={(e) => setMeetingName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max Participants</label>
                <Input
                  type="number"
                  min="2"
                  max="100"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Scheduled At</label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  createMutation.mutate({
                    name: meetingName,
                    maxParticipants: parseInt(maxParticipants) || 10,
                    scheduledAt: scheduledAt || undefined,
                  })
                }
                disabled={createMutation.isPending || !meetingName.trim()}
              >
                {createMutation.isPending ? "Scheduling…" : "Schedule"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
