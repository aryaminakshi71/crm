import { nucleoApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { CookieConsentBanner, useCookieConsent } from "@/components/cookie-consent-banner";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderKanban,
  FolderOpen,
  GitBranch,
  LayoutDashboard,
  LifeBuoy,
  ListOrdered,
  LogOut,
  Megaphone,
  Menu,
  Mic,
  Package,
  Phone,
  Puzzle,
  Receipt,
  Scale,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  UserRoundCog,
  Users,
  Webhook,
  X,
  Zap,
  Activity,
} from "lucide-react";
import { useMemo, useState } from "react";

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

// ─── Navigation Config ────────────────────────────────────────────────────────

function useNavigationGroups(badges: {
  openTickets: number | null;
  pendingLeave: number | null;
}): NavGroup[] {
  return [
    {
      label: "Overview",
      items: [
        { name: "Dashboard", href: "/app", icon: LayoutDashboard },
        { name: "Analytics", href: "/app/analytics", icon: BarChart3 },
      ],
    },
    {
      label: "Customer",
      items: [
        {
          name: "CRM",
          href: "/app/crm",
          icon: Building2,
          children: [
            {
              name: "Overview",
              href: "/app/crm",
              search: { view: "overview" },
            },
            {
              name: "Contacts",
              href: "/app/crm",
              search: { view: "contacts" },
            },
            { name: "Leads", href: "/app/crm", search: { view: "leads" } },
            { name: "Deals", href: "/app/crm", search: { view: "deals" } },
            {
              name: "Timeline",
              href: "/app/crm",
              search: { view: "activities" },
            },
          ],
        },
        {
          name: "Helpdesk",
          href: "/app/helpdesk",
          icon: LifeBuoy,
          badge: badges.openTickets,
          badgeVariant: "warning",
          children: [
            { name: "All Tickets", href: "/app/helpdesk" },
            {
              name: "Open Tickets",
              href: "/app/helpdesk",
              badge: badges.openTickets,
              badgeVariant: "warning",
            },
            { name: "Queue Operations", href: "/app/helpdesk" },
            { name: "Knowledge Base", href: "/app/helpdesk" },
          ],
        },
        {
          name: "Marketing",
          href: "/app/marketing",
          icon: Megaphone,
          children: [
            { name: "Campaigns", href: "/app/marketing" },
            { name: "Audience", href: "/app/marketing" },
            { name: "Analytics", href: "/app/marketing" },
          ],
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          name: "Projects",
          href: "/app/projects",
          icon: FolderKanban,
          children: [
            { name: "Board", href: "/app/projects" },
            { name: "Timeline", href: "/app/projects" },
            { name: "Milestones", href: "/app/projects" },
          ],
        },
        {
          name: "Assets",
          href: "/app/assets",
          icon: FolderOpen,
          children: [
            { name: "All Assets", href: "/app/assets" },
            { name: "Documents", href: "/app/assets" },
            { name: "Maintenance", href: "/app/assets" },
          ],
        },
        {
          name: "Inventory",
          href: "/app/inventory",
          icon: Package,
          children: [
            { name: "Products", href: "/app/inventory" },
            { name: "Warehouses", href: "/app/inventory" },
            { name: "Stock Levels", href: "/app/inventory" },
          ],
        },
        {
          name: "Procurement",
          href: "/app/procurement",
          icon: Briefcase,
          children: [
            { name: "Purchase Orders", href: "/app/procurement" },
            { name: "Vendors", href: "/app/procurement" },
            { name: "Requests", href: "/app/procurement" },
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
          ],
        },
      ],
    },
    {
      label: "Finance & Legal",
      items: [
        {
          name: "Finance",
          href: "/app/finance",
          icon: Receipt,
          children: [
            {
              name: "Overview",
              href: "/app/finance",
              search: { view: "overview" },
            },
            {
              name: "Transactions",
              href: "/app/finance",
              search: { view: "transactions" },
            },
            {
              name: "Payroll",
              href: "/app/finance",
              search: { view: "payroll" },
            },
          ],
        },
        {
          name: "Invoicing",
          href: "/app/invoicing",
          icon: FileText,
        },
        {
          name: "Contracts",
          href: "/app/contracts",
          icon: Scale,
          children: [
            { name: "All Contracts", href: "/app/contracts" },
            { name: "Active", href: "/app/contracts" },
            {
              name: "Pending Review",
              href: "/app/contracts",
              badge: "!",
              badgeVariant: "warning",
            },
          ],
        },
        {
          name: "Compliance",
          href: "/app/compliance",
          icon: ShieldCheck,
          children: [
            { name: "Controls", href: "/app/compliance" },
            { name: "Policies", href: "/app/policies" },
            { name: "Audits", href: "/app/compliance" },
          ],
        },
      ],
    },
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
            {
              name: "Directory",
              href: "/app/hrm",
              search: { view: "directory" },
            },
            {
              name: "Attendance",
              href: "/app/hrm",
              search: { view: "attendance" },
            },
            {
              name: "Leave Requests",
              href: "/app/hrm",
              search: { view: "leave" },
              badge: badges.pendingLeave,
              badgeVariant: "info",
            },
            {
              name: "Performance",
              href: "/app/hrm",
              search: { view: "performance" },
            },
            {
              name: "Recruitment",
              href: "/app/hrm",
              search: { view: "recruitment" },
              children: [
                {
                  name: "Requisitions",
                  href: "/app/hrm",
                  search: { view: "recruitment" },
                },
                {
                  name: "Candidates",
                  href: "/app/hrm",
                  search: { view: "recruitment" },
                },
              ],
            },
            {
              name: "Training",
              href: "/app/hrm",
              search: { view: "training" },
              children: [
                {
                  name: "Programs",
                  href: "/app/hrm",
                  search: { view: "training" },
                },
                {
                  name: "Records",
                  href: "/app/hrm",
                  search: { view: "training" },
                },
              ],
            },
            { name: "Payroll", href: "/app/hrm", search: { view: "payroll" } },
          ],
        },
        {
          name: "Enterprise",
          href: "/app/enterprise",
          icon: Users,
          children: [
            { name: "Org Chart", href: "/app/enterprise" },
            { name: "Departments", href: "/app/enterprise" },
            { name: "Workspace", href: "/app/enterprise" },
          ],
        },
      ],
    },
    {
      label: "Intelligence",
      items: [
        {
          name: "AI & BI",
          href: "/app/intelligence",
          icon: Brain,
          badge: "New",
          badgeVariant: "success",
          children: [
            { name: "Strategic Agent", href: "/app/intelligence" },
            { name: "Revenue Forecast", href: "/app/intelligence" },
            { name: "Agent Run Log", href: "/app/intelligence" },
            { name: "Exec Watchlist", href: "/app/intelligence" },
          ],
        },
        { name: "Settings", href: "/app/settings", icon: Settings },
        { name: "Onboarding", href: "/app/onboarding", icon: Sparkles },
      ],
    },
    {
      label: "Platform",
      items: [
        {
          name: "Integrations",
          href: "/app/integrations",
          icon: Puzzle,
          children: [
            { name: "Overview", href: "/app/integrations" },
            { name: "Connectors", href: "/app/integrations/connectors" },
            { name: "Workflows", href: "/app/integrations/workflows" },
            { name: "Events", href: "/app/integrations/events" },
          ],
        },
        {
          name: "AI Agents",
          href: "/app/agents",
          icon: Bot,
          children: [
            { name: "All Agents", href: "/app/agents" },
            { name: "Templates", href: "/app/agents/templates" },
            { name: "Settings", href: "/app/agents/settings" },
          ],
        },
        {
          name: "DevOps CI/CD",
          href: "/app/devops",
          icon: GitBranch,
          badge: "New",
          badgeVariant: "success",
          children: [
            { name: "Pipelines", href: "/app/devops" },
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
            { name: "Catalog", href: "/app/monitoring/catalog" },
          ],
        },
      ],
    },
    {
      label: "Communications",
      items: [
        {
          name: "SMS & Voice",
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
          ],
        },
        {
          name: "Speech-to-Text",
          href: "/app/speech",
          icon: Mic,
          badge: "New",
          badgeVariant: "success",
          children: [
            { name: "Transcription", href: "/app/speech" },
            { name: "Voice Commands", href: "/app/speech/voice-commands" },
            { name: "Meeting Notes", href: "/app/speech/meetings" },
          ],
        },
      ],
    },
    {
      label: "Marketing",
      items: [
        {
          name: "Campaign Pro",
          href: "/app/campaign-pro",
          icon: Megaphone,
          children: [
            { name: "Campaigns", href: "/app/campaign-pro" },
            { name: "Audience", href: "/app/campaign-pro" },
            { name: "Analytics", href: "/app/campaign-pro" },
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
            { name: "Analytics", href: "/app/social/analytics" },
            { name: "Listening", href: "/app/social/listening" },
          ],
        },
        {
          name: "Search Advertising",
          href: "/app/search-advertising",
          icon: Search,
        },
      ],
    },
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
          ],
        },
        {
          name: "Queue",
          href: "/app/queue",
          icon: ListOrdered,
        },
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

// ─── AppLayout ────────────────────────────────────────────────────────────────

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(["/app/crm", "/app/hrm"]),
  );
  const location = useLocation();
  const badges = useSidebarBadges();
  const navigationGroups = useNavigationGroups(badges);
  const { showBanner } = useCookieConsent();

  const toggleExpanded = (key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-background">
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

        {/* Workspace badge */}
        <div className="shrink-0 border-border/60 border-b px-4 py-2.5">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-left hover:bg-muted/70 transition-colors"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/30">
              <Building2 className="h-3 w-3 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground text-xs">
                Demo Workspace
              </p>
              <p className="text-[10px] text-muted-foreground">
                Free Trial · 14 days left
              </p>
            </div>
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
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
          </div>

          {/* User card */}
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 p-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary text-sm">
              D
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground text-xs">
                Demo User
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                demo@nucleo.one
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
          <div className="w-8" />
        </div>

        <main className="flex-1 overflow-y-auto">
          <TrialBanner />
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Cookie Consent Banner */}
      {showBanner && <CookieConsentBanner />}
    </div>
  );
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
