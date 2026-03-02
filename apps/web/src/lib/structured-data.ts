/**
 * Structured Data (JSON-LD) Utilities
 * Generates JSON-LD structured data for SEO
 */

export interface OrganizationSchema {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    telephone?: string;
    contactType?: string;
    email?: string;
  };
  sameAs?: string[];
}

export interface WebSiteSchema {
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    "@type": string;
    target: {
      "@type": string;
      urlTemplate: string;
    };
    "query-input": string;
  };
}

export interface BreadcrumbSchema {
  items: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * Generate Organization JSON-LD
 */
export function generateOrganizationSchema(data: OrganizationSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    url: data.url,
    ...(data.logo && { logo: data.logo }),
    ...(data.description && { description: data.description }),
    ...(data.contactPoint && {
      contactPoint: {
        "@type": "ContactPoint",
        ...data.contactPoint,
      },
    }),
    ...(data.sameAs && data.sameAs.length > 0 && { sameAs: data.sameAs }),
  };
}

/**
 * Generate WebSite JSON-LD
 */
export function generateWebSiteSchema(data: WebSiteSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: data.name,
    url: data.url,
    ...(data.description && { description: data.description }),
    ...(data.potentialAction && { potentialAction: data.potentialAction }),
  };
}

/**
 * Generate BreadcrumbList JSON-LD
 */
export function generateBreadcrumbSchema(data: BreadcrumbSchema): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: data.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Get default organization schema for CRM
 */
export function getCRMOrganizationSchema(): OrganizationSchema {
  return {
    name: "Nucleo One",
    url: import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001",
    description:
      "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations.",
  };
}
