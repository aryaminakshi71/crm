import { Header } from "@/components/header";
import { Button } from "@crm/ui";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    blurb: "For teams replacing scattered CRM tools.",
    features: ["CRM + Helpdesk", "Projects + Assets", "Email support"],
    cta: "Start Starter",
    featured: false,
  },
  {
    name: "Growth",
    price: "$99",
    blurb: "For scaling operations across departments.",
    features: [
      "Finance + Invoicing + Payroll",
      "Marketing + Analytics",
      "HRM + Recruitment + Training",
    ],
    cta: "Start Growth",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    blurb: "For regulated organizations with advanced controls.",
    features: [
      "RBAC + Approvals + Audit",
      "SSO/SCIM + Compliance center",
      "AI agents + Forecasting + BI",
    ],
    cta: "Book Enterprise Demo",
    featured: false,
  },
];

export const Route = createFileRoute("/pricing")({
  head: () => {
    const baseUrl = import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = `${baseUrl.replace(/\/$/, "")}/pricing`;
    return {
      meta: [
        { title: "Pricing | Nucleo One" },
        {
          name: "description",
          content:
            "Compare Nucleo One plans for CRM, helpdesk, projects, finance, marketing, HRM, and enterprise controls.",
        },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen bg-card">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/10 p-8 md:p-12">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary text-xs">
            <Sparkles className="h-3 w-3" />
            Transparent pricing for full enterprise operations
          </p>
          <h1 className="mt-4 font-bold text-4xl text-foreground sm:text-5xl">Pricing built to scale with your operating model</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            Start with CRM and support, then expand into finance, HRM, compliance, and AI without adding disconnected systems.
          </p>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-2xl border p-6 ${plan.featured ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              {plan.featured ? (
                <span className="inline-block rounded-full bg-primary px-3 py-1 text-primary-foreground text-xs">Most Popular</span>
              ) : null}
              <h2 className="mt-3 font-semibold text-2xl text-foreground">{plan.name}</h2>
              <p className="mt-1 text-muted-foreground">{plan.blurb}</p>
              <p className="mt-6 font-bold text-4xl text-foreground">{plan.price}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="mt-8 block">
                <Button variant={plan.featured ? "primary" : "outline"} className="w-full">
                  {plan.cta}
                </Button>
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-muted/40 p-6">
          <h3 className="font-semibold text-xl text-foreground">Need procurement/legal/security review?</h3>
          <p className="mt-2 text-muted-foreground">
            Enterprise plans include vendor management, contract lifecycle, compliance controls, retention policies, and DR workflows.
          </p>
          <div className="mt-4">
            <Link to="/contact">
              <Button variant="outline">Talk to Sales</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
