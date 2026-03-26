/**
 * Lead Tracking & UTM Utilities
 *
 * UTM parameter parsing, lead scoring, and conversion tracking.
 */

import { industries, pricingTiers } from "./seo";

// UTM Parameter Types
export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

// Lead Source Types
export type LeadSource =
  | "organic"
  | "paid_search"
  | "paid_social"
  | "email"
  | "referral"
  | "direct"
  | "partner";

// Parse UTM parameters from URL
export function parseUTMParams(url: string): UTMParams {
  if (typeof window === "undefined") return {};

  try {
    const params = new URL(url).searchParams;
    return {
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      utm_term: params.get("utm_term") || undefined,
      utm_content: params.get("utm_content") || undefined,
    };
  } catch {
    return {};
  }
}

// Get UTM params from current window
export function getCurrentUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};
  return parseUTMParams(window.location.href);
}

// Determine lead source from UTM medium
export function getLeadSource(utm: UTMParams): LeadSource {
  const medium = utm.utm_medium?.toLowerCase() || "";

  if (medium.includes("cpc") || medium.includes("ppc") || medium.includes("paid"))
    return "paid_search";
  if (medium.includes("social") || medium.includes("facebook") || medium.includes("linkedin"))
    return "paid_social";
  if (medium.includes("email")) return "email";
  if (medium.includes("referral")) return "referral";
  if (medium === "") return "direct";

  return "organic";
}

// Lead Scoring Weights
interface LeadScoringWeights {
  companySize: number;
  industry: number;
  jobTitle: number;
  engagement: number;
  source: number;
}

// Default scoring weights
export const defaultScoringWeights: LeadScoringWeights = {
  companySize: 25,
  industry: 20,
  jobTitle: 20,
  engagement: 20,
  source: 15,
};

// Lead Score Tiers
export type LeadScoreTier = "cold" | "warm" | "hot" | "qualified";

