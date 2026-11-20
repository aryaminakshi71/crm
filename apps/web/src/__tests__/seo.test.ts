/**
 * SEO Tests
 */

import { describe, expect, it } from "vitest";
import {
  generateSoftwareSchema,
  generateFAQSchema,
  moduleSEO,
  pricingTiers,
  competitors,
} from "@/lib/seo";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  getCRMOrganizationSchema,
} from "@/lib/structured-data";

// ─── SoftwareApplication schema tests ────────────────────────────────────────

describe("generateSoftwareSchema", () => {
  it("returns object with @context=https://schema.org", () => {
    const schema = generateSoftwareSchema({});
    expect((schema as any)["@context"]).toBe("https://schema.org");
  });

  it("returns @type=SoftwareApplication", () => {
    const schema = generateSoftwareSchema({});
    expect((schema as any)["@type"]).toBe("SoftwareApplication");
  });

  it("uses provided name", () => {
    const schema = generateSoftwareSchema({ name: "My App" });
    expect((schema as any).name).toBe("My App");
  });

  it("defaults to Nucleo One when name not provided", () => {
    const schema = generateSoftwareSchema({});
    expect((schema as any).name).toBe("Nucleo One");
  });

  it("includes applicationCategory=BusinessApplication", () => {
    const schema = generateSoftwareSchema({});
    expect((schema as any).applicationCategory).toBe("BusinessApplication");
  });

  it("includes operatingSystem=Web", () => {
    const schema = generateSoftwareSchema({});
    expect((schema as any).operatingSystem).toBe("Web");
  });

  it("includes aggregateRating with ratingValue and reviewCount", () => {
    const schema = generateSoftwareSchema({}) as any;
    expect(schema.aggregateRating).toBeDefined();
    expect(schema.aggregateRating["@type"]).toBe("AggregateRating");
    expect(schema.aggregateRating.ratingValue).toBeDefined();
    expect(schema.aggregateRating.reviewCount).toBeDefined();
  });

  it("includes offer with price when price is provided", () => {
    const schema = generateSoftwareSchema({ price: "15" }) as any;
    expect(schema.offers).toBeDefined();
    expect(schema.offers["@type"]).toBe("Offer");
    expect(schema.offers.price).toBe("15");
    expect(schema.offers.priceCurrency).toBe("USD");
  });

  it("does not include offers when price is not provided", () => {
    const schema = generateSoftwareSchema({}) as any;
    expect(schema.offers).toBeUndefined();
  });

  it("generates valid JSON when stringified", () => {
    const schema = generateSoftwareSchema({ name: "Test App" });
    expect(() => JSON.stringify(schema)).not.toThrow();
    const parsed = JSON.parse(JSON.stringify(schema));
    expect(parsed["@type"]).toBe("SoftwareApplication");
  });
});

// ─── FAQPage schema tests ─────────────────────────────────────────────────────

describe("generateFAQSchema", () => {
  const faqs = [
    { question: "What is Nucleo One?", answer: "An all-in-one business platform." },
    { question: "Is there a free trial?", answer: "Yes, 14 days free." },
  ];

  it("returns @type=FAQPage", () => {
    const schema = generateFAQSchema(faqs) as any;
    expect(schema["@type"]).toBe("FAQPage");
  });

  it("returns @context=https://schema.org", () => {
    const schema = generateFAQSchema(faqs) as any;
    expect(schema["@context"]).toBe("https://schema.org");
  });

  it("has mainEntity array with correct length", () => {
    const schema = generateFAQSchema(faqs) as any;
    expect(Array.isArray(schema.mainEntity)).toBe(true);
    expect(schema.mainEntity.length).toBe(faqs.length);
  });

  it("each mainEntity item has @type=Question", () => {
    const schema = generateFAQSchema(faqs) as any;
    schema.mainEntity.forEach((item: any) => {
      expect(item["@type"]).toBe("Question");
    });
  });

  it("each Question has name equal to question text", () => {
    const schema = generateFAQSchema(faqs) as any;
    expect(schema.mainEntity[0].name).toBe("What is Nucleo One?");
  });

  it("each Question has acceptedAnswer with @type=Answer", () => {
    const schema = generateFAQSchema(faqs) as any;
    schema.mainEntity.forEach((item: any) => {
      expect(item.acceptedAnswer).toBeDefined();
      expect(item.acceptedAnswer["@type"]).toBe("Answer");
    });
  });

  it("acceptedAnswer has correct text", () => {
    const schema = generateFAQSchema(faqs) as any;
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe(
      "An all-in-one business platform.",
    );
  });

  it("generates valid JSON when stringified", () => {
    const schema = generateFAQSchema(faqs);
    expect(() => JSON.stringify(schema)).not.toThrow();
  });
});

