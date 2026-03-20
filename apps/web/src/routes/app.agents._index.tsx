import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, EmptyState, Badge } from "@crm/ui";
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
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/agents/_index")({
  component: AgentsIndexPage,
});

const MOCK_AGENTS = [
  {
    id: "agent-001",
    name: "Support Assistant",
    description: "Handles customer support queries with natural language understanding and ticket creation.",
    agentType: "chatbot",
    status: "active",
    model: "gpt-4",
    tasksCompleted: 1247,
    avgResponseTime: "1.2s",
    lastActive: "2 min ago",
  },
  {
    id: "agent-002",
    name: "Data Analyst",
    description: "Analyzes datasets, generates insights, and creates visualizations from raw data.",
    agentType: "data_analysis",
    status: "active",
    model: "gpt-4-turbo",
    tasksCompleted: 423,
    avgResponseTime: "3.5s",
    lastActive: "15 min ago",
  },
  {
    id: "agent-003",
    name: "Code Assistant",
    description: "Helps with code reviews, debugging, and code generation across multiple languages.",
    agentType: "code_execution",
    status: "idle",
    model: "claude-3-opus",
    tasksCompleted: 892,
    avgResponseTime: "2.1s",
    lastActive: "1 hour ago",
  },
  {
    id: "agent-004",
    name: "Research Agent",
    description: "Autonomously researches topics, summarizes findings, and generates comprehensive reports.",
    agentType: "autonomous",
    status: "active",
    model: "gpt-4",
    tasksCompleted: 156,
    avgResponseTime: "8.2s",
    lastActive: "5 min ago",
  },
  {
    id: "agent-005",
    name: "Sales Qualifier",
    description: "Qualifies leads, answers product questions, and schedules demos for the sales team.",
    agentType: "chatbot",
    status: "idle",
    model: "gpt-4-turbo",
    tasksCompleted: 2341,
    avgResponseTime: "1.5s",
    lastActive: "30 min ago",
  },
  {
    id: "agent-006",
    name: "SEO Analyzer",
    description: "Analyzes website content for SEO optimization and generates improvement recommendations.",
    agentType: "data_analysis",
    status: "active",
    model: "gpt-4",
    tasksCompleted: 567,
    avgResponseTime: "4.2s",
    lastActive: "10 min ago",
  },
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
  const [agents, setAgents] = useState(MOCK_AGENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [newAgent, setNewAgent] = useState({ name: "", description: "", agentType: "chatbot" });

  const handleCreate = () => {
    if (!newAgent.name.trim()) return;
    const agent = {
      id: crypto.randomUUID(),
      name: newAgent.name,
      description: newAgent.description,
      agentType: newAgent.agentType,
      status: "idle",
      model: "gpt-4",
      tasksCompleted: 0,
      avgResponseTime: "-",
      lastActive: "Just now",
    };
    setAgents([...agents, agent]);
    setNewAgent({ name: "", description: "", agentType: "chatbot" });
    setShowCreateDialog(false);
  };

  const handleDelete = (id: string) => {
    setAgents(agents.filter((a) => a.id !== id));
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

  return (
    <div className="space-y-6">
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
      </div>

      {filteredAgents.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <EmptyState
              icon={<Bot className="h-8 w-8" />}
              title="No agents found"
              description={searchQuery ? "Try adjusting your search or filters." : "Create your first AI agent to get started."}
              action={
                searchQuery ? undefined : (
                  <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateDialog(true)}>
                    Create Agent
                  </Button>
                )
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
                  <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Agent Name</label>
              <input
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="My AI Agent"
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md bg-background h-20"
                placeholder="Describe what this agent does..."
                value={newAgent.description}
                onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Agent Type</label>
              <div className="grid grid-cols-2 gap-3">
                {AGENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setNewAgent({ ...newAgent, agentType: type.value })}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      newAgent.agentType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-muted-foreground text-xs mt-1">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Create Agent</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
