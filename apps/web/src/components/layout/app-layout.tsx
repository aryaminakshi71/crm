import React from "react";
import { nucleoApi, notificationsApi } from "@/lib/api";
import { useSession, signOut } from "@/lib/auth-client";
import { usePresence } from "@/hooks/use-presence";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { OnlineIndicator } from "@/components/ui/online-indicator";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { CookieConsentBanner, useCookieConsent } from "@/components/cookie-consent-banner";
import { useDarkMode } from "@crm/ui";
import { SubscriptionGate } from "@/components/billing/SubscriptionGate";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Brain,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  LifeBuoy,
  ListOrdered,
  LogOut,
  Megaphone,
  Menu,
  Mic,
  Moon,
  Package,
  Phone,
  Puzzle,
  Sun,
  Receipt,
  Scale,
  FileSearch,
  Key,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  UserRoundCog,
  Users,
  Users2,
  X,
  Zap,
  Activity,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "warning" | "danger" | "success" | "info";

type NavLeaf = {
  name: string;
  href: string;
  search?: Record<string, string>;
  badge?: string | number | null;
  badgeVariant?: BadgeVariant;
};

type NavChild = NavLeaf & {
  children?: NavLeaf[];
};

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number | null;
  badgeVariant?: BadgeVariant;
  children?: NavChild[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// ─── Badge Pill ──────────────────────────────────────────────────────────────

function BadgePill({
  value,
  variant = "default",
  pulse = false,
}: {
  value: string | number;
  variant?: BadgeVariant;
  pulse?: boolean;
}) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-primary/20 text-primary",
    warning: "bg-warning/20 text-warning",
    danger: "bg-destructive/20 text-destructive",
    success: "bg-success/20 text-success",
    info: "bg-info/20 text-info",
  };
  return (
    <span className="relative ml-auto shrink-0">
      {pulse && (
        <span className="absolute inset-0 animate-ping rounded-full opacity-50 bg-warning/40" />
      )}
      <span
        className={cn(
          "relative inline-flex items-center rounded-full px-1.5 py-0.5 font-semibold text-[10px] leading-none tabular-nums",
          styles[variant],
        )}
      >
        {value}
      </span>
    </span>
  );
}

// ─── Org Switcher ────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  enterprise: "bg-violet-500/15 text-violet-600",
  pro: "bg-blue-500/15 text-blue-600",
  starter: "bg-emerald-500/15 text-emerald-600",
  trial: "bg-amber-500/15 text-amber-600",
};

