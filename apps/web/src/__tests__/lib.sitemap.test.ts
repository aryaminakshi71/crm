/**
 * Sitemap Generation Tests
 */

import { describe, expect, it, beforeEach } from "vitest";
import {
  generateSitemap,
  getCRMRoutes,
  type SitemapRoute,
} from "@/lib/sitemap";

const BASE_URL = "https://nucleoone.com";

// ─── generateSitemap Tests ────────────────────────────────────────────────────

describe("generateSitemap function", () => {
  it("returns a valid XML string starting with xml declaration", () => {
    const xml = generateSitemap([], BASE_URL);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  });

  it("returns urlset with correct xmlns", () => {
    const xml = generateSitemap([], BASE_URL);
    expect(xml).toContain("http://www.sitemaps.org/schemas/sitemap/0.9");
  });

  it("generates a URL entry for each route", () => {
    const routes: SitemapRoute[] = [
      { path: "/", priority: 1.0 },
      { path: "/pricing", priority: 0.9 },
    ];
    const xml = generateSitemap(routes, BASE_URL);
    expect(xml).toContain(`<loc>${BASE_URL}/</loc>`);
    expect(xml).toContain(`<loc>${BASE_URL}/pricing</loc>`);
  });

  it("includes lastmod date for each URL", () => {
    const routes: SitemapRoute[] = [
      { path: "/", lastmod: "2026-01-01" },
    ];
    const xml = generateSitemap(routes, BASE_URL);
    expect(xml).toContain("<lastmod>2026-01-01</lastmod>");
  });

  it("uses today's date as fallback lastmod when not specified", () => {
    const routes: SitemapRoute[] = [{ path: "/" }];
    const xml = generateSitemap(routes, BASE_URL);
    const today = new Date().toISOString().split("T")[0];
    expect(xml).toContain(`<lastmod>${today}</lastmod>`);
  });

  it("includes priority for each URL", () => {
    const routes: SitemapRoute[] = [{ path: "/", priority: 1.0 }];
    const xml = generateSitemap(routes, BASE_URL);
    expect(xml).toContain("<priority>1</priority>");
  });

  it("includes changefreq for each URL", () => {
    const routes: SitemapRoute[] = [{ path: "/", changefreq: "daily" }];
    const xml = generateSitemap(routes, BASE_URL);
    expect(xml).toContain("<changefreq>daily</changefreq>");
  });

  it("defaults changefreq to weekly when not specified", () => {
    const routes: SitemapRoute[] = [{ path: "/" }];
    const xml = generateSitemap(routes, BASE_URL);
    expect(xml).toContain("<changefreq>weekly</changefreq>");
  });
});

// ─── getCRMRoutes Tests ───────────────────────────────────────────────────────

describe("getCRMRoutes function", () => {
  let routes: SitemapRoute[];

  beforeEach(() => {
    routes = getCRMRoutes();
  });

  it("returns an array of routes", () => {
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);
  });

  it("includes root path with priority 1.0", () => {
    const root = routes.find((r) => r.path === "/");
    expect(root).toBeDefined();
    expect(root?.priority).toBe(1.0);
  });

  it("includes all 12 competitor routes", () => {
    const competitors = [
      "hubspot", "zoho", "monday", "salesforce",
      "pipedrive", "freshdesk", "zendesk", "clickup",
      "notion", "asana", "odoo", "servicenow",
    ];
    competitors.forEach((c) => {
      const route = routes.find((r) => r.path === `/vs/${c}`);
      expect(route).toBeDefined();
    });
  });

  it("competitor pages have priority 0.85", () => {
    const vsRoutes = routes.filter((r) => r.path.startsWith("/vs/"));
    expect(vsRoutes.length).toBe(12);
    vsRoutes.forEach((r) => {
      expect(r.priority).toBe(0.85);
    });
  });

  it("blog post routes have priority 0.75", () => {
    const blogRoutes = routes.filter((r) => r.path.startsWith("/blog/"));
    expect(blogRoutes.length).toBeGreaterThan(0);
    blogRoutes.forEach((r) => {
      expect(r.priority).toBe(0.75);
    });
  });

  it("blog post routes have lastmod dates", () => {
    const blogRoutes = routes.filter((r) => r.path.startsWith("/blog/"));
    blogRoutes.forEach((r) => {
      expect(r.lastmod).toBeDefined();
      expect(r.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("includes /pricing with priority 0.9", () => {
    const pricing = routes.find((r) => r.path === "/pricing");
    expect(pricing).toBeDefined();
    expect(pricing?.priority).toBe(0.9);
  });

  it("includes /blog route with priority 0.9", () => {
    const blog = routes.find((r) => r.path === "/blog");
    expect(blog).toBeDefined();
    expect(blog?.priority).toBe(0.9);
  });

  it("includes /about with priority 0.7", () => {
    const about = routes.find((r) => r.path === "/about");
    expect(about).toBeDefined();
    expect(about?.priority).toBe(0.7);
  });

  it("includes industry routes", () => {
    const industryRoutes = routes.filter((r) => r.path.startsWith("/industries/"));
    expect(industryRoutes.length).toBeGreaterThan(0);
  });

  it("total route count is correct (static + blog + vs + industry)", () => {
    const staticCount = 14; // From getCRMRoutes staticRoutes
    const vsCount = 12;
    const industryCount = 8;
    const blogCount = routes.filter((r) => r.path.startsWith("/blog/")).length;

    expect(routes.length).toBe(staticCount + vsCount + industryCount + blogCount);
  });

  it("every route has a path starting with /", () => {
    routes.forEach((r) => {
      expect(r.path).toMatch(/^\//);
    });
  });

  it("every route has a defined priority", () => {
    routes.forEach((r) => {
      expect(typeof r.priority).toBe("number");
      expect(r.priority).toBeGreaterThan(0);
      expect(r.priority).toBeLessThanOrEqual(1.0);
    });
  });
});

// ─── generateSitemap with getCRMRoutes integration ───────────────────────────

describe("generateSitemap integration with getCRMRoutes", () => {
  it("generates valid XML for all CRM routes", () => {
    const routes = getCRMRoutes();
    const xml = generateSitemap(routes, BASE_URL);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain(`<loc>${BASE_URL}/</loc>`);
  });

  it("generated XML contains correct number of <url> entries", () => {
    const routes = getCRMRoutes();
    const xml = generateSitemap(routes, BASE_URL);
    const matches = xml.match(/<url>/g);
    expect(matches?.length).toBe(routes.length);
  });

  it("competitor pages appear in generated XML", () => {
    const routes = getCRMRoutes();
    const xml = generateSitemap(routes, BASE_URL);
    expect(xml).toContain(`${BASE_URL}/vs/hubspot`);
    expect(xml).toContain(`${BASE_URL}/vs/salesforce`);
  });
});

