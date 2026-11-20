import { Card, CardContent } from "@crm/ui";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/app/monitoring")({
  component: MonitoringLayout,
});

function MonitoringLayout() {
  const location = useLocation();

  const tabs = [
    { id: "overview", label: "Overview", href: "/app/monitoring" },
    { id: "apm", label: "APM", href: "/app/monitoring/apm" },
    { id: "servers", label: "Servers", href: "/app/monitoring/servers" },
    { id: "dashboards", label: "Dashboards", href: "/app/monitoring/dashboards" },
    { id: "alerts", label: "Alerts", href: "/app/monitoring/alerts" },
    { id: "incidents", label: "Incidents", href: "/app/monitoring/incidents" },
    { id: "sla", label: "SLA", href: "/app/monitoring/sla" },
    { id: "logs", label: "Logs", href: "/app/monitoring/logs" },
    { id: "tracing", label: "Tracing", href: "/app/monitoring/tracing" },
    { id: "synthetics", label: "Synthetics", href: "/app/monitoring/synthetics" },
    { id: "status", label: "Status", href: "/app/monitoring/status" },
    { id: "errors", label: "Errors", href: "/app/monitoring/errors" },
    { id: "uptime", label: "Uptime", href: "/app/monitoring/uptime" },
  ];

  const isActive = (href: string) => {
    if (href === "/app/monitoring") {
      return location.pathname === "/app/monitoring";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Monitoring</h1>
          <p className="text-muted-foreground text-sm">
            Platform observability: APM, servers, alerts, incidents, and more.
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
                isActive(tab.href)
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              }`}
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
