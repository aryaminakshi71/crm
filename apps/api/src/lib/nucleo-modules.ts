export type NucleoModuleKey =
  | "crm"
  | "projects"
  | "assetlayer"
  | "helpdesk"
  | "queue"
  | "invoicing"
  | "campaign_pro"
  | "doclattice";

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
    description: "Shared customer workspace: contacts, deals, leads, and activity.",
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
];

export const MODULE_KEYS = MODULE_CATALOG.map((module) => module.key);
