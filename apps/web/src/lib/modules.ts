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
  Bot,
  BookOpen,
  Box,
  Brain,
  CreditCard,
  FileText,
  FolderKanban,
  Globe,
  Headphones,
  LayoutGrid,
  MessageSquare,
  Settings,
  Share2,
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
  | "marketing"
  | "ecommerce"
  | "agents"
  | "analytics"
  | "integrations";

export type PlanTierKey = "free" | "starter" | "business" | "enterprise";

// ─── Icons (browser-safe) ─────────────────────────────────────────────────────

type IconComponent = typeof Users;

const iconMap: Record<string, IconComponent> = {
  Users,
  Activity,
  BarChart3,
  Bot,
  BookOpen,
  Box,
  Brain,
  CreditCard,
  FileText,
  FolderKanban,
  Globe,
  Headphones,
  LayoutGrid,
  MessageSquare,
  Settings,
  Share2,
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
}

export const NUCLEO_MODULES: NucleoModule[] = [
  {
    key: "crm",
    name: "CRM",
    description: "Contacts, deals, leads, pipeline, and activity tracking",
    iconName: "Users",
  },
  {
    key: "projects",
    name: "Projects",
    description: "Project planning, task tracking, kanban, gantt, and delivery workflows",
    iconName: "Box",
  },
  {
    key: "helpdesk",
    name: "Helpdesk",
    description: "Ticketing, knowledge base, SLA workflows, and support operations",
    iconName: "FileText",
  },
  {
    key: "hrm",
    name: "HRM",
    description: "Employee directory, attendance, leave, recruitment, training, and payroll",
    iconName: "Users",
  },
  {
    key: "inventory",
    name: "Inventory",
    description: "Product catalog, stock management, warehouses, and transfers",
    iconName: "LayoutGrid",
  },
  {
    key: "monitoring",
    name: "Monitoring",
    description: "Error tracking, uptime checks, performance metrics, and log aggregation",
    iconName: "Activity",
  },
  {
    key: "communications",
    name: "Communications",
    description:
      "Omnichannel messaging — SMS, voice, video, chat, and speech transcription",
    iconName: "MessageSquare",
  },
  {
    key: "field_service",
    name: "Field Service",
    description: "Smart dispatch, route optimization, technician tracking, and job scheduling",
    iconName: "Truck",
  },
  {
    key: "devops",
    name: "DevOps",
    description: "CI/CD pipelines, automated deployments, and infrastructure management",
    iconName: "Globe",
  },
  {
    key: "finance",
    name: "Finance",
    description:
      "Expenses, budget tracking, invoicing, billing, payment tracking, financial reporting, and cost control",
    iconName: "CreditCard",
  },
  {
    key: "marketing",
    name: "Marketing",
    description:
      "Campaign builder, email automation, advertising, social media, landing pages, lead scoring, and A/B testing",
    iconName: "BarChart3",
  },
  {
    key: "ecommerce",
    name: "eCommerce",
    description: "Online store, product catalog, cart, checkout, orders, payments, and inventory sync",
    iconName: "ShoppingCart",
  },
  {
    key: "agents",
    name: "AI Agents",
    description:
      "Autonomous AI agents for automation, support, business intelligence, speech, and analytics",
    iconName: "Bot",
  },
  {
    key: "analytics",
    name: "Analytics & BI",
    description:
      "Dashboards, reports, churn analysis, CLV, cohort tracking, predictive analytics, and anomaly detection",
    iconName: "Brain",
  },
  {
    key: "integrations",
    name: "Integrations",
    description: "300+ pre-built connectors, visual workflow builder, webhooks, and event bus",
    iconName: "Workflow",
  },
];

// Helper to get Icon component for a module
export function getModuleIcon(key: string): IconComponent {
  const mod = NUCLEO_MODULES.find((m) => m.key === key);
  if (!mod) return Box;
  return iconMap[mod.iconName] ?? Box;
}

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
      "marketing",
      "ecommerce",
      "agents",
      "analytics",
      "integrations",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    blurb: "Custom contracts for regulated organizations.",
    monthlyPrice: null,
    annualPrice: null,
    maxUsers: -1, // unlimited
    modules: NUCLEO_MODULES.map((m) => m.key), // all 15 modules
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
