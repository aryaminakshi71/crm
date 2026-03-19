/**
 * App Router
 *
 * Composed router with all domain routers.
 * Split into separate files to avoid TypeScript TS7056 limits.
 */

import { activitiesRouter } from "./activities";
import { advertisingRouter } from "./advertising";
import { agentsRouter } from "./agents";
import { apiKeysRouter } from "./api-keys";
import { auditRouter } from "./audit";
import { contactsRouter } from "./contacts";
import { dashboardRouter } from "./dashboard";
import { dealsRouter } from "./deals";
import { enterpriseRouter } from "./enterprise";
import { healthRouter } from "./health";
import { hrmRouter } from "./hrm";
import { intelligenceRouter } from "./intelligence";
import { integrationRouter } from "./integration";
import { leadsRouter } from "./leads";
import { modulesRouter } from "./modules";
import { monitoringRouter } from "./monitoring";
import { notificationsRouter } from "./notifications";
import { nucleoWorkspaceRouter } from "./nucleo-workspace";
import { operationsRouter } from "./operations";
import { organizationSettingsRouter } from "./organization-settings";
import { rbacRouter } from "./rbac";

import { assetsRouter } from "./assets";

export const appRouter = {
  health: healthRouter,
  contacts: contactsRouter,
  deals: dealsRouter,
  leads: leadsRouter,
  activities: activitiesRouter,
  dashboard: dashboardRouter,
  assets: assetsRouter,
  modules: modulesRouter,
  nucleo: nucleoWorkspaceRouter,
  hrm: hrmRouter,
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
  apiKeys: apiKeysRouter,
  audit: auditRouter,
};

export type AppRouter = typeof appRouter;
