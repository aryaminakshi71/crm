import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  Clock,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { z } from "zod";
import { communicationsApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/communications/chat/_index")({
  validateSearch: searchSchema,
  component: ChatPage,
});

function timeAgo(val: string | null | undefined): string {
  if (!val) return "—";
  const diff = Date.now() - new Date(val).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const PLATFORM_COLORS: Record<string, string> = {
  chat: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  sms: "bg-green-500/10 text-green-400 border-green-500/20",
  email: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  voice: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function ChatPage() {
  const { q = "", page = 1 } = useSearch({ from: "/app/communications/chat/_index" });
  const navigate = useNavigate({ from: "/app/communications/chat" });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["communications", "conversations", page],
    queryFn: () => communicationsApi.conversations.list({ page, limit: PAGE_SIZE }),
  });

  const conversations: any[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openConversations = conversations.filter(
    (c) => c.status === "open" || !c.status,
  ).length;

  const unreadMessages = conversations.reduce(
    (sum, c) => sum + (c.unreadCount ?? 0),
    0,
  );

  const responseTimes = conversations
    .map((c) => c.avgResponseMinutes ?? c.responseTime)
    .filter(Boolean);
  const avgResponseTime =
    responseTimes.length > 0
      ? Math.round(
          responseTimes.reduce((a: number, b: number) => a + b, 0) /
            responseTimes.length,
        )
      : null;

  const stats = [
    { label: "Open Conversations", value: openConversations, icon: MessageCircle, color: "text-cyan-400" },
    { label: "Unread Messages", value: unreadMessages, icon: MessageCircle, color: "text-orange-400" },
    {
      label: "Avg Response Time",
      value: avgResponseTime ? `${avgResponseTime}m` : "—",
      icon: Clock,
      color: "text-blue-400",
    },
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          Failed to load conversations.
        </p>
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
          <h1 className="text-2xl font-bold">Live Chat</h1>
          <p className="text-muted-foreground mt-1">
            Manage real-time conversations across all channels
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse h-16 rounded bg-muted" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <MessageCircle className="h-8 w-8" />
              <p className="text-sm">No conversations yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {conv.participantName ?? conv.subject ?? "Unknown"}
                        </span>
                        {(conv.unreadCount ?? 0) > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0 min-w-[1.25rem] text-center">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {conv.lastMessage ?? conv.participantContact ?? "No messages"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <Badge
                      variant="outline"
                      className={
                        PLATFORM_COLORS[conv.channel ?? "chat"] ??
                        "bg-muted text-muted-foreground"
                      }
                    >
                      {conv.channel ?? "chat"}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(conv.lastMessageAt ?? conv.updatedAt ?? conv.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
