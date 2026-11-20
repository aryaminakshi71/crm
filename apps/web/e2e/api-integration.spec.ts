import { test, expect, request } from "@playwright/test";

const API_BASE = "http://localhost:8787";

test.describe("Integration API", () => {
  test("GET /api/health should return ok status", async () => {
    const context = await request.newContext();
    const response = await context.get(`${API_BASE}/api/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("GET /api/rpc should respond", async () => {
    const context = await request.newContext();
    const response = await context.get(`${API_BASE}/api/rpc`);
    // Should return 401 without auth but still respond
    expect(response.status()).toBeTruthy();
  });
});

test.describe("API Authentication", () => {
  test("should require authentication for protected routes", async () => {
    const context = await request.newContext();

    // Test integration endpoint without auth
    const response = await context.get(`${API_BASE}/api/rpc/integration/listConnectors`);
    const body = await response.json();

    // Should return unauthorized
    expect(body.code).toBe("UNAUTHORIZED");
    expect(response.status()).toBe(401);
  });
});

test.describe("Platform Navigation", () => {
  test("should have Integration Hub in navigation", async ({ page }) => {
    await page.goto("/app");
    const nav = page.locator("nav");
    await expect(nav.getByText("Integration Hub")).toBeVisible();
  });

  test("should have AI Agents in navigation", async ({ page }) => {
    await page.goto("/app");
    const nav = page.locator("nav");
    await expect(nav.getByText("AI Agents")).toBeVisible();
  });

  test("should have Monitoring in navigation", async ({ page }) => {
    await page.goto("/app");
    const nav = page.locator("nav");
    await expect(nav.getByText("Monitoring")).toBeVisible();
  });
});
