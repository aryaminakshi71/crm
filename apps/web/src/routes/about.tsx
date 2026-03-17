import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Heart, Target, Zap } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = baseUrl.replace(/\/$/, "") + "/about";
    return {
      meta: [
        { title: "Nucleo One - About" },
        {
          name: "description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: "Nucleo One - About" },
        {
          property: "og:description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Nucleo One - About" },
        {
          name: "twitter:description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },

  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-card">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 font-bold text-5xl text-foreground">
            About Nucleo One
          </h1>
          <p className="mb-8 text-muted-foreground text-xl">
            We're on a mission to help businesses build stronger customer
            relationships and drive sustainable growth through intelligent CRM
            solutions.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 font-bold text-3xl text-foreground">Our Story</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Founded in 2024, Nucleo One was born from a simple observation:
              most CRM systems are either too complex for small teams or too
              basic for growing businesses. We set out to create a solution that
              bridges this gap—powerful enough for enterprise needs, yet
              intuitive enough for anyone to use.
            </p>
            <p>
              Today, we serve over 500 organizations worldwide, from startups to
              Fortune 500 companies, helping them manage millions of customer
              relationships. Our platform combines cutting-edge technology with
              a deep understanding of what sales and marketing teams actually
              need.
            </p>
            <p>
              We believe that great customer relationships are the foundation of
              every successful business. That's why we've built a platform that
              makes it easy to track interactions, nurture leads, and close
              deals—all while maintaining the personal touch that sets great
              companies apart.
            </p>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="bg-muted px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-bold text-3xl text-foreground">
            Our Values
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground text-xl">
                Customer-First
              </h3>
              <p className="text-muted-foreground">
                Every decision we make starts with one question: How does this
                help our customers succeed?
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground text-xl">
                Innovation
              </h3>
              <p className="text-muted-foreground">
                We continuously push boundaries to deliver features that
                anticipate your needs, not just meet them.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground text-xl">
                Integrity
              </h3>
              <p className="text-muted-foreground">
                We build trust through transparency, reliability, and a
                commitment to doing the right thing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div>
              <div className="mb-2 font-bold text-4xl text-primary">500+</div>
              <div className="text-muted-foreground">Organizations</div>
            </div>
            <div>
              <div className="mb-2 font-bold text-4xl text-primary">50K+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="mb-2 font-bold text-4xl text-primary">2M+</div>
              <div className="text-muted-foreground">Contacts Managed</div>
            </div>
            <div>
              <div className="mb-2 font-bold text-4xl text-primary">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-muted px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center font-bold text-3xl text-foreground">
            Our Team
          </h2>
          <p className="mb-8 text-center text-muted-foreground">
            We're a diverse team of engineers, designers, and customer success
            specialists who are passionate about building tools that make work
            easier and more productive.
          </p>
          <div className="text-center">
            <Link
              to="/contact"
              className="inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Join Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 font-bold text-3xl text-background">
            Ready to Transform Your CRM?
          </h2>
          <p className="mb-8 text-primary text-xl">
            Join thousands of teams using our platform to build better customer
            relationships.
          </p>
          <Link
            to="/register"
            className="inline-block rounded-lg bg-card px-8 py-3 font-medium text-primary hover:bg-muted"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
