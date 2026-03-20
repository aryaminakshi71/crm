/**
 * Marketing Layout
 *
 * Main marketing automation workspace layout with navigation.
 */

import { Badge } from "@crm/ui";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  CheckSquare,
  Cpu,
  FlaskConical,
  Globe,
  Home,
  Layout,
  Mail,
  MousePointerClick,
  Scale,
  Settings,
  Target,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/marketing")({
  component: MarketingLayout,
});

function MarketingLayout() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", href: "/app/marketing", icon: Home },
    { id: "campaigns", label: "Campaigns", href: "/app/marketing/campaigns", icon: Zap },
    { id: "email-builder", label: "Email Builder", href: "/app/marketing/email-builder", icon: Mail },
    { id: "landing-pages", label: "Landing Pages", href: "/app/marketing/landing-pages", icon: Layout },
    { id: "ab-testing", label: "A/B Testing", href: "/app/marketing/ab-testing", icon: FlaskConical },
    { id: "lead-scoring", label: "Lead Scoring", href: "/app/marketing/lead-scoring", icon: Target },
    { id: "automation", label: "Automation", href: "/app/marketing/automation", icon: Cpu },
    { id: "webinars", label: "Webinars", href: "/app/marketing/webinars", icon: Video },
    { id: "events", label: "Events", href: "/app/marketing/events", icon: Calendar },
    { id: "analytics", label: "Analytics", href: "/app/marketing/analytics", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Marketing</h1>
          <p className="text-muted-foreground text-sm">
            Campaign builder, email automation, lead scoring, and analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Zap className="h-3 w-3 mr-1" />
            3 Active Campaigns
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
