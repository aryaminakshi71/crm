import { Button, Card, CardContent, Badge } from "@crm/ui";
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
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/video")({
  component: VideoRoomsPage,
});

interface Room {
  id: string;
  name: string;
  participants: number;
  maxParticipants: number;
  status: "active" | "scheduled" | "ended";
  timestamp: string;
  duration?: string;
}

const MOCK_ROOMS: Room[] = [
  { id: "room-1", name: "Team Standup", participants: 5, maxParticipants: 10, status: "active", timestamp: "Started 10 min ago", duration: "10 min" },
  { id: "room-2", name: "Product Review", participants: 3, maxParticipants: 8, status: "active", timestamp: "Started 25 min ago", duration: "25 min" },
  { id: "room-3", name: "Sales Call - Acme Corp", participants: 2, maxParticipants: 6, status: "scheduled", timestamp: "Tomorrow at 2:00 PM" },
  { id: "room-4", name: "Engineering Sync", participants: 0, maxParticipants: 12, status: "ended", timestamp: "Yesterday at 3:00 PM", duration: "45 min" },
];

function VideoRoomsPage() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getStatusBadge = (status: Room["status"]) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "scheduled": return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "ended": return <Badge variant="outline">Ended</Badge>;
    }
  };

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
                <p className="text-xl font-bold">2</p>
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
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="text-xl font-bold">8</p>
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
                <p className="text-sm text-muted-foreground">Total Meetings</p>
                <p className="text-xl font-bold">156</p>
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
                <p className="text-sm text-muted-foreground">Hours This Week</p>
                <p className="text-xl font-bold">42</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_ROOMS.map((room) => (
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
                  {room.participants}/{room.maxParticipants}
                </span>
                <span>{room.duration || room.timestamp}</span>
              </div>

              <div className="flex gap-2">
                {room.status === "active" ? (
                  <Link to={`/app/communications/video/${room.id}` as string} className="flex-1">
                    <Button variant="primary" className="w-full">
                      Join Room
                    </Button>
                  </Link>
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
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setShowCreateModal(true)}>
          <CardContent className="p-4 flex flex-col items-center justify-center min-h-[200px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Create New Room</p>
            <p className="text-sm text-muted-foreground">Schedule an instant meeting</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
