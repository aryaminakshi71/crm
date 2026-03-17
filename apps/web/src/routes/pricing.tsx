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
import { useState } from "react";

export const Route = createFileRoute("/pricing")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = `${baseUrl.replace(/\/$/, "")}/pricing`;
    return {
      meta: [
        { title: "Pricing | Nucleo One — AI-Powered Business OS" },
        {
          name: "description",
          content:
            "Simple, transparent pricing for Nucleo One. Replace your CRM, HRM, Projects, Marketing, Helpdesk, Finance, and BI tools with one AI-powered platform. From $15/user/month.",
        },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: PricingPage,
});

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    blurb: "Perfect for small teams consolidating tools.",
    monthlyPrice: 15,
    annualPrice: 12,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
    cta: "Start free trial",
    popular: false,
    features: [
      "Up to 10 users",
      "CRM — contacts, leads, deals pipeline",
      "Helpdesk — tickets & SLA tracking",
      "Projects — tasks & kanban",
      "Finance — invoices & expense tracking",
      "5 GB storage",
      "Email support (48hr response)",
      "21-day free trial",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    icon: Star,
    blurb: "For scaling teams that need full ops coverage.",
    monthlyPrice: 29,
    annualPrice: 23,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/40",
    cta: "Start free trial",
    popular: true,
    features: [
      "Up to 100 users",
      "Everything in Starter",
      "HRM — employees, leave, recruitment",
      "Marketing — campaigns, audiences, analytics",
      "Procurement & purchase orders",
      "AI lead scoring & campaign planning",
      "25 GB storage",
      "Priority email + chat support",
      "21-day free trial",
    ],
  },
  {
    id: "business",
    name: "Business",
    icon: Globe,
    blurb: "For established companies with advanced needs.",
    monthlyPrice: 49,
    annualPrice: 39,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    cta: "Start free trial",
    popular: false,
    features: [
      "Up to 500 users",
      "Everything in Growth",
      "Intelligence BI — AI agents & forecasting",
      "Compliance & audit trails",
      "Contracts & document lifecycle",
      "Enterprise SSO (SAML/OIDC)",
      "Unlimited storage",
      "Dedicated account manager",
      "SLA: 4hr response",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Shield,
    blurb: "Custom contracts for regulated organizations.",
    monthlyPrice: null,
    annualPrice: null,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    cta: "Book a demo",
    popular: false,
    features: [
      "Unlimited users",
      "Everything in Business",
      "Custom AI agent configuration",
      "SOC 2 Type II compliance",
      "Data residency (US / EU / India / UAE)",
      "Custom integrations & API access",
      "RBAC + approval workflows",
      "99.99% SLA uptime guarantee",
      "Dedicated infrastructure",
    ],
  },
];

// ─── Feature comparison table ─────────────────────────────────────────────────

