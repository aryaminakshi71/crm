import { Button, Card, CardContent, Badge } from "@crm/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Video,
  Plus,
  Users,
  Clock,
  ExternalLink,
  Copy,
  MoreHorizontal,
  VideoOff,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/communications/video")({
  component: VideoRoomsPage,
});

interface VideoRoom {
  id: string;
  name: string;
  participants: Array<{ identity: string; name: string; joinedAt: string; leftAt?: string }>;
  maxParticipants: number;
  status: "active" | "scheduled" | "ended";
  createdAt: string;
  endedAt?: string;
  scheduledAt?: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

function VideoRoomsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["communications", "video-rooms"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/communications/video-rooms`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to load video rooms");
      return res.json() as Promise<{ data: VideoRoom[] }>;
    },
    placeholderData: (prev) => prev,
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const rooms = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`${API_BASE}/communications/video-rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ name, maxParticipants: 10 }),
      });
      if (!res.ok) throw new Error("Failed to create room");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "video-rooms"] });
      toast.success("Video room created");
      setShowCreateModal(false);
      setNewRoomName("");
    },
    onError: () => toast.error("Failed to create video room"),
  });

  const endMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/communications/video-rooms/${id}/end`, {
        method: "PATCH",
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to end room");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "video-rooms"] });
      toast.success("Room ended");
    },
    onError: () => toast.error("Failed to end room"),
  });

  const getStatusBadge = (status: VideoRoom["status"]) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "scheduled": return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "ended": return <Badge variant="outline">Ended</Badge>;
    }
  };

  const activeRooms = rooms.filter((r) => r.status === "active");
  const totalParticipants = rooms
    .filter((r) => r.status === "active")
    .reduce((sum, r) => sum + (r.participants?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Video Rooms</h2>
            <p className="text-muted-foreground text-sm">Create and manage video meeting rooms</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
          Create Room
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Video className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Rooms</p>
                <p className="text-xl font-bold">{isLoading ? "…" : activeRooms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Live Participants</p>
                <p className="text-xl font-bold">{isLoading ? "…" : totalParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rooms</p>
                <p className="text-xl font-bold">{isLoading ? "…" : rooms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <VideoOff className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ended Today</p>
                <p className="text-xl font-bold">{isLoading ? "…" : rooms.filter((r) => r.status === "ended").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <Card key={room.id} className="border-border/60 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    room.status === "active" ? "bg-green-100" : room.status === "scheduled" ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    <Video className={`h-5 w-5 ${
                      room.status === "active" ? "text-green-600" : room.status === "scheduled" ? "text-blue-600" : "text-gray-600"
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{room.name}</h3>
                    {getStatusBadge(room.status)}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {room.participants?.length ?? 0}/{room.maxParticipants}
                </span>
                <span className="text-xs">
                  {room.status === "ended" && room.endedAt
                    ? `Ended ${new Date(room.endedAt).toLocaleTimeString()}`
                    : room.status === "scheduled" && room.scheduledAt
                    ? `Scheduled ${new Date(room.scheduledAt).toLocaleString()}`
                    : `Started ${new Date(room.createdAt).toLocaleTimeString()}`}
                </span>
              </div>

              <div className="flex gap-2">
                {room.status === "active" ? (
                  <>
                    <Button variant="primary" className="flex-1">
                      Join Room
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => endMutation.mutate(room.id)}
                      disabled={endMutation.isPending}
                    >
                      End
                    </Button>
                  </>
                ) : room.status === "scheduled" ? (
                  <Button variant="outline" className="flex-1">
                    Reschedule
                  </Button>
                ) : (
                  <Button variant="outline" className="flex-1" disabled>
                    <ExternalLink className="h-4 w-4 mr-1" /> View Recording
                  </Button>
                )}
                <Button variant="ghost" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create Room Card */}
        <Card
          className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => setShowCreateModal(true)}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center min-h-[200px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Create New Room</p>
            <p className="text-sm text-muted-foreground">Start an instant meeting</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Create Video Room</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Room Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Team Standup"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!newRoomName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate(newRoomName.trim())}
                >
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
