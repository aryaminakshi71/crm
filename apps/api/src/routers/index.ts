/**
 * App Router
 *
 * Composed router with all domain routers.
 * Split into separate files to avoid TypeScript TS7056 limits.
 */

import { activitiesRouter } from "./activities";
import { contactsRouter } from "./contacts";
import { dashboardRouter } from "./dashboard";
import { dealsRouter } from "./deals";
import { healthRouter } from "./health";
import { leadsRouter } from "./leads";

import { assetsRouter } from "./assets";

export const appRouter = {
  health: healthRouter,
  contacts: contactsRouter,
  deals: dealsRouter,
  leads: leadsRouter,
  activities: activitiesRouter,
  dashboard: dashboardRouter,
  assets: assetsRouter,
};

export type AppRouter = typeof appRouter;
