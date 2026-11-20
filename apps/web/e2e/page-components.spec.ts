import { test, expect } from "@playwright/test";

test.describe("Agents Page - Unit", () => {
  test("should render agents page", async ({ page }) => {
    await page.goto("/app/agents");
    await expect(page.getByText("AI Agents")).toBeVisible();
  });

  test("should render agents list", async ({ page }) => {
    await page.goto("/app/agents");
    await expect(page.getByText("All Agents")).toBeVisible();
  });
});

test.describe("Monitoring Page - Unit", () => {
  test("should render monitoring page", async ({ page }) => {
    await page.goto("/app/monitoring");
    await expect(page.getByText("Monitoring")).toBeVisible();
  });

  test("should render dashboard tab", async ({ page }) => {
    await page.goto("/app/monitoring");
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("should render analytics tab", async ({ page }) => {
    await page.goto("/app/monitoring/analytics");
    await expect(page.getByText("Analytics")).toBeVisible();
  });
});

test.describe("Integration Page - Unit", () => {
  test("should render integration page", async ({ page }) => {
    await page.goto("/app/integration");
    await expect(page.getByText("Integration Hub")).toBeVisible();
  });

  test("should render overview tab", async ({ page }) => {
    await page.goto("/app/integration");
    await expect(page.getByText("Overview")).toBeVisible();
  });
});
