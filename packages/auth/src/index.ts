/**
 * Better Auth Server Configuration
 *
 * Full-featured authentication for Cloudflare Workers with:
 * - OAuth providers (Google, GitHub)
 * - Organization/team support
 * - Stripe billing (optional)
 * - API key authentication
 */

import type { KVNamespace } from "@cloudflare/workers-types";
import type { Database } from "@crm/storage";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey, openAPI, organization } from "better-auth/plugins";
import bcrypt from "bcryptjs";
import { createKVStorage } from "./kv-storage";
import * as authSchema from "@crm/storage/schema";

export interface AuthConfig {
  /** Database instance from @crm/storage */
  db: Database;
  /** Cloudflare KV namespace for session storage */
  kv: KVNamespace;
  /** Better Auth secret (32+ characters) */
  secret: string;
  /** Base URL for the app (e.g., https://example.com) */
  baseURL: string;
  /** OAuth provider credentials */
  oauth?: {
    google?: {
      clientId: string;
      clientSecret: string;
    };
    github?: {
      clientId: string;
      clientSecret: string;
    };
  };
  /** Stripe billing configuration (optional) */
  stripe?: {
    secretKey: string;
    webhookSecret: string;
  };
  /** Trusted origins for CORS */
  trustedOrigins?: string[];
}

/**
 * Create a Better Auth instance configured for Cloudflare Workers
 */
export function createAuth(config: AuthConfig) {
  const {
    db,
    kv,
    secret,
    baseURL,
    oauth,
    stripe,
    trustedOrigins = [],
  } = config;

  // Build plugins array
  const plugins: any[] = [
    // Organization/team support
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 3, // Free tier limit
      sendInvitationEmail: async ({
        email,
        organization,
        inviter,
      }: { email: string; organization: any; inviter: any }) => {
        console.log(
          `Invitation to ${email} for org ${organization.name} from ${inviter.user.name}`,
        );
      },
    }),

    // API key authentication
    apiKey({
      enableMetadata: true,
      apiKeyHeaders: "x-api-key",
    }),

    // OpenAPI documentation
    openAPI(),
  ];

  // Add Stripe plugin if configured
  if (stripe?.secretKey && stripe?.webhookSecret) {
    plugins.push({
      name: "stripe",
      // Stripe configuration would be added here
    });
  }

  const isProduction =
    process.env.NODE_ENV === "production" || baseURL.startsWith("https://");

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
      usePlural: true,
    }),
    ...(kv ? { secondaryStorage: createKVStorage(kv) } : {}),
    secret,
    baseURL,
    basePath: "/api/auth",

    // Session configuration
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24 * 7, // 7 days
      cookieCache: { enabled: true, maxAge: 300 }, // 5 min edge cache
    },

    // Email/password enabled
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      password: {
        hash: async (password) => {
          return await bcrypt.hash(password, 10);
        },
        verify: async ({ hash, password }) => {
          return await bcrypt.compare(password, hash);
        },
      },
    },

    // OAuth providers
    socialProviders: {
      ...(oauth?.google && {
        google: {
          clientId: oauth.google.clientId,
          clientSecret: oauth.google.clientSecret,
        },
      }),
      ...(oauth?.github && {
        github: {
          clientId: oauth.github.clientId,
          clientSecret: oauth.github.clientSecret,
        },
      }),
    },

    // Account linking for OAuth
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google", "github"],
        allowDifferentEmails: false,
        allowUnlinkingAll: false,
      },
    },

    // Plugins
    plugins,

    // Advanced settings
    advanced: {
      useSecureCookies: isProduction, // Only use secure cookies in production (HTTPS)
      cookiePrefix: "saas-layer",
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },

    // Trusted origins
    trustedOrigins: [baseURL, ...trustedOrigins],
  });
}

export type Auth = ReturnType<typeof createAuth>;

// Re-export client utilities
export { authClient, useSession, signIn, signUp, signOut } from "./client";
export type { Session, User } from "./client";
