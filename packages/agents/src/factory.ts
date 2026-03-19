/**
 * Agent Factory - creates monitoring agents by type
 */

import type { AgentConfig, AgentResult, MonitoringAgent, AgentType } from "./types";
import { createAnalyticsAgent } from "./analytics";
import { createBillingAgent } from "./billing";
import { createErrorTrackingAgent } from "./error-tracking";
import { createSupportAgent } from "./support";
import { createUptimeAgent } from "./uptime";
import { createPerformanceAgent } from "./performance";
import { createMarketingAgent } from "./marketing";
import { createCatalogAgent } from "./catalog";

const agents: Record<AgentType, () => MonitoringAgent> = {
  analytics: createAnalyticsAgent,
  billing: createBillingAgent,
  error: createErrorTrackingAgent,
  support: createSupportAgent,
  uptime: createUptimeAgent,
  performance: createPerformanceAgent,
  marketing: createMarketingAgent,
  catalog: createCatalogAgent,
};

export async function createAgent(type: AgentType, config: AgentConfig): Promise<AgentResult> {
  const factory = agents[type];
  if (!factory) {
    return { success: false, error: `Unknown agent type: ${type}` };
  }

  const agent = factory();
  return agent.run(config);
}

export function getAgentInfo(type: AgentType): { name: string; description: string } | null {
  const factory = agents[type];
  if (!factory) return null;
  const agent = factory();
  return { name: agent.name, description: agent.description };
}
