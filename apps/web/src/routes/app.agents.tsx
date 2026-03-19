import { Card, CardContent } from "@crm/ui";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Bot, Plus, Users } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/agents")({
  component: AgentsLayout,
});

function AgentsLayout() {
  const [activeTab, setActiveTab] = useState("agents");

  const tabs = [
    { id: "agents", label: "All Agents", href: "/app/agents" },
    { id: "templates", label: "Templates", href: "/app/agents/templates" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">AI Agents</h1>
          <p className="text-muted-foreground text-sm">
            Create and manage autonomous AI coding agents.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.href}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
