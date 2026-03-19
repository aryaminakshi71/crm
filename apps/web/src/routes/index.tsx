import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  Building2,
  Check,
  ChevronRight,
  FolderKanban,
  LifeBuoy,
  Megaphone,
  Receipt,
  ShieldCheck,
  Star,
  UserRoundCog,
  Zap,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const modules = [
  {
    icon: Building2,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    title: "CRM",
    description:
      "Manage contacts, leads, and a visual deal pipeline from first touch to close.",
    href: "/app/crm",
    features: [
      "Contact database",
      "Lead scoring",
      "Deal pipeline",
      "AI insights",
    ],
  },
  {
    icon: LifeBuoy,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    title: "Helpdesk",
    description:
      "AI-triaged support tickets, queue operations, and a searchable knowledge base.",
    href: "/app/helpdesk",
    features: [
      "Smart triage",
      "Queue management",
      "SLA tracking",
      "Knowledge base",
    ],
  },
  {
    icon: Megaphone,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    title: "Marketing",
    description:
      "Plan and launch multi-channel campaigns with AI-generated strategy and budget control.",
    href: "/app/marketing",
    features: [
      "Campaign builder",
      "Audience targeting",
      "AI planning",
      "Budget analytics",
    ],
  },
  {
    icon: FolderKanban,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "Projects",
    description:
      "Full project lifecycle — boards, timelines, milestones, and resource tracking.",
    href: "/app/projects",
    features: [
      "Kanban boards",
      "Gantt timelines",
      "Milestones",
      "Resource allocation",
    ],
  },
  {
    icon: UserRoundCog,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "HRM",
    description:
      "Complete people suite — directory, attendance, leave, recruitment, training, and payroll.",
    href: "/app/hrm",
    features: [
      "Employee directory",
      "Leave management",
      "Recruitment ATS",
      "Payroll runs",
    ],
  },
  {
    icon: Receipt,
    color: "text-green-400",
    bg: "bg-green-400/10",
    title: "Finance",
    description:
      "Transaction ledger, invoicing, payroll runs, and real-time financial overview.",
    href: "/app/finance",
    features: [
      "Transaction ledger",
      "Invoice management",
      "Payroll integration",
      "P&L overview",
    ],
  },
  {
    icon: ShieldCheck,
    color: "text-red-400",
    bg: "bg-red-400/10",
    title: "Compliance",
    description:
      "Control frameworks, audit trails, policy management, and regulatory reporting.",
    href: "/app/compliance",
    features: [
      "Control library",
      "Policy manager",
      "Audit logs",
      "Risk scoring",
    ],
  },
  {
    icon: Brain,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    title: "AI & BI",
    description:
      "Autonomous AI agents, revenue forecasting, and executive business intelligence.",
    href: "/app/intelligence",
    features: [
      "Strategic agents",
      "Revenue forecast",
      "KPI watchlist",
      "Agent run logs",
    ],
  },
];

const stats = [
  { value: "500+", label: "Organizations" },
  { value: "14", label: "Business Modules" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "24/7", label: "AI Assistance" },
];

const pricingPlans = [
  {
    name: "Starter",
    price: 0,
    period: "Free forever",
    description: "Perfect for solo founders and small teams getting started.",
    features: [
      "Up to 3 users",
      "CRM + Helpdesk",
      "1,000 contacts",
      "Community support",
      "5 active projects",
    ],
    cta: "Get Started Free",
    popular: false,
    ctaVariant: "outline",
  },
  {
    name: "Growth",
    price: 29,
    period: "per seat / month",
    description:
      "Full suite for growing businesses that need everything in one place.",
    features: [
      "Unlimited users",
      "All 14 modules",
      "Unlimited contacts",
      "AI agents & forecasting",
      "Priority support",
      "Custom integrations",
    ],
    cta: "Start 14-Day Trial",
    popular: true,
    ctaVariant: "primary",
  },
  {
    name: "Enterprise",
    price: 99,
    period: "per seat / month",
    description: "Advanced security, compliance, and dedicated infrastructure.",
    features: [
      "Everything in Growth",
      "SSO & SCIM provisioning",
      "Custom compliance controls",
      "Audit log export",
      "Dedicated success manager",
      "99.99% SLA",
    ],
    cta: "Talk to Sales",
    popular: false,
    ctaVariant: "outline",
  },
];

const testimonials = [
  {
    quote:
      "Nucleo One replaced 7 separate tools for us. The HRM + Finance + CRM integration alone saved us 20 hours a week.",
    name: "Sarah Chen",
    role: "COO, FinScale",
    rating: 5,
  },
  {
    quote:
      "The AI triage on Helpdesk is phenomenal. Our first-response time dropped from 4 hours to under 20 minutes.",
    name: "Marcus Webb",
    role: "Head of Support, Lyra",
    rating: 5,
  },
  {
    quote:
      "Finally a platform that has enterprise compliance baked in without the enterprise price tag.",
    name: "Priya Nair",
    role: "CTO, TrustLayer",
    rating: 5,
  },
];

