/**
 * API Worker Entry Point
 *
 * Cloudflare Worker entry point using Hono with oRPC.
 * Also runs the AI marketing cron on a schedule.
 */

import { api } from "./app";
import { runMarketingCron } from "./lib/marketing-cron";

export default {
  fetch: api.fetch.bind(api),
  scheduled: async (_event: unknown, env: any, ctx: any) => {
    ctx.waitUntil(runMarketingCron(env));
  },
};
