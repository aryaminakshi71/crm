import { Card, CardContent } from "@crm/ui";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/app/monitoring")({
  component: MonitoringLayout,
});

function MonitoringLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard", href: "/app/monitoring" },
    { id: "analytics", label: "Analytics", href: "/app/monitoring/analytics" },
    { id: "errors", label: "Errors", href: "/app/monitoring/errors" },
    { id: "uptime", label: "Uptime", href: "/app/monitoring/uptime" },
    { id: "performance", label: "Performance", href: "/app/monitoring/performance" },
    { id: "catalog", label: "Catalog", href: "/app/monitoring/catalog" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Monitoring</h1>
          <p className="text-muted-foreground text-sm">
            Platform observability: analytics, errors, uptime, and performance.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <nav className="flex gap-4 min-w-max">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.href}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
