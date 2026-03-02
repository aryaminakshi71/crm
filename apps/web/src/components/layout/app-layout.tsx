import { cn } from "@/lib/utils";
import { Button } from "@crm/ui";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  Brain,
  Briefcase,
  Building2,
  FolderKanban,
  FolderOpen,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  Receipt,
  Scale,
  Settings,
  ShieldCheck,
  UserRoundCog,
  X,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "CRM", href: "/app/crm", icon: Building2 },
  { name: "Helpdesk", href: "/app/helpdesk", icon: LifeBuoy },
  { name: "Projects", href: "/app/projects", icon: FolderKanban },
  { name: "Assets", href: "/app/assets", icon: FolderOpen },
  { name: "Marketing", href: "/app/marketing", icon: Megaphone },
  { name: "Finance", href: "/app/finance", icon: Receipt },
  { name: "Procurement", href: "/app/procurement", icon: Briefcase },
  { name: "Contracts", href: "/app/contracts", icon: Scale },
  { name: "HRM", href: "/app/hrm", icon: UserRoundCog },
  { name: "Compliance", href: "/app/compliance", icon: ShieldCheck },
  { name: "Policies", href: "/app/policies", icon: ShieldCheck },
  { name: "Enterprise", href: "/app/enterprise", icon: ShieldCheck },
  { name: "AI & BI", href: "/app/intelligence", icon: Brain },
  { name: "Settings", href: "/app/settings", icon: Settings },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-muted">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-border border-r bg-card transition-transform duration-200 ease-in-out lg:static lg:inset-auto lg:flex lg:translate-x-0 lg:flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-border border-b px-6">
          <span className="font-bold text-primary text-xl">Nucleo One</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/app" && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center rounded-lg px-4 py-3 font-medium text-sm transition-colors",
                  isActive
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-border border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-16 items-center justify-between border-border border-b bg-card px-4 lg:hidden">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-foreground text-lg">Nucleo One</span>
          <div className="w-6" />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