// Customer logos for social proof
const customerLogos = [
  { name: "TechFlow", abbr: "TF" },
  { name: "DataSync", abbr: "DS" },
  { name: "CloudNine", abbr: "C9" },
  { name: "FinScale", abbr: "FS" },
  { name: "TrustLayer", abbr: "TL" },
  { name: "Lyra", abbr: "LY" },
];

// Security & compliance badges
const securityBadges = [
  { name: "SOC 2 Type II", icon: "🛡️" },
  { name: "GDPR Compliant", icon: "🇪🇺" },
  { name: "ISO 27001", icon: "🔒" },
  { name: "HIPAA Ready", icon: "⚕️" },
];

// FAQ items
const faqItems = [
  {
    q: "How long does it take to set up?",
    a: "Most teams are up and running within 15 minutes. Our guided onboarding walks you through initial setup, and you can import existing data from CSV or via our integrations.",
  },
  {
    q: "Can I migrate from my current tools?",
    a: "Yes! We offer free migration assistance for all paid plans. Import contacts, deals, projects, and more from Salesforce, HubSpot, Zendesk, and 50+ other tools.",
  },
  {
    q: "Is there a free trial?",
    a: "Absolutely. Every paid plan starts with a 14-day free trial. No credit card required. Cancel anytime.",
  },
  {
    q: "What kind of support do you offer?",
    a: "Growth and Enterprise plans include priority support with 1-hour response time. We also offer live chat, extensive documentation, and video tutorials.",
  },
  {
    q: "Can I use Nucleo One on mobile?",
    a: "Yes! We have native iOS and Android apps, plus a responsive web app that works on any device.",
  },
  {
    q: "How does pricing work for large teams?",
    a: "Per-seat pricing scales predictably. Contact us for volume discounts on teams over 50 users, or for custom enterprise agreements.",
  },
];

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = baseUrl.replace(/\/$/, "") + "/";
    const title = "Nucleo One — All-in-One Business Management Platform";
    const description =
      "Nucleo One brings CRM, HRM, Finance, Projects, Helpdesk, Marketing, Compliance, and AI into a single unified platform. Replace 7 tools with one. Start free.";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        {
          name: "keywords",
          content:
            "CRM, business management, HRM, helpdesk, project management, ERP, AI tools, all-in-one business platform",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        // LocalBusiness / SoftwareApplication schema
        { "script:ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Nucleo One",
          "alternateName": "NucleoOne",
          "description": description,
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "AggregateOffer",
            "lowPrice": "0",
            "highPrice": "99",
            "priceCurrency": "USD",
            "offerCount": "3"
          },
          "provider": {
            "@type": "Organization",
            "name": "Nucleo One",
            "url": baseUrl,
            "logo": `${baseUrl}/logo.png`,
            "sameAs": [
              "https://twitter.com/nucleoone",
              "https://linkedin.com/company/nucleoone",
              "https://github.com/nucleoone"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "support@nucleoone.com",
              "contactType": "Customer Support",
              "availableLanguage": ["English"]
            }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "2847"
          },
          "areaServed": {
            "@type": "Place",
            "name": "Worldwide"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Business Management Software",
            "itemListElement": [
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "CRM" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "HRM" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Finance" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Projects" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Helpdesk" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Marketing" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Compliance" } }
            ]
          }
        })},
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: LandingPage,
});

