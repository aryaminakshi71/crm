/**
 * Competitor Compare Route
 *
 * Dynamic SEO page comparing Nucleo One to specific competitors.
 * Targets keywords like "salesforce alternative", "hubspot vs nucleo one", etc.
 */

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button, Card, CardContent } from "@crm/ui";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Minus,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";
import { competitors } from "@/lib/seo";
import { trackCompetitorView } from "@/lib/lead-tracking";
import { useEffect } from "react";

export const Route = createFileRoute("/compare/$competitor")({
  loader: ({ params }) => {
    const competitor = competitors[params.competitor as keyof typeof competitors];
    if (!competitor) {
      throw new Error(`Competitor ${params.competitor} not found`);
    }
    return { competitor, key: params.competitor };
  },
  head: ({ loaderData, params }) => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://nucleo.one";
    const competitor = loaderData?.competitor;
    const competitorKey = params.competitor;
    const canonical = `${baseUrl}/compare/${competitorKey}`;

    if (!competitor) {
      return { meta: [] };
    }

    const competitorName = competitor.name;
    const title = `Nucleo One vs ${competitorName} - Why Switch to Nucleo One`;
    const description = `Compare ${competitorName} vs Nucleo One. See how Nucleo One offers better value with all-in-one CRM, HRM, Projects, and AI features at ${competitor.startingPrice > 0 ? `starting at $${competitor.startingPrice}/user` : "competitive pricing"}, ${competitor.startingPrice > 50 ? "saving you up to 80%" : ""} vs ${competitorName}.`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        // Open Graph
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        // FAQPage Schema
        { "script:ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": getCompetitorFAQs(competitorKey)
        })}
      ],
      links: [
        { rel: "canonical", href: canonical },
        { rel: "alternate", hreflang: "en", href: canonical }
      ]
    };
  },
  component: CompetitorComparePage,
});

