/**
 * Mobile Utilities Unit Tests
 */

import { describe, expect, it } from "vitest";

describe("Mobile Utilities - Business Logic", () => {
  describe("Device Detection", () => {
    it("should detect iOS from user agent", () => {
      function isIOS(userAgent: string): boolean {
        return /iPad|iPhone|iPod/.test(userAgent) && !userAgent.includes("Windows");
      }

      expect(isIOS("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)")).toBe(true);
      expect(isIOS("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
    });

    it("should detect Android from user agent", () => {
      function isAndroid(userAgent: string): boolean {
        return /Android/.test(userAgent);
      }

      expect(isAndroid("Mozilla/5.0 (Linux; Android 11)")).toBe(true);
      expect(isAndroid("Mozilla/5.0 (iPhone)")).toBe(false);
    });

    it("should detect mobile device", () => {
      function isMobile(userAgent: string): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      }

      expect(isMobile("Mozilla/5.0 (iPhone)")).toBe(true);
      expect(isMobile("Mozilla/5.0 (Windows)")).toBe(false);
    });
  });

  describe("Platform Helpers", () => {
    it("should get platform from user agent", () => {
      function getPlatform(userAgent: string): string {
        if (/iPad|iPhone|iPod/.test(userAgent)) return "ios";
        if (/Android/.test(userAgent)) return "android";
        return "web";
      }

      expect(getPlatform("Mozilla/5.0 (iPhone)")).toBe("ios");
      expect(getPlatform("Mozilla/5.0 (Linux; Android 11)")).toBe("android");
      expect(getPlatform("Mozilla/5.0 (Windows)")).toBe("web");
    });
  });

  describe("Version Parsing", () => {
    it("should extract iOS version", () => {
      function getIOSVersion(userAgent: string): string | null {
        const match = userAgent.match(/OS (\d+)_(\d+)/);
        return match ? `${match[1]}.${match[2]}` : null;
      }

      expect(getIOSVersion("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)")).toBe("14.0");
      expect(getIOSVersion("Mozilla/5.0 (Windows)")).toBe(null);
    });

    it("should extract Android version", () => {
      function getAndroidVersion(userAgent: string): string | null {
        const match = userAgent.match(/Android (\d+\.?\d*)/);
        return match ? match[1] : null;
      }

      expect(getAndroidVersion("Mozilla/5.0 (Linux; Android 11)")).toBe("11");
      expect(getAndroidVersion("Mozilla/5.0 (iPhone)")).toBe(null);
    });
  });

  describe("Screen Size", () => {
    it("should categorize screen sizes", () => {
      function getScreenCategory(width: number): "mobile" | "tablet" | "desktop" {
        if (width < 768) return "mobile";
        if (width < 1024) return "tablet";
        return "desktop";
      }

      expect(getScreenCategory(375)).toBe("mobile");
      expect(getScreenCategory(768)).toBe("tablet");
      expect(getScreenCategory(1200)).toBe("desktop");
    });

    it("should calculate device pixel ratio", () => {
      function getPixelRatio(width: number, scale: number): number {
        return width * scale;
      }

      expect(getPixelRatio(375, 2)).toBe(750);
      expect(getPixelRatio(414, 3)).toBe(1242);
    });
  });

  describe("Orientation", () => {
    it("should detect orientation", () => {
      function getOrientation(width: number, height: number): "portrait" | "landscape" {
        return width > height ? "landscape" : "portrait";
      }

      expect(getOrientation(375, 812)).toBe("portrait");
      expect(getOrientation(812, 375)).toBe("landscape");
    });
  });

  describe("Touch Support", () => {
    it("should detect touch capability", () => {
      function hasTouchSupport(maxTouchPoints: number): boolean {
        return maxTouchPoints > 0;
      }

      expect(hasTouchSupport(5)).toBe(true);
      expect(hasTouchSupport(0)).toBe(false);
    });
  });

  describe("App Links", () => {
    it("should generate iOS app link", () => {
      function generateIOSLink(appId: string, path?: string): string {
        const base = `myapp://${path || ""}`;
        return base;
      }

      expect(generateIOSLink("com.example.app")).toBe("myapp://");
      expect(generateIOSLink("com.example.app", "profile")).toBe("myapp://profile");
    });

    it("should generate Android app link", () => {
      function generateAndroidLink(packageName: string, path?: string): string {
        const base = `myapp://${path || ""}`;
        return base;
      }

      expect(generateAndroidLink("com.example.app")).toBe("myapp://");
      expect(generateAndroidLink("com.example.app", "settings")).toBe("myapp://settings");
    });
  });
});
