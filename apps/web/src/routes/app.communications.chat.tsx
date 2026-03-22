import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Plus, Search, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { communicationsApi } from "../lib/api";

export const Route = createFileRoute("/app/communications/chat")({
  component: ChatPage,
});

// ─── Fallback mock data ───────────────────────────────────────────────────────

const MOCK_CHATS = [
  {
    id: "mock-1",
    channel: "chat",
    status: "open",
    subject: "Product inquiry",
    participantName: "Alice Johnson",
    participantContact: "alice@example.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mock-2",
    channel: "chat",
    status: "closed",
    subject: "Billing question",
    participantName: "Bob Smith",
    participantContact: "bob@example.com",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-500/20 text-green-400",
  closed: "bg-muted text-muted-foreground",
  pending: "bg-yellow-500/20 text-yellow-400",
};

// ─── Component ───────────────────────────────────────────────────────────────

function ChatPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newParticipant, setNewParticipant] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["communications", "conversations", statusFilter],
    queryFn: () =>
      communicationsApi.conversations.list({
        page: 1,
        limit: 100,
        channel: "chat",
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  const conversations: any[] = data?.data ?? MOCK_CHATS;

  const createMutation = useMutation({
    mutationFn: (payload: { subject: string; participantName: string }) =>
      communicationsApi.conversations.create({
        channel: "chat",
        subject: payload.subject,
        participantName: payload.participantName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "conversations"] });
      toast.success("Conversation started");
      setIsCreating(false);
      setNewSubject("");
      setNewParticipant("");
    },
    onError: () => toast.error("Failed to create conversation"),
  });

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.subject?.toLowerCase().includes(q) ||
      c.participantName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-cyan-400" />
            Live Chat
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time conversations with customers
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* New conversation form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Start New Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <Input
              placeholder="Participant name"
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  createMutation.mutate({
                    subject: newSubject,
                    participantName: newParticipant,
                  })
                }
                disabled={!newSubject || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Start"}
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {(["all", "open", "pending", "closed"] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-10 w-10 text-muted-foreground" />}
          title="No conversations"
          description="Start a new conversation to begin chatting."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((conv) => (
            <Card key={conv.id} className="hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{conv.participantName ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{conv.subject ?? "No subject"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[conv.status] ?? ""}`}
                  >
                    {conv.status}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <p className="text-sm text-destructive">
          Could not load live data — showing cached results.
        </p>
      )}
    </div>
  );
}