// Get competitor-specific FAQs
function getCompetitorFAQs(competitor: string) {
  const faqs: Record<string, Array<{ name: string; acceptedAnswer: { "@type": string; text: string } }>> = {
    salesforce: [
      {
        name: `Why is Nucleo One better than Salesforce?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nucleo One offers all-in-one functionality including CRM, HRM, Projects, Helpdesk, and AI at a fraction of Salesforce's cost. While Salesforce charges $150+/user/month for basic features and requires expensive add-ons for everything, Nucleo One includes everything in every plan starting at $12/user/month."
        }
      },
      {
        name: "How much can I save switching from Salesforce to Nucleo One?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nucleo One offers significant savings compared to Salesforce. While exact savings depend on your team size and current plan, Nucleo One includes more features at a lower price point, with no expensive add-ons required."
        }
      },
      {
        name: "Does Nucleo One have Salesforce's advanced features?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Nucleo One includes AI-powered lead scoring, advanced analytics, workflow automation, and custom reporting. We also offer dedicated support and faster implementation times."
        }
      }
    ],
    hubspot: [
      {
        name: "How does Nucleo One compare to HubSpot's pricing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "HubSpot's 'free' CRM is severely limited, and their paid plans add up quickly with expensive add-ons for essential features. Nucleo One includes all core modules in every plan at $12/user/month, compared to HubSpot's $50-500+/user/month."
        }
      },
      {
        name: "What does Nucleo One offer that HubSpot doesn't?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nucleo One includes native HRM, Projects, and AI agents that HubSpot either doesn't offer or charges premium prices for. Our platform is truly all-in-one without expensive integrations."
        }
      }
    ],
    zoho: [
      {
        name: "Why choose Nucleo One over Zoho?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "While Zoho is affordable, Nucleo One offers modern AI-powered features, better user experience, and seamless integrations. Our platform is built on modern architecture with better mobile apps and 24/7 support."
        }
      },
      {
        name: "Is Nucleo One more expensive than Zoho?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nucleo One starts at $12/user/month for Starter, the same as Zoho's base tier. However, Nucleo One includes AI agents, modern UX, and priority support built into every plan."
        }
      }
    ],
    pipedrive: [
      {
        name: "How does Nucleo One vs Pipedrive compare for sales teams?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pipedrive is sales-focused but lacks broader business tools. Nucleo One offers the same powerful sales CRM plus native Projects, Helpdesk, HRM, and Marketing — everything your team needs in one platform."
        }
      },
      {
        name: "What about invoicing and billing in Nucleo One vs Pipedrive?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nucleo One includes full invoicing and billing capabilities natively, while Pipedrive requires third-party integrations for these features at additional cost."
        }
      }
    ],
    dynamics: [
      {
        name: "Why is Nucleo One easier than Microsoft Dynamics?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Microsoft Dynamics requires significant IT resources, long implementation times, and deep Microsoft stack knowledge. Nucleo One is designed for business users with intuitive interfaces and same-day setup."
        }
      },
      {
        name: "Does Nucleo One integrate with Microsoft products?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Nucleo One offers integrations with Microsoft 365, Teams, Outlook, and more. You get the best of both worlds — modern SaaS simplicity with Microsoft compatibility."
        }
      }
    ]
  };

  return faqs[competitor] || faqs.salesforce;
}

// Detailed comparison data per competitor
function getDetailedComparison(competitor: string) {
  const commonFeatures = [
    { feature: "CRM (Contacts, Leads, Deals)", nucleo: true, competitor: true },
    { feature: "Pipeline Management", nucleo: true, competitor: true },
    { feature: "Email Integration", nucleo: true, competitor: true },
    { feature: "Mobile App", nucleo: true, competitor: true },
    { feature: "Workflow Automation", nucleo: true, competitor: "salesforce hubspot".includes(competitor) },
    { feature: "AI-Powered Features", nucleo: true, competitor: "salesforce hubspot".includes(competitor) },
    { feature: "Native HRM", nucleo: true, competitor: false },
    { feature: "Native Projects", nucleo: true, competitor: false },
    { feature: "Native Invoicing", nucleo: true, competitor: false },
    { feature: "Native Helpdesk", nucleo: true, competitor: "salesforce".includes(competitor) },
    { feature: "Marketing Automation", nucleo: true, competitor: "salesforce hubspot".includes(competitor) },
    { feature: "Affordable Pricing", nucleo: true, competitor: false },
    { feature: "21-Day Free Trial", nucleo: true, competitor: false },
  ];

  const competitorLabel = competitor.charAt(0).toUpperCase() + competitor.slice(1);

  return {
    pros: {
      nucleo: [
        "All-in-one platform (CRM, HRM, Projects, Marketing, Finance)",
        "AI-powered features included in every plan",
        "No per-user fees for core modules",
        "21-day free trial, no credit card required",
        "Setup in minutes, not months",
        "Transparent pricing with no hidden costs",
      ],
      competitor: competitors[competitor as keyof typeof competitors]?.pros || [],
    },
    cons: {
      nucleo: [
        "Newer platform compared to enterprise giants",
        "Limited to web, iOS, and Android (no desktop app yet)",
      ],
      competitor: competitors[competitor as keyof typeof competitors]?.cons || [],
    },
    features: commonFeatures.map((f) => ({
      ...f,
      competitorValue: f.competitor,
    })),
  };
}

function CompetitorComparePage() {
  const data = Route.useLoaderData();
  const params = Route.useParams();

  useEffect(() => {
    trackCompetitorView(params.competitor);
  }, [params.competitor]);

  const comparison = getDetailedComparison(params.competitor);
  const competitor = data.competitor;

  return (
    <div className="min-h-screen bg-card">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link to="/compare" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" />
            All Comparisons
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">N1</span>
            </div>
            <div className="text-3xl font-bold text-muted-foreground">vs</div>
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-2xl font-bold">{competitor.name.charAt(0)}</span>
            </div>
          </div>

          <h1 className="mb-4 font-bold text-4xl text-foreground">
            Nucleo One vs {competitor.name}
            <span className="text-primary"> — Why Teams Switch</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl">
            {competitor.name} charges {competitor.startingPrice > 0 ? `$${competitor.startingPrice}+/user/month` : "enterprise pricing"} for basic CRM.
            Nucleo One includes everything — CRM, HRM, Projects, AI — starting at $15/user/month.
          </p>

          <div className="flex flex-wrap gap-4">
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

      {/* Quick Stats */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 bg-muted/50">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-black text-primary">16</p>
              <p className="text-muted-foreground text-sm">Business Modules</p>
            </div>
            <div>
              <p className="text-3xl font-black text-green-600">$12</p>
              <p className="text-muted-foreground text-sm">Per User/Month (Starter)</p>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground">14</p>
              <p className="text-muted-foreground text-sm">Days Free Trial</p>
            </div>
            <div>
              <p className="text-3xl font-black text-primary">1</p>
              <p className="text-muted-foreground text-sm">Unified Platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Comparison */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center font-bold text-3xl text-foreground">
            Feature-by-Feature Comparison
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Nucleo One Pros */}
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl text-green-700 mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Nucleo One Advantages
                </h3>
                <ul className="space-y-3">
                  {comparison.pros.nucleo.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-foreground">{pro}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* {competitor.name} Pros */}
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl text-red-700 mb-4 flex items-center gap-2">
                  <Minus className="h-5 w-5" />
                  {competitor.name} Disadvantages
                </h3>
                <ul className="space-y-3">
                  {comparison.pros.competitor.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <X className="h-4 w-4 text-red-400 mt-0.5" />
                      <span className="text-muted-foreground">{pro}</span>
                    </li>
                  ))}
                  {comparison.cons.competitor.map((con, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <X className="h-4 w-4 text-red-400 mt-0.5" />
                      <span className="text-muted-foreground">{con}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Feature Matrix */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg text-foreground mb-4">
                Feature Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-muted-foreground">Feature</th>
                      <th className="text-center p-3 font-medium">
                        <span className="text-primary">Nucleo One</span>
                      </th>
                      <th className="text-center p-3 font-medium text-muted-foreground">{competitor.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.features.map((row) => (
                      <tr key={row.feature} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-medium text-foreground">{row.feature}</td>
                        <td className="p-3 text-center">
                          {row.nucleo ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <Minus className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {row.competitorValue ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <Minus className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="bg-muted/50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center font-bold text-3xl text-foreground">
            Pricing Comparison
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">N1</span>
                </div>
                <h3 className="font-bold text-xl text-foreground mb-2">Nucleo One</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-primary">$15</span>
                  <span className="text-muted-foreground">/user/month</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  All modules included
                </p>
                <ul className="text-left space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    CRM, HRM, Projects, Marketing, Finance
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    AI agents included
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    21-day free trial
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <span className="text-xl font-bold">{competitor.name.charAt(0)}</span>
                </div>
                <h3 className="font-bold text-xl text-foreground mb-2">{competitor.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-foreground">
                    ${competitor.startingPrice}
                  </span>
                  <span className="text-muted-foreground">/user/month</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  {competitor.startingPrice > 0 ? "Basic plan only" : "Custom pricing"}
                </p>
                <ul className="text-left space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4 text-red-400" />
                    Essential modules cost extra
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4 text-red-400" />
                    AI features at premium price
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4 text-red-400" />
                    Setup and training extra
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <p className="text-center mt-6 text-muted-foreground">
            <strong className="text-foreground">Example:</strong> 50 users · Nucleo One Growth: $1,450/mo vs{" "}
            {competitor.name} equivalent: $7,500+/mo
          </p>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-foreground text-xl font-medium italic mb-4">
            "Switching from {competitor.name} to Nucleo One was the best decision we made.
            We got better features, saved money, and the team actually enjoys using it."
          </p>
          <p className="text-muted-foreground text-sm">
            — Former {competitor.name} Customer
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 font-bold text-3xl text-background">
            Ready to Make the Switch?
          </h2>
          <p className="mb-8 text-primary-foreground/90 text-xl">
            Join growing businesses who chose Nucleo One over {competitor.name}.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="secondary">
                Start 21-Day Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-background/20 text-background hover:bg-background/10">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
