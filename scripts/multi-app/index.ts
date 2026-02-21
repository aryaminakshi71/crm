/**
 * Multi-App Credentials Management
 * Main exports for the multi-app management system
 */

// Type exports
export type {
  AppConfig,
  AppRegistry,
  AppStatus,
  CloudflareR2Config,
  CommandOptions,
  DatabaseConfig,
  Environment,
  EnvTemplateVars,
  GitHubOAuthConfig,
  GoogleOAuthConfig,
  PostHogConfig,
  ServiceProvider,
  ServiceStatus,
  SpreadsheetRow,
  StripeConfig,
  UpstashRedisConfig,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from "./types";

export { SERVICE_PROVIDERS } from "./types";

// Template functions
export {
  appConfigToTemplateVars,
  createDefaultAppConfig,
  generateEnvContent,
  generateMinimalTemplate,
  generateSecret,
  generateWranglerSecretsCommand,
  getEnvFileName,
} from "./template";

// Credentials management functions
export {
  addApp,
  batchAddApps,
  cloneAppToEnvironment,
  createEmptyRegistry,
  generateAllEnvFiles,
  generateEnvFile,
  getApp,
  getRegistryStats,
  listApps,
  loadRegistry,
  removeApp,
  saveRegistry,
  setRegistryDefaults,
  updateApp,
  updateServiceCredentials,
} from "./credentials";

// Validation functions
export {
  printValidationResults,
  validateAppConfig,
  validateProductionReadiness,
  validateRegistry,
} from "./validate";

// Export functions
export {
  exportToCSV,
  exportToCSVFull,
  exportToJSON,
  generateCostEstimate,
  generateSetupChecklist,
  generateSummaryTable,
} from "./export";
