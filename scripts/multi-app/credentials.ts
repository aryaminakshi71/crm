/**
 * Credentials Management for Multi-App Production Setup
 * Manages app configurations and credentials across 20+ production apps
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  createDefaultAppConfig,
  generateEnvContent,
  getEnvFileName,
} from "./template";
import type { AppConfig, AppRegistry, Environment } from "./types";

const REGISTRY_FILE = "app-registry.json";
const REGISTRY_VERSION = "1.0.0";

/**
 * Get the path to the registry file
 */
function getRegistryPath(): string {
  return resolve(process.cwd(), REGISTRY_FILE);
}

/**
 * Load the app registry from disk
 */
export function loadRegistry(): AppRegistry {
  const registryPath = getRegistryPath();

  if (!existsSync(registryPath)) {
    return createEmptyRegistry();
  }

  try {
    const content = readFileSync(registryPath, "utf-8");
    const registry = JSON.parse(content) as AppRegistry;
    return registry;
  } catch (error) {
    console.error("Error loading registry:", error);
    return createEmptyRegistry();
  }
}

/**
 * Save the app registry to disk
 */
export function saveRegistry(registry: AppRegistry): void {
  const registryPath = getRegistryPath();
  registry.lastUpdated = new Date().toISOString();

  try {
    writeFileSync(registryPath, JSON.stringify(registry, null, 2), "utf-8");
    console.log(`Registry saved to ${registryPath}`);
  } catch (error) {
    console.error("Error saving registry:", error);
    throw error;
  }
}

/**
 * Create an empty registry
 */
export function createEmptyRegistry(): AppRegistry {
  return {
    version: REGISTRY_VERSION,
    lastUpdated: new Date().toISOString(),
    apps: [],
  };
}

/**
 * Add a new app to the registry
 */
export function addApp(
  registry: AppRegistry,
  id: string,
  name: string,
  domain: string,
  environment: Environment,
): AppConfig {
  // Check if app already exists
  const existingApp = registry.apps.find(
    (app) => app.id === id && app.environment === environment,
  );

  if (existingApp) {
    throw new Error(
      `App ${id} (${environment}) already exists in the registry`,
    );
  }

  const newApp = createDefaultAppConfig(id, name, domain, environment);

  // Apply defaults if set
  if (registry.defaults?.sharedR2Credentials) {
    newApp.services.cloudflareR2 = {
      ...newApp.services.cloudflareR2!,
      accountId: registry.defaults.sharedR2Credentials.accountId,
      accessKeyId: registry.defaults.sharedR2Credentials.accessKeyId,
      secretAccessKey: registry.defaults.sharedR2Credentials.secretAccessKey,
    };
  }

  if (registry.defaults?.defaultPostHogHost) {
    newApp.services.postHog = {
      apiKey: "",
      projectId: "",
      host: registry.defaults.defaultPostHogHost,
    };
  }

  registry.apps.push(newApp);
  return newApp;
}

/**
 * Remove an app from the registry
 */
export function removeApp(
  registry: AppRegistry,
  id: string,
  environment?: Environment,
): boolean {
  const initialLength = registry.apps.length;

  registry.apps = registry.apps.filter((app) => {
    if (environment) {
      return !(app.id === id && app.environment === environment);
    }
    return app.id !== id;
  });

  return registry.apps.length < initialLength;
}

/**
 * Get an app from the registry
 */
export function getApp(
  registry: AppRegistry,
  id: string,
  environment?: Environment,
): AppConfig | undefined {
  return registry.apps.find(
    (app) => app.id === id && (!environment || app.environment === environment),
  );
}

/**
 * Update an app in the registry
 */
export function updateApp(
  registry: AppRegistry,
  id: string,
  environment: Environment,
  updates: Partial<AppConfig>,
): AppConfig | undefined {
  const appIndex = registry.apps.findIndex(
    (app) => app.id === id && app.environment === environment,
  );

  if (appIndex === -1) {
    return undefined;
  }

  const updatedApp = {
    ...registry.apps[appIndex],
    ...updates,
    id, // Ensure ID cannot be changed
    environment, // Ensure environment cannot be changed
    updatedAt: new Date().toISOString(),
  };

  registry.apps[appIndex] = updatedApp;
  return updatedApp;
}

/**
 * List all apps in the registry
 */
export function listApps(
  registry: AppRegistry,
  environment?: Environment,
): AppConfig[] {
  if (environment) {
    return registry.apps.filter((app) => app.environment === environment);
  }
  return registry.apps;
}

/**
 * Generate .env file for an app
 */
