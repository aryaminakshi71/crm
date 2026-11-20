/**
 * Admin Layout
 *
 * Super-admin wrapper for tenant/platform management.
 * Accessible via /admin — separate from the main app sidebar.
 */

import { cn } from "@/lib/utils";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  Database,
  Flag,
  LayoutDashboard,
  LogOut,
  Puzzle,
  Shield,
  Users,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Organizations", href: "/admin/organizations", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Modules", href: "/admin/modules", icon: Puzzle },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
  { name: "Database", href: "/admin/database", icon: Database },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Monitoring", href: "/admin/monitoring", icon: Activity },
  { name: "Feature Flags", href: "/admin/feature-flags", icon: Flag },
];

function AdminLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border/60 bg-card">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border/60 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/20">
            <Shield className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground">Admin Panel</span>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Nucleo One</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href) && item.href !== "/admin";
            return (
              <Link
                key={item.href}
                to={item.href as any}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/60 p-3 space-y-2">
          <Link
            to="/app"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <Zap className="h-3.5 w-3.5 text-primary" />
            Back to App
          </Link>
          <button
            type="button"
            onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-56 flex flex-1 flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/60 bg-card/80 backdrop-blur px-6">
          <h1 className="font-semibold text-sm text-foreground">
            {NAV.find((n) => n.exact ? location.pathname === n.href : location.pathname.startsWith(n.href))?.name ?? "Admin"}
          </h1>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[10px] font-semibold text-destructive uppercase tracking-wide">
              Super Admin
            </span>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
