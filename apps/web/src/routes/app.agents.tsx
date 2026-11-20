import { Card, CardContent } from "@crm/ui";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  Bot,
  Plus,
  LayoutGrid,
  Cpu,
  Users,
  Settings,
  BarChart3,
  Code2,
  Database,
  Lightbulb,
  Wrench,
  Key,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/agents")({
  component: AgentsLayout,
});

const AGENT_NAV_ITEMS = [
  { id: "agents", label: "All Agents", href: "/app/agents", icon: Bot },
  { id: "new", label: "Create Agent", href: "/app/agents/new", icon: Plus },
  { id: "templates", label: "Templates", href: "/app/agents/templates", icon: LayoutGrid },
  { id: "orchestration", label: "Orchestration", href: "/app/agents/orchestration", icon: Users },
  { id: "sandbox", label: "Code Sandbox", href: "/app/agents/sandbox", icon: Code2 },
  { id: "analytics", label: "Analytics", href: "/app/agents/analytics", icon: BarChart3 },
  { id: "tools", label: "Tool Integrations", href: "/app/agents/tools", icon: Wrench },
  { id: "settings", label: "Settings", href: "/app/agents/settings", icon: Settings },
];

function AgentsLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("agents");

  const stats = [
    { label: "Total Agents", value: "12", icon: Bot, color: "text-blue-500" },
    { label: "Active Now", value: "5", icon: Cpu, color: "text-emerald-500" },
    { label: "Tasks Today", value: "847", icon: Database, color: "text-amber-500" },
    { label: "API Calls", value: "12.4K", icon: Key, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-bold text-2xl text-foreground">AI Agents</h1>
            <p className="text-muted-foreground text-sm">
              Create, manage, and orchestrate autonomous AI agents.
            </p>
          </div>
        </div>
        <Link to="/app/agents/new">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Create Agent
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto pb-2">
          {AGENT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}

// Re-export Button for use in the file
import { Button } from "@crm/ui";
