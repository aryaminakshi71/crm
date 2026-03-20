import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  Users,
  UserPlus,
  Calendar,
  Heart,
  TrendingUp,
  GitBranch,
  DollarSign,
  UserCheck,
  FileText,
  GraduationCap,
  Building2,
} from "lucide-react";

export const Route = createFileRoute("/app/hrm")({
  component: HrmLayout,
});

function HrmLayout() {
  const navItems = [
    { name: "Overview", href: "/app/hrm", icon: Building2, isIndex: true },
    { name: "Directory", href: "/app/hrm/directory", icon: Users },
    { name: "Leave", href: "/app/hrm/leave", icon: Calendar },
    { name: "Benefits", href: "/app/hrm/benefits", icon: Heart },
    { name: "Performance", href: "/app/hrm/performance", icon: TrendingUp },
    { name: "OKRs", href: "/app/hrm/okrs", icon: Target },
    { name: "Org Chart", href: "/app/hrm/org-chart", icon: GitBranch },
    { name: "Payroll", href: "/app/hrm/payroll", icon: DollarSign },
    { name: "Recruitment", href: "/app/hrm/recruitment", icon: UserPlus },
    { name: "Training", href: "/app/hrm/training", icon: GraduationCap },
    { name: "Documents", href: "/app/hrm/documents", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Human Resource Management</h1>
        <p className="text-muted-foreground">
          Manage employees, leave, payroll, recruitment, and more
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {navItems.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="rounded-lg border border-border/60 bg-card p-4 hover:bg-muted/50 transition-colors group"
          >
            <item.icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {item.name === "Directory" && "Employee profiles"}
              {item.name === "Leave" && "Time off tracking"}
              {item.name === "Benefits" && "Health & welfare"}
              {item.name === "Performance" && "Reviews & feedback"}
              {item.name === "OKRs" && "Goals & objectives"}
              {item.name === "Org Chart" && "Team structure"}
              {item.name === "Payroll" && "Compensation runs"}
              {item.name === "Recruitment" && "Hiring pipeline"}
              {item.name === "Training" && "Learning programs"}
              {item.name === "Documents" && "HR paperwork"}
              {item.name === "Overview" && "Dashboard"}
            </p>
          </a>
        ))}
      </div>

      <Outlet />
    </div>
  );
}

// Missing icon - define locally
function Target({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
