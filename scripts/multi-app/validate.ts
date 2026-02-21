/**
 * Environment Validation Script
 * Validates app configurations and credentials
 */

import type {
  AppConfig,
  AppRegistry,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from "./types";

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a string looks like a placeholder
 */
function isPlaceholder(value: string): boolean {
  const placeholderPatterns = [
    /^your[-_]?/i,
    /^placeholder/i,
    /^xxx+$/i,
    /^todo/i,
    /^fill[-_]?in/i,
    /^change[-_]?me/i,
    /^\[.*\]$/,
    /^<.*>$/,
  ];

  return placeholderPatterns.some((pattern) => pattern.test(value));
}

/**
 * Validate Google OAuth configuration
 */
function validateGoogleOAuth(config: AppConfig): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const service = "Google OAuth";

  if (!config.services.google) {
    warnings.push({
      service,
      field: "google",
      message: "Google OAuth not configured",
    });
    return { errors, warnings };
  }

  const { clientId, clientSecret, callbackUrl } = config.services.google;

  if (!clientId) {
    errors.push({
      service,
      field: "clientId",
      message: "Google Client ID is required",
    });
  } else if (isPlaceholder(clientId)) {
    errors.push({
      service,
      field: "clientId",
      message: "Google Client ID appears to be a placeholder",
    });
  } else if (!clientId.endsWith(".apps.googleusercontent.com")) {
    warnings.push({
      service,
      field: "clientId",
      message: "Google Client ID should end with .apps.googleusercontent.com",
    });
  }

  if (!clientSecret) {
    errors.push({
      service,
      field: "clientSecret",
      message: "Google Client Secret is required",
    });
  } else if (isPlaceholder(clientSecret)) {
    errors.push({
      service,
      field: "clientSecret",
      message: "Google Client Secret appears to be a placeholder",
    });
  }

  if (callbackUrl && !isValidUrl(callbackUrl)) {
    errors.push({
      service,
      field: "callbackUrl",
      message: "Invalid callback URL format",
    });
  }

  return { errors, warnings };
}

/**
 * Validate GitHub OAuth configuration
 */
function validateGitHubOAuth(config: AppConfig): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const service = "GitHub OAuth";

  if (!config.services.github) {
    warnings.push({
      service,
      field: "github",
      message: "GitHub OAuth not configured",
    });
    return { errors, warnings };
  }

  const { clientId, clientSecret, callbackUrl } = config.services.github;

  if (!clientId) {
    errors.push({
      service,
      field: "clientId",
      message: "GitHub Client ID is required",
    });
  } else if (isPlaceholder(clientId)) {
    errors.push({
      service,
      field: "clientId",
      message: "GitHub Client ID appears to be a placeholder",
    });
  }

  if (!clientSecret) {
    errors.push({
      service,
      field: "clientSecret",
      message: "GitHub Client Secret is required",
    });
  } else if (isPlaceholder(clientSecret)) {
    errors.push({
      service,
      field: "clientSecret",
      message: "GitHub Client Secret appears to be a placeholder",
    });
  }

  if (callbackUrl && !isValidUrl(callbackUrl)) {
    errors.push({
      service,
      field: "callbackUrl",
      message: "Invalid callback URL format",
    });
  }

  return { errors, warnings };
}

/**
 * Validate Stripe configuration
 */
