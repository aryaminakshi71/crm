/**
 * Pricing Page — Nucleo One
 * Full pricing with monthly/annual toggle, feature comparison, FAQ
 */

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@crm/ui";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Globe,
  HelpCircle,
  Minus,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useState, Fragment } from "react";
import {
  NUCLEO_MODULES,
  PLAN_TIERS,
  MODULE_PLANS,
  PHASE_LABELS,
  MODULES_BY_PHASE,
  getModuleIcon,
  type NucleoModuleKey,
  type PlanTierKey,
} from "@/lib/modules";

export const Route = createFileRoute("/pricing")({
  head: () => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://nucleo.one";
    const canonical = `${baseUrl}/pricing`;

    const faqData = FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }));

    return {
      meta: [
        { title: "Pricing | Nucleo One — AI-Powered Business OS" },
        {
          name: "description",
          content:
            "Simple, transparent pricing for Nucleo One. Replace your CRM, HRM, Projects, Marketing, Helpdesk, Finance, and BI tools with one AI-powered platform. From $5/user/month with a free forever plan.",
        },
        { name: "robots", content: "index, follow" },
        // Open Graph
        { property: "og:title", content: "Pricing | Nucleo One — AI-Powered Business OS" },
        { property: "og:description", content: "Simple, transparent pricing. Replace your CRM, HRM, Projects, Marketing, Helpdesk, Finance, and BI tools with one AI-powered platform. From $5/user/month with a free forever plan." },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Pricing | Nucleo One" },
        { name: "twitter:description", content: "Simple, transparent pricing. From $5/user/month with a free forever plan." },
        // FAQPage Schema
        { "script:ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqData
        })},
        // BreadcrumbList schema
        { "script:ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": baseUrl
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Pricing",
              "item": canonical
            }
          ]
        })}
      ],
      links: [
        { rel: "canonical", href: canonical },
        { rel: "alternate", hreflang: "en", href: canonical }
      ]
    };
  },
  component: PricingPage,
});

// ─── Plan data ────────────────────────────────────────────────────────────────
// Uses shared PLAN_TIERS from @/lib/modules

const PLAN_ICONS: Record<PlanTierKey, any> = {
  free: Zap,
  starter: Globe,
  business: Shield,
  enterprise: Sparkles,
};

const PLAN_COLORS: Record<PlanTierKey, { color: string; bg: string; border: string }> = {
  free:   { color: "text-sky-400",    bg: "bg-sky-400/10",      border: "border-sky-400/20" },
  starter:{ color: "text-primary",    bg: "bg-primary/10",       border: "border-primary/40" },
  business:{ color: "text-violet-400",bg: "bg-violet-400/10",    border: "border-violet-400/20" },
  enterprise:{ color: "text-amber-400",bg: "bg-amber-400/10",   border: "border-amber-400/20" },
};

// ─── Feature comparison table ─────────────────────────────────────────────────
// Built from shared PLAN_TIERS and MODULE_PLANS

