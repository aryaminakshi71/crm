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
  Puzzle,
  Settings,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";

// ─── Module Key Types ─────────────────────────────────────────────────────────

export type NucleoModuleKey =
  | "crm"
  | "projects"
  | "assetlayer"
  | "helpdesk"
  | "queue"
  | "invoicing"
  | "campaign_pro"
  | "doclattice"
  | "hrm"
  | "devops"
  | "agents"
  | "communications"
  | "social"
  | "speech"
  | "inventory"
  | "marketing"
  | "monitoring"
  | "field_service"
  | "advertising"
  | "finance";

export type PlanTierKey = "free" | "starter" | "business" | "enterprise";

// ─── Icons (browser-safe) ─────────────────────────────────────────────────────

type IconComponent = typeof Users;

const iconMap: Record<string, IconComponent> = {
  Users,
  Activity,
  Settings,
  Box,
  CreditCard,
  FileText,
  Puzzle,
  BarChart3,
  Bot,
  Globe,
  MessageSquare,
  ShoppingCart,
  Sparkles,
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
  // Core — always available
  {
    key: "crm",
    name: "Core Workspace",
    description: "Contacts, deals, leads, and activity tracking",
    iconName: "Users",
    phase: "core",
  },
  {
    key: "notifications",
    name: "Notifications",
    description: "Email and in-app notifications",
    iconName: "Activity",
    phase: "core",
  },
  {
    key: "rbac",
    name: "Access Control",
    description: "Roles, permissions, and team management",
    iconName: "Settings",
    phase: "core",
  },
  // Operations
  {
    key: "projects",
    name: "Projects",
    description: "Project planning, task tracking, and delivery workflows",
    iconName: "Box",
    phase: "ops",
  },
  {
    key: "helpdesk",
    name: "Helpdesk",
    description: "Ticketing, SLA workflows, and support operations",
    iconName: "FileText",
    phase: "ops",
  },
  {
    key: "hrm",
    name: "HRM",
    description: "Employee management, leave, payroll, and performance",
    iconName: "Users",
    phase: "ops",
  },
  {
    key: "inventory",
    name: "Inventory",
    description: "Stock management, products, warehouses, and transfers",
    iconName: "LayoutGrid",
    phase: "ops",
  },
  {
    key: "monitoring",
    name: "Monitoring",
    description: "System observability, alerts, and uptime tracking",
    iconName: "Activity",
    phase: "ops",
  },
  {
    key: "communications",
    name: "Communications",
    description: "Omnichannel messaging, SMS, voice, and video",
    iconName: "MessageSquare",
    phase: "ops",
  },
  {
    key: "field_service",
    name: "Field Service",
    description: "Dispatch, routing, and field technician management",
    iconName: "Truck",
    phase: "ops",
  },
  {
    key: "queue",
    name: "Queue",
    description: "Queue counters, token flow, and service desk operations",
    iconName: "FileText",
    phase: "ops",
  },
  {
    key: "devops",
    name: "DevOps",
    description: "CI/CD pipelines, deployments, and infrastructure",
    iconName: "Globe",
    phase: "ops",
  },
  {
    key: "finance",
    name: "Finance",
    description: "Expenses, budget tracking, and financial reporting",
    iconName: "CreditCard",
    phase: "ops",
  },
  // Growth
  {
    key: "invoicing",
    name: "Invoicing",
    description: "Invoice generation, payment tracking, and billing",
    iconName: "CreditCard",
    phase: "growth",
  },
  {
    key: "marketing",
    name: "Marketing",
    description: "Campaign management, email automation, and analytics",
    iconName: "BarChart3",
    phase: "growth",
  },
  {
    key: "advertising",
    name: "Advertising",
    description: "Ad campaign management across Google, Meta, LinkedIn",
    iconName: "BarChart3",
    phase: "growth",
  },
  {
    key: "social",
    name: "Social Media",
    description: "Social media scheduling, analytics, and inbox",
    iconName: "BarChart3",
    phase: "growth",
  },
  {
    key: "campaign_pro",
    name: "Campaign Pro",
    description: "Advanced campaign planning, A/B testing, and automation",
    iconName: "BarChart3",
    phase: "growth",
  },
  {
    key: "assetlayer",
    name: "AssetLayer",
    description: "Digital asset storage, tagging, folders, and lifecycle",
    iconName: "Box",
    phase: "ops",
  },
  // AI
  {
    key: "agents",
    name: "AI Agents",
    description: "Autonomous AI agents for coding, support, and analysis",
    iconName: "Bot",
    phase: "ai",
  },
  {
    key: "speech",
    name: "Speech & Voice",
    description: "Speech recognition, transcription, and voice commands",
    iconName: "Bot",
    phase: "ai",
  },
  {
    key: "doclattice",
    name: "Doclattice AI",
    description: "Document intake, OCR, extraction, review, and routing",
    iconName: "Sparkles",
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
    modules: ["crm", "notifications", "rbac", "projects"],
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
      "notifications",
      "rbac",
      "projects",
      "helpdesk",
      "invoicing",
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
      "notifications",
      "rbac",
      "projects",
      "helpdesk",
      "invoicing",
      "hrm",
      "inventory",
      "monitoring",
      "finance",
      "communications",
      "field_service",
      "queue",
      "devops",
      "marketing",
      "advertising",
      "social",
      "campaign_pro",
      "assetlayer",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    blurb: "Custom contracts for regulated organizations.",
    monthlyPrice: null,
    annualPrice: null,
    maxUsers: -1, // unlimited
    modules: NUCLEO_MODULES.map((m) => m.key), // all modules
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
