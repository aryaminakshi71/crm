/**
 * Monitoring Agent Types
 */

export type AgentType =
  | "analytics"
  | "billing"
  | "error"
  | "support"
  | "uptime"
  | "performance"
  | "marketing"
  | "catalog";

export interface AgentConfig {
  organizationId: string;
  interval?: number; // ms between checks
  enabled?: boolean;
}

export interface AgentMetrics {
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface AgentAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AgentResult {
  success: boolean;
  metrics?: AgentMetrics;
  alerts?: AgentAlert[];
  error?: string;
}

export interface MonitoringAgent {
  type: AgentType;
  name: string;
  description: string;
  run(config: AgentConfig): Promise<AgentResult>;
}
