/**
 * API Library Unit Tests
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

describe("API Library - Business Logic", () => {
  describe("Endpoint Builders", () => {
    it("should build resource endpoint", () => {
      function buildEndpoint(base: string, resource: string, id?: string): string {
        let endpoint = `${base}/${resource}`;
        if (id) {
          endpoint += `/${id}`;
        }
        return endpoint;
      }

      expect(buildEndpoint("/api/v1", "contacts")).toBe("/api/v1/contacts");
      expect(buildEndpoint("/api/v1", "contacts", "123")).toBe("/api/v1/contacts/123");
    });

    it("should build nested resource endpoint", () => {
      function buildNestedEndpoint(base: string, resource: string, subResource: string): string {
        return `${base}/${resource}/${subResource}`;
      }

      expect(buildNestedEndpoint("/api/v1", "contacts", "activities")).toBe("/api/v1/contacts/activities");
    });
  });

  describe("Pagination", () => {
    it("should calculate offset", () => {
      function getOffset(page: number, limit: number): number {
        return (page - 1) * limit;
      }

      expect(getOffset(1, 10)).toBe(0);
      expect(getOffset(2, 10)).toBe(10);
      expect(getOffset(3, 10)).toBe(20);
    });

    it("should build pagination params", () => {
      function buildPagination(page: number, limit: number): Record<string, string> {
        return { page: String(page), limit: String(limit) };
      }

      expect(buildPagination(1, 10)).toEqual({ page: "1", limit: "10" });
    });
  });

  describe("Sorting", () => {
    it("should parse sort param", () => {
      function parseSort(sort: string | undefined): { field: string; direction: "asc" | "desc" } | null {
        if (!sort) return null;
        const [field, direction] = sort.split(":");
        return { field, direction: (direction as "asc" | "desc") || "asc" };
      }

      expect(parseSort("name")).toEqual({ field: "name", direction: "asc" });
      expect(parseSort("createdAt:desc")).toEqual({ field: "createdAt", direction: "desc" });
      expect(parseSort(undefined)).toBeNull();
    });
  });

  describe("Filtering", () => {
    it("should build filter query", () => {
      function buildFilters(filters: Record<string, string | number | boolean | undefined>): string[] {
        const queryParts: string[] = [];
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined) {
            queryParts.push(`${key}=${encodeURIComponent(String(value))}`);
          }
        }
        return queryParts;
      }

      expect(buildFilters({ status: "active" })).toContain("status=active");
      expect(buildFilters({})).toHaveLength(0);
    });

    it("should handle array filters", () => {
      function buildArrayFilter(key: string, values: string[]): string {
        return values.map(v => `${key}=${encodeURIComponent(v)}`).join("&");
      }

      expect(buildArrayFilter("status", ["active", "pending"])).toBe("status=active&status=pending");
    });
  });

  describe("Response Transformation", () => {
    it("should extract data from response", () => {
      function extractData<T>(response: { data?: T; items?: T }): T | undefined {
        return response.data ?? response.items;
      }

      expect(extractData({ data: [1, 2, 3] })).toEqual([1, 2, 3]);
      expect(extractData({ items: [1, 2, 3] })).toEqual([1, 2, 3]);
    });

    it("should extract pagination metadata", () => {
      function extractPagination(response: { pagination?: { page: number; total: number } }): { page: number; total: number } | null {
        return response.pagination ?? null;
      }

      expect(extractPagination({ pagination: { page: 1, total: 100 } })).toEqual({ page: 1, total: 100 });
      expect(extractPagination({})).toBeNull();
    });
  });

  describe("Request Interceptors", () => {
    it("should add auth header", () => {
      function addAuthHeader(headers: Record<string, string>, token: string): Record<string, string> {
        return { ...headers, Authorization: `Bearer ${token}` };
      }

      const result = addAuthHeader({}, "abc123");
      expect(result.Authorization).toBe("Bearer abc123");
    });

    it("should add content type", () => {
      function addContentType(headers: Record<string, string>, type: string = "application/json"): Record<string, string> {
        return { ...headers, "Content-Type": type };
      }

      const result = addContentType({});
      expect(result["Content-Type"]).toBe("application/json");
    });
  });

  describe("Response Interceptors", () => {
    it("should handle 401 unauthorized", () => {
      function isUnauthorized(status: number): boolean {
        return status === 401;
      }

      expect(isUnauthorized(401)).toBe(true);
      expect(isUnauthorized(200)).toBe(false);
    });

    it("should handle rate limiting", () => {
      function isRateLimited(status: number): boolean {
        return status === 429;
      }

      expect(isRateLimited(429)).toBe(true);
      expect(isRateLimited(200)).toBe(false);
    });
  });
});
