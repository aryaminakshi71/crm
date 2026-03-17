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
          </div>

          {/* Social proof micro-line */}
          <p className="mt-6 text-muted-foreground text-sm">
            Trusted by{" "}
            <span className="font-semibold text-foreground">
              500+ organizations
            </span>{" "}
            across 40 countries
          </p>
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

      <Footer />
    </div>
  );
}

// Utility (cn) — inline to avoid import issues
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
