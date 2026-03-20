/**
 * Audit Logging Middleware
 *
 * Logs all API requests with user context, IP, user agent, action, resource, and timestamp.
 */

import type { Context, Next } from "hono";

// Paths to skip audit logging
const SKIP_PATHS = ["/api/health", "/health", "/favicon.ico", "/robots.txt"];

interface AuditLogEntry {
  timestamp: string;
  userId?: string;
  organizationId?: string;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  action: string;
  resource: string;
  status?: number;
  duration?: number;
}

// In-memory audit log storage (in production, use database or external service)
const auditLogs: AuditLogEntry[] = [];

export function getAuditLogs(limit = 100): AuditLogEntry[] {
  return auditLogs.slice(-limit);
}

export function getAuditLogsForUser(userId: string, limit = 100): AuditLogEntry[] {
  return auditLogs.filter((log) => log.userId === userId).slice(-limit);
}

export function getAuditLogsForOrganization(
  orgId: string,
  limit = 100,
): AuditLogEntry[] {
  return auditLogs.filter((log) => log.organizationId === orgId).slice(-limit);
}

function extractActionAndResource(path: string, method: string): {
  action: string;
  resource: string;
} {
  // Parse RESTful paths to extract action and resource
  // Example: /api/v1/deals -> resource: deals, action: list
  // Example: POST /api/v1/deals -> resource: deals, action: create

  const parts = path.split("/").filter(Boolean);
  const apiIndex = parts.indexOf("api");

  let resource = "unknown";
  let action = "unknown";

  if (apiIndex !== -1 && parts.length > apiIndex + 1) {
    // Get the resource name (e.g., "deals", "contacts", "users")
    const resourcePart = parts[apiIndex + 1];

    // Determine action based on HTTP method
    switch (method.toUpperCase()) {
      case "GET":
        action = parts[apiIndex + 2] ? "get" : "list";
        break;
      case "POST":
        action = "create";
        break;
      case "PUT":
      case "PATCH":
        action = "update";
        break;
      case "DELETE":
        action = "delete";
        break;
      default:
        action = "unknown";
    }

    resource = resourcePart.replace(/-/g, "_");
  }

  return { action, resource };
}

export async function auditLogMiddleware(c: Context, next: Next) {
  // Skip audit logging for certain paths
  if (SKIP_PATHS.some((p) => c.req.path.startsWith(p))) {
    await next();
    return;
  }

  const start = Date.now();

  // Extract IP from cf-connecting-ip header (Cloudflare) or fallback to other headers
  const ip =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0] ||
    c.req.header("x-real-ip") ||
    "unknown";

  // Get user agent
  const userAgent = c.req.header("User-Agent") || "unknown";

  // Get user and organization from context (set by auth middleware)
  const userId = (c as any).userId || (c as any).user?.id;
  const organizationId =
    (c as any).organizationId ||
    (c as any).user?.organizationId ||
    c.req.header("x-organization-id");

  // Extract action and resource from path and method
  const { action, resource } = extractActionAndResource(
    c.req.path,
    c.req.method,
  );

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  // Create audit log entry
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    userId,
    organizationId,
    ip,
    userAgent,
    method: c.req.method,
    path: c.req.path,
    action,
    resource,
    status,
    duration,
  };

  // Store the entry (in production, this would go to a database)
  auditLogs.push(entry);

  // Keep only last 10000 entries in memory
  if (auditLogs.length > 10000) {
    auditLogs.shift();
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[AUDIT]", JSON.stringify(entry));
  }
}
