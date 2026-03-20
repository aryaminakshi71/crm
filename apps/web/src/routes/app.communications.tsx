import { Card, CardContent, Button } from "@crm/ui";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  MessageSquare,
  Phone,
  Video,
  MessageCircle,
  Bot,
  PhoneForwarded,
  Users,
  Settings,
  Bell,
  ArrowLeft,
  LayoutGrid,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications")({
  component: CommunicationsLayout,
});

const COMM_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/app/communications", icon: LayoutGrid },
  { id: "sms", label: "SMS", href: "/app/communications/sms", icon: MessageSquare },
  { id: "voice", label: "Voice", href: "/app/communications/voice", icon: Phone },
  { id: "video", label: "Video", href: "/app/communications/video", icon: Video },
  { id: "chat", label: "Chat", href: "/app/communications/chat", icon: MessageCircle },
  { id: "chatbot", label: "Chatbot", href: "/app/communications/chatbot", icon: Bot },
  { id: "numbers", label: "Phone Numbers", href: "/app/communications/numbers", icon: PhoneForwarded },
  { id: "routing", label: "Call Routing", href: "/app/communications/routing", icon: Phone },
  { id: "queue", label: "Call Queue", href: "/app/communications/queue", icon: Users },
  { id: "templates", label: "Templates", href: "/app/communications/templates", icon: MessageSquare },
];

function CommunicationsLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const stats = [
    { label: "SMS Today", value: "156", icon: MessageSquare, color: "text-blue-500" },
    { label: "Calls Today", value: "42", icon: Phone, color: "text-emerald-500" },
    { label: "Video Rooms", value: "8", icon: Video, color: "text-amber-500" },
    { label: "Active Chats", value: "23", icon: MessageCircle, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-bold text-2xl text-foreground">Communications (Samva)</h1>
            <p className="text-muted-foreground text-sm">
              SMS, Voice, Video, and Chat APIs
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto pb-2">
          {COMM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
