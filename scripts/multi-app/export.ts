/**
 * Spreadsheet Export Utility
 * Export app credentials to CSV/JSON for tracking and backup
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { AppConfig, AppRegistry, SpreadsheetRow } from "./types";

/**
 * Convert app config to spreadsheet row
 */
function appToRow(app: AppConfig): SpreadsheetRow {
  return {
    appName: app.name,
    domain: app.domain,
    environment: app.environment,
    googleClientId: app.services.google?.clientId || "",
    googleClientSecret: maskSecret(app.services.google?.clientSecret),
    githubClientId: app.services.github?.clientId || "",
    githubClientSecret: maskSecret(app.services.github?.clientSecret),
    stripePublishableKey: app.services.stripe?.publishableKey || "",
    stripeSecretKey: maskSecret(app.services.stripe?.secretKey),
    stripeWebhookSecret: maskSecret(app.services.stripe?.webhookSecret),
    r2BucketName: app.services.cloudflareR2?.bucketName || "",
    r2AccessKeyId: app.services.cloudflareR2?.accessKeyId || "",
    r2SecretAccessKey: maskSecret(app.services.cloudflareR2?.secretAccessKey),
    upstashRedisUrl: app.services.upstashRedis?.restUrl || "",
    upstashRedisToken: maskSecret(app.services.upstashRedis?.restToken),
    postHogApiKey: app.services.postHog?.apiKey || "",
    postHogProjectId: app.services.postHog?.projectId || "",
    databaseUrl: maskSecret(app.services.database?.url),
    notes: app.notes || "",
  };
}

/**
 * Convert app config to spreadsheet row with full secrets (for secure export)
 */
function appToRowFull(app: AppConfig): SpreadsheetRow {
  return {
    appName: app.name,
    domain: app.domain,
    environment: app.environment,
    googleClientId: app.services.google?.clientId || "",
    googleClientSecret: app.services.google?.clientSecret || "",
    githubClientId: app.services.github?.clientId || "",
    githubClientSecret: app.services.github?.clientSecret || "",
    stripePublishableKey: app.services.stripe?.publishableKey || "",
    stripeSecretKey: app.services.stripe?.secretKey || "",
    stripeWebhookSecret: app.services.stripe?.webhookSecret || "",
    r2BucketName: app.services.cloudflareR2?.bucketName || "",
    r2AccessKeyId: app.services.cloudflareR2?.accessKeyId || "",
    r2SecretAccessKey: app.services.cloudflareR2?.secretAccessKey || "",
    upstashRedisUrl: app.services.upstashRedis?.restUrl || "",
    upstashRedisToken: app.services.upstashRedis?.restToken || "",
    postHogApiKey: app.services.postHog?.apiKey || "",
    postHogProjectId: app.services.postHog?.projectId || "",
    databaseUrl: app.services.database?.url || "",
    notes: app.notes || "",
  };
}

/**
 * Mask sensitive values for display
 */