// ─── Components ────────────────────────────────────────────────────────────────

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="h-[500px] w-[900px] rounded-full bg-primary/5 blur-[120px] translate-y-[-30%]" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-primary text-sm font-medium">
            <Zap className="h-3.5 w-3.5" />
            14 powerful modules. One unified platform.
          </div>

          <h1 className="mb-6 font-bold text-5xl leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Run Your Entire{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
              Business
            </span>{" "}
            <br className="hidden sm:block" />
            In One Place
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Nucleo One unifies CRM, HRM, Finance, Projects, Helpdesk, Marketing,
            Compliance, and AI into a single platform. Stop switching between
            tools — start moving faster.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 hover:scale-105"
            >
              Start Free — No Credit Card
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 font-semibold text-foreground hover:bg-muted transition-all duration-200"
            >
              Watch Demo
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              to="/roi-calculator"
              className="inline-flex items-center gap-2 rounded-xl text-primary font-semibold hover:underline transition-all duration-200"
            >
              Calculate ROI
            </Link>
          </div>

          {/* Social proof micro-line */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["SC", "MW", "PN", "AK", "JL"].map((initials) => (
                  <div
                    key={initials}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 border-2 border-background font-bold text-xs text-primary"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">500+ teams</span> joined this month
              </span>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-4 w-4 fill-amber-400" />
              <span className="font-semibold text-foreground">4.8/5</span>
              <span className="text-muted-foreground">from 2,847 reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-border/60 bg-card/50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-bold text-3xl text-primary">{s.value}</p>
              <p className="mt-1 text-muted-foreground text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Customer Logos ── */}
      <section className="border-b border-border/60 bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="mb-8 text-center text-muted-foreground text-sm font-medium uppercase tracking-wider">
            Trusted by forward-thinking companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {customerLogos.map((logo) => (
              <div
                key={logo.name}
                className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-bold text-sm">
                  {logo.abbr}
                </div>
                <span className="font-semibold text-sm">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security Badges ── */}
      <section className="border-b border-border/60 bg-card/30 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="mb-6 text-center text-muted-foreground text-sm font-medium">
            Enterprise-grade security built in
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {securityBadges.map((badge) => (
              <div
                key={badge.name}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground"
              >
                <span className="text-base">{badge.icon}</span>
                {badge.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules Grid ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-4xl text-foreground sm:text-5xl">
              Every Tool Your Business Needs
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground text-lg">
              Each module is deeply integrated — data flows automatically
              between CRM, Finance, HRM, and more.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.title}
                  to={mod.href}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all duration-200 hover:border-border hover:shadow-xl hover:-translate-y-0.5"
                >
                  {/* Gradient hover overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 0%, rgba(var(--color-primary-rgb, 6,182,212),0.05), transparent 70%)",
                    }}
                  />

                  <div
                    className={cn(
                      "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl",
                      mod.bg,
                    )}
                  >
                    <Icon className={cn("h-5 w-5", mod.color)} />
                  </div>

                  <h3 className="mb-2 font-semibold text-foreground text-lg">
                    {mod.title}
                  </h3>
                  <p className="mb-4 text-muted-foreground text-sm leading-relaxed">
                    {mod.description}
                  </p>

                  <ul className="space-y-1">
                    {mod.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-muted-foreground text-xs"
                      >
                        <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-center gap-1 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore {mod.title} <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="border-y border-border/60 bg-card/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-bold text-3xl text-foreground sm:text-4xl">
            Loved by Teams That Move Fast
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border/60 bg-card p-6 space-y-4"
              >
                <StarRating count={t.rating} />
                <p className="text-muted-foreground leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {t.name}
                  </p>
                  <p className="text-muted-foreground text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-4xl text-foreground sm:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground text-lg">
              Start free. Scale when you're ready. No surprises.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border-2 bg-card p-8 flex flex-col",
                  plan.popular
                    ? "border-primary shadow-2xl shadow-primary/10 scale-[1.02]"
                    : "border-border/60",
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-primary-foreground text-xs font-bold uppercase tracking-wide shadow">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold text-foreground text-2xl mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-4xl text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-muted-foreground text-sm"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15">
                        <Check className="h-3 w-3 text-success" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={cn(
                    "block w-full rounded-xl py-3 text-center font-semibold transition-all duration-200",
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                      : "border border-border text-foreground hover:bg-muted",
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-muted-foreground text-sm">
            All plans include a 14-day free trial. No credit card required.
            Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="h-full w-full bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/10" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="mb-4 font-bold text-4xl text-foreground sm:text-5xl">
            Ready to Replace Your Entire Stack?
          </h2>
          <p className="mb-10 text-muted-foreground text-lg">
            Join 500+ organizations who consolidated their tools into Nucleo One
            and gained back hours every week.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-10 py-4 font-bold text-primary-foreground text-lg shadow-2xl shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all duration-200"
            >
              Start Free Today
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-10 py-4 font-semibold text-foreground text-lg hover:bg-card transition-all duration-200"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center font-bold text-4xl text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-border/60 bg-card open:border-primary/30"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-semibold text-foreground list-none">
                  {item.q}
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-5 text-muted-foreground leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-muted-foreground">
              Still have questions?{" "}
              <Link to="/contact" className="text-primary font-semibold hover:underline">
                Talk to our team
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Video Demo CTA ── */}
      <section className="border-t border-border/60 bg-card/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-4 font-bold text-3xl text-foreground">
            See Nucleo One in Action
          </h2>
          <p className="mb-8 text-muted-foreground text-lg max-w-2xl mx-auto">
            Watch how a real team manages their entire business — from leads to payroll —
            all in one unified platform.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200"
            >
              Watch 3-Min Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/roi-calculator"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 font-semibold text-foreground hover:bg-muted transition-all duration-200"
            >
              Calculate Your ROI
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Utility (cn) — inline to avoid import issues
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
