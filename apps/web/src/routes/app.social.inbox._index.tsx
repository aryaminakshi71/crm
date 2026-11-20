/**
 * Social Inbox
 *
 * Incoming social messages with platform, sender, content,
 * reply action, and unreplied filter.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  CheckCheck,
  Inbox,
  MessageSquare,
  Search,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;
import { socialApi } from "@/lib/api";

const searchSchema = z.object({
  filter: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/social/inbox/_index")({
  validateSearch: searchSchema,
  component: SocialInboxPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface InboxMessage {
  id: string;
  senderName: string;
  senderHandle?: string;
  platform: string;
  content: string;
  receivedAt: string;
  replied: boolean;
  repliedAt?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const _MOCK_MESSAGES: InboxMessage[] = [
  { id: "1", senderName: "Alex Thompson", senderHandle: "@alexthompson", platform: "twitter", content: "Hey! Any updates on the Series X launch? Can't wait to get my hands on it 🚀", receivedAt: "2026-03-24T10:30:00Z", replied: false },
  { id: "2", senderName: "Maria Santos", senderHandle: "@mariasantos", platform: "instagram", content: "Love the new product photos! Would you ship internationally?", receivedAt: "2026-03-24T09:15:00Z", replied: true, repliedAt: "2026-03-24T09:45:00Z" },
  { id: "3", senderName: "James K.", senderHandle: "jameskirkland", platform: "linkedin", content: "Interested in your enterprise plan. Could we schedule a call to discuss pricing for a 200-person team?", receivedAt: "2026-03-24T08:00:00Z", replied: false },
  { id: "4", senderName: "Priya Patel", senderHandle: "@priyapatel", platform: "twitter", content: "Is there an API we can integrate with our internal tooling?", receivedAt: "2026-03-23T16:00:00Z", replied: true, repliedAt: "2026-03-23T17:30:00Z" },
  { id: "5", senderName: "Tech Buyer Group", senderHandle: "techbuyergroup", platform: "facebook", content: "We saw your webinar announcement — can we get a group discount for 50+ registrations?", receivedAt: "2026-03-23T14:00:00Z", replied: false },
  { id: "6", senderName: "Sarah Lin", senderHandle: "@sarahlin", platform: "instagram", content: "Where can I find your refund policy? Can't find it on the site.", receivedAt: "2026-03-23T11:30:00Z", replied: true, repliedAt: "2026-03-23T12:00:00Z" },
];

// ─── Platform helpers ─────────────────────────────────────────────────────────

function platformStyles(p: string) {
  switch (p) {
    case "twitter": return { bg: "bg-sky-500/10", text: "text-sky-400", label: "X / Twitter" };
    case "instagram": return { bg: "bg-pink-500/10", text: "text-pink-400", label: "Instagram" };
    case "facebook": return { bg: "bg-blue-500/10", text: "text-blue-400", label: "Facebook" };
    case "linkedin": return { bg: "bg-blue-600/10", text: "text-blue-500", label: "LinkedIn" };
    default: return { bg: "bg-muted/50", text: "text-muted-foreground", label: p };
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Reply Modal ──────────────────────────────────────────────────────────────

function ReplyModal({ message, onClose, onReplied }: { message: InboxMessage; onClose: () => void; onReplied: () => void }) {
  const [reply, setReply] = useState("");

  const mutation = useMutation({
    mutationFn: () => socialApi.inbox.reply(message.id, reply),
    onSuccess: () => {
      toast.success("Reply sent");
      onReplied();
      onClose();
    },
    onError: () => toast.error("Failed to send reply"),
  });

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-xl border border-border/60 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="font-semibold text-lg">Reply to {message.senderName}</h2>
            <p className="text-xs text-muted-foreground">{message.senderHandle} · {platformStyles(message.platform).label}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4">
          <div className="mb-4 rounded-lg bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            "{message.content}"
          </div>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={4}
            placeholder="Write your reply…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            autoFocus
          />
          <div className="mt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              type="button"
              className="flex-1 gap-1"
              disabled={!reply.trim() || mutation.isPending}
              onClick={() => { if (!reply.trim()) return; mutation.mutate(); }}
            >
              <Send className="h-3.5 w-3.5" />
              {mutation.isPending ? "Sending…" : "Send Reply"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function SocialInboxPage() {
  const qc = useQueryClient();
  const { filter = "all", page = 1 } = useSearch({ from: "/app/social/inbox/_index" });
  const navigate = useNavigate({ from: "/app/social/inbox" });

  const setFilter = (val: string) => navigate({ search: (prev) => ({ ...prev, filter: val, page: 1 }) });
  const setPage = (val: number) => navigate({ search: (prev) => ({ ...prev, page: val }) });
  const [search, setSearch] = useState("");
  const [replyTarget, setReplyTarget] = useState<InboxMessage | null>(null);
  // Local override for replied state
  const [repliedIds, setRepliedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["social", "inbox", page],
    queryFn: () => socialApi.inbox.list({ page, limit: PAGE_SIZE }),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const messages: InboxMessage[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const withOverrides = messages.map((m) => ({
    ...m,
    replied: repliedIds.has(m.id) ? true : m.replied,
  }));

  const filtered = withOverrides.filter((m) => {
    const matchSearch = !search || m.senderName.toLowerCase().includes(search.toLowerCase()) || m.content.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || !m.replied;
    return matchSearch && matchFilter;
  });

  const unrepliedCount = withOverrides.filter((m) => !m.replied).length;

  function handleReplied(id: string) {
    setRepliedIds((prev) => new Set([...prev, id]));
    qc.invalidateQueries({ queryKey: ["social", "inbox"] });
  }

  return (
    <div className="space-y-6">
      {replyTarget && (
        <ReplyModal
          message={replyTarget}
          onClose={() => setReplyTarget(null)}
          onReplied={() => { handleReplied(replyTarget.id); setReplyTarget(null); }}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Inbox className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Messages</p>
              <p className="text-2xl font-black">{messages.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${unrepliedCount > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
              <MessageSquare className={`h-5 w-5 ${unrepliedCount > 0 ? "text-amber-400" : "text-emerald-400"}`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unreplied</p>
              <p className="text-2xl font-black">{unrepliedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
          {(["all", "unreplied"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-2 capitalize transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {f === "unreplied" ? `Unreplied (${unrepliedCount})` : "All"}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            className="h-8 w-48 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Search messages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Messages */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading messages…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-40" />
              <p className="text-sm">{filter === "unreplied" ? "No unreplied messages" : "No messages found"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((m) => {
                const ps = platformStyles(m.platform);
                return (
                  <div key={m.id} className={`flex flex-col sm:flex-row sm:items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors ${!m.replied ? "border-l-2 border-l-primary/40" : ""}`}>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 font-semibold text-xs ${ps.bg} ${ps.text}`}>
                        {m.senderName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{m.senderName}</p>
                          {m.senderHandle && <p className="text-xs text-muted-foreground">{m.senderHandle}</p>}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ps.bg} ${ps.text}`}>{ps.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{m.content}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground/60">{timeAgo(m.receivedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.replied ? (
                        <Badge variant="success" className="text-emerald-400 flex items-center gap-1">
                          <CheckCheck className="h-3 w-3" />
                          Replied
                        </Badge>
                      ) : (
                        <>
                          <Badge variant="outline" className="text-amber-400">Unreplied</Badge>
                          <Button
                            size="sm"
                            variant="primary"
                            className="h-7 text-xs gap-1"
                            onClick={() => setReplyTarget(m)}
                          >
                            <Send className="h-3 w-3" />
                            Reply
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
