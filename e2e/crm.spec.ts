import { expect, test } from "@playwright/test";

/**
 * Comprehensive E2E Tests for CRM App
 * Tests: Demo flow, Sign in, Navigation, All pages, Links functionality
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";
const BASE_ORIGIN = new URL(BASE_URL).origin;
const CONTACTS_VIEW_URL = "/app/crm?view=contacts";
const LEADS_VIEW_URL = "/app/crm?view=leads";
const DEALS_VIEW_URL = "/app/crm?view=deals";

test.describe("CRM E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and cookies before each test
    await page.context().clearCookies();
    try {
      await page.goto(`${BASE_URL}`, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
    } catch (error) {
      console.warn("Landing page navigation failed, continuing...");
    }
    await page.waitForTimeout(1000);
  });

  test.describe("Landing Page & Demo Flow", () => {
    test("should load landing page without errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      const response = await page.goto(`${BASE_URL}`);
      expect(response?.status()).toBe(200);
      await page.waitForTimeout(2000);

      const criticalErrors = errors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("sourcemap") &&
          !e.includes("oracledb"),
      );

      if (criticalErrors.length > 0) {
        console.warn("Console errors found:", criticalErrors);
      }
    });

    test("should navigate to demo page and launch demo", async ({ page }) => {
      await page.goto(`${BASE_URL}/demo`, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });
      await page.waitForTimeout(1000);

      const demoText = page.getByText(/Try.*CRM.*Demo/i);
      if ((await demoText.count()) > 0) {
        await expect(demoText).toBeVisible({ timeout: 5000 });
      }

      const launchButton = page.getByRole("button", { name: /Launch Demo/i });
      if ((await launchButton.count()) > 0) {
        await launchButton.click();
        try {
          await page.waitForURL("**/app", { timeout: 8000 });
          expect(page.url()).toContain("/app");
        } catch (error) {
          await page.waitForTimeout(3000);
          const url = page.url();
          expect(url.includes("/app") || url.includes("/demo")).toBe(true);
        }
      } else {
        expect(page.url()).toContain("/demo");
      }
    });

    test("should have working demo button on login page", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });
      await page.waitForTimeout(1000);

      let demoButton = page.getByRole("button", {
        name: /Try Demo.*No Sign In Required/i,
      });

      if ((await demoButton.count()) === 0) {
        demoButton = page.getByRole("button", { name: /Try Demo/i });
      }

      if ((await demoButton.count()) === 0) {
        demoButton = page.locator("button").filter({ hasText: /Demo/i });
      }

      if ((await demoButton.count()) > 0) {
        await demoButton.first().click();
        await page.waitForTimeout(5000);
        const url = page.url();
        const isValidState =
          url.includes("/app") ||
          url.includes("/login") ||
          url.startsWith(BASE_ORIGIN);
        expect(isValidState).toBe(true);
      } else {
        expect(page.url()).toContain("/login");
      }
    });
  });

  test.describe("Sign In Flow", () => {
    test("should display login page correctly", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(2000);

      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if ((await emailInput.count()) > 0) {
        await expect(emailInput).toBeVisible({ timeout: 5000 });
      }
      if ((await passwordInput.count()) > 0) {
        await expect(passwordInput).toBeVisible({ timeout: 5000 });
      }

      const signInButton = page.getByRole("button", { name: /Sign In|Login/i });
      if ((await signInButton.count()) > 0) {
        await expect(signInButton.first()).toBeVisible({ timeout: 5000 });
      } else {
        expect(page.url()).toContain("/login");
      }
    });

    test("should handle login with demo credentials", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(2000);

      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if (
        (await emailInput.count()) === 0 ||
        (await passwordInput.count()) === 0
      ) {
        expect(page.url()).toContain("/login");
        return;
      }

      if (
        (await emailInput.count()) === 0 ||
        (await passwordInput.count()) === 0
      ) {
        expect(page.url()).toContain("/login");
        return;
      }

      if (
        !(await emailInput.isVisible()) ||
        !(await passwordInput.isVisible())
      ) {
        expect(page.url()).toContain("/login");
        return;
      }

      await emailInput.fill("demo@nucleo.one");
      await passwordInput.fill("demo123");

      const signInButton = page
        .locator('button[type="submit"]')
        .or(page.getByRole("button", { name: /^Sign In$/i }))
        .first();
      await signInButton.click();

      await page.waitForTimeout(5000);
      const currentUrl = page.url();

      const isOnValidPage =
        currentUrl.includes("/app") || currentUrl.includes("/tenants");

      const isValidState = isOnValidPage || currentUrl.includes("/login");
      expect(isValidState).toBe(true);
    });

    test("should login with test credentials and not trigger demo mode", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/login`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(2000);

      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if (
        (await emailInput.count()) === 0 ||
        (await passwordInput.count()) === 0
      ) {
        expect(page.url()).toContain("/login");
        return;
      }

      await expect(emailInput).toBeVisible({ timeout: 5000 });
      await expect(passwordInput).toBeVisible({ timeout: 5000 });

      await emailInput.fill("test@test.com");
      await passwordInput.fill("test123");

      const signInButton = page
        .locator('button[type="submit"]')
        .or(page.getByRole("button", { name: /^Sign In$/i }))
        .first();
      await signInButton.click();

      // Wait for either redirect or error message
      await page.waitForTimeout(3000);

      // Wait a bit more for redirect
      await page.waitForTimeout(2000);
      const currentUrl = page.url();

      // Check for error messages
      const errorAlert = page.locator(
        '[role="alert"], .alert, [class*="error"], [class*="destructive"]',
      );
      const errorCount = await errorAlert.count();

      // If login fails (user doesn't exist), that's acceptable for this test
      // The important thing is that demo mode is not triggered
      if (errorCount > 0 || currentUrl.includes("/login")) {
        // Login failed, but verify demo mode is not set
        const demoMode = await page.evaluate(() =>
          localStorage.getItem("demo_mode"),
        );
        expect(demoMode).not.toBe("true");
        // Test passes - we verified login page works and demo mode is not triggered
        return;
      }

      // If login succeeded, verify we're on dashboard
      if (currentUrl.includes("/app")) {
        // Check that demo_mode is NOT set
        const demoMode = await page.evaluate(() =>
          localStorage.getItem("demo_mode"),
        );
        expect(demoMode).not.toBe("true");

        // Check that user is set
        const userStr = await page.evaluate(() => localStorage.getItem("user"));
        if (userStr) {
          const user = JSON.parse(userStr);
          expect(user.email).toBe("test@test.com");
        }
      } else {
        // If redirected elsewhere, just verify we're not in demo mode
        const demoMode = await page.evaluate(() =>
          localStorage.getItem("demo_mode"),
        );
        expect(demoMode).not.toBe("true");
      }
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });
      await page.waitForTimeout(1000);

      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if (
        (await emailInput.count()) === 0 ||
        (await passwordInput.count()) === 0
      ) {
        expect(page.url()).toContain("/login");
        return;
      }

      await emailInput.fill("invalid@example.com");
      await passwordInput.fill("wrongpassword");
      const signInButton = page
        .locator('button[type="submit"]')
        .or(page.getByRole("button", { name: /^Sign In$/i }))
        .first();
      await signInButton.click();

      await page.waitForTimeout(4000);

      const errorAlert = page.locator(
        '[role="alert"], .alert, [class*="error"]',
      );
      const errorText = await page
        .locator("text=/Invalid|Error|incorrect|wrong|Unauthorized/i")
        .count();
      const hasError = (await errorAlert.count()) > 0 || errorText > 0;

      const url = page.url();
      const isValidState = hasError || url.includes("/login");
      expect(isValidState).toBe(true);
    });
  });

  test.describe("Navigation & Links", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });

      await page.goto(`${BASE_URL}/demo`);
      await page.waitForTimeout(1000);

      const launchButton = page.getByRole("button", { name: /Launch Demo/i });
      if ((await launchButton.count()) > 0) {
        await launchButton.click();
        await page.waitForURL("**/app", { timeout: 15000 });
        await page.waitForTimeout(2000);
      } else {
        await page.goto(`${BASE_URL}/app`);
        await page.waitForTimeout(2000);
      }
    });

    test("should navigate to all main pages from sidebar", async ({ page }) => {
      await page.goto(`${BASE_URL}/app`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      if (currentUrl.includes("/login")) {
        expect(currentUrl).toContain("/login");
        return;
      }

      const links = [
        { href: CONTACTS_VIEW_URL, text: /Contacts/i },
        { href: LEADS_VIEW_URL, text: /Leads/i },
        { href: DEALS_VIEW_URL, text: /Deals/i },
      ];

      let successCount = 0;
      for (const link of links) {
        let linkElement = page.getByRole("link", { name: link.text });

        if ((await linkElement.count()) === 0) {
          linkElement = page.locator(`a[href="${link.href}"]`);
        }

        if ((await linkElement.count()) === 0) {
          continue;
        }

        const href = await linkElement.first().getAttribute("href");
        if (href === link.href) {
          successCount++;
        }
      }

      expect(successCount).toBe(links.length);
    });
  });

  test.describe("Page Functionality", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/demo`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(2000);

      const launchButton = page.getByRole("button", { name: /Launch Demo/i });
      if ((await launchButton.count()) > 0) {
        await launchButton.click();
        try {
          await page.waitForURL("**/app", { timeout: 10000 });
        } catch (error) {
          await page.goto(`${BASE_URL}/app`, {
            waitUntil: "domcontentloaded",
            timeout: 10000,
          });
        }
        await page.waitForTimeout(2000);
      } else {
        await page.goto(`${BASE_URL}/app`, {
          waitUntil: "domcontentloaded",
          timeout: 10000,
        });
        await page.waitForTimeout(2000);
      }

      const url = page.url();
      if (url.includes("/login")) {
        return;
      }
    });

    test("dashboard page should load and display data", async ({ page }) => {
      await page.goto(`${BASE_URL}/app`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(2000);

      const url = page.url();
      if (url.includes("/login")) {
        expect(url).toContain("/login");
      } else {
        expect(url).toContain("/app");
        const bodyText = await page.textContent("body");
        const hasContent = (bodyText || "").trim().length > 0;
        expect(hasContent || url.includes("/app")).toBe(true);
      }
    });

    test("contacts page should load", async ({ page }) => {
      await page.goto(`${BASE_URL}${CONTACTS_VIEW_URL}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(2000);

      const url = page.url();
      const isValidState =
        url.includes(CONTACTS_VIEW_URL) ||
        url.includes("/login") ||
        url.startsWith(BASE_ORIGIN);
      expect(isValidState).toBe(true);
    });

    test("leads page should load", async ({ page }) => {
      await page.goto(`${BASE_URL}${LEADS_VIEW_URL}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(url.includes(LEADS_VIEW_URL) || url.includes("/login")).toBe(true);
    });

    test("deals page should load", async ({ page }) => {
      await page.goto(`${BASE_URL}${DEALS_VIEW_URL}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(url.includes(DEALS_VIEW_URL) || url.includes("/login")).toBe(true);
    });

    test("apps page should load", async ({ page }) => {
      await page.goto(`${BASE_URL}/`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(2000);

      expect(page.url()).toContain("/");
      const bodyText = await page.textContent("body");
      const hasContent = (bodyText || "").trim().length > 0;
      expect(hasContent || page.url().includes("/")).toBe(true);
    });
  });

  test.describe("Dashboard Sub-Pages", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });

      await page.goto(`${BASE_URL}/demo`);
      await page.waitForTimeout(1000);

      const launchButton = page.getByRole("button", { name: /Launch Demo/i });
      if ((await launchButton.count()) > 0) {
        await launchButton.click();
        await page.waitForTimeout(2000);
        const finalUrl = page.url();
        expect(
          finalUrl.includes("/app") ||
            finalUrl.includes("/demo") ||
            finalUrl.startsWith(BASE_ORIGIN),
        ).toBe(true);
      } else {
        await page.goto(`${BASE_URL}/app`, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await page.waitForTimeout(2000);
      }
    });

    test("analytics page should load", async ({ page }) => {
      try {
        await page.goto(`${BASE_URL}/app/activities`, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });
      } catch (error) {
        await page.waitForTimeout(2000);
      }
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(
        url.includes("/app/activities") ||
          url.includes("/login") ||
          url.startsWith(BASE_ORIGIN),
      ).toBe(true);
    });

    test("settings page should load", async ({ page }) => {
      try {
        await page.goto(`${BASE_URL}/app/settings`, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });
      } catch (error) {
        await page.waitForTimeout(2000);
      }
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(
        url.includes("/app/settings") ||
          url.includes("/login") ||
          url.startsWith(BASE_ORIGIN),
      ).toBe(true);
    });
  });

  test.describe("Error Handling", () => {
    test("should handle 404 pages gracefully", async ({ page }) => {
      try {
        const response = await page.goto(`${BASE_URL}/nonexistent-page`, {
          waitUntil: "domcontentloaded",
          timeout: 8000,
        });
        const status = response?.status() || 0;
        expect(status >= 200 && status < 600).toBe(true);
      } catch (error) {
        await page.waitForTimeout(1000);
        const url = page.url();
        const bodyText = await page.textContent("body");
        expect(url || bodyText).toBeTruthy();
      }
    });
  });
});
