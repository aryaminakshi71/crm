/**
 * OAuth2 Connector
 */

import type { Connector, ConnectorConfig, ConnectorCredentials } from "./types";

export interface OAuth2Config extends ConnectorConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
}

export async function createOAuth2Connector(config: OAuth2Config): Promise<Connector> {
  let credentials: ConnectorCredentials = {};

  return {
    id: crypto.randomUUID(),
    type: "oauth2",
    name: config.name,
    config,
    credentials,
    status: "inactive",

    async test(): Promise<boolean> {
      try {
        const response = await fetch(config.authorizationUrl, { method: "HEAD" });
        return response.ok || response.status === 401; // 401 means server is up
      } catch {
        return false;
      }
    },

    async disconnect(): Promise<void> {
      credentials = {};
    },
  };
}
