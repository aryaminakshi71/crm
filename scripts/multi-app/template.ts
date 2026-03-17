/**
 * Environment Template Generator
 * Generates .env files from app configurations
 */

import type { AppConfig, EnvTemplateVars, Environment } from "./types";

/**
 * Generate a secure random string for secrets
 */
export function generateSecret(length = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Environment file template
 */
const ENV_TEMPLATE = `# ============================================
# {{APP_NAME}} - {{APP_ENVIRONMENT}} Environment
# Domain: {{APP_DOMAIN}}
# Generated: {{GENERATED_AT}}
# ============================================

# Environment
NODE_ENV={{NODE_ENV}}

# ===========================================
# Authentication (Better Auth)
# ===========================================
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET={{BETTER_AUTH_SECRET}}

# ===========================================
# OAuth Providers
# ===========================================

# Google OAuth
# Console: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID={{GOOGLE_CLIENT_ID}}
GOOGLE_CLIENT_SECRET={{GOOGLE_CLIENT_SECRET}}

# GitHub OAuth
# Console: https://github.com/settings/developers
GITHUB_CLIENT_ID={{GITHUB_CLIENT_ID}}
GITHUB_CLIENT_SECRET={{GITHUB_CLIENT_SECRET}}

# ===========================================
# Stripe
# Console: https://dashboard.stripe.com
# ===========================================
VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY={{STRIPE_PUBLISHABLE_KEY}}
STRIPE_SECRET_KEY={{STRIPE_SECRET_KEY}}
STRIPE_WEBHOOK_SECRET={{STRIPE_WEBHOOK_SECRET}}

# ===========================================
# Cloudflare R2 Storage
# Console: https://dash.cloudflare.com/r2
# ===========================================
CLOUDFLARE_ACCOUNT_ID={{CLOUDFLARE_ACCOUNT_ID}}
R2_BUCKET_NAME={{R2_BUCKET_NAME}}
R2_ACCESS_KEY_ID={{R2_ACCESS_KEY_ID}}
R2_SECRET_ACCESS_KEY={{R2_SECRET_ACCESS_KEY}}

# ===========================================
# Upstash Redis
# Console: https://console.upstash.com
# ===========================================
UPSTASH_REDIS_REST_URL={{UPSTASH_REDIS_REST_URL}}
UPSTASH_REDIS_REST_TOKEN={{UPSTASH_REDIS_REST_TOKEN}}

# ===========================================
# PostHog Analytics
# Console: https://app.posthog.com
# ===========================================
NEXT_PUBLIC_POSTHOG_KEY={{NEXT_PUBLIC_POSTHOG_KEY}}
NEXT_PUBLIC_POSTHOG_HOST={{NEXT_PUBLIC_POSTHOG_HOST}}

# ===========================================
# Database
# ===========================================
DATABASE_URL={{DATABASE_URL}}

# ===========================================
# Application URLs
# ===========================================
BETTER_AUTH_BASE_URL={{BETTER_AUTH_BASE_URL}}
VITE_PUBLIC_SITE_URL={{VITE_PUBLIC_SITE_URL}}
VITE_API_URL={{VITE_API_URL}}

# ===========================================
# Optional: Logging & Monitoring
# ===========================================
LOG_LEVEL={{LOG_LEVEL}}
# SENTRY_DSN=

# ===========================================
# Custom Variables
# ===========================================
{{CUSTOM_VARS}}
`;

/**
 * Convert app config to template variables
 */
export function appConfigToTemplateVars(config: AppConfig): EnvTemplateVars {
  const protocol = config.environment === "development" ? "http" : "https";
  const baseUrl = `${protocol}://${config.domain}`;
  const apiUrl =
    config.environment === "development"
      ? "http://localhost:3001"
      : `${baseUrl}/api`;

  return {
    APP_NAME: config.name,
    APP_DOMAIN: config.domain,
    APP_ENVIRONMENT: config.environment,

    // Auth
    BETTER_AUTH_SECRET:
      config.customEnvVars?.BETTER_AUTH_SECRET || generateSecret(32),

    // Google OAuth
    GOOGLE_CLIENT_ID: config.services.google?.clientId || "",
    GOOGLE_CLIENT_SECRET: config.services.google?.clientSecret || "",

    // GitHub OAuth
    GITHUB_CLIENT_ID: config.services.github?.clientId || "",
    GITHUB_CLIENT_SECRET: config.services.github?.clientSecret || "",

    // Stripe
    STRIPE_PUBLISHABLE_KEY: config.services.stripe?.publishableKey || "",
    STRIPE_SECRET_KEY: config.services.stripe?.secretKey || "",
    STRIPE_WEBHOOK_SECRET: config.services.stripe?.webhookSecret || "",

    // Cloudflare R2
    CLOUDFLARE_ACCOUNT_ID: config.services.cloudflareR2?.accountId || "",
    R2_BUCKET_NAME: config.services.cloudflareR2?.bucketName || "",
    R2_ACCESS_KEY_ID: config.services.cloudflareR2?.accessKeyId || "",
    R2_SECRET_ACCESS_KEY: config.services.cloudflareR2?.secretAccessKey || "",

    // Upstash Redis
    UPSTASH_REDIS_REST_URL: config.services.upstashRedis?.restUrl || "",
    UPSTASH_REDIS_REST_TOKEN: config.services.upstashRedis?.restToken || "",

    // PostHog
    NEXT_PUBLIC_POSTHOG_KEY: config.services.postHog?.apiKey || "",
    NEXT_PUBLIC_POSTHOG_HOST:
      config.services.postHog?.host || "https://app.posthog.com",

    // Database
    DATABASE_URL: config.services.database?.url || "",

    // URLs
    BETTER_AUTH_BASE_URL:
      config.environment === "development"
        ? "http://localhost:8787"
        : `${baseUrl}`,
    VITE_PUBLIC_SITE_URL: baseUrl,
    VITE_API_URL: apiUrl,
  };
}

/**
 * Generate .env file content from app config
 */
export function generateEnvContent(config: AppConfig): string {
  const vars = appConfigToTemplateVars(config);
  const nodeEnv =
    config.environment === "production"
      ? "production"
      : config.environment === "staging"
        ? "production"
        : "development";

  let content = ENV_TEMPLATE.replace("{{APP_NAME}}", vars.APP_NAME)
    .replace("{{APP_ENVIRONMENT}}", vars.APP_ENVIRONMENT.toUpperCase())
    .replace("{{APP_DOMAIN}}", vars.APP_DOMAIN)
    .replace("{{GENERATED_AT}}", new Date().toISOString())
    .replace("{{NODE_ENV}}", nodeEnv)
    .replace("{{BETTER_AUTH_SECRET}}", vars.BETTER_AUTH_SECRET)
    .replace("{{GOOGLE_CLIENT_ID}}", vars.GOOGLE_CLIENT_ID)
    .replace("{{GOOGLE_CLIENT_SECRET}}", vars.GOOGLE_CLIENT_SECRET)
    .replace("{{GITHUB_CLIENT_ID}}", vars.GITHUB_CLIENT_ID)
    .replace("{{GITHUB_CLIENT_SECRET}}", vars.GITHUB_CLIENT_SECRET)
    .replace("{{STRIPE_PUBLISHABLE_KEY}}", vars.STRIPE_PUBLISHABLE_KEY)
    .replace("{{STRIPE_SECRET_KEY}}", vars.STRIPE_SECRET_KEY)
    .replace("{{STRIPE_WEBHOOK_SECRET}}", vars.STRIPE_WEBHOOK_SECRET)
    .replace("{{CLOUDFLARE_ACCOUNT_ID}}", vars.CLOUDFLARE_ACCOUNT_ID)
    .replace("{{R2_BUCKET_NAME}}", vars.R2_BUCKET_NAME)
    .replace("{{R2_ACCESS_KEY_ID}}", vars.R2_ACCESS_KEY_ID)
    .replace("{{R2_SECRET_ACCESS_KEY}}", vars.R2_SECRET_ACCESS_KEY)
    .replace("{{UPSTASH_REDIS_REST_URL}}", vars.UPSTASH_REDIS_REST_URL)
    .replace("{{UPSTASH_REDIS_REST_TOKEN}}", vars.UPSTASH_REDIS_REST_TOKEN)
    .replace("{{NEXT_PUBLIC_POSTHOG_KEY}}", vars.NEXT_PUBLIC_POSTHOG_KEY)
    .replace("{{NEXT_PUBLIC_POSTHOG_HOST}}", vars.NEXT_PUBLIC_POSTHOG_HOST)
    .replace("{{DATABASE_URL}}", vars.DATABASE_URL)
    .replace("{{VITE_PUBLIC_SITE_URL}}", vars.VITE_PUBLIC_SITE_URL)
    .replace("{{VITE_API_URL}}", vars.VITE_API_URL)
    .replace(
      "{{LOG_LEVEL}}",
      config.environment === "production" ? "warn" : "info",
    );

  // Add custom variables
  const customVars = config.customEnvVars
    ? Object.entries(config.customEnvVars)
        .filter(
          ([key]) =>
            !key.startsWith("BETTER_AUTH") &&
            !key.startsWith("GOOGLE") &&
            !key.startsWith("GITHUB"),
        )
        .map(([key, value]) => `${key}=${value}`)
        .join("\n")
    : "";

  content = content.replace("{{CUSTOM_VARS}}", customVars);

  return content;
}

/**
 * Generate environment file name based on environment
 */
export function getEnvFileName(environment: Environment): string {
  switch (environment) {
    case "development":
      return ".env.development";
    case "staging":
      return ".env.staging";
    case "production":
      return ".env.production";
    default:
      return ".env";
  }
}

/**
 * Generate a minimal template for new apps
 */
export function generateMinimalTemplate(appId: string, domain: string): string {
  return `# ${appId} - Configuration Template
# Domain: ${domain}
# Fill in the values below after creating the resources

# ===========================================
# Authentication
# ===========================================
BETTER_AUTH_SECRET=${generateSecret(32)}

# ===========================================
# OAuth (Create at console URLs below)
# ===========================================

# Google OAuth: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth: https://github.com/settings/developers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ===========================================
# Stripe: https://dashboard.stripe.com
# ===========================================
VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ===========================================
# Cloudflare R2: https://dash.cloudflare.com/r2
# ===========================================
CLOUDFLARE_ACCOUNT_ID=
R2_BUCKET_NAME=${appId}-assets
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=

# ===========================================
# Upstash Redis: https://console.upstash.com
# ===========================================
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ===========================================
# PostHog: https://app.posthog.com
# ===========================================
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ===========================================
# Database
# ===========================================
DATABASE_URL=

# ===========================================
# URLs
# ===========================================
VITE_PUBLIC_SITE_URL=https://${domain}
VITE_API_URL=https://${domain}/api
`;
}

/**
 * Create a new app config with default values
 */
export function createDefaultAppConfig(
  id: string,
  name: string,
  domain: string,
  environment: Environment,
): AppConfig {
  const now = new Date().toISOString();
  return {
    id,
    name,
    domain,
    environment,
    createdAt: now,
    updatedAt: now,
    services: {
      cloudflareR2: {
        bucketName: `${id}-assets-${environment}`,
        accountId: "",
        accessKeyId: "",
        secretAccessKey: "",
      },
      upstashRedis: {
        databaseName: `${id}-cache-${environment}`,
        restUrl: "",
        restToken: "",
      },
    },
  };
}

/**
 * Generate Wrangler secrets command for an app
 */
export function generateWranglerSecretsCommand(config: AppConfig): string {
  const vars = appConfigToTemplateVars(config);
  const secrets = [
    `BETTER_AUTH_SECRET`,
    `GOOGLE_CLIENT_ID`,
    `GOOGLE_CLIENT_SECRET`,
    `GITHUB_CLIENT_ID`,
    `GITHUB_CLIENT_SECRET`,
    `STRIPE_SECRET_KEY`,
    `STRIPE_WEBHOOK_SECRET`,
    `R2_ACCESS_KEY_ID`,
    `R2_SECRET_ACCESS_KEY`,
    `UPSTASH_REDIS_REST_URL`,
    `UPSTASH_REDIS_REST_TOKEN`,
    `DATABASE_URL`,
  ];

  const commands = secrets
    .map((secret) => {
      const value = vars[secret as keyof EnvTemplateVars] || "";
      if (!value) return null;
      return `echo "${value}" | wrangler secret put ${secret}`;
    })
    .filter(Boolean);

  return `# Wrangler secrets for ${config.name} (${config.environment})
# Run these commands in the app directory

${commands.join("\n")}
`;
}
