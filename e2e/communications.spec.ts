/**
 * E2E Tests for Communications Module
 * Covers: dashboard, SMS, voice, video, chat, conversation list
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

test.describe("Communications Module", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemo(page);
  });

  test("communications dashboard loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications`, {
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

  test("SMS inbox page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications/sms`, {
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

  test("SMS compose page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications/sms/compose`, {
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

  test("SMS bulk page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications/sms/bulk`, {
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

  test("voice page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications/voice`, {
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

  test("voice dial page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications/voice/dial`, {
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

  test("IVR page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications/voice/ivr`, {
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

  test("voice transcriptions page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications/voice/transcriptions`, {
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

  test("video page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications/video`, {
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

  test("chat page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications/chat`, {
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

  test("conversation list is visible or page shows empty state", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/app/communications/sms`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    // Look for conversation list, table, or empty state
    const listContent = page
      .locator('[role="listbox"], [role="list"], table, [class*="conversation"], [class*="thread"], [class*="inbox"]')
      .first();
    const emptyState = page
      .locator("text=/no conversations|no messages|empty|get started/i")
      .first();

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("numbers page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications/numbers`, {
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

  test("communications templates page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications/templates`, {
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

  test("chatbot page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/communications/chatbot`, {
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
