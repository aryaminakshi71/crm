/**
 * Module & Plan Definitions
 *
 * Single source of truth for all module and plan data in the web app.
 * Mirrors the API's MODULE_CATALOG from nucleo-modules.ts but is usable
 * in the browser without a server round-trip.
 */

import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  BookOpen,
  Box,
  Brain,
  CreditCard,
  FileText,
  Globe,
  Headphones,
  Inbox,
  LayoutGrid,
  MessageSquare,
  ScrollText,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  Truck,
  Users,
  Workflow,
} from "lucide-react";

// ─── Module Key Types ─────────────────────────────────────────────────────────

export type NucleoModuleKey =
  | "crm"
  | "projects"
  | "helpdesk"
  | "hrm"
  | "inventory"
  | "monitoring"
  | "communications"
  | "field_service"
  | "devops"
  | "finance"
  | "enterprise"
  | "knowledge"
  | "marketing"
  | "social"
  | "speech"
  | "campaign_pro"
  | "search_advertising"
  | "integrations"
  | "ecommerce"
  | "agents"
  | "intelligence"
  | "activities"
  | "analytics"
  | "assets"
  | "audit_logs"
  | "billing"
  | "compliance"
  | "contracts"
  | "notifications"
  | "onboarding"
  | "policies"
  | "procurement"
  | "queue"
  | "rbac"
  | "settings";

export type PlanTierKey = "free" | "starter" | "business" | "enterprise";

// ─── Icons (browser-safe) ─────────────────────────────────────────────────────

type IconComponent = typeof Users;

const iconMap: Record<string, IconComponent> = {
  Users,
  Activity,
  BarChart3,
  Bell,
  Bot,
  BookOpen,
  Box,
  Brain,
  CreditCard,
  FileText,
  Globe,
  Headphones,
  Inbox,
  LayoutGrid,
  MessageSquare,
  ScrollText,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  Truck,
  Workflow,
};

// ─── Module Definitions ───────────────────────────────────────────────────────

export interface NucleoModule {
  key: NucleoModuleKey;
  name: string;
  description: string;
  iconName: string;
  phase: "core" | "ops" | "growth" | "ai";
}

