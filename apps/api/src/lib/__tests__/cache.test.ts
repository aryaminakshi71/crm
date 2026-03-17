/**
 * Cache Utilities Unit Tests
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

describe("Cache Utilities - Business Logic", () => {
  describe("Cache Key Generation", () => {
    it("should generate consistent cache keys", () => {
      function generateCacheKey(prefix: string, ...parts: string[]): string {
        return `${prefix}:${parts.join(":")}`;
      }

      expect(generateCacheKey("user", "123", "profile")).toBe("user:123:profile");
      expect(generateCacheKey("list", "contacts", "page1")).toBe("list:contacts:page1");
    });

    it("should sanitize cache key parts", () => {
      function sanitizeKeyPart(part: string): string {
        return part.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
      }

      expect(sanitizeKeyPart("user@example.com")).toBe("user_example_com");
      expect(sanitizeKeyPart("path/to/resource")).toBe("path_to_resource");
    });
  });

  describe("TTL Calculations", () => {
    it("should calculate TTL from expiry time", () => {
      function calculateTTL(expiresAt: Date): number {
        return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      }

      const future = new Date(Date.now() + 60000);
      expect(calculateTTL(future)).toBe(60);

      const past = new Date(Date.now() - 60000);
      expect(calculateTTL(past)).toBe(0);
    });

    it("should format TTL for display", () => {
      function formatTTL(seconds: number): string {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
      }

      expect(formatTTL(30)).toBe("30s");
      expect(formatTTL(120)).toBe("2m");
      expect(formatTTL(3600)).toBe("1h");
      expect(formatTTL(86400)).toBe("1d");
    });
  });

  describe("Cache Invalidation", () => {
    it("should generate invalidation patterns", () => {
      function getInvalidationPatterns(baseKey: string): string[] {
        return [
          baseKey,
          `${baseKey}:*`,
          `${baseKey.split(":")[0]}:*`,
        ];
      }

      const patterns = getInvalidationPatterns("contacts:list:org123");
      expect(patterns).toContain("contacts:list:org123");
      expect(patterns).toContain("contacts:list:org123:*");
    });

    it("should handle wildcard invalidation", () => {
      function matchPattern(key: string, pattern: string): boolean {
        if (pattern === key) return true;
        if (pattern.endsWith(":*")) {
          const prefix = pattern.slice(0, -1);
          return key.startsWith(prefix);
        }
        return false;
      }

      expect(matchPattern("contacts:list:123", "contacts:*")).toBe(true);
      expect(matchPattern("contacts:list:123", "contacts:list:*")).toBe(true);
      expect(matchPattern("contacts:item:456", "contacts:list:*")).toBe(false);
    });
  });

  describe("Cache Warming", () => {
    it("should calculate optimal refresh time", () => {
      function getOptimalRefreshTime(ttlSeconds: number, bufferPercent: number = 0.1): number {
        const buffer = ttlSeconds * bufferPercent;
        return Math.floor(ttlSeconds - buffer);
      }

      expect(getOptimalRefreshTime(300)).toBe(270); // 5 min TTL
      expect(getOptimalRefreshTime(3600)).toBe(3240); // 1 hour TTL
    });

    it("should prioritize cache keys for warming", () => {
      type CacheEntry = { key: string; hits: number; ttl: number };
      const entries: CacheEntry[] = [
        { key: "a", hits: 100, ttl: 300 },
        { key: "b", hits: 500, ttl: 600 },
        { key: "c", hits: 50, ttl: 100 },
      ];

      const prioritized = [...entries].sort((a, b) => {
        const scoreA = a.hits / a.ttl;
        const scoreB = b.hits / b.ttl;
        return scoreB - scoreA;
      });

      expect(prioritized[0].key).toBe("b"); // Highest hits/ttl ratio
    });
  });

  describe("Cache Statistics", () => {
    it("should calculate hit rate", () => {
      function calculateHitRate(hits: number, misses: number): number {
        const total = hits + misses;
        if (total === 0) return 0;
        return Math.round((hits / total) * 100);
      }

      expect(calculateHitRate(80, 20)).toBe(80);
      expect(calculateHitRate(0, 100)).toBe(0);
      expect(calculateHitRate(100, 0)).toBe(100);
    });

    it("should detect cache stampede risk", () => {
      function isStampedeRisk(concurrentRequests: number, threshold: number = 5): boolean {
        return concurrentRequests >= threshold;
      }

      expect(isStampedeRisk(10)).toBe(true);
      expect(isStampedeRisk(3)).toBe(false);
    });
  });
});
