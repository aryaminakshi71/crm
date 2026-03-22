import { Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, EmptyState, Badge, LoadingSkeleton } from "@crm/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bot,
  Plus,
  Pencil,
  Trash2,
  Play,
  MessageSquare,
  Settings,
  MoreHorizontal,
  Search,
  Filter,
  Zap,
  Clock,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Activity,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/agents/_index")({
  component: AgentsIndexPage,
});

const TOKEN_USAGE_DATA = [
  { day: "Mon", tokens: 48200 },
  { day: "Tue", tokens: 72100 },
  { day: "Wed", tokens: 61400 },
  { day: "Thu", tokens: 89300 },
  { day: "Fri", tokens: 95600 },
  { day: "Sat", tokens: 31200 },
  { day: "Sun", tokens: 22800 },
];

const AGENT_TYPES = [
  { value: "chatbot", label: "Chatbot", description: "Interactive conversational agent", color: "bg-blue-100 text-blue-800" },
  { value: "autonomous", label: "Autonomous", description: "Self-directed task completion", color: "bg-purple-100 text-purple-800" },
  { value: "code_execution", label: "Code Execution", description: "Writes and executes code", color: "bg-green-100 text-green-800" },
  { value: "data_analysis", label: "Data Analysis", description: "Analyzes data and generates insights", color: "bg-orange-100 text-orange-800" },
];

