import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  MessageCircle,
  Plus,
  Search,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Clock,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/chat")({
  component: ChatInterfacePage,
});

interface Chat {
  id: string;
  contact: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: "online" | "offline" | "away";
}

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
}

const MOCK_CHATS: Chat[] = [
  { id: "c1", contact: "Sarah Johnson", lastMessage: "Thanks for your help!", timestamp: "2 min ago", unread: 2, status: "online" },
  { id: "c2", contact: "Michael Chen", lastMessage: "I'll check and get back to you", timestamp: "15 min ago", unread: 0, status: "online" },
  { id: "c3", contact: "Emily Davis", lastMessage: "Is this product available in blue?", timestamp: "1 hour ago", unread: 1, status: "offline" },
];

function ChatInterfacePage() {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string | null>("c1");
  const [message, setMessage] = useState("");
  const [messages] = useState<Message[]>([
    { id: "1", role: "user", content: "Hi, I need help with my order", timestamp: "10:23 AM" },
    { id: "2", role: "agent", content: "Hello! I'd be happy to help. Could you please provide your order number?", timestamp: "10:24 AM" },
    { id: "3", role: "user", content: "It's order #12345", timestamp: "10:25 AM" },
    { id: "4", role: "agent", content: "Thank you! I can see your order. It's currently being processed and will ship within 24 hours.", timestamp: "10:26 AM" },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessage("");
  };

  return (
    <div className="h-[calc(100vh-200px)] flex gap-6">
      {/* Chat List */}
      <div className="w-80 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Chats</h2>
          <Button variant="ghost" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {MOCK_CHATS.map((chat) => (
            <div
              key={chat.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedChat === chat.id ? "bg-primary/10" : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedChat(chat.id)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-semibold text-primary">{chat.contact[0]}</span>
                  </div>
                  <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                    chat.status === "online" ? "bg-green-500" : chat.status === "away" ? "bg-amber-500" : "bg-gray-400"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{chat.contact}</h3>
                    <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {chat.unread}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <Card className="flex-1 border-border/60 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-semibold text-primary">S</span>
            </div>
            <div>
              <h3 className="font-semibold">Sarah Johnson</h3>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" /> Online
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "agent" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                  A
                </div>
              )}
              <div className={`max-w-[70%] rounded-xl px-4 py-2 ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg bg-background"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button variant="ghost" size="icon">
              <Smile className="h-4 w-4" />
            </Button>
            <Button variant="primary" size="icon" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