export function getLeadScoreTier(score: number): LeadScoreTier {
  if (score >= 80) return "qualified";
  if (score >= 60) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

// Lead Score Data
export interface LeadScoreData {
  companySize?: "startup" | "smb" | "mid" | "enterprise";
  industry?: keyof typeof industries;
  jobTitle?: "ic" | "manager" | "director" | "vp" | "cxo";
  engagedPages: string[];
  visitCount: number;
  source: LeadSource;
}

// Score a lead based on engagement data
export function scoreLead(data: LeadScoreData): number {
  let score = 0;

  // Company size scoring (max 25 points)
  switch (data.companySize) {
    case "enterprise":
      score += 25;
      break;
    case "mid":
      score += 20;
      break;
    case "smb":
      score += 10;
      break;
    case "startup":
      score += 5;
      break;
  }

  // Industry scoring (max 20 points)
  if (data.industry) {
    const industryKeywords = ["technology", "finance", "healthcare", "enterprise"];
    if (industryKeywords.some((kw) => data.industry!.includes(kw))) {
      score += 20;
    } else {
      score += 10;
    }
  }

  // Job title scoring (max 20 points)
  switch (data.jobTitle) {
    case "cxo":
      score += 20;
      break;
    case "vp":
      score += 15;
      break;
    case "director":
      score += 12;
      break;
    case "manager":
      score += 8;
      break;
    case "ic":
      score += 4;
      break;
  }

  // Engagement scoring (max 20 points)
  const engagementScore = Math.min(data.engagedPages.length * 4, 12);
  const visitScore = Math.min(data.visitCount * 2, 8);
  score += engagementScore + visitScore;

  // Source scoring (max 15 points)
  switch (data.source) {
    case "organic":
      score += 15;
      break;
    case "paid_search":
      score += 12;
      break;
    case "paid_social":
      score += 10;
      break;
    case "referral":
      score += 10;
      break;
    case "email":
      score += 8;
      break;
    case "direct":
      score += 5;
      break;
  }

  return Math.min(score, 100);
}

// Track page view for engagement scoring
export function trackPageView(page: string, leadId?: string): void {
  if (typeof window === "undefined") return;

  const storageKey = `nucleo_engagement_${leadId || "anonymous"}`;
  const engagement = JSON.parse(sessionStorage.getItem(storageKey) || '{"pages":[],"visits":0}');

  if (!engagement.pages.includes(page)) {
    engagement.pages.push(page);
  }
  engagement.visits += 1;
  engagement.lastVisit = new Date().toISOString();

  sessionStorage.setItem(storageKey, JSON.stringify(engagement));
}

// Conversion event types
export type ConversionEvent =
  | "trial_started"
  | "demo_scheduled"
  | "pricing_viewed"
  | "contact_form_submitted"
  | "feature_page_viewed"
  | "comparison_viewed";

// Track conversion events
export function trackConversion(event: ConversionEvent, metadata?: Record<string, any>): void {
  if (typeof window === "undefined") return;

  const utm = getCurrentUTMParams();
  const conversions = JSON.parse(localStorage.getItem("nucleo_conversions") || "[]");

  conversions.push({
    event,
    metadata,
    utm,
    timestamp: new Date().toISOString(),
  });

  localStorage.setItem("nucleo_conversions", JSON.stringify(conversions));

  // Also send to analytics if available
  if (typeof window !== "undefined" && "gtag" in window) {
    (window as any).gtag("event", event, metadata);
  }
}

// Get recommended plan based on lead score
export function getRecommendedPlan(score: number): typeof pricingTiers[number] | null {
  const tier = getLeadScoreTier(score);

  switch (tier) {
    case "qualified":
      return pricingTiers.find((p) => p.key === "enterprise") || null;
    case "hot":
      return pricingTiers.find((p) => p.key === "business") || null;
    case "warm":
      return pricingTiers.find((p) => p.key === "growth") || null;
    default:
      return pricingTiers.find((p) => p.key === "starter") || null;
  }
}

// Ad campaign types for tracking
export interface AdCampaign {
  name: string;
  source: string;
  medium: string;
  terms?: string[];
  content?: string;
}

// Known competitor keywords for ad targeting
export const competitorKeywords = [
  { competitor: "salesforce", terms: ["salesforce alternative", "salesforce crm replacement", "salesforce pricing"] },
  { competitor: "hubspot", terms: ["hubspot alternative", "hubspot crm free", "hubspot pricing too expensive"] },
  { competitor: "zoho", terms: ["zoho crm alternative", "zoho one alternative"] },
  { competitor: "pipedrive", terms: ["pipedrive alternative", "pipedrive crm"] },
  { competitor: "dynamics", terms: ["ms dynamics alternative", "microsoft dynamics crm"] },
] as const;

// Track which competitor page was viewed
export function trackCompetitorView(competitor: string): void {
  if (typeof window === "undefined") return;

  const viewed = JSON.parse(localStorage.getItem("nucleo_competitor_views") || "[]");
  if (!viewed.includes(competitor)) {
    viewed.push(competitor);
    localStorage.setItem("nucleo_competitor_views", JSON.stringify(viewed));
  }

  trackConversion("comparison_viewed", { competitor });
}

// Get UTM storage key
export function getUTMStorageKey(): string {
  if (typeof window === "undefined") return "";
  return `nucleo_utm_${new Date().toISOString().split("T")[0]}`;
}

// Persist UTM params across sessions
export function persistUTMParams(): void {
  if (typeof window === "undefined") return;

  const utm = getCurrentUTMParams();
  if (Object.keys(utm).length > 0) {
    const storageKey = getUTMStorageKey();
    localStorage.setItem(storageKey, JSON.stringify({ ...utm, persistedAt: new Date().toISOString() }));
  }
}

// Get most recent UTM params
export function getPersistedUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};

  const today = new Date().toISOString().split("T")[0];
  const storageKey = `nucleo_utm_${today}`;
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        utm_source: parsed.utm_source,
        utm_medium: parsed.utm_medium,
        utm_campaign: parsed.utm_campaign,
        utm_term: parsed.utm_term,
        utm_content: parsed.utm_content,
      };
    } catch {
      return {};
    }
  }

  return {};
}
