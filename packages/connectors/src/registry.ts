/**
 * Connector Registry
 */

import type { Connector, ConnectorConfig, ConnectorType } from "./types";

export interface ConnectorDefinition {
  type: ConnectorType;
  name: string;
  description: string;
  create(config: ConnectorConfig): Promise<Connector>;
}

const registry = new Map<ConnectorType, ConnectorDefinition>();

export function registerConnector(definition: ConnectorDefinition): void {
  registry.set(definition.type, definition);
}

export function getConnectorDefinition(type: ConnectorType): ConnectorDefinition | undefined {
  return registry.get(type);
}

export function listConnectorTypes(): ConnectorType[] {
  return Array.from(registry.keys());
}

export class ConnectorRegistry {
  private connectors = new Map<string, Connector>();

  async register(id: string, type: ConnectorType, config: ConnectorConfig): Promise<Connector> {
    const definition = registry.get(type);
    if (!definition) {
      throw new Error(`Unknown connector type: ${type}`);
    }

    const connector = await definition.create(config);
    this.connectors.set(id, connector);
    return connector;
  }

  async unregister(id: string): Promise<void> {
    const connector = this.connectors.get(id);
    if (connector) {
      await connector.disconnect();
      this.connectors.delete(id);
    }
  }

  get(id: string): Connector | undefined {
    return this.connectors.get(id);
  }

  list(): Connector[] {
    return Array.from(this.connectors.values());
  }

  async test(id: string): Promise<boolean> {
    const connector = this.connectors.get(id);
    if (!connector) return false;
    return connector.test();
  }
}
