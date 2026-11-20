/**
 * Bot Detection Middleware
 *
 * Detects and blocks bot traffic based on User-Agent patterns and headers.
 */

import type { Context, Next } from "hono";

// Known bot patterns in User-Agent
const BOT_PATTERNS = [
  /curl/i,
  /wget/i,
  /python/i,
  /abot/i,
  /spider/i,
  /crawler/i,
  /bot/i,
  /scrap/i,
  /headless/i,
  /puppeteer/i,
  /selenium/i,
  /chromedriver/i,
  /geckodriver/i,
  /playwright/i,
  /httpclient/i,
  /libwww/i,
  /lwp/i,
  /www::/i,
  /fetch/i,
  /go-http/i,
  /java/i,
  /node/i,
  /php/i,
  /ruby/i,
  /perl/i,
  /lua/i,
  /powershell/i,
  /winhttp/i,
  /metauri/i,
  /mediapartners/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baiduspider/i,
  /duckduckbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /slackbot/i,
  /telegrambot/i,
  /discordbot/i,
];

// Suspicious patterns that indicate potential bot activity
const SUSPICIOUS_PATTERNS = [
  /bot/i,
  /spam/i,
  /hack/i,
  /exploit/i,
  /scan/i,
  /probe/i,
];

// Paths to skip bot detection (e.g., health checks)
const SKIP_PATHS = ["/api/health", "/health", "/favicon.ico", "/robots.txt"];

export async function botDetectionMiddleware(c: Context, next: Next) {
  // Skip bot detection for certain paths
  if (SKIP_PATHS.some((p) => c.req.path.startsWith(p))) {
    await next();
    return;
  }

  const userAgent = c.req.header("User-Agent") || "";
  const acceptLanguage = c.req.header("Accept-Language");

  // Check for empty User-Agent
  if (!userAgent || userAgent.trim() === "") {
    return c.json({ error: "Forbidden: Bot detected", code: "BOT_DETECTED" }, 403);
  }

  // Check for known bot patterns
  const isBot = BOT_PATTERNS.some((pattern) => pattern.test(userAgent));

  if (isBot) {
    return c.json({ error: "Forbidden: Bot detected", code: "BOT_DETECTED" }, 403);
  }

  // Check for suspicious patterns
  const hasSuspiciousPattern = SUSPICIOUS_PATTERNS.some(
    (pattern) => pattern.test(userAgent),
  );

  if (hasSuspiciousPattern) {
    return c.json(
      { error: "Forbidden: Suspicious activity detected", code: "SUSPICIOUS_BOT" },
      403,
    );
  }

  // Check for missing Accept-Language header (common for bots)
  // Only block if User-Agent looks automated
  if (!acceptLanguage && /curl|wget|python|httpclient|node/i.test(userAgent)) {
    return c.json(
      { error: "Forbidden: Bot detected", code: "BOT_DETECTED" },
      403,
    );
  }

  await next();
}
