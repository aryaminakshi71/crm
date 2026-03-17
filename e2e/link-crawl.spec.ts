import { expect, test } from "@playwright/test";

test.setTimeout(Number(process.env.LINK_CRAWL_TIMEOUT_MS ?? 180000));

// Reduced limits to prevent browser context exhaustion
const MAX_DEPTH = Number(process.env.LINK_CRAWL_DEPTH ?? 1);
const MAX_PAGES = Number(process.env.LINK_CRAWL_MAX_PAGES ?? 50);
const MAX_ERRORS = Number(process.env.LINK_CRAWL_MAX_ERRORS ?? 10);
const WAIT_AFTER_NAV_MS = Number(process.env.LINK_CRAWL_WAIT_MS ?? 100);

function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = "";
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}

function shouldSkipHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("#")) return true;
  if (trimmed.startsWith("mailto:")) return true;
  if (trimmed.startsWith("tel:")) return true;
  if (trimmed.startsWith("javascript:")) return true;
  if (trimmed.startsWith("data:")) return true;
  if (trimmed.startsWith("blob:")) return true;
  if (/\/app\/students\/[0-9a-f-]{16,}/i.test(trimmed)) return true;
  if (
    /\/(users?|students?|orders?|tickets?|projects?|contacts?)\/[0-9a-f-]{16,}$/i.test(
      trimmed,
    )
  )
    return true;
  if (
    /\/(users?|students?|orders?|tickets?|projects?|contacts?)\/\d+$/i.test(
      trimmed,
    )
  )
    return true;
  return false;
}

function isSameOrigin(rawUrl: string, origin: string): boolean {
  try {
    return new URL(rawUrl).origin === origin;
  } catch {
    return false;
  }
}

test("crawl internal links", async ({ page }, testInfo) => {
  const baseURL =
    (testInfo.project.use as { baseURL?: string })?.baseURL ||
    process.env.PLAYWRIGHT_BASE_URL;

  if (!baseURL) {
    throw new Error("No baseURL configured for link crawl test");
  }

  // Set demo mode for authentication
  await page.goto(baseURL);
  await page.evaluate(() => {
    localStorage.setItem("demo_mode", "true");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "demo",
        email: "demo@nucleo.one",
        companyId: "demo-company",
      }),
    );
  });

  // Just check if the page loads
  await page.goto(baseURL);
  await page.waitForLoadState("domcontentloaded");
  expect(await page.title()).not.toBe("");

  const origin = new URL(baseURL).origin;
  const queue: Array<{ url: string; depth: number }> = [
    { url: baseURL, depth: 0 },
  ];
  const visited = new Set<string>();
  const crawlErrors: string[] = [];

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const current = queue.shift();
    if (!current) break;

    const normalized = normalizeUrl(current.url);
    if (visited.has(normalized)) continue;

    let response: Awaited<ReturnType<typeof page.goto>> | null = null;
    try {
      response = await page.goto(current.url, {
        waitUntil: "domcontentloaded",
      });
    } catch (error) {
      crawlErrors.push(`${current.url}: ${(error as Error).message}`);
      continue;
    }

    if (!response) {
      crawlErrors.push(`${current.url}: no response`);
      continue;
    }

    const status = response.status();
    if (status >= 500) {
      crawlErrors.push(`${current.url}: bad status ${status}`);
      continue;
    }

    visited.add(normalized);

    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
    if (WAIT_AFTER_NAV_MS > 0) {
      try {
        await page.waitForTimeout(WAIT_AFTER_NAV_MS);
      } catch (error) {
        // Page might have closed, skip
        crawlErrors.push(`${current.url}: page closed during wait`);
        continue;
      }
    }

    if (current.depth >= MAX_DEPTH) continue;

    let links: string[] = [];
    try {
      links = await page.$$eval("a[href]", (elements) =>
        elements.map((el) => el.getAttribute("href") || "").filter(Boolean),
      );
    } catch (error) {
      crawlErrors.push(`${current.url}: failed to get links - ${(error as Error).message}`);
      continue;
    }

    for (const href of links) {
      if (shouldSkipHref(href)) continue;

      let absolute = href;
      try {
        absolute = new URL(href, current.url).toString();
      } catch {
        continue;
      }

      if (!isSameOrigin(absolute, origin)) continue;

      const normalizedChild = normalizeUrl(absolute);
      if (visited.has(normalizedChild)) continue;

      queue.push({ url: absolute, depth: current.depth + 1 });
    }
  }

  expect(
    visited.size,
    "No pages were visited during link crawl",
  ).toBeGreaterThan(0);
  expect(
    crawlErrors.length,
    `Too many crawl errors:\n${crawlErrors.join("\n")}`,
  ).toBeLessThanOrEqual(MAX_ERRORS);
});
