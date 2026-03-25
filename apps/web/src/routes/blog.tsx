import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Badge, Button } from "@crm/ui";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { blogPosts } from "@/lib/blog-content";

export const Route = createFileRoute("/blog")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = `${baseUrl.replace(/\/$/, "")}/blog`;
    const title = "Blog | Nucleo One — Enterprise Software Insights";
    const description =
      "Insights on enterprise CRM, helpdesk, projects, finance, HRM, and go-to-market operations. Learn how to build a unified business OS.";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        { name: "keywords", content: "CRM, business management, HRM, helpdesk, project management, ERP, SaaS, enterprise software" },
        // Open Graph
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: `${baseUrl}/og-image.png` },
        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        // Blog listing schema
        { "script:ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Nucleo One Blog",
          "description": description,
          "url": canonical,
          "publisher": {
            "@type": "Organization",
            "name": "Nucleo One",
            "logo": `${baseUrl}/logo.png`
          }
        })},
        // BreadcrumbList schema
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
              "name": "Blog",
              "item": canonical
            }
          ]
        })}
      ],
      links: [
        { rel: "canonical", href: canonical },
        { rel: "alternate", hreflang: "en", href: canonical }
      ],
    };
  },
  component: BlogPage,
});

function BlogPage() {
  return (
    <div className="min-h-screen bg-card">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-bold text-4xl text-foreground sm:text-5xl">
            Nucleo One Blog
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Practical guides for building a real enterprise operating system
            across revenue, operations, and people.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border border-border bg-muted/30 p-6"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline">{post.category}</Badge>
                <span className="text-muted-foreground text-xs">
                  {post.readMinutes} min read
                </span>
              </div>
              <h2 className="mt-3 font-semibold text-2xl text-foreground">
                {post.title}
              </h2>
              <p className="mt-2 text-muted-foreground">{post.excerpt}</p>
              <p className="mt-4 text-muted-foreground text-xs">
                {post.publishedAt} by {post.author}
              </p>
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="mt-5 inline-block"
              >
                <Button
                  variant="outline"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Read Article
                </Button>
              </Link>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
