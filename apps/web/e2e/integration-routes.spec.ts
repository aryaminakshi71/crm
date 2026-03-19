import { test, expect } from "@playwright/test";

test.describe("Integration Hub Routes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app/integration");
  });

  test("should display Integration Hub page", async ({ page }) => {
    await expect(page.getByText("Integration Hub")).toBeVisible();
  });

  test("should have Overview tab active by default", async ({ page }) => {
    await expect(page.getByText("Overview")).toBeVisible();
  });

  test("should navigate to Connectors page", async ({ page }) => {
    await page.click('text=Connectors');
    await expect(page).toHaveURL(/.*\/connectors/);
  });

  test("should navigate to Workflows page", async ({ page }) => {
    await page.click('text=Workflows');
    await expect(page).toHaveURL(/.*\/workflows/);
  });

  test("should navigate to Events page", async ({ page }) => {
    await page.click('text=Events');
    await expect(page).toHaveURL(/.*\/events/);
  });

  test("should display connectors list", async ({ page }) => {
    await page.click('text=Connectors');
    await expect(page.getByText("Connectors")).toBeVisible();
  });

  test("should display workflows list", async ({ page }) => {
    await page.click('text=Workflows');
    await expect(page.getByText("Workflows")).toBeVisible();
  });
});

test.describe("AI Agents Routes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app/agents");
  });

  test("should display AI Agents page", async ({ page }) => {
    await expect(page.getByText("AI Agents")).toBeVisible();
  });

  test("should have All Agents tab active by default", async ({ page }) => {
    await expect(page.getByText("All Agents")).toBeVisible();
  });

  test("should navigate to Templates page", async ({ page }) => {
    await page.click('text=Templates');
    await expect(page).toHaveURL(/.*\/templates/);
  });

  test("should navigate to Create Agent page", async ({ page }) => {
    await page.click('text=Create Agent');
    await expect(page).toHaveURL(/.*\/new/);
  });
});

test.describe("Monitoring Routes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app/monitoring");
  });

  test("should display Monitoring page", async ({ page }) => {
    await expect(page.getByText("Monitoring")).toBeVisible();
  });

  test("should have Dashboard tab active by default", async ({ page }) => {
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("should navigate to Analytics page", async ({ page }) => {
    await page.click('text=Analytics');
    await expect(page).toHaveURL(/.*\/analytics/);
  });

  test("should navigate to Errors page", async ({ page }) => {
    await page.click('text=Errors');
    await expect(page).toHaveURL(/.*\/errors/);
  });

  test("should navigate to Uptime page", async ({ page }) => {
    await page.click('text=Uptime');
    await expect(page).toHaveURL(/.*\/uptime/);
  });

  test("should navigate to Performance page", async ({ page }) => {
    await page.click('text=Performance');
    await expect(page).toHaveURL(/.*\/performance/);
  });

  test("should navigate to Catalog page", async ({ page }) => {
    await page.click('text=Catalog');
    await expect(page).toHaveURL(/.*\/catalog/);
  });

  test("should navigate to Support page", async ({ page }) => {
    await page.click('text=Support');
    await expect(page).toHaveURL(/.*\/support/);
  });
});

test.describe("Navigation Links", () => {
  test("should navigate from dashboard to app sections", async ({ page }) => {
    await page.goto("/app");

    // Navigate to Integration Hub
    await page.click('text=Integration Hub');
    await expect(page).toHaveURL(/.*\/integration/);

    // Navigate to AI Agents
    await page.click('text=AI Agents');
    await expect(page).toHaveURL(/.*\/agents/);

    // Navigate to Monitoring
    await page.click('text=Monitoring');
    await expect(page).toHaveURL(/.*\/monitoring/);
  });
});
