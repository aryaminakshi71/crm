export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readMinutes: number;
  author: string;
  body: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "enterprise-crm-checklist-2026",
    title: "Enterprise CRM Checklist for 2026",
    excerpt:
      "A practical checklist to evaluate CRM, helpdesk, finance, HRM, and compliance maturity before your next tooling decision.",
    category: "Enterprise",
    publishedAt: "2026-03-02",
    readMinutes: 7,
    author: "Nucleo One Team",
    body: [
      "Most CRM evaluations fail because teams optimize for pipelines but ignore operations, finance, HRM, and compliance. By quarter two, data and workflows fragment across tools.",
      "A modern enterprise stack needs one operating model: customer records, helpdesk queues, projects, contracts, billing, payroll, and audit events linked by organization context.",
      "Before choosing any platform, score your current setup in six dimensions: process depth, workflow automation, data quality, controls, AI leverage, and reporting confidence.",
      "If any dimension is below three out of five, prioritize architecture unification before adding net-new apps.",
    ],
  },
  {
    slug: "how-to-run-recruitment-training-payroll-in-one-suite",
    title: "How to Run Recruitment, Training, and Payroll in One Suite",
    excerpt:
      "Move HRM from basic employee records to a full people system with candidate pipelines, learning plans, and payroll cycles.",
    category: "HRM",
    publishedAt: "2026-02-26",
    readMinutes: 6,
    author: "Nucleo One Team",
    body: [
      "Recruitment should connect directly to departmental hiring plans and approved budgets. Each requisition should define ownership, openings, and status transitions.",
      "Training should be measurable. Every program needs duration, owner, and completion tracking tied to employees.",
      "Payroll should not be isolated from HR records. Payroll runs, entries, and statuses should align with employee lifecycle and approvals.",
      "When these workflows run together, HR, finance, and leadership get one source of truth for people operations.",
    ],
  },
  {
    slug: "seo-playbook-for-b2b-saas-landing-pages",
    title: "SEO Playbook for B2B SaaS Landing Pages",
    excerpt:
      "A no-fluff approach to turn product pages into high-intent acquisition channels with clean structure and conversion-ready CTAs.",
    category: "Marketing",
    publishedAt: "2026-02-19",
    readMinutes: 8,
    author: "Nucleo One Team",
    body: [
      "B2B SEO works when every page serves one buying question. Pricing pages answer cost confidence. Comparison pages answer fit confidence. Case studies answer execution confidence.",
      "Use clean URL architecture, strong page-level metadata, and clear internal linking between feature, industry, pricing, and documentation pages.",
      "Every SEO landing page should include one primary conversion action and one lower-friction action.",
      "Measure performance by qualified demo rate and pipeline contribution, not only visits.",
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
