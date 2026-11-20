import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  XCircle,
  X,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { communicationsApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 50;

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/communications/sms/_index")({
  validateSearch: searchSchema,
  component: SmsPage,
});

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  queued: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  undelivered: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

function formatDate(val: string | null | undefined): string {
  if (!val) return "—";
  return new Date(val).toLocaleString();
}

function SmsPage() {
  const queryClient = useQueryClient();
  const { q = "", page = 1 } = useSearch({ from: "/app/communications/sms/_index" });
  const navigate = useNavigate({ from: "/app/communications/sms" });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [showModal, setShowModal] = useState(false);
  const [toNumber, setToNumber] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [fromNumber, setFromNumber] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["communications", "sms", page],
    queryFn: () => communicationsApi.conversations.list({ page, limit: PAGE_SIZE, channel: "sms" }),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      communicationsApi.campaigns.create({
        name: `SMS to ${toNumber}`,
        body: messageBody,
        fromNumber: fromNumber || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "sms"] });
      setShowModal(false);
      setToNumber("");
      setMessageBody("");
      setFromNumber("");
    },
  });

  const messages: any[] = (data as any)?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const today = new Date();
  const sentToday = messages.filter((m) => {
    const d = new Date(m.createdAt ?? m.lastMessageAt ?? "");
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }).length;

  const delivered = messages.filter((m) => m.status === "delivered").length;
  const failed = messages.filter((m) => m.status === "failed").length;
  const deliveryRate =
    messages.length > 0
      ? Math.round((delivered / messages.length) * 100)
      : 0;

  const stats = [
    { label: "Sent Today", value: sentToday, icon: Send, color: "text-blue-400" },
    { label: "Delivery Rate", value: `${deliveryRate}%`, icon: CheckCircle2, color: "text-green-400" },
    { label: "Failed", value: failed, icon: XCircle, color: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SMS</h1>
          <p className="text-muted-foreground mt-1">
            Send and track SMS messages
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Send SMS
          </Button>
        </div>
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

      {isError && (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load messages.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 rounded bg-muted" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <MessageSquare className="h-8 w-8" />
              <p className="text-sm">No SMS messages yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">To / From</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Preview</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Direction</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr
                      key={msg.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        <div>{msg.participantContact ?? msg.to ?? msg.from ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {msg.lastMessage ?? msg.subject ?? msg.body ?? "No preview"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {msg.direction ?? msg.channel ?? "sms"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            STATUS_COLORS[msg.status] ??
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {msg.status ?? "unknown"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(msg.createdAt ?? msg.lastMessageAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Send SMS Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Send SMS</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">To (phone number)</label>
                <Input
                  placeholder="+1 555 000 0000"
                  value={toNumber}
                  onChange={(e) => setToNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">From (optional)</label>
                <Input
                  placeholder="Leave blank to use default"
                  value={fromNumber}
                  onChange={(e) => setFromNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Message</label>
                <textarea
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={4}
                  placeholder="Type your message..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={
                  sendMutation.isPending ||
                  !toNumber.trim() ||
                  !messageBody.trim()
                }
              >
                {sendMutation.isPending ? "Sending…" : "Send"}
              </Button>
            </div>
            {sendMutation.isError && (
              <p className="text-xs text-destructive">
                Failed to send. Please try again.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
