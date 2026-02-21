import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

/**
 * Hyperdrive connection string type
 */
export interface HyperdriveConnection {
  connectionString: string;
}

/**
 * Create a database client optimized for Cloudflare Workers with Neon
 * and local development with Postgres.js
 */
export function createDb(
  connectionString?: string | { connectionString: string },
) {
  let url: string;

  if (typeof connectionString === "string") {
    url = connectionString;
  } else if (connectionString && "connectionString" in connectionString) {
    url = connectionString.connectionString;
  } else {
    url = process.env.DATABASE_URL!;
  }

  // Determine if we need SSL/Local check
  // Uses postgres.js for local/standard connections to support TCP
  // We check for localhost OR development environment
  const isLocal =
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    process.env.NODE_ENV === "development";

  if (isLocal) {
    // Local development: Use postgres.js
    const client = postgres(url);
    return drizzlePostgres(client, { schema }) as any;
  }

  // Production/Cloudflare: Use Neon Serverless

  // drizzle-orm/neon-serverless accepts connection string directly
  return drizzleNeon(url, { schema }) as any;
}

/**
 * Database client type
 */
export type Database = ReturnType<typeof createDb>;

// Re-export schema for convenience
export { schema };
