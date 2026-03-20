import { Card, CardContent, CardHeader, CardTitle, Badge } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageSquare,
  Phone,
  Video,
  MessageCircle,
  Bot,
  PhoneForwarded,
  ArrowRight,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/app/communications/_index")({
  component: CommunicationsDashboard,
});

const RECENT_ACTIVITY = [
  { type: "sms", message: "New SMS from +1 555-123-4567", time: "2 min ago", status: "received" },
  { type: "call", message: "Outbound call to +1 555-987-6543", time: "5 min ago", status: "completed" },
  { type: "chat", message: "New chat session started", time: "8 min ago", status: "active" },
  { type: "sms", message: "Bulk SMS sent to 150 recipients", time: "12 min ago", status: "delivered" },
  { type: "video", message: "Video room 'Team Standup' started", time: "15 min ago", status: "active" },
];

const QUICK_ACTIONS = [
  { name: "Send SMS", description: "Compose and send SMS", href: "/app/communications/sms/compose", icon: MessageSquare, color: "bg-blue-500" },
  { name: "Make Call", description: "Open dialpad", href: "/app/communications/voice/dial", icon: Phone, color: "bg-emerald-500" },
  { name: "Create Video Room", description: "Start a video meeting", href: "/app/communications/video", icon: Video, color: "bg-amber-500" },
  { name: "Chat Widget", description: "Open chat interface", href: "/app/communications/chat", icon: MessageCircle, color: "bg-purple-500" },
  { name: "Build Chatbot", description: "Create a new chatbot", href: "/app/communications/chatbot", icon: Bot, color: "bg-pink-500" },
  { name: "Manage Numbers", description: "View phone numbers", href: "/app/communications/numbers", icon: PhoneForwarded, color: "bg-indigo-500" },
];

function CommunicationsDashboard() {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.name}
            to={action.href}
            className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors text-center group"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color} mx-auto mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{action.name}</h3>
            <p className="text-muted-foreground text-xs mt-1">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RECENT_ACTIVITY.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.type === "sms" ? "bg-blue-100" :
                      activity.type === "call" ? "bg-emerald-100" :
                      activity.type === "chat" ? "bg-purple-100" :
                      "bg-amber-100"
                    }`}>
                      {activity.type === "sms" && <MessageSquare className="h-4 w-4 text-blue-600" />}
                      {activity.type === "call" && <Phone className="h-4 w-4 text-emerald-600" />}
                      {activity.type === "chat" && <MessageCircle className="h-4 w-4 text-purple-600" />}
                      {activity.type === "video" && <Video className="h-4 w-4 text-amber-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  <Badge className={
                    activity.status === "active" ? "bg-green-100 text-green-800" :
                    activity.status === "completed" || activity.status === "delivered" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }>
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Channel Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-800">SMS</span>
                <span className="text-xs text-blue-600">94% delivery</span>
              </div>
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: "94%" }} />
              </div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-emerald-800">Voice</span>
                <span className="text-xs text-emerald-600">98% connect</span>
              </div>
              <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: "98%" }} />
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-800">Chat</span>
                <span className="text-xs text-purple-600">4.5 min avg response</span>
              </div>
              <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: "75%" }} />
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-amber-800">Video</span>
                <span className="text-xs text-amber-600">12 active rooms</span>
              </div>
              <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-600 rounded-full" style={{ width: "60%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
