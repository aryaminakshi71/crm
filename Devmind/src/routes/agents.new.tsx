import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Bot, Check, Zap, Code, MessageSquare, Brain } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";

export const Route = createFileRoute("/agents/new")({
  component: NewAgentPage,
});

const agentTypes = [
  { 
    id: "chatbot", 
    name: "Chatbot", 
    description: "Conversational AI for customer service or general assistance",
    icon: MessageSquare,
  },
  { 
    id: "autonomous", 
    name: "Autonomous Agent", 
    description: "Self-directed agent that executes complex multi-step tasks",
    icon: Brain,
  },
  { 
    id: "code_execution", 
    name: "Code Assistant", 
    description: "Helps with coding, debugging, and code review",
    icon: Code,
  },
  { 
    id: "data_analysis", 
    name: "Data Analyst", 
    description: "Analyzes data and generates insights and visualizations",
    icon: Zap,
  },
];

const defaultPrompts: Record<string, string> = {
  chatbot: "You are a helpful AI assistant. Be friendly, professional, and helpful. Answer questions accurately and provide valuable information.",
  autonomous: "You are an autonomous AI agent. Break down complex tasks into steps, execute them efficiently, and report progress clearly. Use available tools to complete tasks.",
  code_execution: "You are an expert software developer. Write clean, efficient, and well-documented code. Explain your solutions clearly and help debug issues.",
  data_analysis: "You are an expert data analyst. Analyze data thoroughly, provide actionable insights, and explain your findings with clear visualizations.",
};

const availableTools = [
  { id: "web_search", name: "Web Search", description: "Search the web for information" },
  { id: "execute_code", name: "Execute Code", description: "Run code in a sandboxed environment" },
  { id: "file_read", name: "File Read", description: "Read files from the filesystem" },
  { id: "file_write", name: "File Write", description: "Write files to the filesystem" },
  { id: "bash", name: "Bash", description: "Execute bash commands" },
];

function NewAgentPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("chatbot");
  const [systemPrompt, setSystemPrompt] = useState(defaultPrompts.chatbot);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [model, setModel] = useState("gpt-4o");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setSystemPrompt(defaultPrompts[newType] || "");
  };

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(t => t !== toolId)
        : [...prev, toolId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          type,
          systemPrompt,
          tools: selectedTools,
          model,
        }),
      });

      if (response.ok) {
        navigate({ to: "/agents" });
      } else {
        alert("Failed to create agent");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to create agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/agents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Agent</h1>
          <p className="text-zinc-400">Configure your AI agent</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Give your agent a name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My AI Agent"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your agent does..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Type</CardTitle>
            <CardDescription>Choose the type of agent that best fits your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agentTypes.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.id;
                return (
                  <label
                    key={t.id}
                    className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? "border-violet-500 bg-violet-500/10" 
                        : "border-zinc-800 hover:border-zinc-700 bg-zinc-900"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={t.id}
                      checked={isSelected}
                      onChange={() => handleTypeChange(t.id)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-violet-600" : "bg-zinc-800"
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-zinc-400"}`} />
                    </div>
                    <div>
                      <div className="font-medium text-white">{t.name}</div>
                      <p className="text-sm text-zinc-400 mt-1">{t.description}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Prompt</CardTitle>
            <CardDescription>Define how your agent behaves and responds</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={8}
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tools</CardTitle>
            <CardDescription>Select the tools your agent can use</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableTools.map((tool) => {
                const isSelected = selectedTools.includes(tool.id);
                return (
                  <label
                    key={tool.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? "border-violet-500 bg-violet-500/10" 
                        : "border-zinc-800 hover:border-zinc-700 bg-zinc-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTool(tool.id)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "bg-violet-600 border-violet-600" : "border-zinc-600"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-white">{tool.name}</div>
                      <div className="text-xs text-zinc-400">{tool.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model</CardTitle>
            <CardDescription>Select the AI model to power your agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="gpt-4o">GPT-4o (OpenAI)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo (OpenAI)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                <option value="claude-3-haiku">Claude 3 Haiku (Anthropic)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Link to="/agents" className="flex-1">
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || !name} className="flex-1">
            {isSubmitting ? "Creating..." : "Create Agent"}
          </Button>
        </div>
      </form>
    </div>
  );
}
