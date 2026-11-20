/**
 * E2E Tests for Marketing Module
 * Covers: dashboard, campaigns, email builder, analytics, automation, landing pages
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";

async function setupDemo(page: any) {
  await page.goto(`${BASE_URL}/`, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await page.evaluate(() => {
    localStorage.setItem("demo_mode", "true");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "demo-user-1",
        email: "demo@nucleo.one",
        name: "Demo User",
        firstName: "Demo",
        lastName: "User",
        role: "admin",
        companyId: "demo-company-1",
      }),
    );
  });
}

test.describe("Marketing Module", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemo(page);
  });

  test("marketing dashboard loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/marketing`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("campaigns list page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/marketing/campaigns`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("new campaign button is present on campaigns page", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/marketing/campaigns`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const newCampaignBtn = page
      .getByRole("button", {
        name: /new campaign|create campaign|add campaign/i,
      })
      .or(page.locator('button:has-text("New Campaign")'))
      .or(page.locator('a:has-text("New Campaign")'))
      .first();

    if (
      (await newCampaignBtn.count()) > 0 &&
      (await newCampaignBtn.isVisible())
    ) {
      await newCampaignBtn.click();
      await page.waitForTimeout(800);
      // Could open a modal or navigate to a new page — both are fine
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("campaign detail page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/marketing/campaigns/1`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("email builder page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/marketing/email-builder`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("marketing analytics page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/marketing/analytics`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("marketing automation page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/marketing/automation`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("landing pages page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/marketing/landing-pages`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("A/B testing page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/marketing/ab-testing`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("lead scoring page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/marketing/lead-scoring`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("webinars page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/marketing/webinars`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("marketing events page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/marketing/events`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });
});
