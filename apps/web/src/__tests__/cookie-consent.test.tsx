import { describe, it, expect, vi, beforeEach } from "vitest";
import { setCookieConsent, hasConsent } from "@/components/cookie-consent-banner";

describe("Cookie Consent", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("setCookieConsent", () => {
    it("should store consent in localStorage", () => {
      setCookieConsent({
        analytics: true,
        functional: true,
        marketing: false,
        timestamp: Date.now(),
      });

      const stored = JSON.parse(localStorage.getItem("cookie_consent") || "{}");
      expect(stored.analytics).toBe(true);
      expect(stored.functional).toBe(true);
      expect(stored.marketing).toBe(false);
    });

    it("should store all consent options", () => {
      const consent = {
        analytics: true,
        functional: true,
        marketing: true,
        timestamp: Date.now(),
      };
      setCookieConsent(consent);

      const stored = JSON.parse(localStorage.getItem("cookie_consent") || "{}");
      expect(stored.analytics).toBe(true);
      expect(stored.functional).toBe(true);
      expect(stored.marketing).toBe(true);
    });

    it("should overwrite existing consent", () => {
      setCookieConsent({
        analytics: false,
        functional: true,
        marketing: false,
        timestamp: Date.now(),
      });

      setCookieConsent({
        analytics: true,
        functional: true,
        marketing: true,
        timestamp: Date.now(),
      });

      const stored = JSON.parse(localStorage.getItem("cookie_consent") || "{}");
      expect(stored.analytics).toBe(true);
      expect(stored.marketing).toBe(true);
    });
  });

  describe("hasConsent", () => {
    it("should return false when no consent", () => {
      expect(hasConsent()).toBe(false);
    });

    it("should return true when consent exists", () => {
      localStorage.setItem("cookie_consent", JSON.stringify({
        analytics: true,
        functional: true,
        marketing: false,
        timestamp: Date.now(),
      }));
      expect(hasConsent()).toBe(true);
    });

    it("should return false when consent is expired", () => {
      const expiredTimestamp = Date.now() - (366 * 24 * 60 * 60 * 1000);
      localStorage.setItem("cookie_consent", JSON.stringify({
        analytics: true,
        functional: true,
        marketing: true,
        timestamp: expiredTimestamp,
      }));
      expect(hasConsent()).toBe(false);
    });

    it("should return false when stored consent is invalid JSON", () => {
      localStorage.setItem("cookie_consent", "not valid json");
      expect(hasConsent()).toBe(false);
    });
  });
});