function AgentsIndexPage() {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const queryClient = useQueryClient();

  // Fetch agents from real API
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ["agents", "list"],
    queryFn: async () => {
      const res = await fetch("/api/agents", { headers: { "Content-Type": "application/json" } });
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  // Fetch token usage from real API
  const { data: tokenUsageData } = useQuery({
    queryKey: ["agents", "token-usage"],
    queryFn: async () => {
      const res = await fetch("/api/agents/token-usage?days=7", {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Use real API data with static fallback
  const chartData = tokenUsageData?.data?.length
    ? tokenUsageData.data
    : TOKEN_USAGE_DATA;

  // Create agent mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; agentType: string; config: any }) => {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agents", "list"] }),
  });

  // Delete agent mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agents", "list"] }),
  });

  // Map API agents to the display shape
  const agents = useMemo(() => {
    const apiItems: any[] = agentsData?.data ?? [];
    return apiItems.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description ?? "",
      agentType: agent.agentType ?? "autonomous",
      status: agent.status === "active" ? "active" : "idle",
      model: (agent.config as any)?.model ?? "gpt-4",
      tasksCompleted: 0,
      avgResponseTime: "-",
      lastActive: agent.updatedAt
        ? new Date(agent.updatedAt).toLocaleString()
        : new Date(agent.createdAt).toLocaleString(),
      health: (agent.status === "active" ? "healthy" : agent.status === "error" ? "error" : "degraded") as "healthy" | "degraded" | "error",
      errorRate: 0,
    }));
  }, [agentsData]);

  const [wizardData, setWizardData] = useState({
    // Step 1
    name: "",
    description: "",
    type: "Support",
    // Step 2
    model: "gpt-4",
    maxTokens: 4096,
    temperature: 0.7,
    // Step 3
    tools: [] as string[],
  });

  const WIZARD_TOOLS = [
    "CRM Access",
    "HRM Access",
    "Finance Access",
    "Web Search",
    "Code Execution",
    "Email Sending",
  ];

  const toggleTool = (tool: string) => {
    setWizardData((prev) => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter((t) => t !== tool)
        : [...prev.tools, tool],
    }));
  };

  const handleCreate = () => {
    if (!wizardData.name.trim()) return;
    const agentTypeMap: Record<string, string> = {
      Support: "chatbot",
      Sales: "chatbot",
      "Data Analysis": "data_analysis",
      Code: "code_execution",
      Research: "autonomous",
    };
    createMutation.mutate(
      {
        name: wizardData.name,
        description: wizardData.description,
        agentType: agentTypeMap[wizardData.type] ?? "autonomous",
        config: {
          model: wizardData.model,
          maxTokens: wizardData.maxTokens,
          temperature: wizardData.temperature,
          tools: wizardData.tools,
        },
      },
      {
        onSuccess: () => {
          setWizardData({ name: "", description: "", type: "Support", model: "gpt-4", maxTokens: 4096, temperature: 0.7, tools: [] });
          setWizardStep(1);
          setShowCreateDialog(false);
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || agent.agentType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeColor = (type: string) => {
    const found = AGENT_TYPES.find((t) => t.value === type);
    return found ? found.color : "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "idle": return "bg-gray-100 text-gray-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthDot = (health: "healthy" | "degraded" | "error") => {
    const colors = { healthy: "bg-green-500", degraded: "bg-yellow-500", error: "bg-red-500" };
    const labels = { healthy: "Healthy", degraded: "Degraded", error: "Error" };
    const textColors = { healthy: "text-green-700", degraded: "text-yellow-700", error: "text-red-700" };
    return (
      <span className={`flex items-center gap-1 text-[10px] font-semibold ${textColors[health]}`}>
        <span className={`inline-block h-2 w-2 rounded-full ${colors[health]}`} />
        {labels[health]}
      </span>
    );
  };

  const totalTokensToday = chartData[chartData.length - 1]?.tokens ?? 0;
  const estimatedCost = ((chartData.reduce((s: number, d: { tokens: number }) => s + d.tokens, 0) / 1000) * 0.002).toFixed(2);

  if (agentsLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-40 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Token Usage Tracker */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Token Usage — Last 7 Days
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Today</p>
                <p className="text-sm font-black text-foreground">{totalTokensToday.toLocaleString()} tokens</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Est. Cost (7d)</p>
                <p className="text-sm font-black text-green-600">${estimatedCost}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Rate</p>
                <p className="text-[10px] text-muted-foreground">$0.002/1k tokens</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={20}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "none", borderRadius: "6px", fontSize: "11px" }}
                  formatter={(value: number) => [`${value.toLocaleString()} tokens`, "Usage"]}
                />
                <Bar dataKey="tokens" fill="#2172cd" opacity={0.85} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-background text-sm"
          >
            <option value="all">All Types</option>
            <option value="chatbot">Chatbot</option>
            <option value="autonomous">Autonomous</option>
            <option value="code_execution">Code Execution</option>
            <option value="data_analysis">Data Analysis</option>
          </select>
          <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
            More Filters
          </Button>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreateDialog(true)}
        >
          New Agent
        </Button>
      </div>

      {filteredAgents.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <EmptyState
              icon={<Bot className="h-8 w-8" />}
              title="No agents found"
              description={searchQuery ? "Try adjusting your search or filters." : "Create your first AI agent to get started."}
              action={
                searchQuery ? undefined : {
                  label: "Create Agent",
                  onClick: () => setShowCreateDialog(true),
                }
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="border-border/60 hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{agent.name}</h3>
                      <p className="text-muted-foreground text-xs">{agent.lastActive}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                    {getHealthDot(agent.health)}
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{agent.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getTypeColor(agent.agentType)}>{agent.agentType.replace("_", " ")}</Badge>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">
                    {agent.model}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Tasks</p>
                    <p className="font-semibold text-sm">{agent.tasksCompleted.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Avg Time</p>
                    <p className="font-semibold text-sm">{agent.avgResponseTime}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className={`font-semibold text-sm ${agent.status === "active" ? "text-green-600" : "text-gray-500"}`}>
                      {agent.status === "active" ? <Zap className="h-3 w-3 inline mr-1" /> : null}
                      {agent.status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex gap-1">
                    <Link to={`/app/agents/${agent.id}` as string}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Chat">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to={`/app/agents/${agent.id}/execute` as string}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Execute">
                        <Play className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Settings">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    title="Delete"
                    onClick={() => handleDelete(agent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Agent Creation Wizard */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) setWizardStep(1); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Create New Agent
            </DialogTitle>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 py-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  wizardStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {step}
                </div>
                <span className={`text-xs font-medium ${wizardStep === step ? "text-foreground" : "text-muted-foreground"}`}>
                  {step === 1 ? "Basic Info" : step === 2 ? "Configuration" : "Tools"}
                </span>
                {step < 3 && <div className={`h-px w-8 ${wizardStep > step ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {wizardStep === 1 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Agent Name <span className="text-destructive">*</span></label>
                <input
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                  placeholder="My AI Agent"
                  value={wizardData.name}
                  onChange={(e) => setWizardData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm h-20 resize-none"
                  placeholder="Describe what this agent does..."
                  value={wizardData.description}
                  onChange={(e) => setWizardData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                  value={wizardData.type}
                  onChange={(e) => setWizardData((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="Support">Support</option>
                  <option value="Sales">Sales</option>
                  <option value="Data Analysis">Data Analysis</option>
                  <option value="Code">Code</option>
                  <option value="Research">Research</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {wizardStep === 2 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                  value={wizardData.model}
                  onChange={(e) => setWizardData((prev) => ({ ...prev, model: e.target.value }))}
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="gemini-pro">Gemini Pro</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Max Tokens</label>
                  <span className="text-sm font-bold text-primary">{wizardData.maxTokens.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1024"
                  max="16384"
                  step="512"
                  value={wizardData.maxTokens}
                  onChange={(e) => setWizardData((prev) => ({ ...prev, maxTokens: Number(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1k</span><span>16k</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Temperature</label>
                  <span className="text-sm font-bold text-primary">{wizardData.temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={wizardData.temperature}
                  onChange={(e) => setWizardData((prev) => ({ ...prev, temperature: Number(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0.0 (Focused)</span><span>1.0 (Creative)</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Tools & Integrations */}
          {wizardStep === 3 && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">Select the tools and integrations this agent can access.</p>
              <div className="grid grid-cols-2 gap-2">
                {WIZARD_TOOLS.map((tool) => (
                  <label
                    key={tool}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      wizardData.tools.includes(tool)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={wizardData.tools.includes(tool)}
                      onChange={() => toggleTool(tool)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium">{tool}</span>
                  </label>
                ))}
              </div>
              {wizardData.tools.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {wizardData.tools.length} tool{wizardData.tools.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                if (wizardStep === 1) { setShowCreateDialog(false); setWizardStep(1); }
                else setWizardStep((s) => s - 1);
              }}
              leftIcon={wizardStep > 1 ? <ChevronLeft className="h-4 w-4" /> : undefined}
            >
              {wizardStep === 1 ? "Cancel" : "Back"}
            </Button>
            {wizardStep < 3 ? (
              <Button
                variant="primary"
                rightIcon={<ChevronRight className="h-4 w-4" />}
                onClick={() => setWizardStep((s) => s + 1)}
                disabled={wizardStep === 1 && !wizardData.name.trim()}
              >
                Next
              </Button>
            ) : (
              <Button variant="primary" onClick={handleCreate} disabled={!wizardData.name.trim()}>
                Create Agent
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
