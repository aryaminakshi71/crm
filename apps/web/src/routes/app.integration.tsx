import { Card, CardContent } from "@crm/ui";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Puzzle, Workflow, Bell, Settings, ArrowLeft } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/integration")({
  component: IntegrationLayout,
});

function IntegrationLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", href: "/app/integration" },
    { id: "connectors", label: "Connectors", href: "/app/integration/connectors" },
    { id: "workflows", label: "Workflows", href: "/app/integration/workflows" },
    { id: "events", label: "Events", href: "/app/integration/events" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Integration Hub</h1>
          <p className="text-muted-foreground text-sm">
            Connect your apps, automate workflows, and manage events.
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
