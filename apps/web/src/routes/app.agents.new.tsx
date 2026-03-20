import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Select } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Save,
  Loader2,
  Sparkles,
  Code,
  Database,
  BarChart3,
  MessageSquare,
  Brain,
  Zap,
  Shield,
  Plug,
  Eye,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/agents/new")({
  component: NewAgentPage,
});

const AGENT_TYPES = [
  {
    value: "chatbot",
    label: "Chatbot",
    description: "Interactive conversational agent for customer support and FAQs",
    icon: MessageSquare,
    color: "bg-blue-500",
  },
  {
    value: "autonomous",
    label: "Autonomous",
    description: "Self-directed agent that plans and executes complex tasks",
    icon: Brain,
    color: "bg-purple-500",
  },
  {
    value: "code_execution",
    label: "Code Execution",
    description: "Writes, reviews, and executes code in a sandboxed environment",
    icon: Code,
    color: "bg-green-500",
  },
  {
    value: "data_analysis",
    label: "Data Analysis",
    description: "Analyzes data, generates insights, and creates visualizations",
    icon: BarChart3,
    color: "bg-orange-500",
  },
];

const MODELS = [
  { value: "gpt-4", label: "GPT-4", provider: "OpenAI", description: "Most capable, slower" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", provider: "OpenAI", description: "Fast, cost effective" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "OpenAI", description: "Fastest, lowest cost" },
  { value: "claude-3-opus", label: "Claude 3 Opus", provider: "Anthropic", description: "Most capable, verbose" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet", provider: "Anthropic", description: "Balanced performance" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku", provider: "Anthropic", description: "Fastest, compact" },
];

const TOOLS = [
  { id: "web-search", name: "Web Search", description: "Search the web for information", icon: "🌐" },
  { id: "calculator", name: "Calculator", description: "Perform mathematical calculations", icon: "🔢" },
  { id: "code-interpreter", name: "Code Interpreter", description: "Execute Python and JavaScript code", icon: "💻" },
  { id: "file-system", name: "File System", description: "Read and write files", icon: "📁" },
  { id: "database", name: "Database", description: "Query and manipulate databases", icon: "🗄️" },
  { id: "api-client", name: "API Client", description: "Make HTTP requests to external APIs", icon: "🔗" },
];

function NewAgentPage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [agent, setAgent] = useState({
    name: "",
    description: "",
    agentType: "chatbot",
    model: "gpt-4-turbo",
    temperature: "0.7",
    maxTokens: "4096",
    systemPrompt: "",
    tools: [] as string[],
    memoryEnabled: true,
    streamingEnabled: true,
  });

  const selectedType = AGENT_TYPES.find((t) => t.value === agent.agentType);
  const TypeIcon = selectedType?.icon || Bot;

  const handleCreate = async () => {
    if (!agent.name.trim()) return;
    setIsCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsCreating(false);
    navigate({ to: "/app/agents" });
  };

  const toggleTool = (toolId: string) => {
    setAgent((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter((t) => t !== toolId)
        : [...prev.tools, toolId],
    }));
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

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step)}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                currentStep >= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step}
            </button>
            {step < 3 && (
              <div className={`w-16 h-0.5 mx-2 ${currentStep > step ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          Step {currentStep}: {currentStep === 1 ? "Basic Info" : currentStep === 2 ? "AI Config" : "Tools & Memory"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <>
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
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Agent Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {AGENT_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setAgent({ ...agent, agentType: type.value })}
                          className={`p-4 border rounded-xl text-left transition-all ${
                            agent.agentType === type.value
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${type.color}`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold">{type.label}</div>
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm">{type.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Step 2: AI Configuration */}
          {currentStep === 2 && (
            <>
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" /> AI Model Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">AI Model</label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {MODELS.map((model) => (
                        <button
                          key={model.value}
                          type="button"
                          onClick={() => setAgent({ ...agent, model: model.value })}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            agent.model === model.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{model.label}</span>
                            <span className="text-xs text-muted-foreground">{model.provider}</span>
                          </div>
                          <p className="text-muted-foreground text-xs">{model.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Tokens</label>
                      <Input
                        type="number"
                        min="100"
                        max="32000"
                        value={agent.maxTokens}
                        onChange={(e) => setAgent({ ...agent, maxTokens: e.target.value })}
                      />
                      <p className="text-muted-foreground text-xs">Maximum response length</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>System Prompt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="You are a helpful AI assistant that..."
                    value={agent.systemPrompt}
                    onChange={(e) => setAgent({ ...agent, systemPrompt: e.target.value })}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAgent({ ...agent, systemPrompt: "You are a helpful AI assistant." })}>
                      <Sparkles className="h-4 w-4 mr-1" /> Use Template
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" /> Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Step 3: Tools & Memory */}
          {currentStep === 3 && (
            <>
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plug className="h-5 w-5" /> Tool Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {TOOLS.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => toggleTool(tool.id)}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          agent.tools.includes(tool.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{tool.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{tool.name}</div>
                            <div className="text-muted-foreground text-xs">{tool.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" /> Memory & Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-amber-500" />
                      <div>
                        <div className="font-medium">Enable Memory</div>
                        <div className="text-muted-foreground text-xs">Remember conversation context</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setAgent({ ...agent, memoryEnabled: !agent.memoryEnabled })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        agent.memoryEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        agent.memoryEnabled ? "translate-x-6" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">Streaming Responses</div>
                        <div className="text-muted-foreground text-xs">Show responses as they generate</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setAgent({ ...agent, streamingEnabled: !agent.streamingEnabled })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        agent.streamingEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        agent.streamingEnabled ? "translate-x-6" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {currentStep < 3 ? (
              <Button variant="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                leftIcon={isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                onClick={handleCreate}
                disabled={!agent.name.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create Agent"}
              </Button>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card className="border-border/60 sticky top-6">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4 p-4 bg-muted/50 rounded-xl">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${selectedType?.color || "bg-primary"}`}>
                  <TypeIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">{agent.name || "Agent Name"}</p>
                  <p className="text-muted-foreground text-sm capitalize">{agent.agentType.replace("_", " ")}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Model</p>
                  <p className="text-sm">{MODELS.find((m) => m.value === agent.model)?.label || "Not selected"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Temperature</p>
                  <p className="text-sm">{agent.temperature}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Tools Enabled</p>
                  <p className="text-sm">{agent.tools.length > 0 ? `${agent.tools.length} tools` : "None"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Memory</p>
                  <p className="text-sm">{agent.memoryEnabled ? "Enabled" : "Disabled"}</p>
                </div>
              </div>

              <p className="text-muted-foreground text-sm mt-4">
                {agent.description || "Agent description will appear here..."}
              </p>
            </CardContent>
          </Card>

          {currentStep === 3 && (
            <Card className="border-border/60 bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">Your agent will be secured with enterprise-grade encryption.</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
