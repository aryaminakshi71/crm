import { Header } from "@/components/header";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  Handshake,
  Mail,
  Target,
  Users,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Deal Pipeline",
    description:
      "Visual sales pipeline with drag-and-drop stages. Track deals from lead to close.",
  },
  {
    icon: Users,
    title: "Contact Management",
    description:
      "Store all customer info in one place. Track interactions and history.",
  },
  {
    icon: Mail,
    title: "Email Campaigns",
    description: "Create and send targeted email campaigns with analytics.",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics",
    description:
      "Real-time reports on revenue, conversion rates, and team performance.",
  },
  {
    icon: Handshake,
    title: "Relationship Tracking",
    description: "Log interactions and never lose context on leads.",
  },
  {
    icon: Zap,
    title: "Automation",
    description: "Automate repetitive tasks and workflows to save time.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: 0,
    features: ["100 contacts", "1 user", "Basic features", "Community support"],
    popular: false,
  },
  {
    name: "Starter",
    price: 9,
    features: ["1,000 contacts", "2 users", "Basic pipeline", "Email support"],
    popular: false,
  },
  {
    name: "Professional",
    price: 29,
    features: [
      "Unlimited contacts",
      "10 users",
      "Advanced automation",
      "Priority support",
      "API access",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: 99,
    features: [
      "Unlimited everything",
      "Unlimited users",
      "Custom integrations",
      "Dedicated support",
      "SLA",
    ],
    popular: false,
  },
];

export const Route = createFileRoute("/")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3000";
    const canonical = baseUrl.replace(/\/$/, "") + "/";
    return {
      meta: [
        { title: "CRM Platform - Customer Relationship Management System" },
        {
          name: "description",
          content:
            "Modern CRM platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { name: "robots", content: "index, follow" },
        {
          property: "og:title",
          content: "CRM Platform - Customer Relationship Management System",
        },
        {
          property: "og:description",
          content:
            "Modern CRM platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "CRM Platform - Customer Relationship Management System",
        },
        {
          name: "twitter:description",
          content:
            "Modern CRM platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },

  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-card" style={{ minHeight: "100vh" }}>
      <Header />

      {/* Hero */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-6 font-bold text-5xl text-foreground">
            Manage Your Customer Relationships
            <br />
            <span className="text-primary">Like a Pro</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground text-xl">
            All-in-one CRM platform to manage contacts, deals, and sales
            pipeline. Trusted by 500+ organizations worldwide.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center font-bold text-4xl text-foreground">
            Everything You Need to Grow
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              // Map features to their corresponding app routes
              const featureRoutes: Record<string, string> = {
                "Deal Pipeline": "/app/deals",
                "Contact Management": "/app/contacts",
                "Email Campaigns": "/app/marketing",
                "Sales Analytics": "/app",
                "Relationship Tracking": "/app/activities",
                Automation: "/app/settings",
              };
              const route = featureRoutes[feature.title] || "/register";

              return (
                <Link
                  key={idx}
                  to={route}
                  className="cursor-pointer rounded-lg bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <Icon className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="mb-2 font-semibold text-foreground text-xl">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-center font-bold text-4xl text-foreground">
            Simple Pricing
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            Choose the plan that fits your business
          </p>
          <div className="grid gap-6 md:grid-cols-4">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-lg border-2 bg-card p-6 ${
                  plan.popular ? "border-primary shadow-lg" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="mb-4 inline-block rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground text-xs">
                    Most Popular
                  </div>
                )}
                <h3 className="mb-2 font-bold text-2xl text-foreground">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="font-bold text-4xl text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="mb-6 space-y-2">
                  {plan.features.map((feature, fIdx) => (
                    <li
                      key={fIdx}
                      className="flex items-center gap-2 text-muted-foreground"
                    >
                      <Check className="h-5 w-5 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full rounded-lg py-2 text-center font-semibold ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-foreground hover:bg-muted"
                  }`}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 font-bold text-4xl text-background">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-primary text-xl">
            Join thousands of teams using our CRM platform
          </p>
          <Link
            to="/register"
            className="mx-auto inline-block flex items-center gap-2 rounded-lg bg-card px-8 py-3 font-semibold text-primary hover:bg-muted"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground px-4 py-12 text-muted-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 font-semibold text-background">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/app/marketing" className="hover:text-background">
                    Marketing
                  </Link>
                </li>
                <li>
                  <Link to="/industries" className="hover:text-background">
                    Industries
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-background">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="hover:text-background">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-background">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-background">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/docs" className="hover:text-background">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="/support" className="hover:text-background">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-background">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="hover:text-background">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-background">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-border border-t pt-8 text-center">
            <p>&copy; 2024 CRM Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
