export type NucleoModuleKey =
  | "crm"
  | "projects"
  | "assetlayer"
  | "helpdesk"
  | "invoicing"
  | "campaign_pro";

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
];

export const MODULE_KEYS = MODULE_CATALOG.map((module) => module.key);
