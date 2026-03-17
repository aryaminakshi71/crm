/**
 * Type definitions for multi-app credentials management
 * Supports managing 20+ production apps with centralized configuration
 */

/**
 * Environment types for each app
 */
export type Environment = "development" | "staging" | "production";

/**
 * Service provider configurations
 */
export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  webhookUrl: string;
}

export interface CloudflareR2Config {
  bucketName: string;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string;
}

export interface UpstashRedisConfig {
  restUrl: string;
  restToken: string;
  databaseName: string;
}

export interface PostHogConfig {
  apiKey: string;
  projectId: string;
  host?: string;
}

export interface DatabaseConfig {
  url: string;
  hyperdriveId?: string;
}

/**
 * Complete app configuration
 */
export interface AppConfig {
  /** Unique app identifier (e.g., "app-1", "crm-saas") */
  id: string;
  /** Human-readable app name */
  name: string;
  /** Primary domain for the app */
  domain: string;
  /** Environment this config is for */
  environment: Environment;
  /** Timestamp when config was created */
  createdAt: string;
  /** Timestamp when config was last updated */
  updatedAt: string;

  /** Service configurations */
  services: {
    google?: GoogleOAuthConfig;
    github?: GitHubOAuthConfig;
    stripe?: StripeConfig;
    cloudflareR2?: CloudflareR2Config;
    upstashRedis?: UpstashRedisConfig;
    postHog?: PostHogConfig;
    database?: DatabaseConfig;
  };

  /** Additional custom environment variables */
  customEnvVars?: Record<string, string>;

  /** Notes or documentation for this app */
  notes?: string;
}

/**
 * Registry of all apps being managed
 */
export interface AppRegistry {
  /** Version of the registry format */
  version: string;
  /** When registry was last updated */
  lastUpdated: string;
  /** Default settings applied to all apps */
  defaults?: {
    /** Shared Stripe account (if using one account for all) */
    sharedStripeKey?: string;
    /** Shared R2 credentials */
    sharedR2Credentials?: Omit<CloudflareR2Config, "bucketName">;
    /** Default PostHog host */
    defaultPostHogHost?: string;
  };
  /** All registered apps */
  apps: AppConfig[];
}

/**
 * Validation result for an app configuration
 */
export interface ValidationResult {
  appId: string;
  environment: Environment;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  service?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  service?: string;
}

/**
 * Service status for monitoring
 */
export interface ServiceStatus {
  service: string;
  status: "connected" | "error" | "unconfigured";
  lastChecked: string;
  error?: string;
}

/**
 * App status report
 */
export interface AppStatus {
  appId: string;
  environment: Environment;
  domain: string;
  services: ServiceStatus[];
  overallHealth: "healthy" | "degraded" | "unhealthy";
}

/**
 * Spreadsheet export format
 */
export interface SpreadsheetRow {
  appName: string;
  domain: string;
  environment: Environment;
  googleClientId: string;
  googleClientSecret: string;
  githubClientId: string;
  githubClientSecret: string;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  r2BucketName: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  upstashRedisUrl: string;
  upstashRedisToken: string;
  postHogApiKey: string;
  postHogProjectId: string;
  databaseUrl: string;
  notes: string;
}

/**
 * CLI command options
 */
export interface CommandOptions {
  /** Force operation without confirmation */
  force?: boolean;
  /** Output format */
  format?: "json" | "csv" | "table";
  /** Filter by environment */
  environment?: Environment;
  /** Filter by app ID */
  appId?: string;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Template variables for .env generation
 */
export interface EnvTemplateVars {
  APP_NAME: string;
  APP_DOMAIN: string;
  APP_ENVIRONMENT: Environment;

  // Auth
  BETTER_AUTH_SECRET: string;

  // Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;

  // GitHub OAuth
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;

  // Stripe
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // Cloudflare R2
  CLOUDFLARE_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;

  // PostHog
  NEXT_PUBLIC_POSTHOG_KEY: string;
  NEXT_PUBLIC_POSTHOG_HOST: string;

  // Database
  DATABASE_URL: string;

  // URLs
  BETTER_AUTH_BASE_URL: string;
  VITE_PUBLIC_SITE_URL: string;
  VITE_API_URL: string;
}

/**
 * Service provider metadata
 */
export const SERVICE_PROVIDERS = {
  google: {
    name: "Google OAuth",
    consoleUrl: "https://console.cloud.google.com/apis/credentials",
    freeLimit: "Unlimited OAuth apps",
    costInfo: "Free",
  },
  github: {
    name: "GitHub OAuth",
    consoleUrl: "https://github.com/settings/developers",
    freeLimit: "Unlimited OAuth apps",
    costInfo: "Free",
  },
  stripe: {
    name: "Stripe",
    consoleUrl: "https://dashboard.stripe.com",
    freeLimit: "Test mode free",
    costInfo: "2.9% + $0.30/transaction",
  },
  cloudflareR2: {
    name: "Cloudflare R2",
    consoleUrl: "https://dash.cloudflare.com/r2",
    freeLimit: "10 GB storage, 1M Class A ops/month",
    costInfo: "$0.015/GB after free tier",
  },
  upstashRedis: {
    name: "Upstash Redis",
    consoleUrl: "https://console.upstash.com",
    freeLimit: "10,000 commands/day per database",
    costInfo: "$0.20 per 100K commands after free tier",
  },
  postHog: {
    name: "PostHog",
    consoleUrl: "https://app.posthog.com",
    freeLimit: "1M events/month",
    costInfo: "$0.000225 per event after free tier",
  },
} as const;

export type ServiceProvider = keyof typeof SERVICE_PROVIDERS;
