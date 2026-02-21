import { z } from "zod";

// =============================================================================
// CRM Enums
// =============================================================================

// Deal Stage
export const DEAL_STAGE_VALUES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;
export type DealStage = (typeof DEAL_STAGE_VALUES)[number];
export const dealStageZodEnum = z.enum(DEAL_STAGE_VALUES);

// Lead Status
export const LEAD_STATUS_VALUES = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];
export const leadStatusZodEnum = z.enum(LEAD_STATUS_VALUES);

// Activity Type
export const ACTIVITY_TYPE_VALUES = [
  "call",
  "email",
  "meeting",
  "note",
  "task",
  "other",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPE_VALUES)[number];
export const activityTypeZodEnum = z.enum(ACTIVITY_TYPE_VALUES);

// Industry Type
export const INDUSTRY_TYPE_VALUES = [
  "banking",
  "consulting",
  "education",
  "healthcare",
  "legal",
  "realty",
  "retail",
  "technology",
] as const;
export type IndustryType = (typeof INDUSTRY_TYPE_VALUES)[number];
export const industryTypeZodEnum = z.enum(INDUSTRY_TYPE_VALUES);

// Integration Type
export const INTEGRATION_TYPE_VALUES = [
  "email",
  "whatsapp",
  "calendar",
  "crm",
  "marketing",
  "other",
] as const;
export type IntegrationType = (typeof INTEGRATION_TYPE_VALUES)[number];
export const integrationTypeZodEnum = z.enum(INTEGRATION_TYPE_VALUES);

// =============================================================================
// Backward-compatible constant objects
// =============================================================================

export const DEAL_STAGE = {
  LEAD: "lead",
  QUALIFIED: "qualified",
  PROPOSAL: "proposal",
  NEGOTIATION: "negotiation",
  CLOSED_WON: "closed_won",
  CLOSED_LOST: "closed_lost",
} as const;

export const LEAD_STATUS = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  CONVERTED: "converted",
  LOST: "lost",
} as const;

export const ACTIVITY_TYPE = {
  CALL: "call",
  EMAIL: "email",
  MEETING: "meeting",
  NOTE: "note",
  TASK: "task",
  OTHER: "other",
} as const;
