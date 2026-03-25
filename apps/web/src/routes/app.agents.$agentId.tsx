import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Textarea } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Play,
  Send,
  Settings,
  Database,
  MemoryStick,
  Clock,
  Zap,
  TrendingUp,
  MessageSquare,
  Copy,
  RefreshCw,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/agents/$agentId")({
  component: AgentDetailPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

const MEMORY_ITEMS_MOCK = [
  { type: "user", content: "User asked about pricing plans", timestamp: "2 hours ago" },
  { type: "context", content: "User is from enterprise company", timestamp: "Yesterday" },
  { type: "preference", content: "Prefers detailed technical explanations", timestamp: "3 days ago" },
];

const CONTEXT_VARIABLES_MOCK = [
  { name: "company_name", value: "Acme Corp", type: "string" },
  { name: "user_plan", value: "enterprise", type: "string" },
  { name: "total_tasks", value: "47", type: "number" },
  { name: "satisfaction_score", value: "4.8/5", type: "number" },
];

function AgentDetailPage() {
  const { agentId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"chat" | "memory" | "config">("chat");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  // GET /api/agents/:id — fetch agent detail
  const { data: agent, isLoading: agentLoading, isError, refetch} = useQuery({
    queryKey: ["agents", agentId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/agents/${agentId}`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Agent not found");
      return res.json() as Promise<{
        id: string;
        name: string;
        agentType: string;
        status: string;
        description: string | null;
        config: Record<string, unknown>;
        createdAt: string;
        updatedAt: string;
      }>;
    },
  });

  // GET /api/agents/:id/conversations
  const { data: conversationsData } = useQuery({
    queryKey: ["agents", agentId, "conversations"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/agents/${agentId}/conversations?limit=20`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json() as Promise<{
        data: Array<{ id: string; status: string; createdAt: string; updatedAt: string }>;
        total: number;
      }>;
    },
    enabled: !!agentId,
  });

  // POST /api/agents/:id/chat — send message
  const chatMutation = useMutation({
    mutationFn: async ({ msg, cid }: { msg: string; cid?: string }) => {
      const res = await fetch(`${API_BASE}/agents/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({ id: agentId, message: msg, conversationId: cid }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json() as Promise<{ conversationId: string; message: string }>;
    },
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      queryClient.invalidateQueries({ queryKey: ["agents", agentId, "conversations"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const agentName = agent?.name ?? (agentLoading ? "Loading..." : "Unknown Agent");
  const agentModel = (agent?.config?.model as string) ?? "gpt-4-turbo";
  const agentStatus = agent?.status ?? "inactive";

  const handleSend = async () => {
    if (!message.trim() || chatMutation.isPending) return;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const msgToSend = message;
    setMessage("");
    chatMutation.mutate({ msg: msgToSend, cid: conversationId });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(`sk-agent-${agentId.slice(0, 4)}-xxxx-xxxx-xxxx`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalConversations = conversationsData?.total ?? 0;
  const isTyping = chatMutation.isPending;

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/agents" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {agentLoading ? (
                  <div className="h-7 w-40 animate-pulse bg-muted rounded" />
                ) : (
                  <h2 className="font-bold text-xl">{agentName}</h2>
                )}
                <Badge
                  className={
                    agentStatus === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }
                >
                  {agentStatus}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {agentModel} • ID: {agentId.slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/app/agents/${agentId}/execute` as string}>
            <Button variant="outline" leftIcon={<Play className="h-4 w-4" />}>
              Execute Task
            </Button>
          </Link>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {[
            { id: "chat", label: "Chat", icon: MessageSquare },
            { id: "memory", label: "Memory & Context", icon: MemoryStick },
            { id: "config", label: "Configuration", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <Card className="border-border/60 h-[calc(100vh-320px)] flex flex-col">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" /> Chat Interface
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">Start a conversation with your agent</p>
                  <p className="text-muted-foreground text-sm mt-1">Type a message below to begin.</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <span className="text-sm font-medium text-primary">U</span>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className="flex-1 resize-none"
                />
                <Button
                  variant="primary"
                  size="icon"
                  onClick={handleSend}
                  disabled={!message.trim() || isTyping}
                >
                  {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-muted-foreground text-xs">Press Enter to send, Shift+Enter for new line</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setMessages([]);
                    setConversationId(undefined);
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory Tab */}
      {activeTab === "memory" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MemoryStick className="h-5 w-5" /> Memory Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MEMORY_ITEMS_MOCK.map((item, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">{item.type}</Badge>
                    <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                  </div>
                  <p className="text-sm">{item.content}</p>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">
                <Database className="h-4 w-4 mr-2" /> Add Memory Item
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Context Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {CONTEXT_VARIABLES_MOCK.map((variable) => (
                  <div key={variable.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-mono text-sm font-medium">{variable.name}</p>
                      <p className="text-xs text-muted-foreground">Type: {variable.type}</p>
                    </div>
                    <Badge variant="secondary">{variable.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 lg:col-span-2">
            <CardHeader>
              <CardTitle>API Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <code className="flex-1 p-3 bg-muted/50 rounded-lg font-mono text-sm overflow-x-auto">
                  sk-agent-{agentId.slice(0, 4)}-xxxx-xxxx-xxxx
                </code>
                <Button variant="outline" size="sm" onClick={copyApiKey}>
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs mt-2">
                Use this API key to integrate this agent into your applications.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Config Tab */}
      {activeTab === "config" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Chats</span>
                </div>
                <p className="text-2xl font-bold">{totalConversations.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Avg Response</span>
                </div>
                <p className="text-2xl font-bold">1.2s</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                </div>
                <p className="text-2xl font-bold">98.5%</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Tokens Used</span>
                </div>
                <p className="text-2xl font-bold">2.4M</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agentLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 animate-pulse bg-muted rounded-lg" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Model</span>
                    <span className="text-sm font-medium">{agentModel}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Temperature</span>
                    <span className="text-sm font-medium">
                      {String(agent?.config?.temperature ?? "0.7")}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Max Tokens</span>
                    <span className="text-sm font-medium">
                      {String(agent?.config?.maxTokens ?? "4096")}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <Badge className="bg-green-100 text-green-800 capitalize">
                      {agent?.agentType?.replace("_", " ") ?? "chatbot"}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