function maskSecret(value?: string): string {
  if (!value) return "";
  if (value.length <= 8) return "****";
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert rows to CSV string
 */
function rowsToCSV(rows: SpreadsheetRow[]): string {
  const headers = [
    "App Name",
    "Domain",
    "Environment",
    "Google Client ID",
    "Google Client Secret",
    "GitHub Client ID",
    "GitHub Client Secret",
    "Stripe Publishable Key",
    "Stripe Secret Key",
    "Stripe Webhook Secret",
    "R2 Bucket Name",
    "R2 Access Key ID",
    "R2 Secret Access Key",
    "Upstash Redis URL",
    "Upstash Redis Token",
    "PostHog API Key",
    "PostHog Project ID",
    "Database URL",
    "Notes",
  ];

  const lines = [headers.join(",")];

  for (const row of rows) {
    const values = [
      row.appName,
      row.domain,
      row.environment,
      row.googleClientId,
      row.googleClientSecret,
      row.githubClientId,
      row.githubClientSecret,
      row.stripePublishableKey,
      row.stripeSecretKey,
      row.stripeWebhookSecret,
      row.r2BucketName,
      row.r2AccessKeyId,
      row.r2SecretAccessKey,
      row.upstashRedisUrl,
      row.upstashRedisToken,
      row.postHogApiKey,
      row.postHogProjectId,
      row.databaseUrl,
      row.notes,
    ].map(escapeCSV);

    lines.push(values.join(","));
  }

  return lines.join("\n");
}

/**
 * Export registry to CSV (masked secrets)
 */
export function exportToCSV(
  registry: AppRegistry,
  outputPath?: string,
): string {
  const rows = registry.apps.map(appToRow);
  const csv = rowsToCSV(rows);

  const finalPath =
    outputPath || resolve(process.cwd(), "exports", "apps-credentials.csv");
  const dir = dirname(finalPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(finalPath, csv, "utf-8");
  console.log(`Exported ${rows.length} apps to ${finalPath}`);
  console.log(
    "Note: Secrets are masked for security. Use --full flag for complete export.",
  );

  return finalPath;
}

/**
 * Export registry to CSV with full secrets (SECURE - for backup only)
 */
export function exportToCSVFull(
  registry: AppRegistry,
  outputPath?: string,
): string {
  const rows = registry.apps.map(appToRowFull);
  const csv = rowsToCSV(rows);

  const finalPath =
    outputPath ||
    resolve(process.cwd(), "exports", "apps-credentials-SECURE.csv");
  const dir = dirname(finalPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(finalPath, csv, "utf-8");
  console.log(`Exported ${rows.length} apps to ${finalPath}`);
  console.log(
    "⚠️  WARNING: This file contains unmasked secrets. Store securely!",
  );

  return finalPath;
}

/**
 * Export registry to JSON
 */
export function exportToJSON(
  registry: AppRegistry,
  outputPath?: string,
  maskSecrets = true,
): string {
  const data = maskSecrets
    ? {
        ...registry,
        apps: registry.apps.map((app) => ({
          ...app,
          services: {
            google: app.services.google
              ? {
                  clientId: app.services.google.clientId,
                  clientSecret: maskSecret(app.services.google.clientSecret),
                  callbackUrl: app.services.google.callbackUrl,
                }
              : undefined,
            github: app.services.github
              ? {
                  clientId: app.services.github.clientId,
                  clientSecret: maskSecret(app.services.github.clientSecret),
                  callbackUrl: app.services.github.callbackUrl,
                }
              : undefined,
            stripe: app.services.stripe
              ? {
                  publishableKey: app.services.stripe.publishableKey,
                  secretKey: maskSecret(app.services.stripe.secretKey),
                  webhookSecret: maskSecret(app.services.stripe.webhookSecret),
                  webhookUrl: app.services.stripe.webhookUrl,
                }
              : undefined,
            cloudflareR2: app.services.cloudflareR2
              ? {
                  bucketName: app.services.cloudflareR2.bucketName,
                  accountId: app.services.cloudflareR2.accountId,
                  accessKeyId: app.services.cloudflareR2.accessKeyId,
                  secretAccessKey: maskSecret(
                    app.services.cloudflareR2.secretAccessKey,
                  ),
                }
              : undefined,
            upstashRedis: app.services.upstashRedis
              ? {
                  databaseName: app.services.upstashRedis.databaseName,
                  restUrl: app.services.upstashRedis.restUrl,
                  restToken: maskSecret(app.services.upstashRedis.restToken),
                }
              : undefined,
            postHog: app.services.postHog,
            database: app.services.database
              ? {
                  url: maskSecret(app.services.database.url),
                  hyperdriveId: app.services.database.hyperdriveId,
                }
              : undefined,
          },
        })),
      }
    : registry;

  const json = JSON.stringify(data, null, 2);
  const fileName = maskSecrets
    ? "apps-credentials.json"
    : "apps-credentials-SECURE.json";
  const finalPath = outputPath || resolve(process.cwd(), "exports", fileName);
  const dir = dirname(finalPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(finalPath, json, "utf-8");
  console.log(`Exported ${registry.apps.length} apps to ${finalPath}`);

  if (!maskSecrets) {
    console.log(
      "⚠️  WARNING: This file contains unmasked secrets. Store securely!",
    );
  }

  return finalPath;
}

/**
 * Generate a summary table for console output
 */
export function generateSummaryTable(registry: AppRegistry): string {
  const lines: string[] = [];
  const colWidths = {
    name: 20,
    domain: 30,
    env: 12,
    oauth: 10,
    stripe: 10,
    storage: 10,
    db: 10,
  };

  // Header
  lines.push(
    "+" +
      "-".repeat(colWidths.name + 2) +
      "+" +
      "-".repeat(colWidths.domain + 2) +
      "+" +
      "-".repeat(colWidths.env + 2) +
      "+" +
      "-".repeat(colWidths.oauth + 2) +
      "+" +
      "-".repeat(colWidths.stripe + 2) +
      "+" +
      "-".repeat(colWidths.storage + 2) +
      "+" +
      "-".repeat(colWidths.db + 2) +
      "+",
  );

  const headerRow =
    `| ${"App Name".padEnd(colWidths.name)} ` +
    `| ${"Domain".padEnd(colWidths.domain)} ` +
    `| ${"Environment".padEnd(colWidths.env)} ` +
    `| ${"OAuth".padEnd(colWidths.oauth)} ` +
    `| ${"Stripe".padEnd(colWidths.stripe)} ` +
    `| ${"Storage".padEnd(colWidths.storage)} ` +
    `| ${"Database".padEnd(colWidths.db)} |`;

  lines.push(headerRow);

  lines.push(
    "+" +
      "=".repeat(colWidths.name + 2) +
      "+" +
      "=".repeat(colWidths.domain + 2) +
      "+" +
      "=".repeat(colWidths.env + 2) +
      "+" +
      "=".repeat(colWidths.oauth + 2) +
      "+" +
      "=".repeat(colWidths.stripe + 2) +
      "+" +
      "=".repeat(colWidths.storage + 2) +
      "+" +
      "=".repeat(colWidths.db + 2) +
      "+",
  );

  // Rows
  for (const app of registry.apps) {
    const oauthStatus =
      app.services.google?.clientId || app.services.github?.clientId
        ? "✓"
        : "✗";
    const stripeStatus = app.services.stripe?.secretKey ? "✓" : "✗";
    const storageStatus =
      app.services.cloudflareR2?.bucketName ||
      app.services.upstashRedis?.restUrl
        ? "✓"
        : "✗";
    const dbStatus = app.services.database?.url ? "✓" : "✗";

    const row =
      `| ${app.name.substring(0, colWidths.name).padEnd(colWidths.name)} ` +
      `| ${app.domain.substring(0, colWidths.domain).padEnd(colWidths.domain)} ` +
      `| ${app.environment.padEnd(colWidths.env)} ` +
      `| ${oauthStatus.padEnd(colWidths.oauth)} ` +
      `| ${stripeStatus.padEnd(colWidths.stripe)} ` +
      `| ${storageStatus.padEnd(colWidths.storage)} ` +
      `| ${dbStatus.padEnd(colWidths.db)} |`;

    lines.push(row);
  }

  lines.push(
    "+" +
      "-".repeat(colWidths.name + 2) +
      "+" +
      "-".repeat(colWidths.domain + 2) +
      "+" +
      "-".repeat(colWidths.env + 2) +
      "+" +
      "-".repeat(colWidths.oauth + 2) +
      "+" +
      "-".repeat(colWidths.stripe + 2) +
      "+" +
      "-".repeat(colWidths.storage + 2) +
      "+" +
      "-".repeat(colWidths.db + 2) +
      "+",
  );

  return lines.join("\n");
}

/**
 * Export cost estimation summary
 */
export function generateCostEstimate(registry: AppRegistry): string {
  const productionApps = registry.apps.filter(
    (app) => app.environment === "production",
  );

  const lines: string[] = [
    "Cost Estimation Summary",
    "=".repeat(50),
    "",
    `Total Production Apps: ${productionApps.length}`,
    "",
    "Service Breakdown:",
    "-".repeat(30),
    "",
    "| Service          | Free Tier            | Est. Monthly Cost |",
    "|------------------|----------------------|-------------------|",
    "| Google OAuth     | Unlimited            | $0                |",
    "| GitHub OAuth     | Unlimited            | $0                |",
    "| Stripe           | Test mode free       | Transaction fees  |",
    `| Cloudflare R2    | 10GB, 1M ops         | ~$0-50            |`,
    `| Upstash Redis    | 10K cmd/day/db       | $0 (within limit) |`,
    `| PostHog          | 1M events/mo         | $0 (within limit) |`,
    "",
    "Notes:",
    `- ${productionApps.length} R2 buckets created (one per app)`,
    `- ${productionApps.length} Upstash databases created (one per app)`,
    `- ${productionApps.length} PostHog projects created (one per app)`,
    "",
    "Estimated Total: $0-50/month (depends on usage)",
  ];

  return lines.join("\n");
}

/**
 * Generate setup checklist for an app
 */
export function generateSetupChecklist(app: AppConfig): string {
  const checks = [
    {
      name: "Google OAuth",
      done: !!app.services.google?.clientId,
      url: "https://console.cloud.google.com/apis/credentials",
    },
    {
      name: "GitHub OAuth",
      done: !!app.services.github?.clientId,
      url: "https://github.com/settings/developers",
    },
    {
      name: "Stripe Webhook",
      done: !!app.services.stripe?.webhookSecret,
      url: "https://dashboard.stripe.com/webhooks",
    },
    {
      name: "Cloudflare R2 Bucket",
      done: !!app.services.cloudflareR2?.bucketName,
      url: "https://dash.cloudflare.com/r2",
    },
    {
      name: "Upstash Redis",
      done: !!app.services.upstashRedis?.restUrl,
      url: "https://console.upstash.com",
    },
    {
      name: "PostHog Project",
      done: !!app.services.postHog?.apiKey,
      url: "https://app.posthog.com",
    },
    {
      name: "Database URL",
      done: !!app.services.database?.url,
      url: "",
    },
  ];

  const lines = [
    `Setup Checklist: ${app.name} (${app.environment})`,
    "=".repeat(50),
    "",
  ];

  for (const check of checks) {
    const status = check.done ? "✓" : "□";
    lines.push(`${status} ${check.name}`);
    if (!check.done && check.url) {
      lines.push(`    → ${check.url}`);
    }
  }

  const completed = checks.filter((c) => c.done).length;
  lines.push("");
  lines.push(`Progress: ${completed}/${checks.length} completed`);

  return lines.join("\n");
}
