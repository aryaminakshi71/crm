/**
 * App Router
 *
 * Composed router with all domain routers.
 * Split into separate files to avoid TypeScript TS7056 limits.
 */

import { brandingRouter } from "./branding";
import { billingRouter } from "./billing";
import { outreachRouter } from "./outreach";
import { activitiesRouter } from "./activities";
import { advertisingRouter } from "./advertising";
import { ecommerceRouter } from "./ecommerce";
import { agentsRouter } from "./agents";
import { apiKeysRouter } from "./api-keys";
import { auditRouter } from "./audit";
import { communicationsRouter } from "./communications";
import { contactsRouter } from "./contacts";
import { dashboardRouter } from "./dashboard";
import { dealsRouter } from "./deals";
import { devopsRouter } from "./devops";
import { enterpriseRouter } from "./enterprise";
import { fieldServiceRouter } from "./field-service";
import { healthRouter } from "./health";
import { metricsRouter } from "./metrics";
import { helpdeskRouter } from "./helpdesk";
import { hrmRouter } from "./hrm";
import { intelligenceRouter } from "./intelligence";
import { integrationRouter } from "./integration";
import { inventoryRouter } from "./inventory";
import { invoicingRouter } from "./invoicing";
import { leadsRouter } from "./leads";
import { marketingRouter } from "./marketing";
import { modulesRouter } from "./modules";
import { monitoringRouter } from "./monitoring";
import { notificationsRouter } from "./notifications";
import { nucleoWorkspaceRouter } from "./nucleo-workspace";
import { operationsRouter } from "./operations";
import { organizationSettingsRouter } from "./organization-settings";
import { presenceRouter } from "./presence";
import { rbacRouter } from "./rbac";
import { realtimeRouter } from "./realtime";
import { socialRouter } from "./social";
import { speechRouter } from "./speech";

import { assetsRouter } from "./assets";
import { projectsRouter } from "./projects";

export const appRouter = {
  branding: brandingRouter,
  billing: billingRouter,
  outreach: outreachRouter,
  health: healthRouter,
  metrics: metricsRouter,
  contacts: contactsRouter,
  deals: dealsRouter,
  leads: leadsRouter,
  activities: activitiesRouter,
  dashboard: dashboardRouter,
  assets: assetsRouter,
  modules: modulesRouter,
  nucleo: nucleoWorkspaceRouter,
  hrm: hrmRouter,
  helpdesk: helpdeskRouter,
  enterprise: enterpriseRouter,
  intelligence: intelligenceRouter,
  operations: operationsRouter,
  advertising: advertisingRouter,
  integration: integrationRouter,
  agents: agentsRouter,
  monitoring: monitoringRouter,
  notifications: notificationsRouter,
  rbac: rbacRouter,
  organizationSettings: organizationSettingsRouter,
  presence: presenceRouter,
  apiKeys: apiKeysRouter,
  audit: auditRouter,
  realtime: realtimeRouter,
  fieldService: fieldServiceRouter,
  devops: devopsRouter,
  communications: communicationsRouter,
  social: socialRouter,
  marketing: marketingRouter,
  inventory: inventoryRouter,
  ecommerce: ecommerceRouter,
  invoicing: invoicingRouter,
  speech: speechRouter,
  projects: projectsRouter,
};

export type AppRouter = typeof appRouter;
