/**
 * Server environment variables
 *
 * Includes all environment variables (client + server-only).
 * Never exposed to browser - import from "@crm/env/server" explicitly.
 *
 * Uses Cloudflare Workers runtime to access environment variables.
 */

import { z } from "zod";
import { clientSchema } from "./client.js";

const DEFAULT_DEV_AUTH_SECRET = "crm-local-dev-secret-0000000000000";

const resolveEnv = async (): Promise<Record<string, unknown>> => {
  if (
    typeof process !== "undefined" &&
    process.env?.SKIP_CLOUDFLARE === "true"
  ) {
    return process.env as Record<string, unknown>;
  }

  try {
    const cfModule = await import("cloudflare:workers");
    // `cloudflare:workers` exports are not typed as a plain Record; cast through unknown.
    return (cfModule as unknown as { env?: Record<string, unknown> }).env ?? {};
  } catch {
    return (typeof process !== "undefined" ? process.env : {}) as Record<
      string,
      unknown
    >;
  }
};

const hasValue = (value?: string): value is string =>
  typeof value === "string" && value.trim().length > 0;

const serverSchema = clientSchema
  .extend({
    // ============================================================================
    // OPERATIONAL CONFIG
    // ============================================================================

    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    // ============================================================================
    // AUTH (Better Auth)
    // ============================================================================

    BETTER_AUTH_SECRET: z.string().optional(),
    BETTER_AUTH_BASE_URL: z.string().url().or(z.literal("")).optional(),

    // OAuth Providers
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // ============================================================================
    // GOOGLE ADS API
    // ============================================================================

    GOOGLE_ADS_CLIENT_ID: z.string().optional(),
    GOOGLE_ADS_CLIENT_SECRET: z.string().optional(),
    GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional(),
    GOOGLE_ADS_MANAGER_ACCOUNT_ID: z.string().optional(),

    // ============================================================================
    // REDIS (Upstash)
    // Uses REST API naming convention expected by @upstash/redis fromEnv()
    // ============================================================================

    UPSTASH_REDIS_REST_URL: z.string().url().or(z.literal("")).optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // ============================================================================
    // STRIPE BILLING
    // ============================================================================

    STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),

    // ============================================================================
    // MONITORING (Sentry)
    // ============================================================================

    SENTRY_DSN: z.string().url().or(z.literal("")).optional(),
    SENTRY_ENVIRONMENT: z.string().optional(),
    SENTRY_DEBUG: z.string().optional(),

    // ============================================================================
    // APM (Datadog)
    // ============================================================================

    DATADOG_API_KEY: z.string().optional(),
    DATADOG_SERVICE_NAME: z.string().optional(),
    DATADOG_ENV: z.string().optional(),
    DATADOG_VERSION: z.string().optional(),

    // ============================================================================
    // LOG AGGREGATION
    // ============================================================================

    LOG_AGGREGATION_ENDPOINT: z.string().url().or(z.literal("")).optional(),
    LOG_AGGREGATION_API_KEY: z.string().optional(),
    LOG_AGGREGATION_SERVICE: z
      .enum(["datadog", "logtail", "cloudwatch", "custom"])
      .optional(),
  })
  .superRefine((value, ctx) => {
    const isProduction = value.NODE_ENV === "production";

    const requirePair = (
      leftKey: string,
      leftValue: string | undefined,
      rightKey: string,
      rightValue: string | undefined,
    ) => {
      if (!isProduction) return;
      const left = hasValue(leftValue);
      const right = hasValue(rightValue);
      if (left !== right) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${leftKey} and ${rightKey} must be provided together`,
          path: [left ? rightKey : leftKey],
        });
      }
    };

    requirePair(
      "GOOGLE_CLIENT_ID",
      value.GOOGLE_CLIENT_ID,
      "GOOGLE_CLIENT_SECRET",
      value.GOOGLE_CLIENT_SECRET,
    );
    requirePair(
      "GITHUB_CLIENT_ID",
      value.GITHUB_CLIENT_ID,
      "GITHUB_CLIENT_SECRET",
      value.GITHUB_CLIENT_SECRET,
    );
    requirePair(
      "UPSTASH_REDIS_REST_URL",
      value.UPSTASH_REDIS_REST_URL,
      "UPSTASH_REDIS_REST_TOKEN",
      value.UPSTASH_REDIS_REST_TOKEN,
    );
    requirePair(
      "STRIPE_SECRET_KEY",
      value.STRIPE_SECRET_KEY,
      "STRIPE_WEBHOOK_SECRET",
      value.STRIPE_WEBHOOK_SECRET,
    );

    if (isProduction) {
      if (!hasValue(value.BETTER_AUTH_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "BETTER_AUTH_SECRET is required in production",
          path: ["BETTER_AUTH_SECRET"],
        });
      } else if (value.BETTER_AUTH_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "BETTER_AUTH_SECRET must be at least 32 characters in production",
          path: ["BETTER_AUTH_SECRET"],
        });
      } else if (value.BETTER_AUTH_SECRET === DEFAULT_DEV_AUTH_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "BETTER_AUTH_SECRET cannot use the local development default in production",
          path: ["BETTER_AUTH_SECRET"],
        });
      }

      if (!value.VITE_PUBLIC_SITE_URL.startsWith("https://")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "VITE_PUBLIC_SITE_URL must use https:// in production",
          path: ["VITE_PUBLIC_SITE_URL"],
        });
      }

      if (value.VITE_PUBLIC_SITE_URL.includes("localhost")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "VITE_PUBLIC_SITE_URL cannot point to localhost in production",
          path: ["VITE_PUBLIC_SITE_URL"],
        });
      }

      if (
        hasValue(value.BETTER_AUTH_BASE_URL) &&
        !value.BETTER_AUTH_BASE_URL.startsWith("https://")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "BETTER_AUTH_BASE_URL must use https:// in production",
          path: ["BETTER_AUTH_BASE_URL"],
        });
      }
    }
  });

type ParsedServerEnv = z.infer<typeof serverSchema>;
export type ServerEnv = Omit<ParsedServerEnv, "BETTER_AUTH_SECRET"> & {
  BETTER_AUTH_SECRET: string;
};

/**
 * Validated server environment variables
 *
 * Includes all environment variables (client + server-only).
 * Validation happens once at module load time.
 *
 * Note: Cloudflare bindings (KV, R2, Hyperdrive) are accessed separately
 * via Hono context (c.env.*), not through this module.
 */
const cfEnv = await resolveEnv();
const parsedResult = serverSchema.safeParse(cfEnv);

if (!parsedResult.success) {
  console.error("❌ Server environment validation failed:");
  for (const issue of parsedResult.error.issues) {
    const path = issue.path.length ? issue.path.join(".") : "(root)";
    console.error(`- ${path}: ${issue.message}`);
  }
  throw new Error("Server environment validation failed");
}

const parsedEnv = parsedResult.data;
const nodeEnv = parsedEnv.NODE_ENV ?? "development";
const betterAuthSecret = hasValue(parsedEnv.BETTER_AUTH_SECRET)
  ? parsedEnv.BETTER_AUTH_SECRET
  : nodeEnv === "production"
    ? ""
    : DEFAULT_DEV_AUTH_SECRET;

if (nodeEnv === "production" && !hasValue(betterAuthSecret)) {
  throw new Error("BETTER_AUTH_SECRET is required in production");
}

export const env: ServerEnv = {
  ...parsedEnv,
  BETTER_AUTH_SECRET: betterAuthSecret,
};
