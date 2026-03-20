/**
 * Integration Hub (WeaveBridge) Layout
 *
 * Main layout for all integration-related pages.
 */

import { Card, CardContent } from "@crm/ui";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  Puzzle,
  Workflow,
  Bell,
  Webhook,
  Key,
  Shield,
  History,
  Settings,
  Zap,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/app/integrations")({
  component: IntegrationsLayout,
});

function IntegrationsLayout() {
  const navItems = [
    { name: "Overview", href: "/app/integrations", icon: Zap, isIndex: true },
    { name: "Connectors", href: "/app/integrations/connectors", icon: Puzzle },
    { name: "Workflows", href: "/app/integrations/workflows", icon: Workflow },
    { name: "Events", href: "/app/integrations/events", icon: Bell },
    { name: "Event Log", href: "/app/integrations/events/log", icon: History },
    { name: "Webhooks", href: "/app/integrations/webhooks", icon: Webhook },
    { name: "OAuth Apps", href: "/app/integrations/oauth", icon: Key },
    { name: "Rate Limits", href: "/app/integrations/rate-limits", icon: Shield },
    { name: "Error Handling", href: "/app/integrations/errors", icon: Settings },
    { name: "Audit Logs", href: "/app/integrations/audit", icon: History },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integration Hub</h1>
        <p className="text-muted-foreground">
          Connect your apps, automate workflows, and manage events with WeaveBridge.
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors group flex items-start gap-3"
          >
            <item.icon className="h-8 w-8 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.name === "Overview" && "Dashboard & stats"}
                {item.name === "Connectors" && "API integrations"}
                {item.name === "Workflows" && "Automation builder"}
                {item.name === "Events" && "Event subscriptions"}
                {item.name === "Event Log" && "View all events"}
                {item.name === "Webhooks" && "HTTP callbacks"}
                {item.name === "OAuth Apps" && "Third-party access"}
                {item.name === "Rate Limits" && "API throttling"}
                {item.name === "Error Handling" && "Retry & fallback"}
                {item.name === "Audit Logs" && "Activity history"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
