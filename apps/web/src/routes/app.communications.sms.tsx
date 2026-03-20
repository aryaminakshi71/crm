import { Button, Card, CardContent, Badge, Input } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Search,
  Filter,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/sms")({
  component: SMSMessagesPage,
});

interface Conversation {
  id: string;
  contact: string;
  phone: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: "active" | "closed";
}

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "conv-1", contact: "Sarah Johnson", phone: "+1 555-123-4567", lastMessage: "Thanks for your help with the order!", timestamp: "2 min ago", unread: 2, status: "active" },
  { id: "conv-2", contact: "Michael Chen", phone: "+1 555-234-5678", lastMessage: "When will my package arrive?", timestamp: "15 min ago", unread: 0, status: "active" },
  { id: "conv-3", contact: "Emily Davis", phone: "+1 555-345-6789", lastMessage: "I'd like to schedule a demo please", timestamp: "1 hour ago", unread: 1, status: "active" },
  { id: "conv-4", contact: "Robert Wilson", phone: "+1 555-456-7890", lastMessage: "Can you send me the invoice?", timestamp: "2 hours ago", unread: 0, status: "closed" },
  { id: "conv-5", contact: "Jennifer Martinez", phone: "+1 555-567-8901", lastMessage: "The product looks great, thanks!", timestamp: "3 hours ago", unread: 0, status: "closed" },
  { id: "conv-6", contact: "David Brown", phone: "+1 555-678-9012", lastMessage: "I'm having trouble with my account", timestamp: "5 hours ago", unread: 0, status: "closed" },
];

function SMSMessagesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");

  const filteredConversations = MOCK_CONVERSATIONS.filter((conv) => {
    const matchesSearch = conv.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.phone.includes(searchQuery) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || conv.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">SMS Messages</h2>
            <p className="text-muted-foreground text-sm">View and manage SMS conversations</p>
          </div>
        </div>
        <Link to="/app/communications/sms/compose">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Compose SMS
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-xl font-bold">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-xl font-bold">1,189</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">45</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-xl font-bold">13</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 border rounded-lg bg-background text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
          <Link to="/app/communications/sms/bulk">
            <Button variant="outline" leftIcon={<MessageSquare className="h-4 w-4" />}>
              Bulk SMS
            </Button>
          </Link>
        </div>
      </div>

      {/* Conversations List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                to={`/app/communications/sms/conversation/${conv.id}` as string}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg font-semibold text-primary">{conv.contact[0]}</span>
                  </div>
                  {conv.unread > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {conv.unread}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${conv.unread > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                        {conv.contact}
                      </h3>
                      <Badge variant="outline" className="text-xs">{conv.phone}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                  </div>
                  <p className={`text-sm truncate ${conv.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {conv.lastMessage}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
