import { generateSitemap, getCRMRoutes } from "@/lib/sitemap";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: () => {
        const baseUrl =
          import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
        const routes = getCRMRoutes();
        const sitemap = generateSitemap(routes, baseUrl);

        return new Response(sitemap, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
} as any);