// Non-module rows (storage, users, support, security)
const metaRows: Array<{
  feature: string;
  free: boolean | string;
  starter: boolean | string;
  business: boolean | string;
  enterprise: boolean | string;
}> = [
  {
    feature: "Team members",
    free: "1",
    starter: "25",
    business: "200",
    enterprise: "Unlimited",
  },
  {
    feature: "Storage",
    free: "100 MB",
    starter: "50 GB",
    business: "500 GB",
    enterprise: "Unlimited",
  },
  {
    feature: "Audit logs",
    free: false,
    starter: false,
    business: true,
    enterprise: true,
  },
  {
    feature: "SSO (SAML/OIDC)",
    free: false,
    starter: false,
    business: true,
    enterprise: true,
  },
  {
    feature: "Custom data residency",
    free: false,
    starter: false,
    business: false,
    enterprise: true,
  },
  {
    feature: "Custom SLA",
    free: false,
    starter: false,
    business: false,
    enterprise: true,
  },
  {
    feature: "Dedicated account manager",
    free: false,
    starter: false,
    business: true,
    enterprise: true,
  },
  {
    feature: "Priority email + chat support",
    free: false,
    starter: true,
    business: true,
    enterprise: true,
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Is there really a free plan?",
    a: "Yes! Our Free plan is free forever with 1 user, 100MB storage, and core CRM + Projects features. No credit card required.",
  },
  {
    q: "Can I change plans at any time?",
    a: "Yes. You can upgrade instantly and start using new features immediately. Downgrades take effect at the end of your billing cycle.",
  },
  {
    q: "How does per-user pricing work?",
    a: "You pay for the number of active users in your workspace. You can add or remove users at any time and your billing adjusts pro-rata.",
  },
  {
    q: "Do you offer discounts for annual billing?",
    a: "Yes — annual plans are billed at roughly 17-20% less than monthly. Toggle the billing period above to see the discounted prices.",
  },
  {
    q: "Can I use Nucleo One for multiple companies/workspaces?",
    a: "Each workspace (organization) has its own subscription. Contact us for volume discounts if you manage multiple entities.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards (Visa, Mastercard, Amex) via Stripe. Indian customers can pay via UPI, Net Banking, and cards through our Indian payment gateway. Enterprise customers can pay via wire transfer.",
  },
  {
    q: "Is my data safe if I cancel?",
    a: "You can export all your data at any time, including after cancellation. We retain your data for 30 days post-cancellation, then permanently delete it on request.",
  },
  {
    q: "Do you have plans for startups or non-profits?",
    a: "Yes — we offer special pricing for early-stage startups (pre-Series A) and non-profits. Email hello@nucleoone.com with proof of status.",
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function CheckCell({ value }: { value: boolean | string }) {
  if (value === false)
    return <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
  if (value === true) return <Check className="h-4 w-4 text-success mx-auto" />;
  return (
    <span className="text-xs text-muted-foreground mx-auto block text-center">
      {value}
    </span>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-foreground font-medium hover:text-primary transition-colors"
      >
        <span>{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">
          {a}
        </p>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-card">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-20">
        {/* Hero */}
        <section className="text-center space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-primary text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            Simple, transparent pricing
          </span>
          <h1 className="font-bold text-4xl sm:text-5xl text-foreground tracking-tight">
            One platform.
            <br />
            <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Replace all your tools.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            CRM + HRM + Projects + Marketing + Helpdesk + Finance + AI — all in
            one workspace. Start free, no credit card needed.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!annual ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${annual ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Annual
              <span className="rounded-full bg-success/20 text-success text-[10px] font-bold px-2 py-0.5">
                SAVE 20%
              </span>
            </button>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLAN_TIERS.map((plan) => {
            const price =
              plan.monthlyPrice === null
                ? null
                : annual
                  ? plan.annualPrice
                  : plan.monthlyPrice;
            const Icon = PLAN_ICONS[plan.key];
            const { color, bg, border } = PLAN_COLORS[plan.key];
            const isPopular = plan.key === "starter";
            const planModuleNames = plan.modules
              .slice(0, 6)
              .map((k) => NUCLEO_MODULES.find((m) => m.key === k)?.name ?? k);
            return (
              <article
                key={plan.key}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all hover:shadow-lg hover:shadow-primary/5 ${
                  isPopular
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : `${border} bg-card`
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-primary-foreground text-xs font-semibold">
                      <Star className="h-3 w-3" /> Most Popular
                    </span>
                  </div>
                )}

                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} mb-4`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>

                <h2 className={`font-bold text-xl ${color}`}>
                  {plan.name}
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  {plan.blurb}
                </p>

                <div className="mt-6">
                  {price === null ? (
                    <p className="font-bold text-3xl text-foreground">Custom</p>
                  ) : price === 0 ? (
                    <div className="flex items-end gap-1">
                      <p className="font-bold text-3xl text-foreground">Free</p>
                      <p className="text-muted-foreground text-sm mb-1">
                        forever
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <p className="font-bold text-3xl text-foreground">
                        ${price}
                      </p>
                      <p className="text-muted-foreground text-sm mb-1">
                        /user/mo
                      </p>
                    </div>
                  )}
                  {annual && price !== null && price > 0 && (
                    <p className="text-muted-foreground text-xs mt-1">
                      Billed annually · ${(plan.annualPrice ?? plan.monthlyPrice) * 12}/user/year
                    </p>
                  )}
                </div>

                <ul className="mt-6 space-y-2.5 flex-1">
                  {planModuleNames.map((name) => (
                    <li
                      key={name}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      {name}
                    </li>
                  ))}
                  {plan.modules.length > 6 && (
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                      +{plan.modules.length - 6} more modules
                    </li>
                  )}
                </ul>

                <div className="mt-8">
                  {plan.key === "enterprise" ? (
                    <Link to="/contact">
                      <Button variant="outline" className="w-full">
                        Book a demo
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/register">
                      <Button
                        variant={isPopular ? "primary" : "outline"}
                        className="w-full"
                      >
                        {plan.key === "free" ? "Get started free" : "Start free trial"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {/* Trust bar */}
        <section className="rounded-2xl border border-border bg-muted/20 px-8 py-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 text-center">
            {[
              {
                icon: Users,
                label: "Free forever plan",
                sub: "No credit card needed",
              },
              {
                icon: Shield,
                label: "Security-first design",
                sub: "Enterprise-ready security",
              },
              {
                icon: Globe,
                label: "Built for India & global",
                sub: "UPI, cards, wire accepted",
              },
              {
                icon: Bot,
                label: "AI-native platform",
                sub: "Not an AI bolt-on",
              },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <item.icon className="h-5 w-5 text-primary mx-auto" />
                <p className="font-semibold text-foreground text-sm">
                  {item.label}
                </p>
                <p className="text-muted-foreground text-xs">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature comparison table */}
        <section className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="font-bold text-3xl text-foreground">
              Compare plans
            </h2>
            <p className="text-muted-foreground">
              Full feature breakdown across all tiers
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 font-medium text-muted-foreground w-1/2">
                    Module
                  </th>
                  {PLAN_TIERS.map((p) => (
                    <th key={p.key} className="p-4 text-center font-semibold">
                      <span className={PLAN_COLORS[p.key].color}>{p.name}</span>
                      <div className="text-muted-foreground text-xs font-normal mt-0.5">
                        {p.monthlyPrice === null
                          ? "Custom"
                          : p.monthlyPrice === 0
                            ? "Free"
                            : annual
                              ? `$${p.annualPrice}/user`
                              : `$${p.monthlyPrice}/user`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Module rows */}
                {(["core", "ops", "growth", "ai"] as const).map((phase) => {
                  const phaseModules = MODULES_BY_PHASE[phase] ?? [];
                  if (phaseModules.length === 0) return null;
                  return (
                    <Fragment key={phase}>
                      <tr className="bg-muted/10">
                        <td
                          colSpan={5}
                          className="px-4 py-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground"
                        >
                          {PHASE_LABELS[phase]}
                        </td>
                      </tr>
                      {phaseModules.map((mod) => {
                        const plans = MODULE_PLANS[mod.key] ?? [];
                        return (
                          <tr
                            key={mod.key}
                            className="border-t border-border/50 hover:bg-muted/10 transition-colors"
                          >
                            <td className="p-4 text-foreground">{mod.name}</td>
                            {PLAN_TIERS.map((plan) => {
                              const included = plan.modules.includes(mod.key as NucleoModuleKey);
                              return (
                                <td key={plan.key} className="p-4 text-center">
                                  <CheckCell value={included} />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
                {/* Meta rows (users, storage, support, security) */}
                <tr className="bg-muted/10">
                  <td
                    colSpan={5}
                    className="px-4 py-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    Storage, Security &amp; Support
                  </td>
                </tr>
                {metaRows.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-t border-border/50 hover:bg-muted/10 transition-colors"
                  >
                    <td className="p-4 text-foreground">{row.feature}</td>
                    {(["free", "starter", "business", "enterprise"] as const).map((tier) => (
                      <td key={tier} className="p-4 text-center">
                        <CheckCell value={row[tier] as boolean | string} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-primary text-sm">
              <HelpCircle className="h-4 w-4" />
              Frequently asked questions
            </div>
            <h2 className="font-bold text-3xl text-foreground">
              Everything you need to know
            </h2>
          </div>
          <div className="rounded-2xl border border-border bg-card px-6">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-violet-400/10 p-10 text-center space-y-6">
          <h2 className="font-bold text-3xl text-foreground">
            Ready to consolidate your stack?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start free, no credit card needed. Upgrade to Starter from $12/user/month when you're ready.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg">
                Talk to sales
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground text-xs">
            Free forever plan available · No credit card · Cancel anytime
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
