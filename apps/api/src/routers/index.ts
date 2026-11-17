/**
 * App Router
 *
 * Composed router with all domain routers.
 * Split into separate files to avoid TypeScript TS7056 limits.
 */

import { activitiesRouter } from "./activities";
import { advertisingRouter } from "./advertising";
import { contactsRouter } from "./contacts";
import { dashboardRouter } from "./dashboard";
import { dealsRouter } from "./deals";
import { enterpriseRouter } from "./enterprise";
import { healthRouter } from "./health";
import { metricsRouter } from "./metrics";
import { hrmRouter } from "./hrm";
import { intelligenceRouter } from "./intelligence";
import { leadsRouter } from "./leads";
import { modulesRouter } from "./modules";
import { nucleoWorkspaceRouter } from "./nucleo-workspace";
import { operationsRouter } from "./operations";

import { assetsRouter } from "./assets";

export const appRouter = {
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
  enterprise: enterpriseRouter,
  intelligence: intelligenceRouter,
  operations: operationsRouter,
  advertising: advertisingRouter,
};

export type AppRouter = typeof appRouter;
