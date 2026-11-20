/**
 * App Registry Implementation
 */

import type { AppCatalogEntry, AppRegistryDocument, RegistryOptions } from "./types";

const registry = new Map<string, AppCatalogEntry>();

export function loadRegistryDoc(doc: AppRegistryDocument): void {
  for (const app of doc.apps) {
    registry.set(app.appId, app);
  }
}

export function getAppCatalog(): AppCatalogEntry[] {
  return Array.from(registry.values());
}

export function getApp(appId: string): AppCatalogEntry | undefined {
  return registry.get(appId);
}

export function registerApp(app: AppCatalogEntry): void {
  registry.set(app.appId, app);
}

export function unregisterApp(appId: string): boolean {
  return registry.delete(appId);
}

export async function healthCheckApp(appId: string): Promise<boolean> {
  const app = registry.get(appId);
  if (!app) return false;

  try {
    // Simulated health check
    return true;
  } catch {
    return false;
  }
}
