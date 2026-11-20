/**
 * SEO Utilities
 *
 * Dynamic meta tags, structured data, and Open Graph support.
 */

import type { NucleoModuleKey, PlanTierKey } from "./modules";

type ModuleKey = NucleoModuleKey;
type PlanTier = PlanTierKey;

interface OrganizationData {
  name: string;
  plan?: PlanTier;
  modules?: ModuleKey[];
}

// Module SEO data
export const moduleSEO: Record<ModuleKey, {
  title: string;
  description: string;
  keywords: string[];
  benefits: string[];
  icon: string;
}> = {
  crm: {
    title: "CRM Software",
    description: "Manage contacts, deals, leads, and customer relationships in one unified platform.",
    keywords: ["CRM", "customer relationship management", "sales pipeline", "contact management"],
    benefits: ["Track 50,000+ contacts", "Automate follow-ups", "Pipeline analytics"],
    icon: "👥",
  },
  projects: {
    title: "Project Management",
    description: "Plan, track, and deliver projects with tasks, milestones, and resource management.",
    keywords: ["project management", "task tracking", "milestones", "resource allocation"],
    benefits: ["Kanban & Gantt views", "Team collaboration", "Deadline tracking"],
    icon: "📦",
  },
  finance: {
    title: "Invoicing & Billing",
    description: "Create professional invoices, track payments, and manage billing automatically.",
    keywords: ["invoicing", "billing", "payments", "invoice software"],
    benefits: ["Auto-payment reminders", "Multi-currency support", "Financial reporting"],
    icon: "💳",
  },
  helpdesk: {
    title: "Helpdesk",
    description: "Resolve customer tickets faster with AI-powered triage and SLA management.",
    keywords: ["helpdesk", "support tickets", "customer service", "SLA"],
    benefits: ["AI ticket triage", "SLA monitoring", "Knowledge base"],
    icon: "🎫",
  },
  marketing: {
    title: "Marketing Automation",
    description: "Create campaigns, manage audiences, and track engagement across channels.",
    keywords: ["marketing", "campaign management", "email marketing", "automation"],
    benefits: ["Multi-channel campaigns", "Audience segmentation", "ROI analytics"],
    icon: "📈",
  },
  hrm: {
    title: "HR Management",
    description: "Manage employees, attendance, leave, payroll, and performance reviews.",
    keywords: ["HRM", "human resources", "payroll", "employee management"],
    benefits: ["Automated payroll", "Leave management", "Performance reviews"],
    icon: "👔",
  },
  integrations: {
    title: "Integrations",
    description: "Connect your favorite apps with workflows, webhooks, and 50+ integrations.",
    keywords: ["integrations", "workflow automation", "webhooks", "API"],
    benefits: ["50+ connectors", "Visual workflow builder", "Real-time events"],
    icon: "🔗",
  },
  agents: {
    title: "AI Agents",
    description: "Deploy autonomous AI agents for coding, customer support, and data analysis.",
    keywords: ["AI agents", "artificial intelligence", "automation", "machine learning"],
    benefits: ["24/7 autonomous operation", "Code generation", "Natural language"],
    icon: "🤖",
  },
  monitoring: {
    title: "Platform Monitoring",
    description: "Track uptime, errors, performance, and analytics across your entire platform.",
    keywords: ["monitoring", "observability", "uptime", "performance tracking"],
    benefits: ["Real-time alerts", "Error tracking", "Performance metrics"],
    icon: "📊",
  },
  analytics: {
    title: "Business Analytics",
    description: "Turn raw data into decisions with dashboards, reports, and AI-powered insights.",
    keywords: ["analytics", "business intelligence", "dashboards", "reporting"],
    benefits: ["Custom dashboards", "Scheduled reports", "AI insights"],
    icon: "📈",
  },
  inventory: {
    title: "Inventory Management",
    description: "Track stock, warehouses, and suppliers with real-time inventory control.",
    keywords: ["inventory", "stock management", "warehouse", "supply chain"],
    benefits: ["Real-time stock levels", "Low-stock alerts", "Multi-warehouse"],
    icon: "📦",
  },
  communications: {
    title: "Team Communications",
    description: "Chat, video, and voice built into your business platform.",
    keywords: ["communications", "team chat", "video calls", "voice"],
    benefits: ["Built-in chat", "Video meetings", "Call recording"],
    icon: "💬",
  },
  field_service: {
    title: "Field Service Management",
    description: "Schedule technicians, dispatch jobs, and track work in the field.",
    keywords: ["field service", "dispatch", "technicians", "scheduling"],
    benefits: ["Smart scheduling", "Route optimization", "Mobile job cards"],
    icon: "🚚",
  },
  ecommerce: {
    title: "E-commerce",
    description: "Manage products, orders, storefronts, and discounts in one place.",
    keywords: ["ecommerce", "online store", "orders", "products"],
    benefits: ["Product catalog", "Order management", "Discount engine"],
    icon: "🛒",
  },
  devops: {
    title: "DevOps",
    description: "Ship faster with CI/CD, secrets management, and deployment monitoring.",
    keywords: ["devops", "ci/cd", "deployments", "secrets"],
    benefits: ["Pipeline visibility", "Secrets vault", "Deployment tracking"],
    icon: "⚙️",
  },
};