export const NUCLEO_MODULES: NucleoModule[] = [
  // Core
  {
    key: "crm",
    name: "CRM",
    description: "Contacts, deals, leads, pipeline, and activity tracking",
    iconName: "Users",
    phase: "core",
  },
  // Operations
  {
    key: "projects",
    name: "Projects",
    description: "Project planning, task tracking, kanban, gantt, and delivery workflows",
    iconName: "Box",
    phase: "ops",
  },
  {
    key: "helpdesk",
    name: "Helpdesk",
    description: "Ticketing, knowledge base, SLA workflows, and support operations",
    iconName: "FileText",
    phase: "ops",
  },
  {
    key: "hrm",
    name: "HRM",
    description: "Employee directory, attendance, leave, recruitment, training, and payroll",
    iconName: "Users",
    phase: "ops",
  },
  {
    key: "inventory",
    name: "Inventory",
    description: "Product catalog, stock management, warehouses, and transfers",
    iconName: "LayoutGrid",
    phase: "ops",
  },
  {
    key: "monitoring",
    name: "Monitoring",
    description: "Error tracking, uptime checks, performance metrics, and log aggregation",
    iconName: "Activity",
    phase: "ops",
  },
  {
    key: "communications",
    name: "Communications",
    description: "Omnichannel messaging — SMS, voice, video, and chat",
    iconName: "MessageSquare",
    phase: "ops",
  },
  {
    key: "field_service",
    name: "Field Service",
    description: "Smart dispatch, route optimization, technician tracking, and job scheduling",
    iconName: "Truck",
    phase: "ops",
  },
  {
    key: "devops",
    name: "DevOps",
    description: "CI/CD pipelines, automated deployments, and infrastructure management",
    iconName: "Globe",
    phase: "ops",
  },
  {
    key: "finance",
    name: "Finance",
    description:
      "Expenses, budget tracking, invoicing, payment tracking, financial reporting, and cost control",
    iconName: "CreditCard",
    phase: "ops",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "Advanced enterprise controls, compliance, contracts, and procurement workflows",
    iconName: "Star",
    phase: "ops",
  },
  {
    key: "knowledge",
    name: "Knowledge",
    description: "Knowledge base, self-service articles, documentation, and team wikis",
    iconName: "BookOpen",
    phase: "ops",
  },
  // Growth
  {
    key: "marketing",
    name: "Marketing",
    description:
      "Campaign builder, email automation, advertising, social media, landing pages, lead scoring, and A/B testing",
    iconName: "BarChart3",
    phase: "growth",
  },
  {
    key: "social",
    name: "Social Media",
    description: "Post scheduling, analytics, social listening, and inbox management",
    iconName: "Share2",
    phase: "growth",
  },
  {
    key: "speech",
    name: "Speech & Voice",
    description: "Audio transcription, real-time streaming, and meeting notes",
    iconName: "Headphones",
    phase: "growth",
  },
  {
    key: "campaign_pro",
    name: "Campaign Pro",
    description: "Advanced campaign planning, A/B testing, and multi-channel automation",
    iconName: "Sparkles",
    phase: "growth",
  },
  {
    key: "search_advertising",
    name: "Search Advertising",
    description: "Ad campaigns across Google and LinkedIn with AI-powered optimization",
    iconName: "Target",
    phase: "growth",
  },
  {
    key: "integrations",
    name: "Integrations",
    description: "300+ pre-built connectors, visual workflow builder, webhooks, and event bus",
    iconName: "Workflow",
    phase: "growth",
  },
  {
    key: "ecommerce",
    name: "eCommerce",
    description: "Online store, product catalog, cart, checkout, orders, payments, and inventory sync",
    iconName: "ShoppingCart",
    phase: "growth",
  },
  // AI
  {
    key: "agents",
    name: "AI Agents",
    description:
      "Autonomous AI agents for automation, support, business intelligence, and analytics",
    iconName: "Bot",
    phase: "ai",
  },
  {
    key: "intelligence",
    name: "Intelligence",
    description: "Churn analysis, CLV, cohort tracking, predictive analytics, and anomaly detection",
    iconName: "Brain",
    phase: "ai",
  },
  // Supporting (routes/API exist but cross-cutting — included in enterprise)
  {
    key: "activities",
    name: "Activities",
    description: "Track and log all customer-facing activities, calls, emails, and meetings",
    iconName: "Activity",
    phase: "ops",
  },
  {
    key: "analytics",
    name: "Analytics",
    description: "Cross-module dashboards, custom reports, and business performance metrics",
    iconName: "BarChart3",
    phase: "ops",
  },
  {
    key: "assets",
    name: "Assets",
    description: "Digital asset management — files, images, documents, and media library",
    iconName: "Box",
    phase: "ops",
  },
  {
    key: "audit_logs",
    name: "Audit Logs",
    description: "Complete audit trail of all user actions and system changes",
    iconName: "ScrollText",
    phase: "ops",
  },
  {
    key: "billing",
    name: "Billing",
    description: "Subscription management, invoices, payments, and revenue tracking",
    iconName: "CreditCard",
    phase: "ops",
  },
  {
    key: "compliance",
    name: "Compliance",
    description: "GDPR, SOC 2, and HIPAA compliance controls, policies, and reporting",
    iconName: "ShieldCheck",
    phase: "ops",
  },
  {
    key: "contracts",
    name: "Contracts",
    description: "Contract lifecycle management — create, sign, renew, and track agreements",
    iconName: "FileText",
    phase: "ops",
  },
  {
    key: "notifications",
    name: "Notifications",
    description: "In-app notifications, email digests, SMS alerts, and push notifications",
    iconName: "Bell",
    phase: "ops",
  },
  {
    key: "onboarding",
    name: "Onboarding",
    description: "Guided onboarding flows, checklists, and user setup wizards",
    iconName: "Sparkles",
    phase: "ops",
  },
  {
    key: "policies",
    name: "Policies",
    description: "Company policies, SOPs, and document management with approval workflows",
    iconName: "ScrollText",
    phase: "ops",
  },
  {
    key: "procurement",
    name: "Procurement",
    description: "Purchase orders, vendor management, and procurement approval workflows",
    iconName: "ShoppingCart",
    phase: "ops",
  },
  {
    key: "queue",
    name: "Queue",
    description: "Shared team queues for ticket routing, task assignment, and workload balancing",
    iconName: "Inbox",
    phase: "ops",
  },
  {
    key: "rbac",
    name: "RBAC",
    description: "Role-based access control — define roles, permissions, and team policies",
    iconName: "Settings",
    phase: "ops",
  },
  {
    key: "settings",
    name: "Settings",
    description: "Organization settings, team management, API keys, and security controls",
    iconName: "Settings",
    phase: "ops",
  },
];

