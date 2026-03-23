import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Wrench,
  Plus,
  Search,
  Plug,
  Globe,
  Calculator,
  Database,
  Code,
  Mail,
  ExternalLink,
  Settings,
  Trash2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/agents/tools")({
  component: ToolsPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const getOrgHeader = () => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-org-id": orgId } : {};
};

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: "connected" | "disconnected" | "error";
  lastUsed: string;
  usageCount: number;
}

const STATIC_TOOLS: Tool[] = [
  { id: "web-search", name: "Web Search", description: "Search the web for information", icon: "🌐", category: "Search", status: "connected", lastUsed: "2 min ago", usageCount: 1247 },
  { id: "calculator", name: "Calculator", description: "Perform mathematical calculations", icon: "🔢", category: "Utility", status: "connected", lastUsed: "5 min ago", usageCount: 8923 },
  { id: "code-interpreter", name: "Code Interpreter", description: "Execute Python and JavaScript code", icon: "💻", category: "Development", status: "connected", lastUsed: "12 min ago", usageCount: 456 },
  { id: "file-system", name: "File System", description: "Read and write files", icon: "📁", category: "Development", status: "connected", lastUsed: "1 hour ago", usageCount: 234 },
  { id: "database", name: "Database", description: "Query and manipulate databases", icon: "🗄️", category: "Data", status: "connected", lastUsed: "30 min ago", usageCount: 567 },
  { id: "api-client", name: "API Client", description: "Make HTTP requests to external APIs", icon: "🔗", category: "Development", status: "connected", lastUsed: "15 min ago", usageCount: 789 },
  { id: "email", name: "Email", description: "Send and receive emails", icon: "📧", category: "Communication", status: "disconnected", lastUsed: "Never", usageCount: 0 },
  { id: "slack", name: "Slack", description: "Post messages to Slack channels", icon: "💬", category: "Communication", status: "disconnected", lastUsed: "Never", usageCount: 0 },
  { id: "github", name: "GitHub", description: "Manage GitHub repositories", icon: "🐙", category: "Development", status: "connected", lastUsed: "3 hours ago", usageCount: 123 },
  { id: "google-sheets", name: "Google Sheets", description: "Read and write to Google Sheets", icon: "📊", category: "Data", status: "disconnected", lastUsed: "Never", usageCount: 0 },
  { id: "stripe", name: "Stripe", description: "Process payments and manage subscriptions", icon: "💳", category: "Payment", status: "disconnected", lastUsed: "Never", usageCount: 0 },
  { id: "openweather", name: "OpenWeather", description: "Get weather forecasts", icon: "🌤️", category: "Data", status: "connected", lastUsed: "6 hours ago", usageCount: 89 },
];

const CATEGORIES = ["All", "Search", "Utility", "Development", "Data", "Communication", "Payment"];

const TOOL_TEMPLATES = [
  { name: "Web Search API", description: "Search the web using SerpAPI or Google Custom Search", icon: "🌐", fields: [{ name: "apiKey", label: "API Key", type: "password" }] },
  { name: "Calculator", description: "Built-in mathematical operations", icon: "🔢", fields: [] },
  { name: "Code Interpreter", description: "Execute code in a sandboxed environment", icon: "💻", fields: [{ name: "timeout", label: "Timeout (seconds)", type: "number" }] },
  { name: "Custom API", description: "Connect to any REST API", icon: "🔗", fields: [{ name: "baseUrl", label: "Base URL", type: "text" }, { name: "authType", label: "Auth Type", type: "select" }] },
];

function ToolsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // GET /api/agents/tools — real tool definitions from the agent task API
  const { data: apiToolsData, isError, refetch} = useQuery({
    queryKey: ["agents", "tools"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/agents/tools`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch tools");
      return res.json() as Promise<{ tools: Array<{ id: string; name: string; description: string }> }>;
    },
  });

  // Merge API tools with static catalog. API tools get "connected" status.
  const apiTools: Tool[] = (apiToolsData?.tools ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: "🔧",
    category: "Development",
    status: "connected" as const,
    lastUsed: "Available",
    usageCount: 0,
  }));

  // Combine: static catalog + API-specific tools (deduplicated by id)
  const allTools = [
    ...STATIC_TOOLS,
    ...apiTools.filter((at) => !STATIC_TOOLS.some((st) => st.id === at.id)),
  ];

  const filteredTools = allTools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: Tool["status"]) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case "disconnected":
        return <Badge variant="outline">Disconnected</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Search": return <Globe className="h-4 w-4" />;
      case "Utility": return <Calculator className="h-4 w-4" />;
      case "Development": return <Code className="h-4 w-4" />;
      case "Data": return <Database className="h-4 w-4" />;
      case "Communication": return <Mail className="h-4 w-4" />;
      default: return <Plug className="h-4 w-4" />;
    }
  };

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
          <div>
            <h2 className="font-bold text-xl">Tool Integrations</h2>
            <p className="text-muted-foreground text-sm">Connect external tools and APIs to your agents</p>
          </div>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowAddDialog(true)}
        >
          Add Tool
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool) => (
          <Card key={tool.id} className="border-border/60 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{tool.icon}</span>
                  <div>
                    <h3 className="font-semibold">{tool.name}</h3>
                    <p className="text-muted-foreground text-xs">{tool.category}</p>
                  </div>
                </div>
                {getStatusBadge(tool.status)}
              </div>

              <p className="text-muted-foreground text-sm mb-4">{tool.description}</p>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <span>Used {tool.usageCount.toLocaleString()} times</span>
                <span>Last: {tool.lastUsed}</span>
              </div>

              <div className="flex gap-2">
                {tool.status === "connected" ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-1" /> Configure
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </>
                ) : tool.status === "error" ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-1" /> Retry
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="primary" size="sm" className="flex-1">
                      <Plug className="h-4 w-4 mr-1" /> Connect
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Tool Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Tool Integration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Add</label>
              <div className="grid grid-cols-2 gap-3">
                {TOOL_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    className="p-4 border rounded-lg text-left hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{template.icon}</span>
                      <span className="font-medium">{template.name}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium">Custom API</label>
              <p className="text-muted-foreground text-xs mt-1 mb-3">
                Connect to any REST API that accepts JSON
              </p>
              <div className="space-y-3">
                <Input placeholder="API Name" />
                <Input placeholder="Base URL (e.g., https://api.example.com)" />
                <select className="w-full px-3 py-2 border rounded-lg bg-background">
                  <option>No Authentication</option>
                  <option>API Key</option>
                  <option>Bearer Token</option>
                  <option>Basic Auth</option>
                  <option>OAuth 2.0</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary">Add Tool</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
