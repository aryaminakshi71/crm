import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@crm/ui";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Book,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Video,
} from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = baseUrl.replace(/\/$/, "") + "/support";
    return {
      meta: [
        { title: "Nucleo One - Support" },
        {
          name: "description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: "Nucleo One - Support" },
        {
          property: "og:description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Nucleo One - Support" },
        {
          name: "twitter:description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },

  component: SupportPage,
});

const faqCategories = [
  {
    title: "Getting Started",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click the 'Get Started' button on our homepage, fill in your details, and verify your email address. You'll be up and running in minutes!",
      },
      {
        q: "Is there a free trial?",
        a: "Yes! We offer a 14-day free trial with full access to all features. No credit card required.",
      },
      {
        q: "Can I import my existing contacts?",
        a: "Absolutely! You can import contacts via CSV, Excel, or connect directly with popular CRMs like Salesforce and HubSpot.",
      },
    ],
  },
  {
    title: "Billing & Plans",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, MasterCard, American Express) and ACH transfers for annual plans.",
      },
      {
        q: "Can I change my plan later?",
        a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.",
      },
      {
        q: "Do you offer refunds?",
        a: "We offer a 30-day money-back guarantee. If you're not satisfied, contact us within 30 days for a full refund.",
      },
    ],
  },
  {
    title: "Features & Usage",
    questions: [
      {
        q: "How many contacts can I store?",
        a: "This depends on your plan. Free plans include 100 contacts, while paid plans offer unlimited contacts.",
      },
      {
        q: "Can I customize the sales pipeline?",
        a: "Yes! You can create custom pipeline stages, add fields, and set up automation workflows to match your sales process.",
      },
      {
        q: "Is there a mobile app?",
        a: "Our platform is fully responsive and works great on mobile browsers. Native iOS and Android apps are coming soon!",
      },
    ],
  },
];

function SupportPage() {
  return (
    <div className="min-h-screen bg-card">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-6 font-bold text-5xl text-foreground">
            Support Center
          </h1>
          <p className="mb-8 text-muted-foreground text-xl">
            Find answers, get help, and learn how to make the most of CRM
            Platform.
          </p>
          <div className="relative mx-auto max-w-xl">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 transform text-muted-foreground" />
            <input
              type="search"
              placeholder="Search for help..."
              className="w-full rounded-lg border border-border py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 font-bold text-2xl text-foreground">
            How can we help?
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer transition hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Book className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">
                  Documentation
                </h3>
                <p className="mb-4 text-muted-foreground text-sm">
                  Browse our guides and tutorials
                </p>
                <Link to="/docs">
                  <Button variant="outline" size="sm" className="w-full">
                    View Docs
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="cursor-pointer transition hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">
                  Video Tutorials
                </h3>
                <p className="mb-4 text-muted-foreground text-sm">
                  Watch step-by-step guides
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Watch Videos
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer transition hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">
                  Live Chat
                </h3>
                <p className="mb-4 text-muted-foreground text-sm">
                  Chat with our support team
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Start Chat
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer transition hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">
                  Email Support
                </h3>
                <p className="mb-4 text-muted-foreground text-sm">
                  Send us a message
                </p>
                <Link to="/contact">
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Us
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-bold text-3xl text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {faqCategories.map((category) => (
              <div key={category.title}>
                <h3 className="mb-4 font-semibold text-foreground text-xl">
                  {category.title}
                </h3>
                <div className="space-y-4">
                  {category.questions.map((faq, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-base">{faq.q}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{faq.a}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-0 bg-primary text-primary-foreground">
            <CardContent className="p-8">
              <div className="text-center">
                <h2 className="mb-4 font-bold text-3xl">Still Need Help?</h2>
                <p className="mb-6 text-lg text-primary">
                  Our support team is available Monday-Friday, 9am-5pm EST
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Link to="/contact">
                    <Button variant="secondary" size="lg">
                      <Mail className="mr-2 h-4 w-4" />
                      Send us an Email
                    </Button>
                  </Link>
                  <Button variant="secondary" size="lg">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Us: (555) 123-4567
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}
