/**
 * Link & Page Smoke Tests
 *
 * Validates core public and app routes respond without 5xx errors.
 * Link crawling is covered by link-crawl.spec.ts.
 */

import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/demo",
  "/about",
  "/contact",
  "/docs",
  "/support",
  "/privacy",
  "/terms",
  "/forgot-password",
  "/industries",
];

const appRoutes = [
  "/app",
  "/app/contacts",
  "/app/deals",
  "/app/leads",
  "/app/activities",
  "/app/marketing",
  "/app/settings",
];

async function expectRouteOk(page: any, route: string) {
  const response = await page.goto(`${BASE_URL}${route}`, {
    waitUntil: "domcontentloaded",
  });
  const status = response?.status() ?? 0;
  expect(status, `${route} returned status ${status}`).toBeLessThan(500);
}

test.describe("Public Routes", () => {
  for (const route of publicRoutes) {
    test(`loads ${route}`, async ({ page }) => {
      await expectRouteOk(page, route);
    });
  }
});

test.describe("App Routes (Demo Mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const demoUserData = {
        id: "demo-user",
        email: "demo@nucleo.one",
        name: "Demo User",
        firstName: "Demo",
        lastName: "User",
        role: "admin",
        companyId: "demo-company",
        isDemo: true,
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem("user", JSON.stringify(demoUserData));
      window.localStorage.setItem("isDemo", "true");
      window.localStorage.setItem("demo_mode", "true");
      window.localStorage.setItem("accessToken", "demo-token");
      window.localStorage.setItem("companyId", "demo-company");
    });
  });

  for (const route of appRoutes) {
    test(`loads ${route}`, async ({ page }) => {
      await expectRouteOk(page, route);
    });
  }
});

test("404 route does not 5xx", async ({ page }) => {
  const response = await page.goto(`${BASE_URL}/nonexistent-route`, {
    waitUntil: "domcontentloaded",
  });
  const status = response?.status() ?? 0;
  expect(status).toBeLessThan(500);
});
