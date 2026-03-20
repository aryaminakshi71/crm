import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock window before importing
const mockPosthog = { capture: vi.fn() };
const mockGtag = vi.fn();

Object.defineProperty(window, "posthog", {
  value: mockPosthog,
  writable: true,
});

Object.defineProperty(window, "gtag", {
  value: mockGtag,
  writable: true,
});

describe("Analytics Helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("hasAnalyticsConsent", () => {
    it("should return false when no consent exists", async () => {
      const { hasAnalyticsConsent } = await import("@/lib/analytics");
      expect(hasAnalyticsConsent()).toBe(false);
    });

    it("should return false when analytics consent is false", async () => {
      localStorage.setItem("cookie_consent", JSON.stringify({
        analytics: false,
        functional: true,
        marketing: false,
        timestamp: Date.now(),
      }));
      const { hasAnalyticsConsent } = await import("@/lib/analytics");
      expect(hasAnalyticsConsent()).toBe(false);
    });

    it("should return true when analytics consent is true", async () => {
      localStorage.setItem("cookie_consent", JSON.stringify({
        analytics: true,
        functional: true,
        marketing: false,
        timestamp: Date.now(),
      }));
      const { hasAnalyticsConsent } = await import("@/lib/analytics");
      expect(hasAnalyticsConsent()).toBe(true);
    });

    it("should return true when analytics is true regardless of timestamp check", async () => {
      // Note: hasAnalyticsConsent checks consent.analytics directly, not expiration
      // The expiration is handled by getStoredConsent in cookie-consent-banner
      // This test verifies the analytics flag is checked
      const { hasAnalyticsConsent } = await import("@/lib/analytics");
      localStorage.setItem("cookie_consent", JSON.stringify({
        analytics: true,
        functional: true,
        marketing: true,
        timestamp: Date.now(),
      }));
      expect(hasAnalyticsConsent()).toBe(true);
    });
  });

  describe("trackPageView", () => {
    it("should not track to PostHog when no consent", async () => {
      const { trackPageView } = await import("@/lib/analytics");
      trackPageView("/test");
      expect(mockPosthog.capture).not.toHaveBeenCalled();
    });

    it("should not track to gtag when no consent", async () => {
      const { trackPageView } = await import("@/lib/analytics");
      trackPageView("/test");
      expect(mockGtag).not.toHaveBeenCalled();
    });

    it("should track to PostHog when consented", async () => {
      localStorage.setItem("cookie_consent", JSON.stringify({
        analytics: true,
        functional: true,
        marketing: false,
        timestamp: Date.now(),
      }));
      const { trackPageView } = await import("@/lib/analytics");
      trackPageView("/test", { referrer: "home" });
      expect(mockPosthog.capture).toHaveBeenCalledWith("page_view", expect.objectContaining({
        path: "/test",
        referrer: "home",
      }));
    });
  });

  describe("trackEvent", () => {
    it("should not track when no consent", async () => {
      const { trackEvent } = await import("@/lib/analytics");
      trackEvent("test_event");
      expect(mockPosthog.capture).not.toHaveBeenCalled();
    });

    it("should track event when consented", async () => {
      localStorage.setItem("cookie_consent", JSON.stringify({
        analytics: true,
        functional: true,
        marketing: false,
        timestamp: Date.now(),
      }));
      const { trackEvent } = await import("@/lib/analytics");
      trackEvent("button_click", { button: "submit" });
      expect(mockPosthog.capture).toHaveBeenCalledWith("button_click", expect.objectContaining({
        button: "submit",
      }));
    });
  });

  describe("trackConversion", () => {
    it("should not track when no consent", async () => {
      const { trackConversion } = await import("@/lib/analytics");
      trackConversion("signup", 100);
      expect(mockPosthog.capture).not.toHaveBeenCalled();
    });

    it("should track conversion when consented", async () => {
      localStorage.setItem("cookie_consent", JSON.stringify({
        analytics: true,
        functional: true,
        marketing: false,
        timestamp: Date.now(),
      }));
      const { trackConversion } = await import("@/lib/analytics");
      trackConversion("signup", 100);
      expect(mockPosthog.capture).toHaveBeenCalledWith("conversion_signup", expect.objectContaining({
        conversion_name: "signup",
        value: 100,
      }));
    });
  });
});
