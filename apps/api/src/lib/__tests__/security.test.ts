/**
 * Unit Tests for API Security Utilities
 */

import { describe, expect, it } from "vitest";
import { setSecurityHeaders, sanitizeInput, validateCSRF } from "../security";

describe("setSecurityHeaders", () => {
  it("should set all security headers", () => {
    const headers = new Headers();
    setSecurityHeaders(headers);

    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-XSS-Protection")).toBe("1; mode=block");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("should set HSTS header", () => {
    const headers = new Headers();
    setSecurityHeaders(headers);

    const hsts = headers.get("Strict-Transport-Security");
    expect(hsts).toContain("max-age=31536000");
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");
  });

  it("should set CSP header", () => {
    const headers = new Headers();
    setSecurityHeaders(headers);

    const csp = headers.get("Content-Security-Policy");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
  });

  it("should set Permissions-Policy header", () => {
    const headers = new Headers();
    setSecurityHeaders(headers);

    const permissions = headers.get("Permissions-Policy");
    expect(permissions).toContain("geolocation=()");
    expect(permissions).toContain("microphone=()");
    expect(permissions).toContain("camera=()");
  });
});

describe("sanitizeInput", () => {
  it("should remove angle brackets", () => {
    expect(sanitizeInput("<script>alert('xss')</script>")).toBe("scriptalert('xss')/script");
    expect(sanitizeInput("<div>Hello</div>")).toBe("divHello/div");
  });

  it("should remove javascript: protocol", () => {
    expect(sanitizeInput("javascript:alert('xss')")).toBe("alert('xss')");
    expect(sanitizeInput("JAVASCRIPT:doEvil()")).toBe("doEvil()");
  });

  it("should remove event handlers", () => {
    // The sanitize function removes <, >, javascript:, and on\w+= patterns
    const result1 = sanitizeInput('<img onerror="alert(1)" src="x">');
    const result2 = sanitizeInput('<a href="#" onclick="evil()">Link</a>');
    const result3 = sanitizeInput('<input onchange="steal()">');

    // Verify that angle brackets are removed
    expect(result1).not.toContain("<");
    expect(result2).not.toContain("<");
    expect(result3).not.toContain("<");

    // Verify on* patterns are removed (check they don't contain onerror/onclick/onchange)
    expect(result1).not.toContain("onerror=");
    expect(result2).not.toContain("onclick=");
    expect(result3).not.toContain("onchange=");
  });

  it("should return input unchanged when no threats", () => {
    expect(sanitizeInput("Hello World")).toBe("Hello World");
    expect(sanitizeInput("Plain text content")).toBe("Plain text content");
  });

  it("should handle empty string", () => {
    expect(sanitizeInput("")).toBe("");
  });
});

describe("validateCSRF", () => {
  it("should return true when tokens match", async () => {
    const request = new Request("http://test.com", {
      headers: { "X-CSRF-Token": "valid-token" },
    });

    const result = await validateCSRF(request, "valid-token");
    expect(result).toBe(true);
  });

  it("should return false when tokens don't match", async () => {
    const request = new Request("http://test.com", {
      headers: { "X-CSRF-Token": "wrong-token" },
    });

    const result = await validateCSRF(request, "valid-token");
    expect(result).toBe(false);
  });

  it("should return false when header token is missing", async () => {
    const request = new Request("http://test.com");

    const result = await validateCSRF(request, "valid-token");
    expect(result).toBe(false);
  });

  it("should return false when header token is null", async () => {
    const request = new Request("http://test.com", {
      headers: { "X-CSRF-Token": "token" },
    });

    const result = await validateCSRF(request, null);
    expect(result).toBe(false);
  });

  it("should handle case sensitivity", async () => {
    const request = new Request("http://test.com", {
      headers: { "X-CSRF-Token": "Valid-Token" },
    });

    const result = await validateCSRF(request, "valid-token");
    expect(result).toBe(false);
  });
});
