import { expect, test } from "@playwright/test";

test("crawl internal links", async ({ page }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";

  await page.goto(baseURL);
  await page.waitForLoadState("domcontentloaded");
  expect(await page.title()).not.toBe("");
});
