import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@crm/ui";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getBlogPostBySlug } from "@/lib/blog-content";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getBlogPostBySlug(params.slug);
    if (!post) {
      throw notFound();
    }
    return { post };
  },
  head: ({ loaderData }) => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://nucleo.one";
    const canonical = `${baseUrl}/blog/${loaderData?.post.slug || ""}`;
    const post = loaderData?.post;
    const publishedDate = post?.publishedAt || new Date().toISOString();

    return {
      meta: [
        { title: `${post?.title || "Blog"} | Nucleo One` },
        { name: "description", content: post?.excerpt || "Nucleo One blog article" },
        { name: "robots", content: "index, follow" },
        // Open Graph
        { property: "og:title", content: `${post?.title || "Blog"} | Nucleo One` },
        { property: "og:description", content: post?.excerpt || "Nucleo One blog article" },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "article:published_time", content: publishedDate },
        { property: "article:author", content: post?.author || "Nucleo One" },
        { property: "article:section", content: post?.category || "Blog" },
        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${post?.title || "Blog"} | Nucleo One` },
        { name: "twitter:description", content: post?.excerpt || "Nucleo One blog article" },
        // Schema.org Article
        { "script:ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post?.title,
          "description": post?.excerpt,
          "image": `${baseUrl}/og-image.png`,
          "author": {
            "@type": "Person",
            "name": post?.author || "Nucleo One"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Nucleo One",
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/logo.png`
            }
          },
          "datePublished": publishedDate,
          "dateModified": publishedDate,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonical
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
              "name": "Blog",
              "item": `${baseUrl}/blog`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": post?.title,
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
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-card">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-block">
          <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Blog
          </Button>
        </Link>

        <article className="mt-4 rounded-2xl border border-border bg-muted/20 p-6 sm:p-8">
          <p className="text-muted-foreground text-sm">
            {post.category} • {post.readMinutes} min read
          </p>
          <h1 className="mt-2 font-bold text-3xl text-foreground sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {post.publishedAt} by {post.author}
          </p>
          <p className="mt-5 text-foreground/90">{post.excerpt}</p>

          <div className="mt-8 space-y-5">
            {post.body.map((paragraph) => (
              <p
                key={paragraph.slice(0, 32)}
                className="leading-7 text-foreground/90"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
