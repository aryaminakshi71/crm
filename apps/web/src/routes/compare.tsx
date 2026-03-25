/**
 * Compare Index Route
 *
 * Landing page for comparing Nucleo One with competitors.
 * Targets SEO keywords for competitor comparisons.
 */

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button, Card, CardContent } from "@crm/ui";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Minus,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { competitors } from "@/lib/seo";

export const Route = createFileRoute("/compare")({
  head: () => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://nucleo.one";
    const canonical = `${baseUrl}/compare`;

    return {
      meta: [
        { title: "Compare CRM Solutions | Nucleo One vs Salesforce, HubSpot, Zoho & More" },
        {
          name: "description",
          content:
            "Compare Nucleo One vs Salesforce, HubSpot, Zoho CRM, Pipedrive & Microsoft Dynamics. See why thousands of businesses choose Nucleo One for better value, easier setup, and all-in-one functionality.",
        },
        { name: "robots", content: "index, follow" },
        // Open Graph
        { property: "og:title", content: "Compare CRM Solutions | Nucleo One vs Competitors" },
        { property: "og:description", content: "See why Nucleo One beats Salesforce, HubSpot, Zoho & more. All-in-one platform at better value." },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Compare CRM Solutions | Nucleo One" },
        // FAQPage Schema
        { "script:ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How does Nucleo One compare to Salesforce?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Nucleo One offers all-in-one functionality including CRM, HRM, Projects, and AI at a fraction of Salesforce's cost, with significantly easier setup and no per-user licensing fees."
              }
            },
            {
              "@type": "Question",
              "name": "Is Nucleo One better than HubSpot?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Unlike HubSpot's tiered pricing with expensive add-ons, Nucleo One includes all modules in every plan. Our pricing is transparent with no hidden costs."
              }
            },
            {
              "@type": "Question",
              "name": "Why switch from Zoho to Nucleo One?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Nucleo One provides modern AI-powered features, better user experience, and seamless integrations that Zoho lacks, at comparable pricing."
              }
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
  component: CompareIndexPage,
});

// Quick comparison matrix
const comparisonMatrix = [
  { feature: "All-in-one platform", nucleo: true, salesforce: true, hubspot: true, zoho: true, pipedrive: false },
  { feature: "Unlimited users (some plans)", nucleo: true, salesforce: false, hubspot: false, zoho: false, pipedrive: false },
  { feature: "AI-powered features", nucleo: true, salesforce: true, hubspot: true, zoho: false, pipedrive: false },
  { feature: "HRM included", nucleo: true, salesforce: false, hubspot: false, zoho: true, pipedrive: false },
  { feature: "Projects & Tasks", nucleo: true, salesforce: false, hubspot: false, zoho: true, pipedrive: false },
  { feature: "Marketing automation", nucleo: true, salesforce: true, hubspot: true, zoho: true, pipedrive: false },
  { feature: "Free trial", nucleo: true, salesforce: false, hubspot: true, zoho: true, pipedrive: true },
  { feature: "Setup in minutes", nucleo: true, salesforce: false, hubspot: true, zoho: true, pipedrive: true },
  { feature: "Starting price", nucleo: "$15/user", salesforce: "$150/user", hubspot: "$50/user", zoho: "$12/user", pipedrive: "$15/user" },
];

function CompareIndexPage() {
  return (
    <div className="min-h-screen bg-card">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 font-bold text-5xl text-foreground">
            Don't Settle for Legacy CRM
            <br />
            <span className="text-primary">Switch to Nucleo One</span>
          </h1>
          <p className="mb-8 text-muted-foreground text-xl max-w-2xl mx-auto">
            See why 10,000+ businesses switched from Salesforce, HubSpot, Zoho, and Pipedrive
            to get all their business tools in one place — at a fraction of the cost.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Competitor Cards */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center font-bold text-3xl text-foreground">
            Compare Nucleo One to Any CRM
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(competitors).map(([key, competitor]) => (
              <Link key={key} to="/compare/$competitor" params={{ competitor: key }}>
                <Card className="transition-all hover:shadow-lg hover:border-primary/50 h-full">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl text-foreground mb-2">
                      {competitor.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {key === "salesforce" && "Enterprise CRM leader"}
                      {key === "hubspot" && "Marketing-focused CRM"}
                      {key === "zoho" && "Budget all-in-one"}
                      {key === "pipedrive" && "Sales-focused CRM"}
                      {key === "dynamics" && "Microsoft ecosystem CRM"}
                    </p>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-bold text-foreground">
                        ${competitor.startingPrice}
                      </span>
                      <span className="text-muted-foreground text-sm">/user/mo</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        starting price
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">{competitor.pros[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Minus className="h-4 w-4 text-red-400" />
                        <span className="text-muted-foreground">{competitor.cons[0]}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-primary text-sm font-medium">
                      Compare vs {competitor.name}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Comparison Table */}
      <section className="bg-muted/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center font-bold text-3xl text-foreground">
            Feature Comparison at a Glance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground">Feature</th>
                  <th className="text-center p-4 font-medium">
                    <span className="text-primary">Nucleo One</span>
                  </th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Salesforce</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">HubSpot</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Zoho</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Pipedrive</th>
                </tr>
              </thead>
              <tbody>
                {comparisonMatrix.map((row) => (
                  <tr key={row.feature} className="border-b hover:bg-background/50">
                    <td className="p-4 font-medium text-foreground">{row.feature}</td>
                    <td className="p-4 text-center">
                      {typeof row.nucleo === "boolean" ? (
                        row.nucleo ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <Minus className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-primary font-medium text-xs">{row.nucleo}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.salesforce === "boolean" ? (
                        row.salesforce ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <Minus className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-muted-foreground text-xs">{row.salesforce}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.hubspot === "boolean" ? (
                        row.hubspot ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <Minus className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-muted-foreground text-xs">{row.hubspot}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.zoho === "boolean" ? (
                        row.zoho ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <Minus className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-muted-foreground text-xs">{row.zoho}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.pipedrive === "boolean" ? (
                        row.pipedrive ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <Minus className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-muted-foreground text-xs">{row.pipedrive}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center font-bold text-3xl text-foreground">
            Why Businesses Switch to Nucleo One
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">10x Faster Setup</h3>
              <p className="text-muted-foreground text-sm">
                Go live in days, not months. Our guided onboarding gets your team productive immediately.
              </p>
            </div>
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">All-In-One Platform</h3>
              <p className="text-muted-foreground text-sm">
                CRM, HRM, Projects, Marketing, Finance, and AI — no more juggling multiple tools.
              </p>
            </div>
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <BarChart3 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">Transparent Pricing</h3>
              <p className="text-muted-foreground text-sm">
                No surprise fees, no expensive add-ons. Every feature included in every plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-muted/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-foreground text-xl font-medium italic mb-4">
            "We saved $40,000/year switching from Salesforce and got better features.
            Nucleo One is what Salesforce should have been."
          </p>
          <p className="text-muted-foreground text-sm">
            — Sarah Chen, VP of Operations at TechScale (former Salesforce customer)
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 font-bold text-3xl text-background">
            Ready to Switch?
          </h2>
          <p className="mb-8 text-primary-foreground/90 text-xl">
            Start your 21-day free trial today. No credit card, no contracts.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="secondary">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-background/20 text-foreground hover:bg-background/10">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
