// Core enums - single source of truth for all system enums

// Organization roles
export const ORGANIZATION_ROLE_VALUES = ["owner", "admin", "member"] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLE_VALUES)[number];

// Contact status for CRM
export const CONTACT_STATUS_VALUES = [
  "lead",
  "prospect",
  "customer",
  "churned",
] as const;
export type ContactStatus = (typeof CONTACT_STATUS_VALUES)[number];

// Deal stages for pipeline
export const DEAL_STAGE_VALUES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
export type DealStage = (typeof DEAL_STAGE_VALUES)[number];

// Lead sources
export const LEAD_SOURCE_VALUES = [
  "website",
  "referral",
  "cold_outreach",
  "social_media",
  "event",
  "advertising",
  "other",
] as const;
export type LeadSource = (typeof LEAD_SOURCE_VALUES)[number];

// Activity types
export const ACTIVITY_TYPE_VALUES = [
  "call",
  "email",
  "meeting",
  "note",
  "task",
  "demo",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPE_VALUES)[number];

// Billing plans
export const BILLING_PLAN_VALUES = ["free", "pro", "enterprise"] as const;
export type BillingPlan = (typeof BILLING_PLAN_VALUES)[number];

// Subscription status
export const SUBSCRIPTION_STATUS_VALUES = [
  "active",
  "canceled",
  "past_due",
  "trialing",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS_VALUES)[number];
