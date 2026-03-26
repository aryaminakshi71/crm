/**
 * Comparison Page — Nucleo One vs Competitors
 */

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Brain,
  Check,
  Clock,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/vs/$competitor")({
  component: ComparisonPage,
  head: ({ params }) => {
    const slug = params.competitor.toLowerCase();
    const name =
      slug === "hubspot" ? "HubSpot" :
      slug === "zoho" ? "Zoho" :
      slug === "monday" ? "Monday.com" :
      slug === "salesforce" ? "Salesforce" :
      slug === "pipedrive" ? "Pipedrive" :
      slug === "freshdesk" ? "Freshdesk" :
      slug === "zendesk" ? "Zendesk" :
      slug === "clickup" ? "ClickUp" :
      slug === "notion" ? "Notion" :
      slug === "asana" ? "Asana" :
      slug === "odoo" ? "Odoo" :
      slug === "servicenow" ? "ServiceNow" :
      slug.charAt(0).toUpperCase() + slug.slice(1);

    const baseUrl = import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = `${baseUrl}/vs/${slug}`;
    const title = `Nucleo One vs ${name} (${new Date().getFullYear()}) — Feature & Pricing Comparison`;
    const description = `Nucleo One vs ${name}: side-by-side feature comparison, pricing, and why growing teams switch to Nucleo One's unified CRM, HRM, Projects, Finance, Helpdesk, and AI platform.`;

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": canonical,
          url: canonical,
          name: title,
          description,
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
              { "@type": "ListItem", position: 2, name: `Nucleo One vs ${name}`, item: canonical },
            ],
          },
        },
        {
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: `How does Nucleo One compare to ${name}?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `Nucleo One offers a fully unified platform covering CRM, HRM, Projects, Finance, Helpdesk, AI Agents, and Integration Hub in one product. Unlike ${name}, there is no need to purchase multiple add-ons or integrate separate tools.`,
              },
            },
            {
              "@type": "Question",
              name: `Is Nucleo One cheaper than ${name}?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `Nucleo One starts free and scales to plans from $12/user/month for Starter, which includes CRM, HRM, Projects, Finance, and more. This represents significant savings vs ${name} when accounting for all modules needed to match equivalent functionality.`,
              },
            },
            {
              "@type": "Question",
              name: `Can I migrate from ${name} to Nucleo One?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `Yes. Nucleo One offers free migration assistance for all paid plans, including data import from ${name} via CSV or direct Integration Hub connectors.`,
              },
            },
          ],
        },
      ],
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        { name: "keywords", content: `nucleo one vs ${name.toLowerCase()}, ${name.toLowerCase()} alternative, ${name.toLowerCase()} competitor, best ${name.toLowerCase()} alternative 2026` },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: `${baseUrl}/og.svg` },
        { property: "og:site_name", content: "Nucleo One" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@nucleoone" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: `${baseUrl}/og.svg` },
        { "script:ld+json": JSON.stringify(structuredData) },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const COMPETITORS: Record<string, any> = {
  hubspot: {
    name: "HubSpot",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    description:
      "Great for marketing, but expensive to scale and requires multiple 'Hubs' for a clean experience.",
    weakness:
      "Pricing escalates drastically with scale; fragmented data across hubs; basic project management.",
  },
  zoho: {
    name: "Zoho",
    color: "text-red-500",
    bg: "bg-red-500/10",
    description:
      "A wide suite, but often feels like a collection of disjointed legacy apps with clunky UX.",
    weakness:
      "Disjointed UI/UX; complex setup; limited advanced AI orchestration compared to Nucleo.",
  },
  monday: {
    name: "Monday.com",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    description:
      "Strong at project visuals, but weak as a true Enterprise Operating System with deep CRM/ERP needs.",
    weakness:
      "Weak deep CRM features; no native HRM/Compliance suite; limited financial ledger capabilities.",
  },
  salesforce: {
    name: "Salesforce",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    description:
      "The legacy giant. Powerful but incredibly complex, slow, and requires expensive consultants.",
    weakness:
      "Prohibitive costs; slow implementation (months/years); steep learning curve; bloated mobile experience.",
  },
  pipedrive: {
    name: "Pipedrive",
    color: "text-green-500",
    bg: "bg-green-500/10",
    description:
      "A solid sales-focused CRM with a clean pipeline UI, but stops short at CRM — no HRM, Finance, or Helpdesk.",
    weakness:
      "CRM-only; no native HRM, invoicing, or helpdesk; limited AI beyond basic activity suggestions.",
  },
  freshdesk: {
    name: "Freshdesk",
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    description:
      "Good entry-level helpdesk for small support teams, but fragmented across Freshworks' many products.",
    weakness:
      "Data is split across Freshdesk, Freshsales, and Freshservice; expensive to get a unified view; limited native automation.",
  },
  zendesk: {
    name: "Zendesk",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    description:
      "Industry-leading helpdesk with mature ticketing, but very expensive and siloed from CRM and finance.",
    weakness:
      "Pricing jumps sharply with scale; no native CRM, HRM, or finance; heavy reliance on Marketplace apps adds cost.",
  },
  clickup: {
    name: "ClickUp",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    description:
      "A flexible project and task management tool with many views, but not a true business OS — no CRM, HRM, or ERP.",
    weakness:
      "Feature sprawl without depth; no native HRM, finance, or helpdesk; reliability concerns at enterprise scale.",
  },
  notion: {
    name: "Notion",
    color: "text-gray-400",
    bg: "bg-gray-400/10",
    description:
      "A great docs and knowledge tool, but not an operational platform — lacks CRM, HRM, ticketing, or finance.",
    weakness:
      "No native workflow automation, CRM pipelines, or financial management; challenging for structured operational data.",
  },
  asana: {
    name: "Asana",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    description:
      "Excellent task and project management, but limited to work management — no CRM, HRM, or business intelligence.",
    weakness:
      "Work management only; no CRM, HRM, finance, or helpdesk; expensive for what it offers vs. a full platform.",
  },
  odoo: {
    name: "Odoo",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    description:
      "Open-source ERP with broad module coverage, but complex to implement, maintain, and customize.",
    weakness:
      "Steep implementation complexity; outdated UX on many modules; requires technical expertise; slow cloud version.",
  },
  servicenow: {
    name: "ServiceNow",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    description:
      "Enterprise ITSM and workflow powerhouse, but built for large IT departments — not accessible to growing businesses.",
    weakness:
      "Extremely high cost ($100k+ annually); requires dedicated ServiceNow admins; months-long implementation cycles.",
  },
};

const COMPARISON_FEATURES = [
  {
    label: "Unified Data Architecture",
    nucleo: true,
    competitor: false,
    detail: "Nucleo uses one schema for all modules; others sync via APIs.",
  },
  {
    label: "AI (Agents + Business Intelligence)",
    nucleo: true,
    competitor: false,
    detail: "Native AI that handles both autonomous tasks and business analytics.",
  },
  {
    label: "Integrated HRM & Payroll",
    nucleo: true,
    competitor: "Var",
    detail: "Manage your people and your customers in one login.",
  },
  {
    label: "US-Compliant Invoicing",
    nucleo: true,
    competitor: false,
    detail: "Native USD invoicing with US tax compliance built-in.",
  },
  {
    label: "Zero-Setup BI",
    nucleo: true,
    competitor: "Var",
    detail: "Real-time reports across every module without SQL/Custom code.",
  },
  {
    label: "Rapid Implementation",
    nucleo: true,
    competitor: false,
    detail: "Live in 24 hours vs months of expensive legacy setup.",
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20 text-success">
      <Check className="h-3 w-3" />
    </div>
  );
}

function CrossIcon() {
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-destructive/50">
      <X className="h-3 w-3" />
    </div>
  );
}

function VarIcon() {
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
      <Shield className="h-3 w-3" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ComparisonPage() {
  const { competitor: compId } = Route.useParams();
  const comp = COMPETITORS[compId.toLowerCase()] || {
    name: compId,
    description: "Compare Nucleo One vs the legacy competition.",
  };

  return (
    <div className="min-h-screen bg-card">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-card to-muted/20 pb-16 pt-24 text-center">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <span className="text-muted-foreground text-3xl font-light italic">
              vs
            </span>
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl ${comp.bg}`}
            >
              <Users className={`h-8 w-8 ${comp.color}`} />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl mb-6">
            Move beyond <span className={comp.color}>{comp.name}</span>.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10">
            {comp.description} Nucleo One is the 2025 standard for teams that
            want a single unified operating system, not a dozen expensive
            subscriptions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
            >
              Switch to Nucleo — 21 Days Free
            </Link>
            <Link
              to="/demo"
              className="rounded-full border border-border bg-card px-8 py-3.5 text-sm font-bold text-foreground hover:bg-muted/50 transition-all"
            >
              Watch 2m Demo
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-20">
        {/* Table */}
        <div className="mb-20">
          <h2 className="text-center font-bold text-3xl text-foreground mb-12">
            How we stack up
          </h2>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/5">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-5 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Capabilities
                  </th>
                  <th className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-black text-foreground">
                        NUCLEO ONE
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-5 text-sm font-bold text-muted-foreground">
                    {comp.name.toUpperCase()}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {COMPARISON_FEATURES.map((feat) => (
                  <tr
                    key={feat.label}
                    className="group hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <p className="font-bold text-foreground text-sm">
                        {feat.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                        {feat.detail}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <CheckIcon />
                        <span className="text-xs font-semibold text-success">
                          Included
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {feat.competitor === true ? (
                        <div className="flex items-center gap-2">
                          <CheckIcon />
                          <span className="text-xs">Yes</span>
                        </div>
                      ) : feat.competitor === false ? (
                        <div className="flex items-center gap-2">
                          <CrossIcon />
                          <span className="text-xs text-muted-foreground">
                            No
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <VarIcon />
                          <span className="text-xs text-amber-500">
                            Limited
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deep Dive Section */}
        <div className="grid gap-12 lg:grid-cols-2 mb-20">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-foreground">
              The cost of fragmentation
            </h3>
            <p className="text-muted-foreground italic">
              "Most companies spend 40% of their software budget just trying to
              make their tools talk to each other. We built Nucleo so they don't
              have to."
            </p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">
                    3.4x Higher Operational Cost
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Legacy tools like {comp.name} often require middleware,
                    premium 'Hubs', and constant custom dev work.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">
                    AI is an afterthought
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Competitive AI features are usually bolted-on chatbots.
                    Nucleo 1's agents live in the core system logic.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-muted/10 p-8 space-y-6">
            <h3 className="text-xl font-bold text-foreground">
              Why switch from {comp.name}?
            </h3>
            <ul className="space-y-3">
              {[
                "Save up to 60% on total software license spend.",
                "Single source of truth for CRM, HRM, and projects.",
                "Real-time visibility across all business verticals.",
                "Instant US-tax and regulatory compliance.",
                "Modern UX that actually increases employee adoption.",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm text-muted-foreground"
                >
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-4 font-mono uppercase tracking-tighter">
                Whitepaper Highlight
              </p>
              <p className="text-sm italic text-foreground/80">
                "{comp.weakness}"
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <section className="rounded-[2.5rem] bg-foreground px-8 py-14 text-center text-primary-foreground relative overflow-hidden">
          <div className="relative z-10 mx-auto max-w-2xl space-y-6">
            <h2 className="text-3xl font-black sm:text-4xl text-white">
              Stop juggling. Start winning.
            </h2>
            <p className="text-white/70">
              Join growing companies switching from {comp.name} to Nucleo One.
              Your data migration is free and handled by our engineers.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to="/register"
                className="rounded-full bg-primary px-10 py-4 text-sm font-black text-primary-foreground hover:scale-105 transition-transform"
              >
                Start Switch
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 pt-4 text-white/40 grayscale opacity-50">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />{" "}
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  24h Implementation
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" />{" "}
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  SOC-2 Compliant
                </span>
              </div>
            </div>
          </div>
          {/* Background flare */}
          <div className="absolute -bottom-24 -right-24 h-64 w-64 bg-primary/20 blur-[100px] rounded-full" />
          <div className="absolute -top-24 -left-24 h-64 w-64 bg-blue-500/10 blur-[100px] rounded-full" />
        </section>
      </main>
      <Footer />
    </div>
  );
}
