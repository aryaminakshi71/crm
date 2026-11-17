import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bot,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Zap,
} from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

interface SidebarProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/app" },
  { icon: Bot, label: "Agents", href: "/agents" },
  { icon: CreditCard, label: "Billing", href: "/billing" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function AppLayout({ children }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-5 border-b border-zinc-800">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DevMind</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Create Agent Button */}
          <div className="px-3 py-4 border-t border-zinc-800">
            <Link to="/agents/new" onClick={() => setSidebarOpen(false)}>
              <Button className="w-full justify-start gap-2" size="sm">
                <Plus className="w-4 h-4" />
                New Agent
              </Button>
            </Link>
          </div>

          {/* User section */}
          <div className="px-3 py-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">User</p>
                <p className="text-xs text-zinc-500 truncate">
                  user@example.com
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-zinc-400 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-400"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">DevMind</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
