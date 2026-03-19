import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bot, Plus, Pencil, Trash2, Play, MessageSquare } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/agents/_index")({
  component: AgentsIndexPage,
});

const AGENT_TYPES = [
  { value: "chatbot", label: "Chatbot", description: "Interactive conversational agent" },
  { value: "autonomous", label: "Autonomous", description: "Self-directed task completion" },
  { value: "code_execution", label: "Code Execution", description: "Writes and executes code" },
  { value: "data_analysis", label: "Data Analysis", description: "Analyzes data and generates insights" },
];

function AgentsIndexPage() {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [agents, setAgents] = useState<Array<{
    id: string;
    name: string;
    description: string;
    agentType: string;
    status: string;
  }>>([]);
  const [newAgent, setNewAgent] = useState({ name: "", description: "", agentType: "chatbot" });

  const handleCreate = () => {
    if (!newAgent.name.trim()) return;
    const agent = {
      id: crypto.randomUUID(),
      name: newAgent.name,
      description: newAgent.description,
      agentType: newAgent.agentType,
      status: "inactive",
    };
    setAgents([...agents, agent]);
    setNewAgent({ name: "", description: "", agentType: "chatbot" });
    setShowCreateDialog(false);
  };

  const handleDelete = (id: string) => {
    setAgents(agents.filter((a) => a.id !== id));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "chatbot": return "bg-blue-100 text-blue-800";
      case "autonomous": return "bg-purple-100 text-purple-800";
      case "code_execution": return "bg-green-100 text-green-800";
      case "data_analysis": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app" })}>
              ←
            </Button>
            <div>
              <h2 className="font-bold text-xl text-foreground">AI Agents</h2>
              <p className="text-muted-foreground text-sm">
                Create and manage autonomous AI agents.
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/app/agents/templates">
            <Button variant="outline">Browse Templates</Button>
          </Link>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateDialog(true)}>
            Create Agent
          </Button>
        </div>
      </div>

      {agents.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <EmptyState
              icon={<Bot className="h-8 w-8" />}
              title="No agents yet"
              description="Create your first AI agent to automate tasks, chat with users, or analyze data."
              action={
                <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateDialog(true)}>
                  Create Agent
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="border-border/60 hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{agent.name}</h3>
                  </div>
                  <Badge className={getTypeColor(agent.agentType)}>{agent.agentType.replace("_", " ")}</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{agent.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Link to={`/app/agents/${agent.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Chat">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Execute">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete" onClick={() => handleDelete(agent.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
