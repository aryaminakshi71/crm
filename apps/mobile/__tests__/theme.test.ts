/**
 * Unit Tests for Mobile Theme & Utilities
 */

import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatRelativeDate,
  formatPersonName,
  getInitials,
  theme,
} from "../src/lib/theme";

describe("Theme", () => {
  it("should have required color properties", () => {
    expect(theme.colors.canvas).toBe("#f4efe7");
    expect(theme.colors.paper).toBe("#fffaf2");
    expect(theme.colors.ink).toBe("#182033");
    expect(theme.colors.accent).toBe("#f05d23");
  });

  it("should have radius values", () => {
    expect(theme.radius.sm).toBe(10);
    expect(theme.radius.md).toBe(18);
    expect(theme.radius.pill).toBe(999);
  });

  it("should have spacing values", () => {
    expect(theme.spacing.xs).toBe(6);
    expect(theme.spacing.sm).toBe(10);
    expect(theme.spacing.xl).toBe(32);
  });
});

describe("formatCurrency", () => {
  it("should format number as USD currency", () => {
    expect(formatCurrency(1000)).toBe("$1,000");
    expect(formatCurrency(1234)).toBe("$1,234");
    expect(formatCurrency(0)).toBe("$0");
  });

  it("should format string as currency", () => {
    expect(formatCurrency("5000")).toBe("$5,000");
  });

  it("should handle null and undefined", () => {
    expect(formatCurrency(null)).toBe("$0");
    expect(formatCurrency(undefined)).toBe("$0");
  });

  it("should handle invalid values", () => {
    expect(formatCurrency(NaN)).toBe("$0");
    expect(formatCurrency(Infinity)).toBe("$0");
  });
});

describe("formatRelativeDate", () => {
  it("should return 'Fresh' for null/undefined", () => {
    expect(formatRelativeDate(null)).toBe("Fresh");
    expect(formatRelativeDate(undefined)).toBe("Fresh");
    expect(formatRelativeDate()).toBe("Fresh");
  });

  it("should return 'Fresh' for invalid dates", () => {
    expect(formatRelativeDate("invalid-date")).toBe("Fresh");
  });

  it("should return 'Just now' for recent dates", () => {
    const now = new Date().toISOString();
    expect(formatRelativeDate(now)).toBe("Just now");
  });

  it("should format minutes ago", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(formatRelativeDate(fiveMinutesAgo)).toBe("5m ago");
  });

  it("should format hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(twoHoursAgo)).toBe("2h ago");
  });

  it("should format days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(threeDaysAgo)).toBe("3d ago");
  });
});

describe("formatPersonName", () => {
  it("should combine first and last name", () => {
    expect(formatPersonName("John", "Doe")).toBe("John Doe");
  });

  it("should handle only first name", () => {
    expect(formatPersonName("John", null)).toBe("John");
  });

  it("should handle only last name", () => {
    expect(formatPersonName(null, "Doe")).toBe("Doe");
  });

  it("should return 'Unnamed' for null values", () => {
    expect(formatPersonName(null, null)).toBe("Unnamed");
    expect(formatPersonName(undefined, undefined)).toBe("Unnamed");
  });

  it("should handle empty strings", () => {
    expect(formatPersonName("", "")).toBe("Unnamed");
    expect(formatPersonName("  ", "  ")).toBe("Unnamed");
  });
});

describe("getInitials", () => {
  it("should return initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("should return single initial for single word", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("should handle more than two words", () => {
    expect(getInitials("John James Doe")).toBe("JJ");
  });

  it("should uppercase letters", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("should handle empty strings", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   ")).toBe("");
  });
});
