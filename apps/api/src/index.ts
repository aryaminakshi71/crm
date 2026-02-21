/**
 * API Worker Entry Point
 *
 * Cloudflare Worker entry point using Hono with oRPC.
 */

import { api } from "./app";

// Export for Cloudflare Workers
export default api;
