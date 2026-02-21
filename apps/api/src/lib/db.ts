/**
 * Database Access Module
 *
 * Provides database access for procedures without exposing
 * full Drizzle types in the oRPC context (which causes TS7056 errors).
 *
 * In Cloudflare Workers, we create a new client per-request since
 * environment bindings are request-scoped.
 */

import { createDb as createDbClient, schema } from "@crm/storage";
import type { InitialContext } from "../context";

export { schema };

/**
 * Create a database client from the request context
 * Use this in procedures instead of accessing db from context
 */
export function getDb(context: Pick<InitialContext, "env">) {
  const connectionString =
    context.env?.DATABASE?.connectionString ||
    context.env?.DATABASE_URL ||
    (typeof process !== "undefined" ? process.env.DATABASE_URL : undefined);

  if (!connectionString) {
    throw new Error(
      "Database connection string not found. Ensure DATABASE binding is set in Cloudflare or DATABASE_URL in process.env",
    );
  }

  return createDbClient({ connectionString });
}

/**
 * Database client type - use sparingly to avoid type inference bloat
 */
export type Db = ReturnType<typeof getDb>;
