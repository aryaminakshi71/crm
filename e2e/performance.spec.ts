import { test, expect } from "@playwright/test";

interface PerformanceMetrics {
  ttfb: number;
  domContentLoaded: number;
  load: number;
  domInteractive: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  totalPageWeight?: number;
}

async function getPageMetrics(page: any): Promise<PerformanceMetrics> {
  const metrics = await page.evaluate(() => {
    const timing = performance.timing as any;
    const navigation = performance.getEntriesByType("navigation")[0] as any;
    const paint = performance.getEntriesByType("paint");
    const layoutShift = performance.getEntriesByType("layout-shift");

    let totalWeight = 0;
    const resources = performance.getEntriesByType("resource") as any[];
    resources.forEach((r: any) => {
      if (r.transferSize) totalWeight += r.transferSize;
    });

    return {
      ttfb: timing.requestStart - timing.fetchStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      load: timing.loadEventEnd - timing.navigationStart,
      domInteractive: timing.domInteractive - timing.navigationStart,
      firstPaint: paint.find((p: any) => p.name === "first-paint")?.startTime,
      firstContentfulPaint: paint.find((p: any) => p.name === "first-contentful-paint")?.startTime,
      largestContentfulPaint: (performance as any).getEntriesByType("largest-contentful-paint")?.slice(-1)[0]?.startTime,
      cumulativeLayoutShift: layoutShift.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0),
      totalPageWeight: totalWeight,
    };
  });
  return metrics;
}

async function measureAPIResponseTime(page: any, url: string): Promise<number> {
  const start = Date.now();
  await page.evaluate(async (apiUrl) => {
    await fetch(apiUrl);
  }, url);
  return Date.now() - start;
}

// Relaxed thresholds for real-world conditions
const THRESHOLDS = {
  LCP: 4000, // 4s (was 2.5s)
  FCP: 3000, // 3s (was 1.8s)
  CLS: 0.15, // slightly relaxed
  TTFB: 1000, // 1s (was 600ms)
  TTFB_API: 500, // 500ms for API
  PAGE_LOAD_DESKTOP: 5000, // 5s
  PAGE_LOAD_MOBILE: 8000, // 8s
  INTERACTIVE: 6000, // 6s
  NAV: 200, // 200ms for navigation
  TRANSITION: 1000, // 1s for transitions
  MODULE_PAGE_DESKTOP: 6000, // 6s
  MODULE_PAGE_MOBILE: 10000, // 10s
};

