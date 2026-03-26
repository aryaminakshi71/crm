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
  Box,
  CreditCard,
  FileText,
  Globe,
  LayoutGrid,
  MessageSquare,
  Truck,
  Users,
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
  | "agents";

export type PlanTierKey = "free" | "starter" | "business" | "enterprise";

// ─── Icons (browser-safe) ─────────────────────────────────────────────────────

type IconComponent = typeof Users;

const iconMap: Record<string, IconComponent> = {
  Users,
  Activity,
  Box,
  CreditCard,
  FileText,
  BarChart3,
  Bot,
  Globe,
  MessageSquare,
  Truck,
  LayoutGrid,
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
  // Growth
  {
    key: "marketing",
    name: "Marketing",
    description:
      "Campaign builder, email automation, advertising, social media, landing pages, lead scoring, and A/B testing",
    iconName: "BarChart3",
    phase: "growth",
  },
  // AI
  {
    key: "agents",
    name: "AI Agents",
    description:
      "Autonomous AI agents for automation, support, business intelligence, speech transcription, and meeting notes",
    iconName: "Bot",
    phase: "ai",
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
      "finance",
      "communications",
      "field_service",
      "devops",
      "marketing",
      "agents",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    blurb: "Custom contracts for regulated organizations.",
    monthlyPrice: null,
    annualPrice: null,
    maxUsers: -1, // unlimited
    modules: NUCLEO_MODULES.map((m) => m.key), // all 12 public modules
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