// Helper to get Icon component for a module
export function getModuleIcon(key: string): IconComponent {
  const mod = NUCLEO_MODULES.find((m) => m.key === key);
  if (!mod) return Box;
  return iconMap[mod.iconName] ?? Box;
}

// ─── Module Phase Labels ──────────────────────────────────────────────────────

export const PHASE_LABELS: Record<NucleoModule["phase"], string> = {
  core: "Core",
  ops: "Operations",
  growth: "Growth",
  ai: "AI & Intelligence",
};

// ─── Plan Tiers ───────────────────────────────────────────────────────────────

export interface PlanTier {
  key: PlanTierKey;
  name: string;
  blurb: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  maxUsers: number;
  modules: NucleoModuleKey[]; // which modules are included in this plan
}

export const PLAN_TIERS: PlanTier[] = [
  {
    key: "free",
    name: "Free",
    blurb: "Perfect for solo founders getting started.",
    monthlyPrice: 0,
    annualPrice: 0,
    maxUsers: 1,
    modules: ["crm", "projects"],
  },
  {
    key: "starter",
    name: "Starter",
    blurb: "For growing teams that need full coverage.",
    monthlyPrice: 15,
    annualPrice: 12,
    maxUsers: 25,
    modules: [
      "crm",
      "projects",
      "helpdesk",
      "hrm",
      "inventory",
      "monitoring",
      "finance",
      "activities",
      "analytics",
    ],
  },
  {
    key: "business",
    name: "Business",
    blurb: "For established companies with advanced needs.",
    monthlyPrice: 49,
    annualPrice: 39,
    maxUsers: 200,
    modules: [
      "crm",
      "projects",
      "helpdesk",
      "hrm",
      "inventory",
      "monitoring",
      "communications",
      "field_service",
      "devops",
      "finance",
      "enterprise",
      "knowledge",
      "marketing",
      "social",
      "speech",
      "campaign_pro",
      "search_advertising",
      "integrations",
      "ecommerce",
      "agents",
      "intelligence",
      "activities",
      "analytics",
      "assets",
      "audit_logs",
      "billing",
      "compliance",
      "contracts",
      "notifications",
      "onboarding",
      "policies",
      "procurement",
      "queue",
      "rbac",
      "settings",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    blurb: "Custom contracts for regulated organizations.",
    monthlyPrice: null,
    annualPrice: null,
    maxUsers: -1, // unlimited
    modules: NUCLEO_MODULES.map((m) => m.key), // all 34 modules
  },
];

// ─── Module Plan Access Map ────────────────────────────────────────────────────
// For quick lookup: which plans include which module
export const MODULE_PLANS: Record<NucleoModuleKey, PlanTierKey[]> = (() => {
  const map: Record<string, PlanTierKey[]> = {} as any;
  for (const mod of NUCLEO_MODULES) {
    map[mod.key] = PLAN_TIERS
      .filter((plan) => plan.modules.includes(mod.key))
      .map((plan) => plan.key);
  }
  return map;
})();

// ─── Module by Phase ───────────────────────────────────────────────────────────

export const MODULES_BY_PHASE = NUCLEO_MODULES.reduce(
  (acc, mod) => {
    if (!acc[mod.phase]) acc[mod.phase] = [];
    acc[mod.phase].push(mod);
    return acc;
  },
  {} as Record<NucleoModule["phase"], NucleoModule[]>
);