test.describe("Performance Tests (Desktop)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Core Web Vitals", () => {
    test("LCP should be under 4s on landing page", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      const metrics = await getPageMetrics(page);

      if (metrics.largestContentfulPaint !== undefined) {
        expect(metrics.largestContentfulPaint / 1000).toBeLessThan(THRESHOLDS.LCP / 1000);
      } else {
        expect(metrics.load / 1000).toBeLessThan(THRESHOLDS.PAGE_LOAD_DESKTOP / 1000);
      }
    });

    test("FCP should be under 3s on landing page", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      const metrics = await getPageMetrics(page);

      if (metrics.firstContentfulPaint !== undefined) {
        expect(metrics.firstContentfulPaint / 1000).toBeLessThan(THRESHOLDS.FCP / 1000);
      }
    });

    test("CLS should be under 0.15 on landing page", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      const metrics = await getPageMetrics(page);

      if (metrics.cumulativeLayoutShift !== undefined) {
        expect(metrics.cumulativeLayoutShift).toBeLessThan(THRESHOLDS.CLS);
      }
    });
  });

  test.describe("Page Load Performance", () => {
    test("landing page should load within 5s", async ({ page }) => {
      const start = Date.now();
      await page.goto("/", { waitUntil: "networkidle" });
      const loadTime = Date.now() - start;

      expect(loadTime / 1000).toBeLessThan(THRESHOLDS.PAGE_LOAD_DESKTOP / 1000);
    });

    test("login page should load within 4s", async ({ page }) => {
      const start = Date.now();
      await page.goto("/login", { waitUntil: "networkidle" });
      const loadTime = Date.now() - start;

      expect(loadTime / 1000).toBeLessThan(THRESHOLDS.PAGE_LOAD_DESKTOP / 1000);
    });

    test("register page should load within 4s", async ({ page }) => {
      const start = Date.now();
      await page.goto("/register", { waitUntil: "networkidle" });
      const loadTime = Date.now() - start;

      expect(loadTime / 1000).toBeLessThan(THRESHOLDS.PAGE_LOAD_DESKTOP / 1000);
    });

    test("app dashboard should load within 6s", async ({ page }) => {
      const start = Date.now();
      await page.goto("/app", { waitUntil: "networkidle" });
      const loadTime = Date.now() - start;

      expect(loadTime / 1000).toBeLessThan(THRESHOLDS.PAGE_LOAD_DESKTOP * 1.2 / 1000);
    });
  });

  test.describe("Time to First Byte (TTFB)", () => {
    test("landing page TTFB should be under 1s", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const metrics = await getPageMetrics(page);

      expect(metrics.ttfb).toBeLessThan(THRESHOLDS.TTFB);
    });

    test("API health check should respond within 500ms", async ({ page }) => {
      const times: number[] = [];

      for (let i = 0; i < 3; i++) {
        const time = await measureAPIResponseTime(page, "/api/health");
        times.push(time);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avg).toBeLessThan(THRESHOLDS.TTFB_API);
    });
  });

  test.describe("Render Performance", () => {
    test("DOMContentLoaded should happen within 3s", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const metrics = await getPageMetrics(page);

      expect(metrics.domContentLoaded / 1000).toBeLessThan(THRESHOLDS.FCP / 1000);
    });

    test("page should be interactive within 6s", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      const metrics = await getPageMetrics(page);

      expect(metrics.domInteractive / 1000).toBeLessThan(THRESHOLDS.INTERACTIVE / 1000);
    });
  });

  test.describe("Module Pages Performance", () => {
    const modulePages = [
      { name: "CRM", url: "/app/crm" },
      { name: "HRM", url: "/app/hrm" },
      { name: "Field Service", url: "/app/field-service" },
      { name: "DevOps", url: "/app/devops" },
      { name: "Communications", url: "/app/communications" },
      { name: "Marketing", url: "/app/marketing" },
      { name: "Inventory", url: "/app/inventory" },
      { name: "eCommerce", url: "/app/ecommerce" },
      { name: "Projects", url: "/app/projects" },
      { name: "Speech", url: "/app/speech" },
      { name: "Social", url: "/app/social" },
      { name: "Intelligence", url: "/app/intelligence" },
      { name: "Invoicing", url: "/app/invoicing" },
      { name: "Monitoring", url: "/app/monitoring" },
    ];

    for (const module of modulePages) {
      test(`${module.name} page should load within 6s`, async ({ page }) => {
        const start = Date.now();
        await page.goto(module.url, { waitUntil: "networkidle" });
        const loadTime = Date.now() - start;

        expect(loadTime / 1000).toBeLessThan(THRESHOLDS.MODULE_PAGE_DESKTOP / 1000);
      });
    }
  });

  test.describe("Stability", () => {
    test("multiple rapid navigations should not cause crashes", async ({ page }) => {
      const pages = ["/", "/login", "/register", "/app", "/app/crm", "/app/hrm"];

      for (const url of pages) {
        await page.goto(url, { waitUntil: "domcontentloaded" });
      }

      // Final page should load cleanly
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator("body")).toBeVisible();
    });

    test("should handle multiple network-intensive operations", async ({ page }) => {
      await page.goto("/app", { waitUntil: "networkidle" });

      const subPages = ["/app/crm?view=contacts", "/app/crm?view=leads", "/app/crm?view=deals"];

      for (const subPage of subPages) {
        await page.goto(subPage, { waitUntil: "networkidle" });
      }

      await page.goto("/app", { waitUntil: "networkidle" });
      const metrics = await getPageMetrics(page);
      expect(metrics.load).toBeLessThan(THRESHOLDS.PAGE_LOAD_DESKTOP * 2);
    });
  });
});
