/**
 * CRM Layout
 *
 * Main CRM workspace layout with navigation and routing.
 */

import { Badge, Card, CardContent } from "@crm/ui";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Briefcase,
  Calendar,
  FileText,
  Home,
  Mail,
  Map,
  PieChart as PieChartIcon,
  Settings,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/crm")({
  component: CrmLayout,
});

function CrmLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", href: "/app/crm", icon: Home },
    { id: "pipeline", label: "Pipeline", href: "/app/crm/pipeline", icon: Briefcase },
    { id: "contacts", label: "Contacts", href: "/app/crm/contacts", icon: Users },
    { id: "leads", label: "Leads", href: "/app/crm/leads", icon: Target },
    { id: "deals", label: "Deals", href: "/app/crm/deals", icon: TrendingUp },
    { id: "activities", label: "Activities", href: "/app/crm/activities", icon: Calendar },
    { id: "sequences", label: "Sequences", href: "/app/crm/sequences", icon: Mail },
    { id: "documents", label: "Documents", href: "/app/crm/documents", icon: FileText },
    { id: "forecasting", label: "Forecasting", href: "/app/crm/forecasting", icon: BarChart3 },
    { id: "commissions", label: "Commissions", href: "/app/crm/commissions", icon: PieChartIcon },
    { id: "territories", label: "Territories", href: "/app/crm/territories", icon: Map },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">CRM</h1>
          <p className="text-muted-foreground text-sm">
            Customer relationship management, sales pipeline, and lead tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Zap className="h-3 w-3 mr-1" />
            Pipeline Active
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
