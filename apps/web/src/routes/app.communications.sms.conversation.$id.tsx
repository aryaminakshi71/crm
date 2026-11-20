import { Button, Card, CardContent, Badge, Textarea } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Send,
  Phone,
  MoreVertical,
  CheckCircle,
  Check,
  Image,
  Paperclip,
  Smile,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { communicationsApi } from "@/lib/api";

export const Route = createFileRoute("/app/communications/sms/conversation/$id")({
  component: ConversationPage,
});

interface Message {
  id: string;
  role: "inbound" | "outbound";
  content: string;
  timestamp: string;
  status: "delivered" | "sent" | "failed";
}

function ConversationPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation + messages from API
  const conversationQuery = useQuery({
    queryKey: ["communications", "conversation", id],
    queryFn: () => communicationsApi.conversationMessages.get(id),
    retry: false,
    placeholderData: (prev) => prev,
  });

  // Seed local messages from API
  useEffect(() => {
    if (conversationQuery.data) {
      const apiMessages: any[] = conversationQuery.data.messages ?? [];
      setLocalMessages(
        apiMessages.map((m: any) => ({
            id: m.id ?? crypto.randomUUID(),
            role: m.role ?? "outbound",
            content: m.content ?? m.body ?? "",
            timestamp: m.timestamp
              ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: (m.status as Message["status"]) ?? "delivered",
          }))
        );
    }
  }, [conversationQuery.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => communicationsApi.conversationMessages.send(id, body),
    onSuccess: (result) => {
      const newMsg: Message = {
        id: result?.id ?? crypto.randomUUID(),
        role: "outbound",
        content: result?.content ?? message,
        timestamp: result?.timestamp
          ? new Date(result.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: result?.status ?? "sent",
      };
      setLocalMessages((prev) => [...prev, newMsg]);
      queryClient.invalidateQueries({ queryKey: ["communications", "conversation", id] });
    },
    onError: () => {
      // Optimistic fallback already applied
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    const draft = message;
    setMessage("");

    // Optimistic update
    const optimistic: Message = {
      id: crypto.randomUUID(),
      role: "outbound",
      content: draft,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };
    setLocalMessages((prev) => [...prev, optimistic]);

    sendMutation.mutate(draft);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const contact = {
    name: conversationQuery.data?.conversation?.participantName ?? "John Smith",
    phone: conversationQuery.data?.conversation?.participantContact ?? "+1 555-123-4567",
    status: "active",
  };

  const messages = localMessages;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications/sms" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <span className="text-lg font-semibold text-primary">{contact.name[0]}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">{contact.name}</h2>
                <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
              </div>
              <p className="text-muted-foreground text-sm">{contact.phone}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Phone className="h-4 w-4" />}>
            Call
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="border-border/60 h-[calc(100vh-320px)] flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversationQuery.isLoading && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                Loading conversation...
              </div>
            )}

            <div className="text-center">
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">Today</span>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "outbound" ? "justify-end" : ""}`}>
                {msg.role === "inbound" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-medium text-primary">{contact.name[0]}</span>
                  </div>
                )}
                <div className={`max-w-[70%] ${msg.role === "outbound" ? "order-1" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      msg.role === "outbound"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${msg.role === "outbound" ? "justify-end" : ""}`}>
                    <span className={`text-xs ${msg.role === "outbound" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {msg.timestamp}
                    </span>
                    {msg.role === "outbound" && (
                      msg.status === "delivered" ? (
                        <CheckCircle className="h-3 w-3 text-primary-foreground/70" />
                      ) : msg.status === "sent" ? (
                        <Check className="h-3 w-3 text-primary-foreground/70" />
                      ) : (
                        <span className="text-xs text-red-400">Failed</span>
                      )
                    )}
                  </div>
                </div>
                {msg.role === "outbound" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-sm font-medium text-primary">Y</span>
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Image className="h-4 w-4" />
              </Button>
              <Textarea
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="flex-1 resize-none"
              />
              <Button variant="ghost" size="icon" className="shrink-0">
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                variant="primary"
                size="icon"
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
