export type NucleoModuleKey =
  | "crm"
  | "projects"
  | "assetlayer"
  | "helpdesk"
  | "queue"
  | "invoicing"
  | "campaign_pro"
  | "doclattice"
  | "integrations"
  | "ai_agents"
  | "monitoring"
  | "api_webhooks"
  | "notifications"
  | "rbac"
  | "audit";

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
    key: "integrations",
    name: "Integrations",
    description: "Connect CRM, helpdesk, invoicing, and workflow automation.",
    phase: "growth",
    defaultEnabled: false,
  },
  {
    key: "ai_agents",
    name: "AI Agents",
    description: "Autonomous AI coding and data analysis agents.",
    phase: "ai",
    defaultEnabled: false,
  },
  {
    key: "monitoring",
    name: "Monitoring",
    description: "Platform observability: analytics, errors, uptime, performance.",
    phase: "ops",
    defaultEnabled: false,
  },
  {
    key: "api_webhooks",
    name: "API & Webhooks",
    description: "API key management and webhook configuration.",
    phase: "ops",
    defaultEnabled: false,
  },
  {
    key: "notifications",
    name: "Notifications",
    description: "Email, SMS, push, and in-app notifications.",
    phase: "core",
    defaultEnabled: true,
  },
  {
    key: "rbac",
    name: "Access Control",
    description: "Role-based access control, departments, and teams.",
    phase: "core",
    defaultEnabled: true,
  },
  {
    key: "audit",
    name: "Audit Logs",
    description: "Audit logging and compliance reporting.",
    phase: "ops",
    defaultEnabled: false,
  },
];

export const MODULE_KEYS = MODULE_CATALOG.map((module) => module.key);
