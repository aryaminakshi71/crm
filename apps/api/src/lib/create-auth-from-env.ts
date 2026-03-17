/**
 * Shared Auth Configuration
 *
 * Creates a Better Auth instance from environment bindings.
 * Used by both the Hono app and oRPC procedures to avoid duplication.
 */

import { createAuth } from "@crm/auth";
import type { Database } from "@crm/storage";
import type { AppEnv } from "../context";

export function createAuthFromEnv(db: Database, env: AppEnv) {
  const baseURL =
    env.BETTER_AUTH_BASE_URL ||
    env.VITE_PUBLIC_SITE_URL ||
    "http://localhost:3001";

  return createAuth({
    db,
    kv: env.CACHE,
    secret: env.BETTER_AUTH_SECRET,
    baseURL,
    trustedOrigins: [
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3001",
      "http://localhost:8787",
      "http://127.0.0.1:8787",
    ],
    oauth: {
      google: env.GOOGLE_CLIENT_ID
        ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
          }
        : undefined,
      github: env.GITHUB_CLIENT_ID
        ? {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET!,
          }
        : undefined,
    },
    stripe:
      env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET
        ? {
            secretKey: env.STRIPE_SECRET_KEY,
            webhookSecret: env.STRIPE_WEBHOOK_SECRET,
          }
        : undefined,
  });
}
