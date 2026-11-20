/**
 * Monitoring Agents
 *
 * Platform monitoring agents for analytics, billing, error tracking,
 * support, uptime, performance, marketing, and catalog management.
 */

export type { MonitoringSnapshot, AppCatalogEntry } from "@crm/storage";

// Analytics Agent - PostHog integration
export { createAnalyticsAgent } from "./analytics";

// Billing Agent - Stripe integration
export { createBillingAgent } from "./billing";

// Error Tracking Agent - Sentry integration
export { createErrorTrackingAgent } from "./error-tracking";

// Support Agent - Helpdesk integration
export { createSupportAgent } from "./support";

// Uptime Agent - Health checks
export { createUptimeAgent } from "./uptime";

// Performance Agent - APM metrics
export { createPerformanceAgent } from "./performance";

// Marketing Agent - Campaign analytics
export { createMarketingAgent } from "./marketing";

// Catalog Agent - App registry
export { createCatalogAgent } from "./catalog";

// Agent factory
export { createAgent } from "./factory";
