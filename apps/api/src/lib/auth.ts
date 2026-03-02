import { env } from "@crm/env/server";
import { logger } from "@crm/logger";
import { createDb, schema } from "@crm/storage";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

// Create scoped logger for auth module
const log = logger.child({ module: "auth" });

/**
 * Create auth instance with database
 * In Cloudflare Workers, we create this per-request
 */
export function createAuth(connectionString: string) {
  const db = createDb({ connectionString });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    baseURL: env.VITE_PUBLIC_SITE_URL || "http://localhost:3001",
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET || "change-me-in-production-min-32-chars",
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update session every 24 hours
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
    socialProviders: {
      google:
        env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
          ? {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            }
          : undefined,
      github:
        env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
          ? {
              clientId: env.GITHUB_CLIENT_ID,
              clientSecret: env.GITHUB_CLIENT_SECRET,
            }
          : undefined,
    },
    plugins: [
      organization({
        allowUserToCreateOrganization: true,
        organizationCreation: {
          afterCreate: async ({
            organization,
            user,
          }: { organization: any; user: any }) => {
            log.info("organization:created", {
              organizationId: organization.id,
              userId: user.id,
            });
          },
        },
      }),
    ],
    advanced: {
      cookiePrefix: "crm",
      useSecureCookies: env.NODE_ENV === "production",
    },
  });
}
