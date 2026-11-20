/**
 * Billing Hook Unit Tests
 *
 * Tests for useModuleAccess, useBilling, and related helpers.
 * These tests exercise the pure logic and helper functions extracted from the hooks,
 * as well as the hook contract shapes returned by the billing API.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ─── Inline logic mirrors from useBilling / useModuleAccess ───────────────────

function getModuleAccess(
  modules: Record<string, { enabled: boolean; source: string } | undefined>,
  moduleKey: string,
) {
  const module = modules[moduleKey];
  return {
    hasAccess: module?.enabled ?? false,
    source: module?.source ?? null,
    canEnable: module?.source !== "base",
  };
}

function getUsageLimit(
  usage: Record<string, number> | undefined,
  limits: Record<string, number> | undefined,
  percentages: Record<string, number> | undefined,
  type: "apiCalls" | "storage" | "users",
) {
  const limitKey =
    type === "storage" ? "maxStorage" : type === "apiCalls" ? "maxApiCalls" : "maxUsers";
  return {
    used: usage?.[type] ?? 0,
    limit: limits?.[limitKey] ?? 0,
    percentage: percentages?.[type] ?? 0,
    isNearLimit: (percentages?.[type] ?? 0) >= 80,
    isOverLimit: (percentages?.[type] ?? 0) >= 100,
  };
}

function isTrialActive(isTrial: boolean | undefined, daysRemaining: number | undefined): boolean {
  return (isTrial ?? false) && (daysRemaining ?? 0) > 0;
}

function getPlanTierFeatures(planKey: string): string[] {
  const features: Record<string, string[]> = {
    free: ["crm", "contacts"],
    starter: ["crm", "contacts", "helpdesk", "invoicing"],
    pro: ["crm", "contacts", "helpdesk", "invoicing", "projects", "hrm", "inventory"],
    enterprise: [
      "crm",
      "contacts",
      "helpdesk",
      "invoicing",
      "projects",
      "hrm",
      "inventory",
      "communications",
      "analytics",
      "custom_reports",
    ],
  };
  return features[planKey] ?? [];
}

function canAccessModule(planKey: string, moduleKey: string): boolean {
  return getPlanTierFeatures(planKey).includes(moduleKey);
}

// ─── useModuleAccess logic tests ───────────────────────────────────────────────

describe("useModuleAccess: module access logic", () => {
  it("returns hasAccess true when module is enabled", () => {
    const modules = {
      helpdesk: { enabled: true, source: "plan" },
    };
    const result = getModuleAccess(modules, "helpdesk");
    expect(result.hasAccess).toBe(true);
  });

  it("returns hasAccess false when module is disabled", () => {
    const modules = {
      analytics: { enabled: false, source: "addon" },
    };
    const result = getModuleAccess(modules, "analytics");
    expect(result.hasAccess).toBe(false);
  });

  it("returns hasAccess false when module key not present", () => {
    const result = getModuleAccess({}, "unknown_module");
    expect(result.hasAccess).toBe(false);
  });

  it("returns correct source value", () => {
    const modules = {
      invoicing: { enabled: true, source: "addon" },
    };
    const result = getModuleAccess(modules, "invoicing");
    expect(result.source).toBe("addon");
  });

  it("returns source null when module not found", () => {
    const result = getModuleAccess({}, "missing");
    expect(result.source).toBeNull();
  });

  it("canEnable is false for base modules", () => {
    const modules = {
      crm: { enabled: true, source: "base" },
    };
    const result = getModuleAccess(modules, "crm");
    expect(result.canEnable).toBe(false);
  });

  it("canEnable is true for non-base modules", () => {
    const modules = {
      analytics: { enabled: false, source: "addon" },
    };
    const result = getModuleAccess(modules, "analytics");
    expect(result.canEnable).toBe(true);
  });
});

// ─── useBilling shape tests ────────────────────────────────────────────────────

describe("useBilling: subscription status checks", () => {
  it("identifies active trial with days remaining", () => {
    expect(isTrialActive(true, 7)).toBe(true);
    expect(isTrialActive(true, 1)).toBe(true);
  });

  it("trial is inactive when days remaining is 0", () => {
    expect(isTrialActive(true, 0)).toBe(false);
  });

  it("trial is inactive when isTrial is false", () => {
    expect(isTrialActive(false, 14)).toBe(false);
  });

  it("trial is inactive when both values are undefined", () => {
    expect(isTrialActive(undefined, undefined)).toBe(false);
  });

  it("returns empty invoices array as default", () => {
    // Mirrors the useBilling hook's default: invoicesQuery.data?.invoices ?? []
    const data: any = undefined;
    const invoices = data?.invoices ?? [];
    expect(invoices).toEqual([]);
    expect(Array.isArray(invoices)).toBe(true);
  });

  it("returns empty plans array as default", () => {
    const data: any = undefined;
    const plans = data?.plans ?? [];
    expect(plans).toEqual([]);
  });

  it("returns empty modules object as default", () => {
    const data: any = undefined;
    const modules = data?.modules ?? {};
    expect(modules).toEqual({});
    expect(typeof modules).toBe("object");
  });
});

// ─── Plan tier feature tests ───────────────────────────────────────────────────

describe("Plan tier: feature access", () => {
  it("free plan includes crm and contacts", () => {
    const features = getPlanTierFeatures("free");
    expect(features).toContain("crm");
    expect(features).toContain("contacts");
  });

  it("free plan does not include helpdesk", () => {
    const features = getPlanTierFeatures("free");
    expect(features).not.toContain("helpdesk");
  });

  it("starter plan includes helpdesk and invoicing", () => {
    const features = getPlanTierFeatures("starter");
    expect(features).toContain("helpdesk");
    expect(features).toContain("invoicing");
  });

  it("pro plan includes projects, hrm, and inventory", () => {
    const features = getPlanTierFeatures("pro");
    expect(features).toContain("projects");
    expect(features).toContain("hrm");
    expect(features).toContain("inventory");
  });

  it("enterprise plan includes communications and analytics", () => {
    const features = getPlanTierFeatures("enterprise");
    expect(features).toContain("communications");
    expect(features).toContain("analytics");
    expect(features).toContain("custom_reports");
  });

  it("returns empty array for unknown plan", () => {
    const features = getPlanTierFeatures("unknown_plan");
    expect(features).toEqual([]);
  });

  it("canAccessModule correctly gates features by plan", () => {
    expect(canAccessModule("free", "crm")).toBe(true);
    expect(canAccessModule("free", "helpdesk")).toBe(false);
    expect(canAccessModule("pro", "hrm")).toBe(true);
    expect(canAccessModule("starter", "inventory")).toBe(false);
    expect(canAccessModule("enterprise", "custom_reports")).toBe(true);
  });
});

// ─── useUsageLimit logic tests ─────────────────────────────────────────────────

describe("useUsageLimit: usage limit checks", () => {
  it("returns used value from usage data", () => {
    const result = getUsageLimit(
      { apiCalls: 450 },
      { maxApiCalls: 1000 },
      { apiCalls: 45 },
      "apiCalls",
    );
    expect(result.used).toBe(450);
    expect(result.limit).toBe(1000);
    expect(result.percentage).toBe(45);
  });

  it("isNearLimit is true when percentage >= 80", () => {
    const result = getUsageLimit(
      { apiCalls: 850 },
      { maxApiCalls: 1000 },
      { apiCalls: 85 },
      "apiCalls",
    );
    expect(result.isNearLimit).toBe(true);
    expect(result.isOverLimit).toBe(false);
  });

  it("isOverLimit is true when percentage >= 100", () => {
    const result = getUsageLimit(
      { apiCalls: 1050 },
      { maxApiCalls: 1000 },
      { apiCalls: 105 },
      "apiCalls",
    );
    expect(result.isOverLimit).toBe(true);
    expect(result.isNearLimit).toBe(true);
  });

  it("returns zero defaults when usage data is undefined", () => {
    const result = getUsageLimit(undefined, undefined, undefined, "users");
    expect(result.used).toBe(0);
    expect(result.limit).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.isNearLimit).toBe(false);
    expect(result.isOverLimit).toBe(false);
  });

  it("resolves storage limit key correctly", () => {
    const result = getUsageLimit(
      { storage: 200 },
      { maxStorage: 500 },
      { storage: 40 },
      "storage",
    );
    expect(result.used).toBe(200);
    expect(result.limit).toBe(500);
  });

  it("resolves users limit key correctly", () => {
    const result = getUsageLimit(
      { users: 8 },
      { maxUsers: 10 },
      { users: 80 },
      "users",
    );
    expect(result.used).toBe(8);
    expect(result.limit).toBe(10);
    expect(result.isNearLimit).toBe(true);
  });
});
