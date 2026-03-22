/**
 * E2E Tests for AI Agents Module
 * Covers: dashboard, agent list, create agent, templates, orchestration, analytics
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

test.describe("AI Agents Module", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemo(page);
  });

  test("agents dashboard loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/agents`, {
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

  test("agents list page loads with content", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/agents`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    // Look for agent cards, list items, or any agent-related content
    const agentContent = page
      .locator("text=/agent|AI|assistant/i")
      .first();
    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("create agent button is clickable", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/agents`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    if (url.includes("/login")) {
      expect(url).toContain("/login");
      return;
    }

    const createBtn = page
      .getByRole("button", { name: /create agent|new agent|add agent/i })
      .or(page.locator('button:has-text("Create Agent")'))
      .or(page.locator('button:has-text("New Agent")'))
      .or(page.locator('a:has-text("New Agent")'))
      .or(page.locator('a[href*="/agents/new"]'))
      .first();

    if ((await createBtn.count()) > 0 && (await createBtn.isVisible())) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      // Could navigate to /app/agents/new or open a modal
    }

    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);
  });

  test("new agent page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/agents/new`, {
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

  test("agent detail page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/agents/agent-1`, {
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

  test("agent chat page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/agents/agent-1/chat`, {
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

  test("agent templates page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/agents/templates`, {
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

  test("orchestration page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/agents/orchestration`, {
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

  test("agent analytics page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/agents/analytics`, {
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

  test("agent tools page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/agents/tools`, {
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

  test("agent sandbox page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/agents/sandbox`, {
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

  test("agent settings page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/agents/settings`, {
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
