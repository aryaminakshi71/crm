import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import {
  Brain,
  BarChart3,
  LineChart,
  AlertTriangle,
  Database,
  FileText,
  Target,
  TrendingUp,
  Settings,
  Sparkles,
  Users,
  DollarSign,
} from "lucide-react";

export const Route = createFileRoute("/app/intelligence")({
  component: IntelligenceLayout,
});

const navItems = [
  { to: "/app/intelligence", label: "Dashboard", icon: BarChart3 },
  { to: "/app/intelligence/reports", label: "Reports", icon: FileText },
  { to: "/app/intelligence/queries", label: "Query Interface", icon: Sparkles },
  { to: "/app/intelligence/anomalies", label: "Anomalies", icon: AlertTriangle },
  { to: "/app/intelligence/predictive", label: "Predictive", icon: TrendingUp },
  { to: "/app/intelligence/cohort", label: "Cohort", icon: Users },
  { to: "/app/intelligence/funnel", label: "Funnel", icon: Target },
  { to: "/app/intelligence/retention", label: "Retention", icon: LineChart },
  { to: "/app/intelligence/rfm", label: "RFM", icon: DollarSign },
  { to: "/app/intelligence/clv", label: "CLV", icon: DollarSign },
  { to: "/app/intelligence/churn", label: "Churn", icon: AlertTriangle },
  { to: "/app/intelligence/sources", label: "Data Sources", icon: Database },
];

function IntelligenceLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-7 w-7 text-primary" />
          AI & Business Intelligence
        </h1>
        <p className="text-muted-foreground">
          Analytics, predictive insights, and business intelligence
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-border/60">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
            activeProps={{ className: "bg-muted text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground" }}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