function validateStripe(config: AppConfig): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const service = "Stripe";

  if (!config.services.stripe) {
    warnings.push({
      service,
      field: "stripe",
      message: "Stripe not configured",
    });
    return { errors, warnings };
  }

  const { publishableKey, secretKey, webhookSecret } = config.services.stripe;

  if (secretKey) {
    if (isPlaceholder(secretKey)) {
      errors.push({
        service,
        field: "secretKey",
        message: "Stripe Secret Key appears to be a placeholder",
      });
    } else if (
      config.environment === "production" &&
      secretKey.startsWith("sk_test_")
    ) {
      errors.push({
        service,
        field: "secretKey",
        message:
          "Production environment should use live Stripe keys (sk_live_)",
      });
    } else if (
      config.environment !== "production" &&
      secretKey.startsWith("sk_live_")
    ) {
      warnings.push({
        service,
        field: "secretKey",
        message: "Non-production environment is using live Stripe keys",
      });
    }
  }

  if (publishableKey) {
    if (
      config.environment === "production" &&
      publishableKey.startsWith("pk_test_")
    ) {
      errors.push({
        service,
        field: "publishableKey",
        message:
          "Production environment should use live Stripe keys (pk_live_)",
      });
    }
  }

  if (!webhookSecret && secretKey) {
    warnings.push({
      service,
      field: "webhookSecret",
      message: "Stripe webhook secret not configured",
    });
  }

  return { errors, warnings };
}

/**
 * Validate Cloudflare R2 configuration
 */
function validateCloudflareR2(config: AppConfig): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const service = "Cloudflare R2";

  if (!config.services.cloudflareR2) {
    warnings.push({
      service,
      field: "cloudflareR2",
      message: "Cloudflare R2 not configured",
    });
    return { errors, warnings };
  }

  const { bucketName, accountId, accessKeyId, secretAccessKey } =
    config.services.cloudflareR2;

  if (!bucketName) {
    errors.push({
      service,
      field: "bucketName",
      message: "R2 bucket name is required",
    });
  } else if (!/^[a-z0-9][-a-z0-9]*[a-z0-9]$/.test(bucketName)) {
    warnings.push({
      service,
      field: "bucketName",
      message: "R2 bucket name should be lowercase alphanumeric with hyphens",
    });
  }

  if (!accountId) {
    errors.push({
      service,
      field: "accountId",
      message: "Cloudflare Account ID is required",
    });
  }

  if (!accessKeyId) {
    errors.push({
      service,
      field: "accessKeyId",
      message: "R2 Access Key ID is required",
    });
  }

  if (!secretAccessKey) {
    errors.push({
      service,
      field: "secretAccessKey",
      message: "R2 Secret Access Key is required",
    });
  }

  return { errors, warnings };
}

/**
 * Validate Upstash Redis configuration
 */
function validateUpstashRedis(config: AppConfig): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const service = "Upstash Redis";

  if (!config.services.upstashRedis) {
    warnings.push({
      service,
      field: "upstashRedis",
      message: "Upstash Redis not configured",
    });
    return { errors, warnings };
  }

  const { restUrl, restToken } = config.services.upstashRedis;

  if (!restUrl) {
    errors.push({
      service,
      field: "restUrl",
      message: "Upstash Redis REST URL is required",
    });
  } else if (!isValidUrl(restUrl)) {
    errors.push({
      service,
      field: "restUrl",
      message: "Invalid Upstash Redis REST URL format",
    });
  } else if (!restUrl.includes("upstash.io")) {
    warnings.push({
      service,
      field: "restUrl",
      message: "Upstash Redis URL should contain upstash.io",
    });
  }

  if (!restToken) {
    errors.push({
      service,
      field: "restToken",
      message: "Upstash Redis REST Token is required",
    });
  }

  return { errors, warnings };
}

/**
 * Validate PostHog configuration
 */
function validatePostHog(config: AppConfig): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const service = "PostHog";

  if (!config.services.postHog) {
    warnings.push({
      service,
      field: "postHog",
      message: "PostHog not configured",
    });
    return { errors, warnings };
  }

  const { apiKey, host } = config.services.postHog;

  if (!apiKey) {
    warnings.push({
      service,
      field: "apiKey",
      message: "PostHog API key not configured",
    });
  } else if (!apiKey.startsWith("phc_")) {
    warnings.push({
      service,
      field: "apiKey",
      message: "PostHog API key should start with phc_",
    });
  }

  if (host && !isValidUrl(host)) {
    errors.push({
      service,
      field: "host",
      message: "Invalid PostHog host URL format",
    });
  }

  return { errors, warnings };
}

/**
 * Validate Database configuration
 */
