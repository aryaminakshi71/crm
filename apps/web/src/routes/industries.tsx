import { Header } from "@/components/header";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Briefcase,
  Building2,
  Code,
  DollarSign,
  GraduationCap,
  Heart,
  Scale,
  ShoppingBag,
} from "lucide-react";

const industries = [
  {
    name: "Real Estate",
    icon: Building2,
    description: "Manage properties, leads, and client relationships",
  },
  {
    name: "Education",
    icon: GraduationCap,
    description: "Track student enrollment and engagement",
  },
  {
    name: "Healthcare",
    icon: Heart,
    description: "Patient management and care coordination",
  },
  {
    name: "Legal",
    icon: Scale,
    description: "Case management and client relations",
  },
  {
    name: "Retail",
    icon: ShoppingBag,
    description: "Customer management and sales tracking",
  },
  {
    name: "Technology",
    icon: Code,
    description: "Lead generation and tech sales pipeline",
  },
  {
    name: "Consulting",
    icon: Briefcase,
    description: "Client projects and relationship management",
  },
  {
    name: "Banking",
    icon: DollarSign,
    description: "Financial services and client onboarding",
  },
];

export const Route = createFileRoute("/industries")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = baseUrl.replace(/\/$/, "") + "/industries";
    return {
      meta: [
        { title: "Nucleo One - Industries" },
        {
          name: "description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: "Nucleo One - Industries" },
        {
          property: "og:description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Nucleo One - Industries" },
        {
          name: "twitter:description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },

  component: IndustriesPage,
});

function IndustriesPage() {
  return (
    <div className="min-h-screen bg-card">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-6 font-bold text-5xl text-foreground">
            Industry-Specific Solutions
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
            Tailored CRM solutions for your industry. Manage your business with
            tools designed for your specific needs.
          </p>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {industries.map((industry, idx) => {
              const Icon = industry.icon;
              return (
                <Link
                  key={idx}
                  to="/industries/$industry"
                  params={{
                    industry: industry.name.toLowerCase().replace(/\s+/g, "-"),
                  }}
                  className="group rounded-lg border-2 border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
                >
                  <Icon className="mb-4 h-12 w-12 text-primary transition-transform group-hover:scale-110" />
                  <h3 className="mb-2 font-semibold text-foreground text-xl">
                    {industry.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {industry.description}
                  </p>
                </Link>
              );
            })}
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
            Choose your industry and start managing your relationships better
          </p>
          <Link
            to="/register"
            className="inline-block rounded-lg bg-card px-8 py-3 font-semibold text-primary hover:bg-muted"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
