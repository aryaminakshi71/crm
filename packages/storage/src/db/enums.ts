// Drizzle enums for PostgreSQL - derived from core enums
import {
  ACTIVITY_TYPE_VALUES,
  BILLING_PLAN_VALUES,
  CONTACT_STATUS_VALUES,
  DEAL_STAGE_VALUES,
  LEAD_SOURCE_VALUES,
  ORGANIZATION_ROLE_VALUES,
  SUBSCRIPTION_STATUS_VALUES,
} from "@crm/core";
import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

// Drizzle pgEnum definitions - use the array directly
export const organizationRoleEnum = pgEnum(
  "organization_role",
  ORGANIZATION_ROLE_VALUES,
);
export const contactStatusEnum = pgEnum(
  "contact_status",
  CONTACT_STATUS_VALUES,
);
export const dealStageEnum = pgEnum("deal_stage", DEAL_STAGE_VALUES);
export const leadSourceEnum = pgEnum("lead_source", LEAD_SOURCE_VALUES);
export const activityTypeEnum = pgEnum("activity_type", ACTIVITY_TYPE_VALUES);
export const billingPlanEnum = pgEnum("billing_plan", BILLING_PLAN_VALUES);
export const subscriptionStatusEnum = pgEnum(
  "subscription_status",
  SUBSCRIPTION_STATUS_VALUES,
);

// Zod enums for validation (re-exported from core)
export const organizationRoleZodEnum = z.enum(ORGANIZATION_ROLE_VALUES);
export const contactStatusZodEnum = z.enum(CONTACT_STATUS_VALUES);
export const dealStageZodEnum = z.enum(DEAL_STAGE_VALUES);
export const leadSourceZodEnum = z.enum(LEAD_SOURCE_VALUES);
export const activityTypeZodEnum = z.enum(ACTIVITY_TYPE_VALUES);
export const billingPlanZodEnum = z.enum(BILLING_PLAN_VALUES);
export const subscriptionStatusZodEnum = z.enum(SUBSCRIPTION_STATUS_VALUES);

// Also export core enums
export * from "@crm/core";