export function generateEnvFile(config: AppConfig, outputDir?: string): string {
  const content = generateEnvContent(config);
  const fileName = getEnvFileName(config.environment);
  const outputPath = outputDir
    ? join(outputDir, fileName)
    : join(process.cwd(), "generated-envs", config.id, fileName);

  // Ensure directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, content, "utf-8");
  console.log(`Generated ${outputPath}`);

  return outputPath;
}

/**
 * Generate .env files for all apps
 */
export function generateAllEnvFiles(
  registry: AppRegistry,
  outputDir?: string,
): string[] {
  const paths: string[] = [];

  for (const app of registry.apps) {
    const path = generateEnvFile(app, outputDir);
    paths.push(path);
  }

  return paths;
}

/**
 * Update service credentials for an app
 */
export function updateServiceCredentials(
  registry: AppRegistry,
  appId: string,
  environment: Environment,
  service: keyof AppConfig["services"],
  credentials: Record<string, string>,
): boolean {
  const app = getApp(registry, appId, environment);
  if (!app) {
    return false;
  }

  // Update the specific service
  app.services[service] = {
    ...app.services[service],
    ...credentials,
  } as any;

  app.updatedAt = new Date().toISOString();
  return true;
}

/**
 * Batch add multiple apps
 */
export function batchAddApps(
  registry: AppRegistry,
  apps: Array<{
    id: string;
    name: string;
    domain: string;
    environments: Environment[];
  }>,
): AppConfig[] {
  const addedApps: AppConfig[] = [];

  for (const appDef of apps) {
    for (const env of appDef.environments) {
      try {
        const app = addApp(
          registry,
          appDef.id,
          appDef.name,
          appDef.domain,
          env,
        );
        addedApps.push(app);
      } catch (error) {
        console.warn(`Skipping ${appDef.id} (${env}): ${error}`);
      }
    }
  }

  return addedApps;
}

/**
 * Clone an app configuration to a new environment
 */
export function cloneAppToEnvironment(
  registry: AppRegistry,
  appId: string,
  sourceEnv: Environment,
  targetEnv: Environment,
): AppConfig | undefined {
  const sourceApp = getApp(registry, appId, sourceEnv);
  if (!sourceApp) {
    return undefined;
  }

  // Check if target already exists
  const existingTarget = getApp(registry, appId, targetEnv);
  if (existingTarget) {
    throw new Error(`App ${appId} (${targetEnv}) already exists`);
  }

  const newApp: AppConfig = {
    ...JSON.parse(JSON.stringify(sourceApp)), // Deep clone
    environment: targetEnv,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    services: {
      ...sourceApp.services,
      // Update bucket/database names for new environment
      cloudflareR2: sourceApp.services.cloudflareR2
        ? {
            ...sourceApp.services.cloudflareR2,
            bucketName: `${appId}-assets-${targetEnv}`,
          }
        : undefined,
      upstashRedis: sourceApp.services.upstashRedis
        ? {
            ...sourceApp.services.upstashRedis,
            databaseName: `${appId}-cache-${targetEnv}`,
          }
        : undefined,
    },
  };

  registry.apps.push(newApp);
  return newApp;
}

/**
 * Set shared defaults for all apps
 */
export function setRegistryDefaults(
  registry: AppRegistry,
  defaults: AppRegistry["defaults"],
): void {
  registry.defaults = {
    ...registry.defaults,
    ...defaults,
  };
}

/**
 * Get summary statistics for the registry
 */
export function getRegistryStats(registry: AppRegistry): {
  totalApps: number;
  byEnvironment: Record<Environment, number>;
  servicesConfigured: Record<string, number>;
} {
  const byEnvironment: Record<Environment, number> = {
    development: 0,
    staging: 0,
    production: 0,
  };

  const servicesConfigured: Record<string, number> = {
    google: 0,
    github: 0,
    stripe: 0,
    cloudflareR2: 0,
    upstashRedis: 0,
    postHog: 0,
    database: 0,
  };

  for (const app of registry.apps) {
    byEnvironment[app.environment]++;

    if (app.services.google?.clientId) servicesConfigured.google++;
    if (app.services.github?.clientId) servicesConfigured.github++;
    if (app.services.stripe?.secretKey) servicesConfigured.stripe++;
    if (app.services.cloudflareR2?.bucketName)
      servicesConfigured.cloudflareR2++;
    if (app.services.upstashRedis?.restUrl) servicesConfigured.upstashRedis++;
    if (app.services.postHog?.apiKey) servicesConfigured.postHog++;
    if (app.services.database?.url) servicesConfigured.database++;
  }

  return {
    totalApps: registry.apps.length,
    byEnvironment,
    servicesConfigured,
  };
}