// ─── Organization schema tests ────────────────────────────────────────────────

describe("generateOrganizationSchema", () => {
  it("returns @type=Organization", () => {
    const schema = generateOrganizationSchema({
      name: "Nucleo One",
      url: "https://nucleoone.com",
    }) as any;
    expect(schema["@type"]).toBe("Organization");
  });

  it("includes name and url", () => {
    const schema = generateOrganizationSchema({
      name: "Nucleo One",
      url: "https://nucleoone.com",
    }) as any;
    expect(schema.name).toBe("Nucleo One");
    expect(schema.url).toBe("https://nucleoone.com");
  });

  it("includes logo when provided", () => {
    const schema = generateOrganizationSchema({
      name: "Nucleo One",
      url: "https://nucleoone.com",
      logo: "https://nucleoone.com/logo.png",
    }) as any;
    expect(schema.logo).toBe("https://nucleoone.com/logo.png");
  });

  it("does not include logo when not provided", () => {
    const schema = generateOrganizationSchema({
      name: "Nucleo One",
      url: "https://nucleoone.com",
    }) as any;
    expect(schema.logo).toBeUndefined();
  });

  it("includes contactPoint when provided", () => {
    const schema = generateOrganizationSchema({
      name: "Nucleo One",
      url: "https://nucleoone.com",
      contactPoint: { email: "hello@nucleoone.com", contactType: "customer service" },
    }) as any;
    expect(schema.contactPoint).toBeDefined();
    expect(schema.contactPoint["@type"]).toBe("ContactPoint");
  });

  it("includes sameAs array when provided", () => {
    const schema = generateOrganizationSchema({
      name: "Nucleo One",
      url: "https://nucleoone.com",
      sameAs: ["https://twitter.com/nucleoone"],
    }) as any;
    expect(Array.isArray(schema.sameAs)).toBe(true);
    expect(schema.sameAs[0]).toBe("https://twitter.com/nucleoone");
  });

  it("generates valid JSON", () => {
    const schema = generateOrganizationSchema({
      name: "Nucleo One",
      url: "https://nucleoone.com",
    });
    expect(() => JSON.stringify(schema)).not.toThrow();
  });
});

// ─── WebSite schema tests ─────────────────────────────────────────────────────

