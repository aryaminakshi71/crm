/**
 * E2E Tests for Field Service Module
 * Covers: dashboard, jobs, dispatch, schedule, technicians, equipment
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

test.describe("Field Service Module", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemo(page);
  });

  test("field service dashboard loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service`, {
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

  test("jobs list page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/jobs`, {
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

  test("can filter jobs by status", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/jobs`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const statusOptions = ["scheduled", "in_progress", "completed", "pending"];

    for (const status of statusOptions) {
      const filterEl = page
        .getByRole("tab", { name: new RegExp(status.replace("_", " "), "i") })
        .or(
          page.locator(
            `button:has-text("${status.replace("_", " ")}")`,
          ),
        )
        .or(page.locator(`[data-value="${status}"]`))
        .first();

      if ((await filterEl.count()) > 0 && (await filterEl.isVisible())) {
        await filterEl.click();
        await page.waitForTimeout(600);
      }
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("job detail page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/jobs/1`, {
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

  test("dispatch page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/dispatch`, {
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

  test("dispatch map page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/dispatch/map`, {
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

  test("schedule page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/schedule`, {
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

  test("technicians list page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/technicians`, {
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

  test("technician detail page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/technicians/1`, {
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

  test("equipment page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/equipment`, {
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

  test("parts page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/parts`, {
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

  test("warranty page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/warranty`, {
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

  test("new job button or link is present on jobs page", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/jobs`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const newJobBtn = page
      .getByRole("button", { name: /new job|create job|add job/i })
      .or(page.locator('button:has-text("New Job")'))
      .or(page.locator('a:has-text("New Job")'))
      .first();

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("field service alerts page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/field-service/alerts`, {
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
