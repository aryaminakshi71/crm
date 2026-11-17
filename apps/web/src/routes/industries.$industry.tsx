/**
 * Industry Detail Route
 *
 * Dynamic route for individual industry pages.
 * Includes SEO optimization with unique meta tags and structured data.
 */

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button, Card, CardContent } from "@crm/ui";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  Mail,
  Target,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/industries/$industry")({
  head: ({ params }) => {
    const industryKey = params.industry.replace(/-/g, "-");
    const industryData = industryFeatures[industryKey] || {
      title: `${params.industry
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")} CRM`,
      description: `Tailored CRM solutions for ${params.industry.replace(/-/g, " ")} businesses. Streamline operations and grow relationships.`,
    };

    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://nucleo.one";
    const canonical = `${baseUrl}/industries/${params.industry}`;
    const pageTitle = `${industryData.title} - Nucleo One`;
    const pageDescription = industryData.description;

    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: pageDescription },
        { name: "robots", content: "index, follow" },
        // Open Graph
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: pageDescription },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: `${baseUrl}/og-image.png` },
        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: pageTitle },
        { name: "twitter:description", content: pageDescription },
        // Schema.org structured data
        { "script:ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": industryData.title,
          "description": pageDescription,
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Free trial available"
          },
          "provider": {
            "@type": "Organization",
            "name": "Nucleo One",
            "url": baseUrl
          }
        })},
        // BreadcrumbList schema for navigation
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
              "name": "Industries",
              "item": `${baseUrl}/industries`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": industryData.title,
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
  component: IndustryDetailPage,
});

const industryFeatures: Record<
  string,
  { title: string; description: string; features: string[] }
> = {
  "real-estate": {
    title: "Real Estate CRM",
    description:
      "Manage properties, leads, and client relationships with tools built specifically for real estate professionals.",
    features: [
      "Property listing management",
      "Lead capture from multiple sources",
      "Client relationship tracking",
      "Transaction pipeline management",
      "Document storage and sharing",
      "Market analysis and reporting",
    ],
  },
  education: {
    title: "Education CRM",
    description:
      "Track student enrollment, engagement, and relationships to improve retention and success rates.",
    features: [
      "Student enrollment tracking",
      "Parent and guardian management",
      "Communication history",
      "Event and activity management",
      "Academic progress tracking",
      "Alumni relationship management",
    ],
  },
  healthcare: {
    title: "Healthcare CRM",
    description:
      "Patient management and care coordination tools designed for healthcare providers and practices.",
    features: [
      "Patient information management",
      "Appointment scheduling",
      "Care team coordination",
      "Treatment history tracking",
      "HIPAA-compliant data handling",
      "Referral management",
    ],
  },
  legal: {
    title: "Legal CRM",
    description:
      "Case management and client relations software for law firms and legal professionals.",
    features: [
      "Case and matter management",
      "Client relationship tracking",
      "Document management",
      "Billing and time tracking",
      "Court date and deadline tracking",
      "Conflict of interest checking",
    ],
  },
  retail: {
    title: "Retail CRM",
    description:
      "Customer management and sales tracking for retail businesses of all sizes.",
    features: [
      "Customer purchase history",
      "Loyalty program management",
      "Inventory integration",
      "Sales performance tracking",
      "Customer segmentation",
      "Promotional campaign management",
    ],
  },
  technology: {
    title: "Technology CRM",
    description:
      "Lead generation and tech sales pipeline management for SaaS and technology companies.",
    features: [
      "Lead scoring and qualification",
      "Product demo scheduling",
      "Technical support tracking",
      "API integration management",
      "Customer success metrics",
      "Churn prediction and prevention",
    ],
  },
  consulting: {
    title: "Consulting CRM",
    description:
      "Client projects and relationship management for consulting firms and independent consultants.",
    features: [
      "Project and engagement tracking",
      "Client relationship mapping",
      "Resource allocation",
      "Time and expense tracking",
      "Proposal and contract management",
      "Knowledge base management",
    ],
  },
  banking: {
    title: "Banking CRM",
    description:
      "Financial services and client onboarding solutions for banks and financial institutions.",
    features: [
      "Client onboarding workflows",
      "Account relationship management",
      "Compliance tracking",
      "Financial product tracking",
      "Risk assessment tools",
      "Regulatory reporting",
    ],
  },
};

function IndustryDetailPage() {
  const params = Route.useParams();
  const industryKey = params.industry.replace(/-/g, "-");
  const industry = industryFeatures[industryKey] || {
    title: `${params.industry
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")} CRM`,
    description: `Tailored CRM solutions for ${params.industry.replace(/-/g, " ")} businesses.`,
    features: [
      "Custom pipeline management",
      "Industry-specific reporting",
      "Integration capabilities",
      "Automated workflows",
      "Team collaboration tools",
      "Mobile access",
    ],
  };

  return (
    <div className="min-h-screen bg-card">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 font-bold text-5xl text-foreground">
            {industry.title}
          </h1>
          <p className="mb-8 text-muted-foreground text-xl">
            {industry.description}
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-bold text-3xl text-foreground">
            Key Features
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {industry.features.map((feature, idx) => (
              <Card key={idx} className="transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-medium text-foreground">{feature}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-muted px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center font-bold text-3xl text-foreground">
            Why Choose Nucleo One?
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">
                  Industry-Specific
                </h3>
                <p className="text-muted-foreground">
                  Built with your industry's unique needs in mind, not a
                  one-size-fits-all solution.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">
                  Powerful Analytics
                </h3>
                <p className="text-muted-foreground">
                  Get insights that matter with reports and dashboards tailored
                  to your industry.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">
                  Easy to Use
                </h3>
                <p className="text-muted-foreground">
                  Intuitive interface that your team will actually want to use,
                  reducing training time.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">
                  Seamless Integration
                </h3>
                <p className="text-muted-foreground">
                  Connect with the tools you already use through our extensive
                  integration library.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 font-bold text-3xl text-background">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-primary text-xl">
            Join other {params.industry.replace(/-/g, " ")} businesses using CRM
            Platform to grow their relationships.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
