/**
 * Registry Types
 */

export interface AppCatalogEntry {
  id: string;
  appId: string;
  name: string;
  description?: string;
  category?: string;
  version?: string;
  status: "active" | "inactive" | "error";
  metadata?: Record<string, unknown>;
  healthCheckAt?: Date;
}

export interface AppRegistryDocument {
  version: string;
  apps: AppCatalogEntry[];
  updatedAt: Date;
}

export interface RegistryOptions {
  enableHealthChecks?: boolean;
  healthCheckInterval?: number; // ms
}
