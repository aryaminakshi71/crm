import { Button, Card, CardContent, Badge, Input } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, Heart, MessageSquare, Share2, Mail, Instagram, Twitter, Linkedin,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/app/social/inbox")({
  component: InboxPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

interface Message {
  id: string;
  platform: string;
  author: string;
  content: string;
  type: "mention" | "comment" | "dm" | "like";
  timestamp: string;
  read: boolean;
}

const MOCK_MESSAGES: Message[] = [
  { id: "m1", platform: "instagram", author: "@techfan42", content: "Love your product! Just bought the Pro plan and it's amazing!", type: "comment", timestamp: "5 min ago", read: false },
  { id: "m2", platform: "twitter", author: "@startupfounder", content: "@nucleoone When will the new features be released?", type: "mention", timestamp: "15 min ago", read: false },
  { id: "m3", platform: "instagram", author: "@designlover", content: "Beautiful UI! Inspiring design work.", type: "comment", timestamp: "30 min ago", read: true },
  { id: "m4", platform: "linkedin", author: "John Smith", content: "Great article on AI agents! Shared it with my network.", type: "mention", timestamp: "1 hour ago", read: true },
  { id: "m5", platform: "twitter", author: "@devuser123", content: "Having trouble with API integration. Any help?", type: "mention", timestamp: "2 hours ago", read: true },
];

function InboxPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  const { data, isLoading, refetch, isError} = useQuery({
    queryKey: ["social", "mentions"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/social/listening/mentions`, {
        headers: { ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch mentions");
      return res.json();
    },
  });

  const messages: Message[] = data?.data ?? MOCK_MESSAGES;

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return <Instagram className="h-4 w-4 text-pink-500" />;
      case "twitter": return <Twitter className="h-4 w-4 text-sky-500" />;
      case "linkedin": return <Linkedin className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: Message["type"]) => {
    switch (type) {
      case "mention": return <Mail className="h-4 w-4" />;
      case "comment": return <MessageSquare className="h-4 w-4" />;
      case "like": return <Heart className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  if (isLoading) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const filteredMessages = messages.filter((m) =>
    m.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Social Inbox</h2>
            <p className="text-muted-foreground text-sm">All your social media mentions in one place</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMessages.map((message) => (
          <Card
            key={message.id}
            className={`border-border/60 cursor-pointer transition-colors ${
              selectedMessage === message.id ? "border-primary" : "hover:border-primary/50"
            } ${!message.read ? "bg-primary/5" : ""}`}
            onClick={() => setSelectedMessage(message.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getPlatformIcon(message.platform)}
                  <span className="font-medium text-sm">{message.author}</span>
                </div>
                {!message.read && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{message.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {getTypeIcon(message.type)}
                  <span>{message.type}</span>
                </div>
                <span className="text-xs text-muted-foreground">{message.timestamp}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