// Competitor data
export const competitors = {
  salesforce: {
    name: "Salesforce",
    logo: "/logos/salesforce.svg",
    startingPrice: 150,
    pros: ["Market leader", "Extensive ecosystem"],
    cons: ["Expensive", "Complex setup", "Steep learning curve"],
  },
  hubspot: {
    name: "HubSpot",
    logo: "/logos/hubspot.svg",
    startingPrice: 50,
    pros: ["Good free tier", "Inbound marketing focus"],
    cons: ["Limited customization", "Add-ons expensive"],
  },
  zoho: {
    name: "Zoho CRM",
    logo: "/logos/zoho.svg",
    startingPrice: 12,
    pros: ["Affordable", "All-in-one suite"],
    cons: ["Limited scalability", "Basic AI features"],
  },
  pipedrive: {
    name: "Pipedrive",
    logo: "/logos/pipedrive.svg",
    startingPrice: 15,
    pros: ["Sales-focused", "Simple UI"],
    cons: ["Limited beyond sales", "No built-in invoicing"],
  },
  dynamics: {
    name: "Microsoft Dynamics",
    logo: "/logos/microsoft.svg",
    startingPrice: 40,
    pros: ["Office 365 integration", "Enterprise features"],
    cons: ["Complex", "Requires Microsoft stack"],
  },
};

// Industry data
export const industries = {
  healthcare: {
    name: "Healthcare",
    icon: "🏥",
    description: "HIPAA-compliant tools for healthcare organizations",
    modules: ["crm", "projects", "helpdesk", "monitoring"] as ModuleKey[],
    features: ["Patient tracking", "Appointment scheduling", "Compliance reporting"],
  },
  finance: {
    name: "Finance & Banking",
    icon: "🏦",
    description: "Secure financial tools with audit trails",
    modules: ["crm", "invoicing", "projects", "monitoring"] as ModuleKey[],
    features: ["Audit logging", "Role-based access", "Document management"],
  },
  technology: {
    name: "Technology",
    icon: "💻",
    description: "Modern tools for software and tech companies",
    modules: ["crm", "projects", "agents", "integrations"] as ModuleKey[],
    features: ["DevOps integration", "AI coding agents", "API management"],
  },
  retail: {
    name: "Retail & E-commerce",
    icon: "🛒",
    description: "Omnichannel tools for retail businesses",
    modules: ["crm", "marketing", "invoicing", "integrations"] as ModuleKey[],
    features: ["Multi-channel sync", "Inventory tracking", "Customer analytics"],
  },
  manufacturing: {
    name: "Manufacturing",
    icon: "🏭",
    description: "Operations tools for manufacturing",
    modules: ["projects", "hrm", "invoicing", "monitoring"] as ModuleKey[],
    features: ["Resource planning", "Quality tracking", "Supply chain"],
  },
  education: {
    name: "Education",
    icon: "🎓",
    description: "Tools for schools and EdTech",
    modules: ["crm", "projects", "helpdesk", "marketing"] as ModuleKey[],
    features: ["Enrollment tracking", "Course management", "Parent portal"],
  },
};

// Pricing tiers — imported from shared modules.ts
export { PLAN_TIERS as pricingTiers } from "./modules";

// Generate structured data for SaaS
export function generateSoftwareSchema(options: {
  name?: string;
  description?: string;
  price?: string;
  category?: string;
  features?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: options.name ?? "Nucleo One",
    description: options.description ?? "All-in-One Business Management Platform",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: options.price
      ? {
          "@type": "Offer",
          price: options.price,
          priceCurrency: "USD",
        }
      : undefined,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "1250",
    },
  };
}

// Generate FAQ structured data
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
