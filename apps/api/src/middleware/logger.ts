/**
 * Logger Middleware
 *
 * Request-scoped logging middleware for Hono.
 */

import { type Logger, createRequestLogger } from "@crm/logger";
import type { Context, Next } from "hono";

const SKIP_PATHS = ["/api/health", "/health", "/favicon.ico", "/robots.txt"];

declare module "hono" {
  interface ContextVariableMap {
    logger: Logger;
  }
}

export async function loggerMiddleware(c: Context, next: Next) {
  const requestId = c.get("requestId") || crypto.randomUUID();
  c.header("X-Request-Id", requestId);

  const requestLogger = createRequestLogger(c.req.raw);
  c.set("logger", requestLogger);

  const start = Date.now();
  await next();

  // Skip logging for noisy paths
  if (!SKIP_PATHS.some((p) => c.req.path.startsWith(p))) {
    requestLogger.info("Request completed", {
      status: c.res.status,
      duration: Date.now() - start,
    });
  }
}
