/**
 * Connector Types
 */

export type ConnectorType = "crm" | "invoicing" | "helpdesk" | "airtable" | "linear" | "notion" | "oauth2";

export interface ConnectorConfig {
  type: ConnectorType;
  name: string;
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  webhookUrl?: string;
}

export interface ConnectorCredentials {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
}

export interface Connector {
  id: string;
  type: ConnectorType;
  name: string;
  config: ConnectorConfig;
  credentials: ConnectorCredentials;
  status: "active" | "inactive" | "error";
  test(): Promise<boolean>;
  disconnect(): Promise<void>;
}

export interface ConnectorOperation {
  id: string;
  connectorId: string;
  operation: string;
  params: Record<string, unknown>;
  result?: unknown;
  error?: string;
  timestamp: Date;
}
