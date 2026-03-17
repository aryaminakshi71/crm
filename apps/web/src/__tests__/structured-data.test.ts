/**
 * Unit Tests for Structured Data Utilities
 */

import { describe, expect, it } from "vitest";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  getCRMOrganizationSchema,
} from "../lib/structured-data";

describe("generateOrganizationSchema", () => {
  it("should generate valid organization schema", () => {
    const result = generateOrganizationSchema({
      name: "Test Company",
      url: "https://example.com",
    });

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("Organization");
    expect(result.name).toBe("Test Company");
    expect(result.url).toBe("https://example.com");
  });

  it("should include optional logo", () => {
    const result = generateOrganizationSchema({
      name: "Test Company",
      url: "https://example.com",
      logo: "https://example.com/logo.png",
    });

    expect(result.logo).toBe("https://example.com/logo.png");
  });

  it("should include optional description", () => {
    const result = generateOrganizationSchema({
      name: "Test Company",
      url: "https://example.com",
      description: "A test company",
    });

    expect(result.description).toBe("A test company");
  });

  it("should include contact point when provided", () => {
    const result = generateOrganizationSchema({
      name: "Test Company",
      url: "https://example.com",
      contactPoint: {
        telephone: "+1-555-1234",
        contactType: "customer service",
        email: "support@example.com",
      },
    });

    expect(result.contactPoint).toBeDefined();
    expect((result.contactPoint as Record<string, unknown>).telephone).toBe("+1-555-1234");
  });

  it("should include sameAs when provided with values", () => {
    const result = generateOrganizationSchema({
      name: "Test Company",
      url: "https://example.com",
      sameAs: ["https://twitter.com/test", "https://linkedin.com/company/test"],
    });

    expect(result.sameAs).toEqual([
      "https://twitter.com/test",
      "https://linkedin.com/company/test",
    ]);
  });

  it("should exclude sameAs when empty", () => {
    const result = generateOrganizationSchema({
      name: "Test Company",
      url: "https://example.com",
      sameAs: [],
    });

    expect(result.sameAs).toBeUndefined();
  });
});

describe("generateWebSiteSchema", () => {
  it("should generate valid website schema", () => {
    const result = generateWebSiteSchema({
      name: "Test Site",
      url: "https://example.com",
    });

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("WebSite");
    expect(result.name).toBe("Test Site");
    expect(result.url).toBe("https://example.com");
  });

  it("should include optional description", () => {
    const result = generateWebSiteSchema({
      name: "Test Site",
      url: "https://example.com",
      description: "A test website",
    });

    expect(result.description).toBe("A test website");
  });

  it("should include potential action when provided", () => {
    const result = generateWebSiteSchema({
      name: "Test Site",
      url: "https://example.com",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://example.com/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    });

    expect(result.potentialAction).toBeDefined();
  });
});

describe("generateBreadcrumbSchema", () => {
  it("should generate valid breadcrumb schema", () => {
    const result = generateBreadcrumbSchema({
      items: [
        { name: "Home", url: "https://example.com/" },
        { name: "Products", url: "https://example.com/products" },
      ],
    });

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("BreadcrumbList");
    expect((result as Record<string, unknown>).itemListElement).toHaveLength(2);
  });

  it("should set correct positions", () => {
    const result = generateBreadcrumbSchema({
      items: [
        { name: "Home", url: "https://example.com/" },
        { name: "Products", url: "https://example.com/products" },
        { name: "Category", url: "https://example.com/products/category" },
      ],
    });

    const items = (result as Record<string, unknown>).itemListElement as Array<Record<string, unknown>>;
    expect(items[0].position).toBe(1);
    expect(items[1].position).toBe(2);
    expect(items[2].position).toBe(3);
  });

  it("should handle single item", () => {
    const result = generateBreadcrumbSchema({
      items: [{ name: "Home", url: "https://example.com/" }],
    });

    const items = (result as Record<string, unknown>).itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(1);
    expect(items[0].position).toBe(1);
  });
});

describe("getCRMOrganizationSchema", () => {
  it("should return organization schema with default values", () => {
    const result = getCRMOrganizationSchema();

    expect(result.name).toBe("Nucleo One");
    expect(result.url).toBeDefined();
    expect(result.description).toContain("Nucleo One");
  });
});
