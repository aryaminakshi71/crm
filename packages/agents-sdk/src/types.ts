/**
 * AI Agents Types
 */

export type AgentType = "chatbot" | "autonomous" | "code_execution" | "data_analysis";

export interface AgentConfig {
  name: string;
  description?: string;
  type: AgentType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  agentId: string;
  messages: Message[];
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  config: AgentConfig;
  status: "active" | "inactive" | "error";
  createdAt: Date;
}

export interface ExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  tokens?: number;
  cost?: number;
  duration?: number; // ms
}

export interface UsageStats {
  totalTokens: number;
  totalApiCalls: number;
  totalCost: number;
  periodStart: Date;
  periodEnd: Date;
}
