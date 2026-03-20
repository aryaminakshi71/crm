/**
 * Helpdesk Layout
 *
 * Main helpdesk workspace layout with navigation.
 */

import { Badge } from "@crm/ui";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  BookOpenText,
  Headphones,
  Home,
  Inbox,
  LifeBuoy,
  MessageSquare,
  Scale,
  Settings,
  Smile,
  Ticket,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/helpdesk")({
  component: HelpdeskLayout,
});

function HelpdeskLayout() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", href: "/app/helpdesk", icon: Home },
    { id: "tickets", label: "Tickets", href: "/app/helpdesk/tickets", icon: Ticket },
    { id: "queue", label: "Queue", href: "/app/helpdesk/queue", icon: Inbox },
    { id: "knowledge", label: "Knowledge Base", href: "/app/helpdesk/knowledge", icon: BookOpenText },
    { id: "sla", label: "SLA", href: "/app/helpdesk/sla", icon: Scale },
    { id: "canned", label: "Canned Responses", href: "/app/helpdesk/canned", icon: MessageSquare },
    { id: "surveys", label: "Surveys", href: "/app/helpdesk/surveys", icon: Smile },
    { id: "help-center", label: "Help Center", href: "/app/helpdesk/help-center", icon: LifeBuoy },
    { id: "widget", label: "Widget", href: "/app/helpdesk/widget", icon: Wrench },
    { id: "forum", label: "Forum", href: "/app/helpdesk/forum", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Helpdesk</h1>
          <p className="text-muted-foreground text-sm">
            Ticket management, knowledge base, and customer support.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Headphones className="h-3 w-3 mr-1" />
            12 Active Agents
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.href}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