describe("generateWebSiteSchema", () => {
  it("returns @type=WebSite", () => {
    const schema = generateWebSiteSchema({
      name: "Nucleo One",
      url: "https://nucleoone.com",
    }) as any;
    expect(schema["@type"]).toBe("WebSite");
  });

  it("includes name and url", () => {
    const schema = generateWebSiteSchema({
      name: "Nucleo One",
      url: "https://nucleoone.com",
    }) as any;
    expect(schema.name).toBe("Nucleo One");
    expect(schema.url).toBe("https://nucleoone.com");
  });

  it("includes potentialAction when provided", () => {
    const schema = generateWebSiteSchema({
      name: "Nucleo One",
      url: "https://nucleoone.com",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://nucleoone.com/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    }) as any;
    expect(schema.potentialAction).toBeDefined();
  });
});

// ─── Breadcrumb schema tests ───────────────────────────────────────────────────

describe("generateBreadcrumbSchema", () => {
  const breadcrumb = {
    items: [
      { name: "Home", url: "https://nucleoone.com" },
      { name: "Blog", url: "https://nucleoone.com/blog" },
      { name: "Post Title", url: "https://nucleoone.com/blog/post-1" },
    ],
  };

  it("returns @type=BreadcrumbList", () => {
    const schema = generateBreadcrumbSchema(breadcrumb) as any;
    expect(schema["@type"]).toBe("BreadcrumbList");
  });

  it("has itemListElement array with correct length", () => {
    const schema = generateBreadcrumbSchema(breadcrumb) as any;
    expect(schema.itemListElement.length).toBe(3);
  });

  it("each item has @type=ListItem", () => {
    const schema = generateBreadcrumbSchema(breadcrumb) as any;
    schema.itemListElement.forEach((item: any) => {
      expect(item["@type"]).toBe("ListItem");
    });
  });

  it("items have correct position starting from 1", () => {
    const schema = generateBreadcrumbSchema(breadcrumb) as any;
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[1].position).toBe(2);
    expect(schema.itemListElement[2].position).toBe(3);
  });

  it("items have correct name and url", () => {
    const schema = generateBreadcrumbSchema(breadcrumb) as any;
    expect(schema.itemListElement[0].name).toBe("Home");
    expect(schema.itemListElement[0].item).toBe("https://nucleoone.com");
  });
});

// ─── getCRMOrganizationSchema tests ──────────────────────────────────────────

describe("getCRMOrganizationSchema", () => {
  it("returns an object with name=Nucleo One", () => {
    const schema = getCRMOrganizationSchema();
    expect(schema.name).toBe("Nucleo One");
  });

  it("returns an object with a url field", () => {
    const schema = getCRMOrganizationSchema();
    expect(typeof schema.url).toBe("string");
    expect(schema.url.length).toBeGreaterThan(0);
  });

  it("returns a description field", () => {
    const schema = getCRMOrganizationSchema();
    expect(typeof schema.description).toBe("string");
    expect(schema.description!.length).toBeGreaterThan(0);
  });
});

// ─── moduleSEO metadata tests ─────────────────────────────────────────────────

describe("moduleSEO metadata", () => {
  const moduleKeys = Object.keys(moduleSEO) as Array<keyof typeof moduleSEO>;

  it("has SEO data for at least 5 modules", () => {
    expect(moduleKeys.length).toBeGreaterThanOrEqual(5);
  });

  it("each module has a title", () => {
    moduleKeys.forEach((key) => {
      expect(typeof moduleSEO[key].title).toBe("string");
      expect(moduleSEO[key].title.length).toBeGreaterThan(0);
    });
  });

  it("each module has a description", () => {
    moduleKeys.forEach((key) => {
      expect(typeof moduleSEO[key].description).toBe("string");
      expect(moduleSEO[key].description.length).toBeGreaterThan(20);
    });
  });

  it("each module has a keywords array", () => {
    moduleKeys.forEach((key) => {
      expect(Array.isArray(moduleSEO[key].keywords)).toBe(true);
      expect(moduleSEO[key].keywords.length).toBeGreaterThan(0);
    });
  });

  it("CRM module has expected keywords", () => {
    expect(moduleSEO.crm.keywords).toContain("CRM");
  });

  it("helpdesk module has SLA in keywords", () => {
    expect(moduleSEO.helpdesk.keywords).toContain("SLA");
  });
});

// ─── pricingTiers SEO tests ───────────────────────────────────────────────────

describe("pricingTiers structured data", () => {
  it("has at least 3 pricing tiers", () => {
    expect(pricingTiers.length).toBeGreaterThanOrEqual(3);
  });

  it("each tier has a key", () => {
    pricingTiers.forEach((tier) => {
      expect(typeof tier.key).toBe("string");
    });
  });

  it("each tier has a name", () => {
    pricingTiers.forEach((tier) => {
      expect(typeof tier.name).toBe("string");
    });
  });

  it("each tier has a price (0 = custom/contact)", () => {
    pricingTiers.forEach((tier) => {
      expect(typeof tier.price).toBe("number");
    });
  });

  it("each tier has features array", () => {
    pricingTiers.forEach((tier) => {
      expect(Array.isArray(tier.features)).toBe(true);
      expect(tier.features.length).toBeGreaterThan(0);
    });
  });

  it("Starter tier price is lower than Business tier price", () => {
    const starter = pricingTiers.find((t) => t.key === "starter");
    const business = pricingTiers.find((t) => t.key === "business");
    expect(starter?.price).toBeLessThan(business!.price);
  });

  it("can serialize all tiers to valid JSON", () => {
    expect(() => JSON.stringify(pricingTiers)).not.toThrow();
  });
});

// ─── Canonical URL tests ───────────────────────────────────────────────────────

describe("Canonical URL formation", () => {
  function buildCanonical(baseUrl: string, path: string): string {
    const base = baseUrl.replace(/\/$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  it("forms correct canonical for root path", () => {
    const canonical = buildCanonical("https://nucleoone.com", "/");
    expect(canonical).toBe("https://nucleoone.com/");
  });

  it("forms correct canonical for /pricing", () => {
    const canonical = buildCanonical("https://nucleoone.com", "/pricing");
    expect(canonical).toBe("https://nucleoone.com/pricing");
  });

  it("removes trailing slash from base URL before appending path", () => {
    const canonical = buildCanonical("https://nucleoone.com/", "/blog");
    expect(canonical).toBe("https://nucleoone.com/blog");
  });

  it("works with nested paths", () => {
    const canonical = buildCanonical(
      "https://nucleoone.com",
      "/blog/enterprise-crm-checklist",
    );
    expect(canonical).toBe(
      "https://nucleoone.com/blog/enterprise-crm-checklist",
    );
  });

  it("works with vs/competitor paths", () => {
    const canonical = buildCanonical("https://nucleoone.com", "/vs/hubspot");
    expect(canonical).toBe("https://nucleoone.com/vs/hubspot");
  });
});

// ─── og: and twitter: meta tag tests ─────────────────────────────────────────

describe("Open Graph and Twitter meta tags", () => {
  function buildPageMeta(options: {
    title: string;
    description: string;
    url: string;
    image?: string;
  }): Array<{ property?: string; name?: string; content: string }> {
    return [
      { property: "og:title", content: options.title },
      { property: "og:description", content: options.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: options.url },
      ...(options.image
        ? [{ property: "og:image", content: options.image }]
        : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: options.title },
      { name: "twitter:description", content: options.description },
    ];
  }

  it("includes og:title", () => {
    const meta = buildPageMeta({
      title: "Nucleo One - CRM",
      description: "...",
      url: "https://nucleoone.com",
    });
    const ogTitle = meta.find((m) => m.property === "og:title");
    expect(ogTitle?.content).toBe("Nucleo One - CRM");
  });

  it("includes og:description", () => {
    const meta = buildPageMeta({
      title: "Nucleo One",
      description: "All-in-one platform",
      url: "https://nucleoone.com",
    });
    const ogDesc = meta.find((m) => m.property === "og:description");
    expect(ogDesc?.content).toBe("All-in-one platform");
  });

  it("sets og:type to website", () => {
    const meta = buildPageMeta({
      title: "Nucleo One",
      description: "Desc",
      url: "https://nucleoone.com",
    });
    const ogType = meta.find((m) => m.property === "og:type");
    expect(ogType?.content).toBe("website");
  });

  it("sets twitter:card to summary_large_image", () => {
    const meta = buildPageMeta({
      title: "Nucleo One",
      description: "Desc",
      url: "https://nucleoone.com",
    });
    const twitterCard = meta.find((m) => m.name === "twitter:card");
    expect(twitterCard?.content).toBe("summary_large_image");
  });

  it("includes twitter:title and twitter:description", () => {
    const meta = buildPageMeta({
      title: "Test Page",
      description: "Test description",
      url: "https://nucleoone.com/test",
    });
    const twitterTitle = meta.find((m) => m.name === "twitter:title");
    const twitterDesc = meta.find((m) => m.name === "twitter:description");
    expect(twitterTitle?.content).toBe("Test Page");
    expect(twitterDesc?.content).toBe("Test description");
  });

  it("includes og:image when provided", () => {
    const meta = buildPageMeta({
      title: "Nucleo One",
      description: "Desc",
      url: "https://nucleoone.com",
      image: "https://nucleoone.com/og.png",
    });
    const ogImage = meta.find((m) => m.property === "og:image");
    expect(ogImage?.content).toBe("https://nucleoone.com/og.png");
  });

  it("does not include og:image when not provided", () => {
    const meta = buildPageMeta({
      title: "Nucleo One",
      description: "Desc",
      url: "https://nucleoone.com",
    });
    const ogImage = meta.find((m) => m.property === "og:image");
    expect(ogImage).toBeUndefined();
  });
});
