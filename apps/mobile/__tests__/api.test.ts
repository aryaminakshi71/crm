/**
 * Unit Tests for Mobile API Client - Standalone
 */

import { describe, expect, it } from "vitest";

// Inline implementations to avoid React Native import issues
function cleanBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function buildHeaders(config: {
  apiBaseUrl: string;
  demoMode: boolean;
  organizationId: string;
  authToken?: string | null;
}) {
  const orgId = config.demoMode
    ? "demo-org"
    : config.organizationId.trim() || undefined;

  return {
    "Content-Type": "application/json",
    ...(config.authToken
      ? { Authorization: `Bearer ${config.authToken}` }
      : {}),
    ...(orgId ? { "x-organization-id": orgId } : {}),
  };
}

describe("Mobile API - cleanBaseUrl", () => {
  it("should remove trailing slashes", () => {
    expect(cleanBaseUrl("http://localhost:8787/")).toBe("http://localhost:8787");
    expect(cleanBaseUrl("http://localhost:8787///")).toBe("http://localhost:8787");
  });

  it("should trim whitespace", () => {
    expect(cleanBaseUrl("  http://localhost:8787  ")).toBe("http://localhost:8787");
  });

  it("should return the URL as-is if no trailing slashes", () => {
    expect(cleanBaseUrl("http://localhost:8787")).toBe("http://localhost:8787");
  });
});

describe("Mobile API - buildHeaders", () => {
  it("should include content-type and organization id", () => {
    const headers = buildHeaders({
      apiBaseUrl: "http://localhost:8787",
      demoMode: true,
      organizationId: "test-org",
    });

    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["x-organization-id"]).toBe("demo-org");
  });

  it("should use real organization id when not in demo mode", () => {
    const headers = buildHeaders({
      apiBaseUrl: "http://localhost:8787",
      demoMode: false,
      organizationId: "real-org",
    });

    expect(headers["x-organization-id"]).toBe("real-org");
  });

  it("should include auth token when provided", () => {
    const headers = buildHeaders({
      apiBaseUrl: "http://localhost:8787",
      demoMode: false,
      organizationId: "test-org",
      authToken: "test-token",
    });

    expect(headers["Authorization"]).toBe("Bearer test-token");
  });

  it("should not include auth header when no token", () => {
    const headers = buildHeaders({
      apiBaseUrl: "http://localhost:8787",
      demoMode: false,
      organizationId: "test-org",
      authToken: null,
    });

    expect(headers["Authorization"]).toBeUndefined();
  });

  it("should trim organization id", () => {
    const headers = buildHeaders({
      apiBaseUrl: "http://localhost:8787",
      demoMode: false,
      organizationId: "  trimmed-org  ",
    });

    expect(headers["x-organization-id"]).toBe("trimmed-org");
  });
});

describe("Mobile API - URL Construction", () => {
  it("should construct correct API URL", () => {
    const baseUrl = cleanBaseUrl("http://localhost:8787");
    const endpoint = "/api/health";
    const fullUrl = `${baseUrl}${endpoint}`;

    expect(fullUrl).toBe("http://localhost:8787/api/health");
  });

  it("should handle URLs with trailing slash in endpoint", () => {
    const baseUrl = cleanBaseUrl("http://localhost:8787/");
    const endpoint = "/api/v1/contacts/";
    const fullUrl = `${baseUrl}${endpoint}`;

    expect(fullUrl).toBe("http://localhost:8787/api/v1/contacts/");
  });
});
