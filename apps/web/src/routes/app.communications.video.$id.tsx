import { Button, Card, CardContent, Badge, Input } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Monitor,
  Users,
  MessageSquare,
  MoreVertical,
  Settings,
  Share,
  Maximize,
  Clock,
  Copy,
  Send,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/video/$id")({
  component: VideoRoomPage,
});

const PARTICIPANTS = [
  { id: "p1", name: "You", isMuted: false, isVideoOn: true, isSpeaking: true },
  { id: "p2", name: "Sarah Johnson", isMuted: false, isVideoOn: true, isSpeaking: false },
  { id: "p3", name: "Michael Chen", isMuted: true, isVideoOn: true, isSpeaking: false },
  { id: "p4", name: "Emily Davis", isMuted: false, isVideoOn: false, isSpeaking: false },
];

const CHAT_MESSAGES = [
  { id: "1", sender: "Sarah", content: "Can you share your screen?", timestamp: "10:30 AM" },
  { id: "2", sender: "Michael", content: "I'll share the presentation", timestamp: "10:31 AM" },
  { id: "3", sender: "You", content: "Great, thanks!", timestamp: "10:31 AM" },
];

function VideoRoomPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [callDuration, setCallDuration] = useState(0);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatMessage("");
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications/video" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-semibold">Team Standup</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> 10:00
              </span>
              <span>•</span>
              <span>4 participants</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Share className="h-4 w-4" />}>
            Share
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 bg-gray-900">
          <div className="grid grid-cols-2 gap-4 h-full">
            {PARTICIPANTS.map((participant) => (
              <div key={participant.id} className="relative rounded-xl bg-gray-800 overflow-hidden">
                {participant.isVideoOn ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl font-bold text-white/50">
                      {participant.name[0]}
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                    <VideoOff className="h-12 w-12 text-white/50" />
                  </div>
                )}

                {participant.isSpeaking && (
                  <div className="absolute inset-0 border-4 border-green-500 rounded-xl pointer-events-none" />
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{participant.name}</span>
                      {participant.isMuted && <MicOff className="h-4 w-4 text-red-400" />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 border-l bg-card flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Chat
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {CHAT_MESSAGES.map((msg) => (
                <div key={msg.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{msg.sender}</span>
                    <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm bg-muted rounded-lg px-3 py-2">{msg.content}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button size="icon" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t bg-card">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isMuted ? "primary" : "outline"}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button
            variant={isVideoOn ? "outline" : "primary"}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full">
            <Monitor className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => setShowChat(!showChat)}>
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full">
            <Users className="h-5 w-5" />
          </Button>
          <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={() => navigate({ to: "/app/communications/video" })}>
            <Phone className="h-5 w-5 rotate-[135deg]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
