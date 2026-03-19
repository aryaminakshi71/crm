import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Select } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bot, Save, Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/agents/new")({
  component: NewAgentPage,
});

function NewAgentPage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [agent, setAgent] = useState({
    name: "",
    description: "",
    agentType: "chatbot",
    systemPrompt: "",
    model: "gpt-4",
    temperature: "0.7",
  });

  const handleCreate = async () => {
    if (!agent.name.trim()) return;
    setIsCreating(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsCreating(false);
    navigate({ to: "/app/agents" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/agents" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="font-bold text-xl text-foreground">Create New Agent</h2>
          <p className="text-muted-foreground text-sm">
            Configure your AI agent settings and capabilities.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" /> Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Agent Name *</label>
                <Input
                  placeholder="My AI Agent"
                  value={agent.name}
                  onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe what this agent does..."
                  value={agent.description}
                  onChange={(e) => setAgent({ ...agent, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Agent Type *</label>
                <Select value={agent.agentType} onValueChange={(v) => setAgent({ ...agent, agentType: v })}>
                  <option value="chatbot">Chatbot</option>
                  <option value="autonomous">Autonomous</option>
                  <option value="code_execution">Code Execution</option>
                  <option value="data_analysis">Data Analysis</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model</label>
                  <Select value={agent.model} onValueChange={(v) => setAgent({ ...agent, model: v })}>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temperature</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={agent.temperature}
                    onChange={(e) => setAgent({ ...agent, temperature: e.target.value })}
                  />
                  <p className="text-muted-foreground text-xs">Higher = more creative, lower = more deterministic</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">System Prompt</label>
                <Textarea
                  placeholder="You are a helpful AI assistant..."
                  value={agent.systemPrompt}
                  onChange={(e) => setAgent({ ...agent, systemPrompt: e.target.value })}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-muted-foreground text-xs">Define the agent's behavior, personality, and capabilities.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{agent.name || "Agent Name"}</p>
                  <p className="text-muted-foreground text-sm capitalize">{agent.agentType.replace("_", " ")}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                {agent.description || "Agent description will appear here..."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="primary"
                className="w-full"
                leftIcon={isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                onClick={handleCreate}
                disabled={!agent.name.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create Agent"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate({ to: "/app/agents" })}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
