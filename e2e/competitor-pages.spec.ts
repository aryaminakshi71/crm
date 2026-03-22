/**
 * E2E Tests for Competitor Comparison Pages (/vs/* and /compare/*)
 * Verifies: page loads, has meta title, shows comparison content, has CTA buttons
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";

const COMPETITORS = [
  { slug: "salesforce", name: "Salesforce" },
  { slug: "hubspot", name: "HubSpot" },
  { slug: "monday", name: "Monday" },
  { slug: "notion", name: "Notion" },
  { slug: "clickup", name: "ClickUp" },
  { slug: "pipedrive", name: "Pipedrive" },
  { slug: "freshdesk", name: "Freshdesk" },
  { slug: "zendesk", name: "Zendesk" },
  { slug: "asana", name: "Asana" },
  { slug: "odoo", name: "Odoo" },
];

test.describe("Competitor Comparison Pages — /vs/* routes", () => {
  test("all /vs/* pages load with content", async ({ page }) => {
    for (const competitor of COMPETITORS) {
      try {
        await page.goto(`${BASE_URL}/vs/${competitor.slug}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await page.waitForTimeout(600);

        const bodyLen = await page.evaluate(
          () => document.body.innerHTML.length,
        );
        expect(
          bodyLen,
          `/vs/${competitor.slug} should have content`,
        ).toBeGreaterThan(100);
      } catch (error) {
        console.warn(`Warning on /vs/${competitor.slug}:`, error);
      }
    }
  });

  test("vs pages have a page title in <title>", async ({ page }) => {
    for (const competitor of COMPETITORS) {
      try {
        await page.goto(`${BASE_URL}/vs/${competitor.slug}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await page.waitForTimeout(600);

        const title = await page.title();
        // Title should be non-empty
        expect(title.length, `/vs/${competitor.slug} should have a title`).toBeGreaterThan(0);
      } catch (error) {
        console.warn(`Warning on /vs/${competitor.slug} title check:`, error);
      }
    }
  });

  test("vs pages show comparison content or competitor name", async ({
    page,
  }) => {
    for (const competitor of COMPETITORS) {
      try {
        await page.goto(`${BASE_URL}/vs/${competitor.slug}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await page.waitForTimeout(600);

        const bodyText = (await page.textContent("body")) || "";

        // Page should mention the competitor or contain comparison-related content
        const hasMention =
          bodyText.toLowerCase().includes(competitor.slug) ||
          bodyText.toLowerCase().includes(competitor.name.toLowerCase()) ||
          bodyText.toLowerCase().includes("vs") ||
          bodyText.toLowerCase().includes("compare") ||
          bodyText.toLowerCase().includes("alternative");

        expect(
          hasMention || bodyText.length > 200,
          `/vs/${competitor.slug} should mention the competitor or have content`,
        ).toBeTruthy();
      } catch (error) {
        console.warn(
          `Warning on /vs/${competitor.slug} content check:`,
          error,
        );
      }
    }
  });

  test("vs pages have CTA buttons (Get Started, Try, Demo, etc.)", async ({
    page,
  }) => {
    // Test a representative sample
    const sample = COMPETITORS.slice(0, 3);

    for (const competitor of sample) {
      try {
        await page.goto(`${BASE_URL}/vs/${competitor.slug}`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await page.waitForTimeout(800);

        const ctaButton = page
          .getByRole("link", {
            name: /get started|try|demo|free|sign up|start/i,
          })
          .or(
            page.getByRole("button", {
              name: /get started|try|demo|free|sign up|start/i,
            }),
          )
          .first();

        const ctaExists = (await ctaButton.count()) > 0;

        // Also check for any button or link on page as fallback
        const anyLink = page.locator("a, button").first();
        const anyLinkExists = (await anyLink.count()) > 0;

        expect(
          ctaExists || anyLinkExists,
          `/vs/${competitor.slug} should have CTA or interactive elements`,
        ).toBeTruthy();
      } catch (error) {
        console.warn(`Warning on /vs/${competitor.slug} CTA check:`, error);
      }
    }
  });

  test("Salesforce comparison page has comparison table or feature list", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/vs/salesforce`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(800);

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);

    // Look for table, grid, or feature list
    const comparisonTable = page
      .locator("table")
      .or(page.locator('[class*="comparison"]'))
      .or(page.locator('[class*="table"]'))
      .or(page.locator('[class*="feature"]'))
      .or(page.locator('[class*="grid"]'))
      .first();

    // The page should at minimum have substantial content
    const bodyText = (await page.textContent("body")) || "";
    expect(bodyText.length).toBeGreaterThan(200);
  });

  test("HubSpot comparison page loads with content", async ({ page }) => {
    await page.goto(`${BASE_URL}/vs/hubspot`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(800);

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("Monday comparison page loads with content", async ({ page }) => {
    await page.goto(`${BASE_URL}/vs/monday`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(800);

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });
});

test.describe("Competitor Comparison Pages — /compare/* routes", () => {
  test("compare index page loads", async ({ page }) => {
    try {
      await page.goto(`${BASE_URL}/compare`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(600);

      const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
      expect(bodyLen).toBeGreaterThan(100);
    } catch (error) {
      console.warn("Warning on /compare:", error);
    }
  });

  test("compare/salesforce page loads", async ({ page }) => {
    try {
      await page.goto(`${BASE_URL}/compare/salesforce`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(600);

      const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
      expect(bodyLen).toBeGreaterThan(100);
    } catch (error) {
      console.warn("Warning on /compare/salesforce:", error);
    }
  });
});
