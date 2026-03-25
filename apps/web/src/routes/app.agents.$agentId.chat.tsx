import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Textarea } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bot,
  Send,
  Copy,
  Trash2,
  Download,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { agentsApi } from "@/lib/api";

export const Route = createFileRoute("/app/agents/$agentId/chat")({
  component: AgentChatPage,
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  feedback?: "up" | "down" | null;
}

const QUICK_PROMPTS = [
  "Explain this in simple terms",
  "Show me the code",
  "What are the alternatives?",
  "Can you elaborate?",
];

function AgentChatPage() {
  const { agentId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history from API on mount
  const historyQuery = useQuery({
    queryKey: ["agents", agentId, "history"],
    queryFn: () => agentsApi.history(agentId),
    retry: false,
  });

  if (historyQuery.isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => historyQuery.refetch()}>Retry</Button>
    </div>
  );

  // Seed local state from API history (once)
  useEffect(() => {
    if (historyQuery.data?.messages?.length && localMessages.length === 0) {
      const seeded: Message[] = historyQuery.data.messages.map((m: any) => ({
        id: m.id ?? crypto.randomUUID(),
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
      }));
      setLocalMessages(seeded);
    }
  }, [historyQuery.data]);

  const messages = localMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedContent]);

  // Send message mutation
  const chatMutation = useMutation({
    mutationFn: (msg: string) => agentsApi.chat(agentId, msg),
  });

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setLocalMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);
    setStreamedContent("");

    try {
      const result = await chatMutation.mutateAsync(message);
      const fullResponse: string = result?.message ?? "I received your message and I'm processing it.";

      // Simulate streaming from the API response
      let currentIndex = 0;
      const streamInterval = setInterval(() => {
        if (currentIndex < fullResponse.length) {
          setStreamedContent(fullResponse.slice(0, currentIndex + 10));
          currentIndex += 10;
        } else {
          clearInterval(streamInterval);
          setStreamedContent("");
          setIsTyping(false);
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: fullResponse,
            timestamp: result?.timestamp ? new Date(result.timestamp) : new Date(),
          };
          setLocalMessages((prev) => [...prev, assistantMessage]);
        }
      }, 50);
    } catch {
      // Fallback response on error
      const fallback = "I'm having trouble connecting right now. Please try again.";
      setStreamedContent("");
      setIsTyping(false);
      setLocalMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fallback,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = (messageId: string, feedback: "up" | "down") => {
    setLocalMessages(messages.map((msg) =>
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
  };

  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  const clearChat = () => {
    setLocalMessages([]);
    setStreamedContent("");
    queryClient.invalidateQueries({ queryKey: ["agents", agentId, "history"] });
  };

  const exportChat = () => {
    const chatText = messages
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"} (${msg.timestamp.toLocaleTimeString()}):\n${msg.content}`)
      .join("\n\n");
    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${agentId.slice(0, 8)}.txt`;
    a.click();
  };

  return (
    <div className="h-[calc(100vh-280px)] flex flex-col">
      <Card className="border-border/60 flex-1 flex flex-col">
        <CardHeader className="pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat with Agent
              <Badge variant="outline" className="ml-2 text-xs">Streaming Enabled</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={exportChat}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {historyQuery.isLoading && (
              <div className="text-center py-4 text-muted-foreground text-sm">Loading chat history...</div>
            )}

            {messages.length === 0 && !historyQuery.isLoading && (
              <div className="text-center py-12">
                <div className="flex justify-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Bot className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                    <span className="text-xl font-bold">U</span>
                  </div>
                </div>
                <p className="text-muted-foreground font-medium mb-4">Start your conversation</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleQuickPrompt(prompt)}
                      className="px-3 py-1.5 text-sm bg-muted/50 hover:bg-muted rounded-full border transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="max-w-[75%] space-y-2">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  <div className={`flex items-center gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                    <span className={`text-xs ${
                      msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleFeedback(msg.id, "up")}
                          className={`p-1 rounded hover:bg-muted/50 ${msg.feedback === "up" ? "text-green-600" : "text-muted-foreground"}`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, "down")}
                          className={`p-1 rounded hover:bg-muted/50 ${msg.feedback === "down" ? "text-red-600" : "text-muted-foreground"}`}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                        <button className="p-1 rounded hover:bg-muted/50 text-muted-foreground">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-sm font-medium text-primary">U</span>
                  </div>
                )}
              </div>
            ))}

            {/* Streaming indicator */}
            {isTyping && streamedContent && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-muted">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{streamedContent}</p>
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                </div>
              </div>
            )}

            {isTyping && !streamedContent && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-card flex-shrink-0">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="flex-1 resize-none min-h-[44px] max-h-[200px]"
              />
              <Button
                variant="primary"
                size="icon"
                onClick={handleSend}
                disabled={!message.trim() || isTyping}
                className="h-[44px] w-[44px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Enter to send, Shift+Enter for new line</span>
              <span>{messages.length} messages in this session</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
