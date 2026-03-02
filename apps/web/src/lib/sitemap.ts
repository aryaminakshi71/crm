/**
 * Sitemap generation utility
 * Generates XML sitemap for search engines
 */

export interface SitemapRoute {
  path: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
  lastmod?: string;
}

export function generateSitemap(
  routes: SitemapRoute[],
  baseUrl: string,
): string {
  const urlset = routes
    .map((route) => {
      const url = new URL(route.path, baseUrl).toString();
      const lastmod = route.lastmod || new Date().toISOString().split("T")[0];
      const changefreq = route.changefreq || "weekly";
      const priority = route.priority ?? 0.8;

      return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
}

/**
 * Get public routes for CRM app
 */
export function getCRMRoutes(): SitemapRoute[] {
  const staticRoutes: SitemapRoute[] = [
    { path: "/", changefreq: "daily", priority: 1.0 },
    { path: "/pricing", changefreq: "weekly", priority: 0.9 },
    { path: "/blog", changefreq: "weekly", priority: 0.9 },
    { path: "/about", changefreq: "monthly", priority: 0.7 },
    { path: "/contact", changefreq: "monthly", priority: 0.6 },
    { path: "/demo", changefreq: "weekly", priority: 0.8 },
    { path: "/docs", changefreq: "weekly", priority: 0.7 },
    { path: "/support", changefreq: "weekly", priority: 0.7 },
    { path: "/industries", changefreq: "monthly", priority: 0.8 },
    { path: "/privacy", changefreq: "yearly", priority: 0.3 },
    { path: "/terms", changefreq: "yearly", priority: 0.3 },
    { path: "/security", changefreq: "monthly", priority: 0.3 },
    { path: "/status", changefreq: "weekly", priority: 0.3 },
  ];

  const blogRoutes: SitemapRoute[] = blogPosts.map((post) => ({
    path: `/blog/${post.slug}`,
    changefreq: "monthly",
    priority: 0.75,
    lastmod: post.publishedAt,
  }));

  return [...staticRoutes, ...blogRoutes];
}
import { blogPosts } from "./blog-content";
