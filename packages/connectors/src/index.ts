/**
 * Connectors Framework
 *
 * Integration connector framework supporting:
 * - CRM connectors (Salesforce, HubSpot)
 * - Invoicing connectors (Stripe, QuickBooks)
 * - Helpdesk connectors (Zendesk, Freshdesk)
 * - OAuth2 authentication
 */

export { ConnectorRegistry } from "./registry";
export { createOAuth2Connector } from "./oauth2";
export type { Connector, ConnectorConfig, ConnectorCredentials } from "./types";
