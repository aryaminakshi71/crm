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

export const MODULE_CATALOG: Array<{
  key: NucleoModuleKey;
  name: string;
  description: string;
  phase: "core" | "ops" | "growth" | "ai";
  defaultEnabled: boolean;
}> = [
  {
    key: "crm",
    name: "Core Workspace",
    description:
      "Shared customer workspace: contacts, deals, leads, and activity.",
    phase: "core",
    defaultEnabled: true,
  },
  {
    key: "projects",
    name: "Projects",
    description: "Project planning, task tracking, and delivery workflows.",
    phase: "ops",
    defaultEnabled: false,
  },
  {
    key: "assetlayer",
    name: "AssetLayer",
    description: "Digital asset storage, tagging, folders, and lifecycle.",
    phase: "ops",
    defaultEnabled: false,
  },
  {
    key: "helpdesk",
    name: "Helpdesk",
    description: "Ticketing, SLA workflows, and support operations.",
    phase: "ops",
    defaultEnabled: false,
  },
  {
    key: "queue",
    name: "Queue",
    description: "Queue counters, token flow, and service desk operations.",
    phase: "ops",
    defaultEnabled: false,
  },
  {
    key: "invoicing",
    name: "Invoicing",
    description: "Invoices, billing records, and payment tracking.",
    phase: "growth",
    defaultEnabled: false,
  },
  {
    key: "campaign_pro",
    name: "Campaign Pro",
    description: "Campaign planning, messaging automation, and analytics.",
    phase: "growth",
    defaultEnabled: false,
  },
  {
    key: "doclattice",
    name: "Doclattice AI",
    description: "Document intake, OCR, extraction, review, and routing.",
    phase: "ai",
    defaultEnabled: false,
  },
  {
    key: "hrm",
    name: "HRM",
    description: "Human resource management",
    phase: "ops",
    defaultEnabled: false,
  },
  {
    key: "devops",
    name: "DevOps",
    description: "CI/CD pipelines and deployments",
    phase: "ops",
    defaultEnabled: false,
  },
  {
    key: "agents",
    name: "AI Agents",
    description: "Autonomous AI agents",
    phase: "ai",
    defaultEnabled: false,
  },
  {
    key: "communications",
    name: "Communications",
    description: "Omnichannel messaging",
    phase: "ops",
    defaultEnabled: false,
  },
  {
    key: "social",
    name: "Social Media",
    description: "Social media management",
    phase: "growth",
    defaultEnabled: false,
  },
  {
    key: "speech",
    name: "Speech & Voice",
    description: "Speech recognition and transcription",
    phase: "ai",
    defaultEnabled: false,
  },
  {
    key: "inventory",
    name: "Inventory",
    description: "Stock and product management",
    phase: "ops",
    defaultEnabled: false,
  },
  {
    key: "marketing",
    name: "Marketing",
    description: "Campaign and email marketing",
    phase: "growth",
    defaultEnabled: false,
  },
  {
    key: "monitoring",
    name: "Monitoring",
    description: "System observability",
    phase: "ops",
    defaultEnabled: false,
  },
  {
    key: "field_service",
    name: "Field Service",
    description: "Dispatch and field operations",
    phase: "ops",
    defaultEnabled: false,
  },
  {
    key: "advertising",
    name: "Advertising",
    description: "Ad campaigns and analytics",
    phase: "growth",
    defaultEnabled: false,
  },
  {
    key: "finance",
    name: "Finance",
    description: "Invoicing, expenses, and payroll",
    phase: "growth",
    defaultEnabled: false,
  },
];

export const MODULE_KEYS = MODULE_CATALOG.map((module) => module.key);