function validateDatabase(config: AppConfig): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const service = "Database";

  if (!config.services.database) {
    errors.push({
      service,
      field: "database",
      message: "Database not configured",
    });
    return { errors, warnings };
  }

  const { url } = config.services.database;

  if (!url) {
    errors.push({
      service,
      field: "url",
      message: "Database URL is required",
    });
  } else if (isPlaceholder(url)) {
    errors.push({
      service,
      field: "url",
      message: "Database URL appears to be a placeholder",
    });
  } else {
    // Check for common database URL patterns
    const validPrefixes = [
      "postgresql://",
      "postgres://",
      "mysql://",
      "mongodb://",
      "mongodb+srv://",
    ];
    if (!validPrefixes.some((prefix) => url.startsWith(prefix))) {
      warnings.push({
        service,
        field: "url",
        message:
          "Database URL should start with a valid protocol (e.g., postgresql://)",
      });
    }

    // Check for localhost in production
    if (
      config.environment === "production" &&
      (url.includes("localhost") || url.includes("127.0.0.1"))
    ) {
      errors.push({
        service,
        field: "url",
        message: "Production environment should not use localhost database",
      });
    }
  }

  return { errors, warnings };
}

/**
 * Validate a single app configuration
 */
export function validateAppConfig(config: AppConfig): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];

  // Validate basic fields
  if (!config.id) {
    allErrors.push({ field: "id", message: "App ID is required" });
  }

  if (!config.domain) {
    allErrors.push({ field: "domain", message: "Domain is required" });
  } else if (!isValidUrl(`https://${config.domain}`)) {
    allErrors.push({ field: "domain", message: "Invalid domain format" });
  }

  // Validate each service
  const validators = [
    validateGoogleOAuth,
    validateGitHubOAuth,
    validateStripe,
    validateCloudflareR2,
    validateUpstashRedis,
    validatePostHog,
    validateDatabase,
  ];

  for (const validator of validators) {
    const { errors, warnings } = validator(config);
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  }

  return {
    appId: config.id,
    environment: config.environment,
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Validate all apps in the registry
 */
export function validateRegistry(registry: AppRegistry): ValidationResult[] {
  return registry.apps.map(validateAppConfig);
}

/**
 * Print validation results to console
 */
export function printValidationResults(results: ValidationResult[]): void {
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of results) {
    console.log(`\n${result.appId} (${result.environment}):`);

    if (result.isValid && result.warnings.length === 0) {
      console.log("  ✓ All checks passed");
      continue;
    }

    for (const error of result.errors) {
      console.log(
        `  ✗ ERROR [${error.service || "general"}]: ${error.message}`,
      );
      totalErrors++;
    }

    for (const warning of result.warnings) {
      console.log(
        `  ⚠ WARNING [${warning.service || "general"}]: ${warning.message}`,
      );
      totalWarnings++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Total: ${results.length} apps validated`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log("\n⚠️  Some configurations have errors that need to be fixed.");
  } else if (totalWarnings > 0) {
    console.log("\n✓ No errors, but some warnings should be reviewed.");
  } else {
    console.log("\n✓ All configurations are valid!");
  }
}

/**
 * Check if all production apps are properly configured
 */
export function validateProductionReadiness(registry: AppRegistry): {
  ready: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const productionApps = registry.apps.filter(
    (app) => app.environment === "production",
  );

  if (productionApps.length === 0) {
    issues.push("No production apps configured");
    return { ready: false, issues };
  }

  for (const app of productionApps) {
    const result = validateAppConfig(app);

    if (!result.isValid) {
      issues.push(
        `${app.id}: ${result.errors.length} error(s) - ${result.errors.map((e) => e.message).join(", ")}`,
      );
    }

    // Additional production checks
    if (!app.services.database?.url) {
      issues.push(`${app.id}: No database configured`);
    }

    if (!app.services.google?.clientId && !app.services.github?.clientId) {
      issues.push(`${app.id}: No OAuth providers configured`);
    }
  }

  return {
    ready: issues.length === 0,
    issues,
  };
}
