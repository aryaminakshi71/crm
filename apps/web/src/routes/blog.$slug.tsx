import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@crm/ui";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getBlogPostBySlug } from "../lib/blog-content";

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
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = `${baseUrl.replace(/\/$/, "")}/blog/${loaderData?.post.slug || ""}`;
    return {
      meta: [
        { title: `${loaderData?.post.title || "Blog"} | Nucleo One` },
        {
          name: "description",
          content: loaderData?.post.excerpt || "Nucleo One blog article",
        },
      ],
      links: [{ rel: "canonical", href: canonical }],
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