function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: orgsData } = useQuery({
    queryKey: ["organizations-list"],
    queryFn: () =>
      fetch("/api/v1/organizations", {
        headers: { "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "" },
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    staleTime: 300_000,
    placeholderData: (prev) => prev,
  });

  const orgs: { id: string; name: string; plan: string }[] =
    (orgsData as any)?.data ?? (orgsData as any)?.organizations ?? [];

  const activeId =
    typeof window !== "undefined"
      ? (localStorage.getItem("activeOrganizationId") ?? orgs[0]?.id ?? "")
      : orgs[0]?.id ?? "";

  const activeOrg = orgs.find((o) => o.id === activeId) ?? orgs[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function selectOrg(org: { id: string; name: string; plan: string }) {
    if (org.id === activeId) { setOpen(false); return; }
    localStorage.setItem("activeOrganizationId", org.id);
    window.location.reload();
  }

  return (
    <div ref={ref} className="relative shrink-0 border-border/60 border-b px-4 py-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-left hover:bg-muted/70 transition-colors"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/30 shrink-0">
          <Building2 className="h-3 w-3 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground text-xs">
            {activeOrg?.name ?? "Select Organization"}
          </p>
          <p className="text-[10px] text-muted-foreground capitalize">
            {activeOrg?.plan ?? "—"}
          </p>
        </div>
        <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border/60">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Your Organizations
            </p>
          </div>
          <div className="py-1 max-h-56 overflow-y-auto">
            {orgs.map((org) => {
              const isActive = org.id === activeId;
              const planClass = PLAN_COLORS[org.plan] ?? PLAN_COLORS.trial;
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => selectOrg(org)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
                    isActive && "bg-primary/5",
                  )}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary font-bold text-xs">
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-xs font-medium", isActive ? "text-primary" : "text-foreground")}>
                      {org.name}
                    </p>
                    <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold capitalize", planClass)}>
                      {org.plan}
                    </span>
                  </div>
                  {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Live Badge Hook ─────────────────────────────────────────────────────────

function useSidebarBadges() {
  const tickets = useQuery({
    queryKey: ["sidebar-tickets-open"],
    queryFn: () =>
      nucleoApi.tickets.list({ page: 1, limit: 1, status: "open" }),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const leave = useQuery({
    queryKey: ["sidebar-leave-pending"],
    queryFn: () => nucleoApi.hrm.leaveRequests.list({ page: 1, limit: 1 }),
    staleTime: 60_000,
  });

  const openTickets = useMemo(() => {
    const data = tickets.data as any;
    return data?.total ?? data?.data?.length ?? null;
  }, [tickets.data]);

  const pendingLeave = useMemo(() => {
    const items = (leave.data as any)?.data ?? [];
    return items.filter((r: any) => r.status === "pending").length || null;
  }, [leave.data]);

  return { openTickets, pendingLeave };
}

// ─── Notification Bell ────────────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [bellBounce, setBellBounce] = useState(false);
  const prevUnreadRef = useRef<number>(0);
  const ref = useRef<HTMLDivElement>(null);

  const { data: countData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => notificationsApi.unreadCount(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: listData, refetch } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => notificationsApi.list({ limit: 10 }),
    enabled: open,
    staleTime: 15_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => refetch(),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => refetch(),
  });

  const unread = (countData as any)?.count ?? 0;
  const notifications: any[] = (listData as any)?.data ?? [];

  // Bounce bell when unread count increases
  useEffect(() => {
    if (unread > prevUnreadRef.current) {
      setBellBounce(true);
      const id = setTimeout(() => setBellBounce(false), 1000);
      prevUnreadRef.current = unread;
      return () => clearTimeout(id);
    }
    prevUnreadRef.current = unread;
  }, [unread]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Notifications"
      >
        <Bell className={`h-4 w-4 ${bellBounce ? "animate-bounce" : ""}`} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-semibold text-sm">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-[11px] text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                <Bell className="h-6 w-6 opacity-40" />
                <p className="text-xs">No notifications</p>
              </div>
            ) : (
              notifications.map((n: any) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead.mutate(n.id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/60",
                    !n.readAt && "bg-primary/5",
                  )}
                >
                  {!n.readAt && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                  {n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                  <div className="min-w-0">
                    <p className={cn("leading-snug", !n.readAt && "font-medium")}>
                      {n.title ?? n.message}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.body}</p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Navigation Config ────────────────────────────────────────────────────────

function useNavigationGroups(badges: {
  openTickets: number | null;
  pendingLeave: number | null;
}): NavGroup[] {
  return [
    // ── Overview ──────────────────────────────────────────────────────────────
    {
      label: "Overview",
      items: [
        { name: "Dashboard", href: "/app", icon: LayoutDashboard },
        { name: "Analytics", href: "/app/analytics", icon: BarChart3 },
      ],
    },

    // ── Customer ──────────────────────────────────────────────────────────────
    // CRM + Helpdesk only. Marketing lives in Sales & Marketing below.
    {
      label: "Customer",
      items: [
        {
          name: "CRM",
          href: "/app/crm",
          icon: Building2,
          children: [
            { name: "Overview", href: "/app/crm" },
            { name: "Contacts", href: "/app/crm/contacts" },
            { name: "Leads", href: "/app/crm/leads" },
            { name: "Deals", href: "/app/crm/deals" },
            { name: "Pipeline", href: "/app/crm/pipeline" },
            { name: "Activities", href: "/app/crm/activities" },
            { name: "Documents", href: "/app/crm/documents" },
            { name: "Forecasting", href: "/app/crm/forecasting" },
          ],
        },
        {
          name: "Helpdesk",
          href: "/app/helpdesk",
          icon: LifeBuoy,
          badge: badges.openTickets,
          badgeVariant: "warning",
          children: [
            { name: "Overview", href: "/app/helpdesk" },
            { name: "All Tickets", href: "/app/helpdesk/tickets", badge: badges.openTickets, badgeVariant: "warning" },
            { name: "Queue", href: "/app/helpdesk/queue" },
            { name: "Knowledge Base", href: "/app/helpdesk/knowledge" },
            { name: "SLA", href: "/app/helpdesk/sla" },
            { name: "Canned Responses", href: "/app/helpdesk/canned" },
          ],
        },
      ],
    },

    // ── Sales & Marketing ─────────────────────────────────────────────────────
    // Merged: Marketing (absorbs Campaign Pro + Search Ads) + Social Media.
    // Was previously split across two nav groups.
    {
      label: "Marketing",
      items: [
        {
          name: "Marketing",
          href: "/app/marketing",
          icon: Megaphone,
          children: [
            { name: "Overview", href: "/app/marketing" },
            { name: "Campaigns", href: "/app/marketing/campaigns" },
            { name: "Automation", href: "/app/marketing/automation" },
            { name: "Email Builder", href: "/app/marketing/email-builder" },
            { name: "Landing Pages", href: "/app/marketing/landing-pages" },
            { name: "Lead Scoring", href: "/app/marketing/lead-scoring" },
            { name: "Webinars", href: "/app/marketing/webinars" },
            { name: "A/B Testing", href: "/app/marketing/ab-testing" },
            { name: "Campaign Pro", href: "/app/campaign-pro" },
            { name: "Search Ads", href: "/app/search-advertising" },
            { name: "Analytics", href: "/app/marketing/analytics" },
          ],
        },
        {
          name: "Social Media",
          href: "/app/social",
          icon: Share2,
          badge: "New",
          badgeVariant: "success",
          children: [
            { name: "Dashboard", href: "/app/social" },
            { name: "Accounts", href: "/app/social/accounts" },
            { name: "Posts", href: "/app/social/posts" },
            { name: "Calendar", href: "/app/social/posts/calendar" },
            { name: "Analytics", href: "/app/social/analytics" },
            { name: "Listening", href: "/app/social/listening" },
            { name: "Competitors", href: "/app/social/competitors" },
            { name: "Hashtags", href: "/app/social/hashtags" },
            { name: "Inbox", href: "/app/social/inbox" },
          ],
        },
        {
          name: "Campaign Pro",
          href: "/app/campaign-pro",
          icon: Sparkles,
        },
        {
          name: "Search Advertising",
          href: "/app/search-advertising",
          icon: Search,
        },
      ],
    },

    // ── Commerce ──────────────────────────────────────────────────────────────
    {
      label: "Commerce",
      items: [
        {
          name: "eCommerce",
          href: "/app/ecommerce",
          icon: ShoppingCart,
          badge: "New",
          badgeVariant: "success",
          children: [
            { name: "Store", href: "/app/ecommerce" },
            { name: "Orders", href: "/app/ecommerce/orders" },
            { name: "Products", href: "/app/ecommerce/products" },
            { name: "Customers", href: "/app/ecommerce/customers" },
            { name: "Shipping", href: "/app/ecommerce/shipping" },
            { name: "Discounts", href: "/app/ecommerce/discounts" },
            { name: "Reviews", href: "/app/ecommerce/reviews" },
            { name: "Abandoned Carts", href: "/app/ecommerce/abandoned" },
          ],
        },
      ],
    },

    // ── Operations ────────────────────────────────────────────────────────────
    // Inventory absorbs Procurement + Assets. Standalone items removed.
    {
      label: "Operations",
      items: [
        {
          name: "Projects",
          href: "/app/projects",
          icon: FolderKanban,
          children: [
            { name: "Overview", href: "/app/projects" },
            { name: "Board", href: "/app/projects/board" },
            { name: "Timeline", href: "/app/projects/timeline" },
            { name: "Sprints", href: "/app/projects/sprints" },
            { name: "Templates", href: "/app/projects/templates" },
            { name: "Risks", href: "/app/projects/risks" },
            { name: "Capacity", href: "/app/projects/capacity" },
          ],
        },
        {
          name: "Inventory & Assets",
          href: "/app/inventory",
          icon: Package,
          children: [
            { name: "Overview", href: "/app/inventory" },
            { name: "Products", href: "/app/inventory/products" },
            { name: "Warehouses", href: "/app/inventory/warehouses" },
            { name: "Stock", href: "/app/inventory/stock" },
            { name: "Suppliers", href: "/app/inventory/suppliers" },
            { name: "Purchase Orders", href: "/app/procurement" },
            { name: "Assets", href: "/app/assets" },
            { name: "Transfers", href: "/app/inventory/transfers" },
            { name: "Adjustments", href: "/app/inventory/adjustments" },
            { name: "Alerts", href: "/app/inventory/alerts" },
          ],
        },
        {
          name: "Field Service",
          href: "/app/field-service",
          icon: Truck,
          badge: "New",
          badgeVariant: "success",
          children: [
            { name: "Dashboard", href: "/app/field-service" },
            { name: "Jobs", href: "/app/field-service/jobs" },
            { name: "Dispatch", href: "/app/field-service/dispatch" },
            { name: "Technicians", href: "/app/field-service/technicians" },
            { name: "Routes", href: "/app/field-service/routes" },
            { name: "Schedule", href: "/app/field-service/schedule" },
            { name: "Parts", href: "/app/field-service/parts" },
          ],
        },
        { name: "Work Queue", href: "/app/queue", icon: ListOrdered },
      ],
    },

    // ── Finance ───────────────────────────────────────────────────────────────
    // Merged: Finance + Invoicing + Contracts + Compliance into one nav item.
    // "Finance & Legal" group eliminated — now a single expandable Finance item.
    {
      label: "Finance",
      items: [
        {
          name: "Finance",
          href: "/app/finance",
          icon: Receipt,
          children: [
            { name: "Overview", href: "/app/finance" },
            { name: "Invoices", href: "/app/invoicing/invoices" },
            { name: "Quotes", href: "/app/invoicing/quotes" },
            { name: "Expenses", href: "/app/invoicing/expenses" },
            { name: "Payments", href: "/app/invoicing/payments" },
            { name: "Vendors", href: "/app/invoicing/vendors" },
            { name: "Recurring", href: "/app/invoicing/recurring" },
            { name: "Taxes", href: "/app/invoicing/taxes" },
            { name: "Accounts", href: "/app/invoicing/accounts" },
            { name: "Contracts", href: "/app/contracts" },
            {
              name: "Compliance",
              href: "/app/compliance",
              children: [
                { name: "Controls", href: "/app/compliance" },
                { name: "Policies", href: "/app/policies" },
              ],
            },
            {
              name: "Reports",
              href: "/app/invoicing/reports/pl",
              children: [
                { name: "P&L", href: "/app/invoicing/reports/pl" },
                { name: "Balance Sheet", href: "/app/invoicing/reports/balance" },
                { name: "Cash Flow", href: "/app/invoicing/reports/cashflow" },
              ],
            },
          ],
        },
      ],
    },

    // ── People ────────────────────────────────────────────────────────────────
    // Enterprise moved to Settings. People = HRM only.
    {
      label: "People",
      items: [
        {
          name: "HRM",
          href: "/app/hrm",
          icon: UserRoundCog,
          badge: badges.pendingLeave,
          badgeVariant: "info",
          children: [
            { name: "Overview", href: "/app/hrm" },
            { name: "Directory", href: "/app/hrm/directory" },
            { name: "Leave", href: "/app/hrm/leave", badge: badges.pendingLeave, badgeVariant: "info" },
            { name: "Performance", href: "/app/hrm/performance" },
            { name: "Recruitment", href: "/app/hrm/recruitment" },
            { name: "Training", href: "/app/hrm/training" },
            { name: "Payroll", href: "/app/hrm/payroll" },
            { name: "Org Chart", href: "/app/hrm/org-chart" },
            { name: "OKRs", href: "/app/hrm/okrs" },
          ],
        },
      ],
    },

    // ── Communications ────────────────────────────────────────────────────────
    {
      label: "Communications",
      items: [
        {
          name: "Messaging & Calls",
          href: "/app/communications",
          icon: Phone,
          badge: "New",
          badgeVariant: "success",
          children: [
            { name: "Dashboard", href: "/app/communications" },
            { name: "SMS", href: "/app/communications/sms" },
            { name: "Voice", href: "/app/communications/voice" },
            { name: "Video", href: "/app/communications/video" },
            { name: "Chat", href: "/app/communications/chat" },
            { name: "Numbers", href: "/app/communications/numbers" },
            { name: "Routing", href: "/app/communications/routing" },
          ],
        },
        {
          name: "Speech-to-Text",
          href: "/app/speech",
          icon: Mic,
          badge: "New",
          badgeVariant: "success",
          children: [
            { name: "Transcription", href: "/app/speech/transcribe" },
            { name: "Commands", href: "/app/speech/commands" },
            { name: "Meetings", href: "/app/speech/meetings" },
            { name: "Speakers", href: "/app/speech/speakers" },
            { name: "Vocabulary", href: "/app/speech/vocabulary" },
            { name: "Models", href: "/app/speech/models" },
          ],
        },
      ],
    },

    // ── Platform & AI ─────────────────────────────────────────────────────────
    {
      label: "Platform & AI",
      items: [
        {
          name: "AI Agents",
          href: "/app/agents",
          icon: Bot,
          children: [
            { name: "All Agents", href: "/app/agents" },
            { name: "Templates", href: "/app/agents/templates" },
            { name: "Orchestration", href: "/app/agents/orchestration" },
            { name: "Sandbox", href: "/app/agents/sandbox" },
            { name: "Analytics", href: "/app/agents/analytics" },
          ],
        },
        {
          name: "AI & BI",
          href: "/app/intelligence",
          icon: Brain,
          badge: "New",
          badgeVariant: "success",
          children: [
            { name: "Overview", href: "/app/intelligence" },
            { name: "Reports", href: "/app/intelligence/reports" },
            { name: "Queries", href: "/app/intelligence/queries" },
            { name: "Cohort", href: "/app/intelligence/cohort" },
            { name: "Predictive", href: "/app/intelligence/predictive" },
            { name: "Funnel", href: "/app/intelligence/funnel" },
            { name: "Churn", href: "/app/intelligence/churn" },
            { name: "RFM", href: "/app/intelligence/rfm" },
          ],
        },
        {
          name: "Integrations",
          href: "/app/integrations",
          icon: Puzzle,
          children: [
            { name: "Overview", href: "/app/integrations" },
            { name: "Connectors", href: "/app/integrations/connectors" },
            { name: "Workflows", href: "/app/integrations/workflows" },
            { name: "Events", href: "/app/integrations/events" },
            { name: "Webhooks", href: "/app/integrations/webhooks" },
          ],
        },
        {
          name: "DevOps CI/CD",
          href: "/app/devops",
          icon: GitBranch,
          badge: "New",
          badgeVariant: "success",
          children: [
            { name: "Overview", href: "/app/devops" },
            { name: "Pipelines", href: "/app/devops/pipelines" },
            { name: "Runs", href: "/app/devops/runs" },
            { name: "Deployments", href: "/app/devops/deployments" },
            { name: "Infrastructure", href: "/app/devops/infrastructure" },
            { name: "Environments", href: "/app/devops/environments" },
          ],
        },
        {
          name: "Monitoring",
          href: "/app/monitoring",
          icon: Activity,
          children: [
            { name: "Dashboard", href: "/app/monitoring" },
            { name: "Analytics", href: "/app/monitoring/analytics" },
            { name: "Errors", href: "/app/monitoring/errors" },
            { name: "Uptime", href: "/app/monitoring/uptime" },
            { name: "Performance", href: "/app/monitoring/performance" },
            { name: "Alerts", href: "/app/monitoring/alerts" },
            { name: "Incidents", href: "/app/monitoring/incidents" },
            { name: "Logs", href: "/app/monitoring/logs" },
          ],
        },
      ],
    },

    // ── Settings ──────────────────────────────────────────────────────────────
    // Enterprise Controls moved here from People (it's an admin/platform concern).
    {
      label: "Settings",
      items: [
        { name: "Settings", href: "/app/settings", icon: Settings },
        { name: "Profile", href: "/app/settings/profile", icon: UserRoundCog },
        { name: "Notifications", href: "/app/settings/notifications", icon: Bell },
        { name: "API Keys", href: "/app/settings/api-keys", icon: Key },
        { name: "Organization", href: "/app/settings/organization", icon: Building2 },
        { name: "Team", href: "/app/settings/team", icon: Users2 },
        { name: "Enterprise", href: "/app/enterprise", icon: Users },
        { name: "Onboarding", href: "/app/onboarding", icon: Sparkles },
        { name: "Audit Log", href: "/app/audit-logs", icon: FileSearch },
        { name: "Roles & Permissions", href: "/app/rbac", icon: ShieldCheck },
      ],
    },
  ];
}

// ─── NavLeaf Item ─────────────────────────────────────────────────────────────

function LeafLink({
  item,
  onClose,
  depth = 1,
}: {
  item: NavLeaf;
  onClose: () => void;
  depth?: number;
}) {
  const dotSize = depth === 2 ? "h-0.5 w-0.5" : "h-1 w-1";
  return (
    <Link
      to={item.href}
      search={item.search as any}
      onClick={onClose}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        depth === 1
          ? "text-muted-foreground hover:text-foreground"
          : "text-muted-foreground/70 hover:text-foreground text-xs",
      )}
      activeProps={{ className: "font-semibold !text-primary" }}
      activeOptions={{ exact: false, includeSearch: false }}
    >
      <span
        className={cn(
          "rounded-full bg-current transition-opacity group-hover:opacity-100 opacity-40",
          dotSize,
        )}
      />
      {item.name}
      {item.badge != null && (
        <BadgePill value={item.badge} variant={item.badgeVariant} />
      )}
    </Link>
  );
}

// ─── Nav Item with optional nested children ────────────────────────────────

function NavItemRow({
  item,
  location,
  onClose,
  expandedItems,
  toggleExpanded,
}: {
  item: NavItem;
  location: { pathname: string };
  onClose: () => void;
  expandedItems: Set<string>;
  toggleExpanded: (key: string) => void;
}) {
  const isActive =
    location.pathname === item.href ||
    (item.href !== "/app" && location.pathname.startsWith(item.href));
  const isExpanded = expandedItems.has(item.href);
  const hasChildren = !!item.children?.length;

  return (
    <div>
      {hasChildren ? (
        <button
          type="button"
          onClick={() => toggleExpanded(item.href)}
          className={cn(
            "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {/* Active bar */}
          <span
            className={cn(
              "-ml-3 mr-0 h-5 w-0.5 shrink-0 rounded-r-full transition-all",
              isActive ? "bg-primary opacity-100" : "opacity-0",
            )}
          />
          <item.icon
            className={cn(
              "h-4 w-4 shrink-0",
              isActive
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          />
          <span className="flex-1 text-left leading-none">{item.name}</span>
          {item.badge != null && (
            <BadgePill
              value={item.badge}
              variant={item.badgeVariant}
              pulse={
                item.badgeVariant === "warning" ||
                item.badgeVariant === "danger"
              }
            />
          )}
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
        </button>
      ) : (
        <Link
          to={item.href}
          onClick={onClose}
          className={cn(
            "group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "-ml-3 mr-0 h-5 w-0.5 shrink-0 rounded-r-full transition-all",
              isActive ? "bg-primary opacity-100" : "opacity-0",
            )}
          />
          <item.icon
            className={cn(
              "h-4 w-4 shrink-0",
              isActive
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          />
          <span className="flex-1 leading-none">{item.name}</span>
          {item.badge != null && (
            <BadgePill value={item.badge} variant={item.badgeVariant} />
          )}
        </Link>
      )}

      {/* Level-1 children */}
      {hasChildren && isExpanded && (
        <div className="mt-0.5 ml-3 space-y-0.5 border-l border-border/40 pl-3">
          {item.children!.map((child) => {
            const childKey = `${item.href}::${child.name}`;
            const hasGrandChildren = !!child.children?.length;
            const childExpanded = expandedItems.has(childKey);

            if (hasGrandChildren) {
              return (
                <div key={child.name}>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(childKey)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
                  >
                    <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />
                    <span className="flex-1 text-left">{child.name}</span>
                    {child.badge != null && (
                      <BadgePill
                        value={child.badge}
                        variant={child.badgeVariant}
                      />
                    )}
                    {childExpanded ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                  {childExpanded && (
                    <div className="ml-3 space-y-0.5 border-l border-border/30 pl-3 py-0.5">
                      {child.children!.map((leaf) => (
                        <LeafLink
                          key={leaf.name}
                          item={leaf}
                          onClose={onClose}
                          depth={2}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <LeafLink
                key={child.name}
                item={child as NavLeaf}
                onClose={onClose}
                depth={1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ groups }: { groups: NavGroup[] }) {
  const location = useLocation();
  const path = location.pathname;

  // Skip breadcrumb on root app page
  if (path === "/app" || path === "/app/") return null;

  // Build crumb trail from nav tree
  const crumbs: { name: string; href: string }[] = [];

  for (const group of groups) {
    for (const item of group.items) {
      // Direct match on top-level item
      if (item.href === path) {
        crumbs.push({ name: item.name, href: item.href });
        break;
      }
      // Check children
      const matchedChild = item.children?.find((c) => c.href === path);
      if (matchedChild) {
        crumbs.push({ name: item.name, href: item.href });
        crumbs.push({ name: matchedChild.name, href: matchedChild.href });
        break;
      }
      // Check grandchildren
      for (const child of item.children ?? []) {
        const matchedGrand = (child as NavChild).children?.find((g) => g.href === path);
        if (matchedGrand) {
          crumbs.push({ name: item.name, href: item.href });
          crumbs.push({ name: child.name, href: child.href });
          crumbs.push({ name: matchedGrand.name, href: matchedGrand.href });
          break;
        }
      }
      if (crumbs.length) break;
    }
    if (crumbs.length) break;
  }

  if (crumbs.length < 2) return null;

  return (
    <div className="flex items-center gap-1.5 border-b border-border/40 bg-background/60 px-6 py-2 text-xs text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3 opacity-40" />}
          {i < crumbs.length - 1 ? (
            <Link to={crumb.href as any} className="hover:text-foreground transition-colors">
              {crumb.name}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{crumb.name}</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── Command Palette ──────────────────────────────────────────────────────────

function CommandPalette({
  open,
  onClose,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  groups: NavGroup[];
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Flatten all leaf links into a searchable list
  const allLinks = useMemo(() => {
    const links: { label: string; href: string; group: string }[] = [];
    for (const group of groups) {
      for (const item of group.items) {
        links.push({ label: item.name, href: item.href, group: group.label });
        for (const child of item.children ?? []) {
          links.push({ label: `${item.name} › ${child.name}`, href: child.href, group: group.label });
          for (const grandchild of (child as NavChild).children ?? []) {
            links.push({ label: `${item.name} › ${child.name} › ${grandchild.name}`, href: grandchild.href, group: group.label });
          }
        }
      }
    }
    return links;
  }, [groups]);

  const results = useMemo(() => {
    if (!query.trim()) return allLinks.slice(0, 8);
    const q = query.toLowerCase();
    return allLinks.filter((l) => l.label.toLowerCase().includes(q)).slice(0, 10);
  }, [query, allLinks]);

  useEffect(() => { setCursor(0); }, [results]);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(""); }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
      if (e.key === "Enter" && results[cursor]) {
        navigate({ to: results[cursor].href as any });
        onClose();
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, cursor, results, navigate, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, modules..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            results.map((link, i) => (
              <Link
                key={link.href + link.label}
                to={link.href as any}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer",
                  i === cursor ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60",
                )}
                onMouseEnter={() => setCursor(i)}
              >
                <span>{link.label}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{link.group}</span>
              </Link>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t border-border/60 px-4 py-2 text-[10px] text-muted-foreground">
          <span><kbd className="rounded border border-border px-1 py-0.5">↑↓</kbd> navigate</span>
          <span><kbd className="rounded border border-border px-1 py-0.5">↵</kbd> open</span>
          <span className="ml-auto"><kbd className="rounded border border-border px-1 py-0.5">⌘K</kbd> to open</span>
        </div>
      </div>
    </div>
  );
}

// ─── AppLayout ────────────────────────────────────────────────────────────────

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(["/app/crm", "/app/hrm"]),
  );
  const location = useLocation();
  const badges = useSidebarBadges();
  const navigationGroups = useNavigationGroups(badges);
  const { showBanner, acceptAll, rejectAll } = useCookieConsent();
  const { darkMode, toggleDarkMode } = useDarkMode();
  useKeyboardShortcuts();
  const { status: presenceStatus } = usePresence();
  const { data: session } = useSession();
  const user = session?.user;
  const userName = user?.name ?? "Demo User";
  const userEmail = user?.email ?? "demo@nucleo.one";
  const userInitial = userName.charAt(0).toUpperCase();

  // Cmd+K / Ctrl+K to open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleExpanded = (key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {}
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} groups={navigationGroups} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-border/60 border-r bg-card transition-transform duration-200 ease-in-out lg:static lg:inset-auto lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center justify-between border-border/60 border-b px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-base text-foreground tracking-tight">
              Nucleo <span className="text-primary">One</span>
            </span>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Org Switcher */}
        <OrgSwitcher />

        {/* Search / Command palette trigger */}
        <div className="shrink-0 px-3 pt-2 pb-1">
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="rounded border border-border px-1 py-0.5 text-[10px]">⌘K</kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-border">
          {navigationGroups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="mb-1 px-3 font-semibold text-[10px] uppercase tracking-widest text-muted-foreground/50">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItemRow
                    key={item.name}
                    item={item}
                    location={location}
                    onClose={() => setSidebarOpen(false)}
                    expandedItems={expandedItems}
                    toggleExpanded={toggleExpanded}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-1.5 border-border/60 border-t p-3">
          {/* Quick links */}
          <div className="mb-2 grid grid-cols-2 gap-1">
            <Link
              to="/app/settings"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground text-xs hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
            <Link
              to="/app/intelligence"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground text-xs hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI Tools
            </Link>
            <Link
              to="/app/helpdesk"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground text-xs hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <LifeBuoy className="h-3.5 w-3.5" />
              Support
            </Link>
            <Link
              to="/docs"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground text-xs hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Docs
            </Link>
            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground text-xs hover:bg-muted/60 hover:text-destructive transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-destructive/70" />
              Admin
            </Link>
          </div>

          {/* Dark mode toggle + keyboard shortcuts hint */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground text-xs hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              {darkMode ? <Sun className="h-3.5 w-3.5 text-yellow-500" /> : <Moon className="h-3.5 w-3.5" />}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShortcutsOpen((v) => !v)}
                title="Keyboard shortcuts"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground text-xs font-bold hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                ?
              </button>
              {shortcutsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShortcutsOpen(false)}
                  />
                  <div className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-xl border border-border bg-card shadow-xl">
                    <div className="border-b border-border/60 px-4 py-2.5">
                      <p className="text-xs font-semibold text-foreground">Keyboard Shortcuts</p>
                      <p className="text-[10px] text-muted-foreground">Press keys outside any input</p>
                    </div>
                    <div className="p-3 space-y-1.5">
                      {[
                        { keys: ["g", "d"], label: "Dashboard" },
                        { keys: ["g", "c"], label: "CRM Contacts" },
                        { keys: ["g", "p"], label: "Projects" },
                        { keys: ["g", "i"], label: "Invoices" },
                        { keys: ["g", "h"], label: "Helpdesk" },
                        { keys: ["g", "a"], label: "Agents" },
                        { keys: ["⌘K"], label: "Command palette" },
                      ].map((sc) => (
                        <div key={sc.label} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{sc.label}</span>
                          <div className="flex items-center gap-1">
                            {sc.keys.map((k, i) => (
                              <span key={i} className="flex items-center gap-1">
                                {i > 0 && <span className="text-[9px] text-muted-foreground/50">then</span>}
                                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">{k}</kbd>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User card */}
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 p-2">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary text-sm">
              {userInitial}
              <OnlineIndicator
                status={presenceStatus}
                className="absolute -bottom-0.5 -right-0.5"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground text-xs">
                {userName}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {userEmail}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center justify-between border-border/60 border-b bg-card px-4 lg:hidden">
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground">Nucleo One</span>
          </div>
          <NotificationBell />
        </div>

        <main className="flex-1 overflow-y-auto">
          <TrialBanner />
          <Breadcrumb groups={navigationGroups} />
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <SubscriptionGate>
                <RouteErrorBoundary>
                  <Outlet />
                </RouteErrorBoundary>
              </SubscriptionGate>
            </div>
          </div>
        </main>
      </div>

      {/* Cookie Consent Banner */}
      {showBanner && <CookieConsentBanner onAcceptAll={acceptAll} onRejectAll={rejectAll} />}
    </div>
  );
}

// ─── Route Error Boundary ─────────────────────────────────────────────────────

class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              This module encountered an error. Your other data is safe.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-3 text-left text-xs bg-muted rounded-lg p-3 max-w-lg overflow-auto text-destructive">
                {(this.state.error as Error).message}
              </pre>
            )}
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Trial Banner ─────────────────────────────────────────────────────────────

function TrialBanner() {
  const plan =
    typeof window !== "undefined"
      ? localStorage.getItem("nucleo_plan") || "trial"
      : "trial";
  const [dismissed, setDismissed] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("trial_banner_dismissed") === "1"
      : false,
  );

  if (plan !== "trial" || dismissed) return null;

  const TOTAL_DAYS = 21;
  const daysLeft: number = 14; // simulated — wire to actual trial_start_date in production
  const pct = Math.round((daysLeft / TOTAL_DAYS) * 100);
  const urgent = daysLeft <= 5;
  const warning = daysLeft <= 10;

  const handleDismiss = () => {
    localStorage.setItem("trial_banner_dismissed", "1");
    setDismissed(true);
  };

  return (
    <div
      className={`relative flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm ${
        urgent
          ? "bg-destructive/15 border-b border-destructive/30"
          : warning
            ? "bg-amber-500/15 border-b border-amber-500/30"
            : "bg-primary/10 border-b border-primary/20"
      }`}
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-muted/30">
        <div
          className={`h-full transition-all ${
            urgent ? "bg-destructive" : warning ? "bg-amber-400" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <AlertTriangle
        className={`h-3.5 w-3.5 shrink-0 ${
          urgent
            ? "text-destructive"
            : warning
              ? "text-amber-400"
              : "text-primary"
        }`}
      />

      <span className="text-foreground font-medium">
        {urgent
          ? `⚠️ Your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"} — upgrade now to keep your data.`
          : `Free trial — ${daysLeft} of ${TOTAL_DAYS} days remaining. Full Growth plan access included.`}
      </span>

      <Link
        to="/app/settings"
        search={{ tab: "billing" } as any}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
          urgent
            ? "bg-destructive text-white hover:bg-destructive/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        Upgrade now
        <ArrowRight className="h-3 w-3" />
      </Link>

      <span className="text-muted-foreground text-xs hidden sm:inline">
        No credit card needed until trial ends
      </span>

      <button
        type="button"
        onClick={handleDismiss}
        className="ml-auto rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss trial banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
