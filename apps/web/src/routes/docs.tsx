import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Book,
  Code,
  Mail,
  PlayCircle,
  Search,
  Settings,
  Target,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = baseUrl.replace(/\/$/, "") + "/docs";
    return {
      meta: [
        { title: "Nucleo One - Docs" },
        {
          name: "description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: "Nucleo One - Docs" },
        {
          property: "og:description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Nucleo One - Docs" },
        {
          name: "twitter:description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },

  component: DocsPage,
});

const docCategories = [
  {
    icon: PlayCircle,
    title: "Getting Started",
    description: "Quick start guides and setup instructions",
    articles: [
      "Introduction to Nucleo One",
      "Creating Your First Account",
      "Setting Up Your Organization",
      "Inviting Team Members",
    ],
  },
  {
    icon: Users,
    title: "Contacts & Leads",
    description: "Manage your customer database",
    articles: [
      "Adding and Managing Contacts",
      "Importing Contacts from CSV",
      "Lead Capture and Conversion",
      "Contact Segmentation",
    ],
  },
  {
    icon: Target,
    title: "Deals & Pipeline",
    description: "Track your sales pipeline",
    articles: [
      "Creating and Managing Deals",
      "Pipeline Stages and Workflows",
      "Deal Forecasting",
      "Sales Reports and Analytics",
    ],
  },
  {
    icon: Mail,
    title: "Email & Campaigns",
    description: "Email marketing and automation",
    articles: [
      "Creating Email Campaigns",
      "Email Templates",
      "Automation Workflows",
      "Campaign Analytics",
    ],
  },
  {
    icon: Code,
    title: "API & Integrations",
    description: "Developer resources and integrations",
    articles: [
      "API Overview",
      "Authentication",
      "Webhooks",
      "Third-party Integrations",
    ],
  },
  {
    icon: Settings,
    title: "Settings & Admin",
    description: "Configure your account and organization",
    articles: [
      "Account Settings",
      "User Permissions",
      "Billing and Subscriptions",
      "Security Settings",
    ],
  },
];

function DocsPage() {
  return (
    <div className="min-h-screen bg-card">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Book className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-6 font-bold text-5xl text-foreground">
            Documentation
          </h1>
          <p className="mb-8 text-muted-foreground text-xl">
            Everything you need to know about using Nucleo One effectively.
          </p>
          <div className="relative mx-auto max-w-xl">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 transform text-muted-foreground" />
            <input
              type="search"
              placeholder="Search documentation..."
              className="w-full rounded-lg border border-border py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-muted px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 font-bold text-2xl text-foreground">
            Popular Articles
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="cursor-pointer rounded-lg border border-border bg-card p-4 transition hover:border-primary hover:shadow-md">
              <h3 className="mb-1 font-semibold text-foreground">
                Quick Start Guide
              </h3>
              <p className="text-muted-foreground text-sm">
                Get up and running in 5 minutes
              </p>
            </div>
            <div className="cursor-pointer rounded-lg border border-border bg-card p-4 transition hover:border-primary hover:shadow-md">
              <h3 className="mb-1 font-semibold text-foreground">
                Importing Your Data
              </h3>
              <p className="text-muted-foreground text-sm">
                Migrate from your current CRM
              </p>
            </div>
            <div className="cursor-pointer rounded-lg border border-border bg-card p-4 transition hover:border-primary hover:shadow-md">
              <h3 className="mb-1 font-semibold text-foreground">
                API Reference
              </h3>
              <p className="text-muted-foreground text-sm">
                Complete API documentation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-bold text-3xl text-foreground">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {docCategories.map((category) => (
              <Card key={category.title} className="transition hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <category.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{category.title}</CardTitle>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.articles.map((article) => (
                      <li key={article}>
                        <button className="text-left text-primary text-sm hover:text-primary hover:underline">
                          {article}
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="bg-primary px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 font-bold text-3xl text-background">
            Still Need Help?
          </h2>
          <p className="mb-8 text-primary text-xl">
            Can't find what you're looking for? Our support team is here to
            help.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/support">
              <button className="rounded-lg bg-card px-6 py-3 font-medium text-primary hover:bg-muted">
                Contact Support
              </button>
            </Link>
            <Link to="/contact">
              <button className="rounded-lg bg-primary/90 px-6 py-3 font-medium text-primary-foreground hover:bg-primary/80">
                Send us a Message
              </button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
