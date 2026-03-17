/**
 * Validation Utilities Unit Tests
 */

import { describe, expect, it } from "vitest";

describe("Validation Utilities - Business Logic", () => {
  describe("Email Validation", () => {
    it("should validate email format", () => {
      function isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      }

      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.org")).toBe(true);
      expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
    });

    it("should extract domain from email", () => {
      function extractDomain(email: string): string | null {
        const match = email.match(/@([^@]+)$/);
        return match ? match[1] : null;
      }

      expect(extractDomain("user@example.com")).toBe("example.com");
      expect(extractDomain("test@sub.domain.org")).toBe("sub.domain.org");
    });
  });

  describe("Phone Validation", () => {
    it("should validate phone number", () => {
      function isValidPhone(phone: string): boolean {
        const cleaned = phone.replace(/\D/g, "");
        return cleaned.length >= 10 && cleaned.length <= 15;
      }

      expect(isValidPhone("+1-555-555-5555")).toBe(true);
      expect(isValidPhone("555-555-5555")).toBe(true);
      expect(isValidPhone("555")).toBe(false);
    });

    it("should format phone number", () => {
      function formatPhone(phone: string): string {
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.length === 10) {
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
      }

      expect(formatPhone("5555555555")).toBe("(555) 555-5555");
      expect(formatPhone("+15555555555")).toBe("+15555555555");
    });
  });

  describe("URL Validation", () => {
    it("should validate URL", () => {
      function isValidUrl(url: string): boolean {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      }

      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://localhost:3000")).toBe(true);
      expect(isValidUrl("not-a-url")).toBe(false);
    });

    it("should extract URL parts", () => {
      function parseUrl(url: string): { origin: string; pathname: string } | null {
        try {
          const parsed = new URL(url);
          return { origin: parsed.origin, pathname: parsed.pathname };
        } catch {
          return null;
        }
      }

      const result = parseUrl("https://example.com/path");
      expect(result?.origin).toBe("https://example.com");
      expect(result?.pathname).toBe("/path");
    });
  });

  describe("String Validation", () => {
    it("should validate string length", () => {
      function isValidLength(str: string, min: number, max: number): boolean {
        return str.length >= min && str.length <= max;
      }

      expect(isValidLength("hello", 3, 10)).toBe(true);
      expect(isValidLength("hi", 3, 10)).toBe(false);
      expect(isValidLength("very long string", 3, 10)).toBe(false);
    });

    it("should validate alphanumeric strings", () => {
      function isAlphanumeric(str: string): boolean {
        return /^[a-zA-Z0-9]+$/.test(str);
      }

      expect(isAlphanumeric("abc123")).toBe(true);
      expect(isAlphanumeric("hello world")).toBe(false);
      expect(isAlphanumeric("test_name")).toBe(false);
    });
  });

  describe("Number Validation", () => {
    it("should validate numeric range", () => {
      function isInRange(value: number, min: number, max: number): boolean {
        return value >= min && value <= max;
      }

      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
    });

    it("should validate positive numbers", () => {
      function isPositive(value: number): boolean {
        return value > 0;
      }

      expect(isPositive(1)).toBe(true);
      expect(isPositive(0)).toBe(false);
      expect(isPositive(-1)).toBe(false);
    });
  });

  describe("UUID Validation", () => {
    it("should validate UUID format", () => {
      function isValidUUID(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      }

      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isValidUUID("not-a-uuid")).toBe(false);
    });
  });

  describe("Date Validation", () => {
    it("should validate date format", () => {
      function isValidDate(dateStr: string): boolean {
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
      }

      expect(isValidDate("2024-01-15")).toBe(true);
      expect(isValidDate("2024-13-01")).toBe(false);
      expect(isValidDate("invalid")).toBe(false);
    });

    it("should check if date is in future", () => {
      function isFutureDate(dateStr: string): boolean {
        const date = new Date(dateStr);
        return date.getTime() > Date.now();
      }

      expect(isFutureDate("2030-01-01")).toBe(true);
      expect(isFutureDate("2020-01-01")).toBe(false);
    });
  });
});