const COMPARISON = [
  {
    category: "Core Platform",
    rows: [
      {
        feature: "CRM (Contacts, Leads, Deals)",
        starter: true,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "Helpdesk & Ticketing",
        starter: true,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "Projects & Kanban",
        starter: true,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "Finance & Invoicing",
        starter: true,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "HRM & Leave Management",
        starter: false,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "Recruitment Module",
        starter: false,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "Marketing & Campaigns",
        starter: false,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "Procurement & POs",
        starter: false,
        growth: true,
        business: true,
        enterprise: true,
      },
    ],
  },
  {
    category: "AI & Intelligence",
    rows: [
      {
        feature: "AI Lead Scoring",
        starter: false,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "Campaign Planning AI",
        starter: false,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "Revenue Forecasting",
        starter: false,
        growth: false,
        business: true,
        enterprise: true,
      },
      {
        feature: "Executive BI Dashboard",
        starter: false,
        growth: false,
        business: true,
        enterprise: true,
      },
      {
        feature: "Custom AI Agents",
        starter: false,
        growth: false,
        business: false,
        enterprise: true,
      },
    ],
  },
  {
    category: "Security & Compliance",
    rows: [
      {
        feature: "SSL & encryption at rest",
        starter: true,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "GDPR-compliant data handling",
        starter: true,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "Audit logs",
        starter: false,
        growth: false,
        business: true,
        enterprise: true,
      },
      {
        feature: "SSO (SAML/OIDC)",
        starter: false,
        growth: false,
        business: true,
        enterprise: true,
      },
      {
        feature: "SOC 2 Type II",
        starter: false,
        growth: false,
        business: false,
        enterprise: true,
      },
      {
        feature: "Custom data residency",
        starter: false,
        growth: false,
        business: false,
        enterprise: true,
      },
    ],
  },
  {
    category: "Support",
    rows: [
      {
        feature: "Email support",
        starter: true,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "Priority chat support",
        starter: false,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        feature: "Dedicated account manager",
        starter: false,
        growth: false,
        business: true,
        enterprise: true,
      },
      {
        feature: "Custom SLA",
        starter: false,
        growth: false,
        business: false,
        enterprise: true,
      },
      {
        feature: "Onboarding assistance",
        starter: false,
        growth: false,
        business: true,
        enterprise: true,
      },
    ],
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Do I need a credit card to start a free trial?",
    a: "No. You get 21 days completely free with no credit card required. You only enter payment details if you choose to continue after the trial.",
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
    a: "Yes — annual plans are billed at roughly 20% less than monthly. Toggle the billing period above to see the discounted prices.",
  },
  {
    q: "Can I use Nucleo One for multiple companies/workspaces?",
    a: "Each workspace (organization) has its own subscription. Contact us for volume discounts if you manage multiple entities.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards (Visa, Mastercard, Amex) via Stripe. US customers can also pay via ACH bank transfer. Enterprise customers can pay via wire transfer.",
  },
  {
    q: "Is my data safe if I cancel?",
    a: "You can export all your data at any time, including after cancellation. We retain your data for 30 days post-cancellation, then permanently delete it on request.",
  },
  {
    q: "Do you have plans for startups or non-profits?",
    a: "Yes — we offer 50% off for early-stage startups (pre-Series A) and non-profits. Email hello@nucleoone.com with proof of status.",
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
              Replace seven tools.
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
          {PLANS.map((plan) => {
            const price =
              plan.monthlyPrice === null
                ? null
                : annual
                  ? plan.annualPrice
                  : plan.monthlyPrice;
            const Icon = plan.icon;
            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all hover:shadow-lg hover:shadow-primary/5 ${
                  plan.popular
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : `${plan.border} bg-card`
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-primary-foreground text-xs font-semibold">
                      <Star className="h-3 w-3" /> Most Popular
                    </span>
                  </div>
                )}

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${plan.bg} mb-4`}
                >
                  <Icon className={`h-5 w-5 ${plan.color}`} />
                </div>

                <h2 className={`font-bold text-xl ${plan.color}`}>
                  {plan.name}
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  {plan.blurb}
                </p>

                <div className="mt-6">
                  {price === null ? (
                    <p className="font-bold text-3xl text-foreground">Custom</p>
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
                  {annual && price !== null && (
                    <p className="text-muted-foreground text-xs mt-1">
                      Billed annually · ${plan.annualPrice! * 12}/user/year
                    </p>
                  )}
                </div>

                <ul className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {plan.id === "enterprise" ? (
                    <Link to="/contact">
                      <Button variant="outline" className="w-full">
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/register">
                      <Button
                        variant={plan.popular ? "primary" : "outline"}
                        className="w-full"
                      >
                        {plan.cta}
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
                label: "Free for first 21 days",
                sub: "No credit card needed",
              },
              {
                icon: Shield,
                label: "SOC 2 in progress",
                sub: "Enterprise-ready security",
              },
              {
                icon: Globe,
                label: "US company, global reach",
                sub: "Data in your region",
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
                    Feature
                  </th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="p-4 text-center font-semibold">
                      <span className={p.color}>{p.name}</span>
                      <div className="text-muted-foreground text-xs font-normal mt-0.5">
                        {p.monthlyPrice === null
                          ? "Custom"
                          : annual
                            ? `$${p.annualPrice}/user`
                            : `$${p.monthlyPrice}/user`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((cat) => (
                  <>
                    <tr key={cat.category} className="bg-muted/10">
                      <td
                        colSpan={5}
                        className="px-4 py-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {cat.category}
                      </td>
                    </tr>
                    {cat.rows.map((row) => (
                      <tr
                        key={row.feature}
                        className="border-t border-border/50 hover:bg-muted/10 transition-colors"
                      >
                        <td className="p-4 text-foreground">{row.feature}</td>
                        <td className="p-4">
                          <CheckCell value={row.starter} />
                        </td>
                        <td className="p-4">
                          <CheckCell value={row.growth} />
                        </td>
                        <td className="p-4">
                          <CheckCell value={row.business} />
                        </td>
                        <td className="p-4">
                          <CheckCell value={row.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </>
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
            Start with a 21-day free trial. No credit card. Cancel anytime. Full
            access to all Growth features from day one.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Start free trial
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
            21-day free trial · No credit card · Full Growth access · Cancel
            anytime
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
