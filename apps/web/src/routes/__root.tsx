import { QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { type ReactNode, useEffect } from "react";
import { Toaster } from "sonner";
import { ErrorBoundaryWrapper } from "../components/error-boundary-wrapper";
import { BrandingProvider } from "../components/providers/branding-provider";
import { PostHogProvider } from "../components/providers/posthog-provider";
import { addSkipLink } from "../lib/accessibility";
import { queryClient } from "../lib/query";
import { initSentry } from "../lib/sentry";
import { registerServiceWorker } from "../lib/service-worker";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  getCRMOrganizationSchema,
} from "../lib/structured-data";

import appCss from "../app.css?url";

export const Route = createRootRoute({
  head: () => {
    const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL;
    const ogImage = siteUrl ? `${siteUrl}/og.svg` : "/og.svg";
    const brandName = import.meta.env.VITE_BRAND_NAME ?? "Nucleo One";
    const brandTagline = import.meta.env.VITE_BRAND_TAGLINE ?? "All-in-One Business Management Platform";
    const themeColor = import.meta.env.VITE_THEME_COLOR ?? "#e11d48";
    const twitterHandle = import.meta.env.VITE_TWITTER_HANDLE ?? "@nucleoone";

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: `${brandName} — ${brandTagline}` },
        {
          name: "description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        {
          name: "keywords",
          content:
            "CRM, customer relationship management, sales management, business CRM, sales pipeline",
        },
        {
          property: "og:title",
          content: `${brandName} — ${brandTagline}`,
        },
        {
          property: "og:description",
          content:
            "Modern Nucleo One platform for managing customer relationships and sales pipelines.",
        },
        { property: "og:type", content: "website" },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: brandName },
        { name: "application-name", content: brandName },
        { name: "apple-mobile-web-app-title", content: brandName },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: `${brandName} — ${brandTagline}`,
        },
        {
          name: "twitter:description",
          content:
            "Modern Nucleo One platform for managing customer relationships and sales pipelines.",
        },
        { name: "twitter:image", content: ogImage },
        { name: "twitter:site", content: twitterHandle },
        { name: "robots", content: "index, follow" },
        { name: "theme-color", content: themeColor },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico" },
      ],
    };
  },
  shellComponent: RootDocument,
  errorComponent: ({ error }) => {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
          <h1 className="mb-4 font-bold text-2xl text-destructive">
            Something went wrong
          </h1>
          <p className="mb-4 text-foreground">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="w-full max-w-md rounded-lg bg-card p-6 text-center shadow-lg">
          <h1 className="mb-2 font-bold text-4xl text-foreground">404</h1>
          <h2 className="mb-4 font-semibold text-foreground text-xl">
            Page Not Found
          </h2>
          <p className="mb-6 text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  },
});

function RootDocument({ children }: { children: ReactNode }) {
  // Register service worker for offline support
  useEffect(() => {
    initSentry();
    registerServiceWorker();
    // Add skip link for accessibility
    addSkipLink("main-content", "Skip to main content");
  }, []);

  return (
    <html lang="en">
      <head>
        <HeadContent />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="mask-icon" href="/icon.svg" color={import.meta.env.VITE_THEME_COLOR ?? "#e11d48"} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateOrganizationSchema(getCRMOrganizationSchema()),
            ),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateWebSiteSchema({
                name: getCRMOrganizationSchema().name,
                url:
                  import.meta.env.VITE_PUBLIC_SITE_URL ||
                  getCRMOrganizationSchema().url,
              }),
            ),
          }}
        />
      </head>
      <body>
        <ErrorBoundaryWrapper>
          <BrandingProvider>
            <PostHogProvider>
              <QueryClientProvider client={queryClient}>
                {children}
                <Toaster position="top-right" />
                {import.meta.env.PROD ? null : <TanStackRouterDevtools />}
                <Scripts />
              </QueryClientProvider>
            </PostHogProvider>
          </BrandingProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
