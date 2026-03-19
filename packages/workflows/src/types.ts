/**
 * Workflow Types
 */

export type WorkflowStatus = "draft" | "active" | "paused" | "archived";
export type RunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface WorkflowStep {
  id: string;
  name: string;
  type: "action" | "condition" | "transform" | "delay" | "end";
  config: Record<string, unknown>;
  next?: string; // next step ID on success
  onError?: string; // next step ID on error
}

export interface Workflow {
  id: string;
  name: string;
  triggerType: "webhook" | "schedule" | "event" | "manual";
  steps: WorkflowStep[];
  errorHandling?: "stop" | "retry" | "skip";
  timeout?: number; // ms
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  triggerData: Record<string, unknown>;
  status: RunStatus;
  currentStepId?: string;
  stepResults: Map<string, StepResult>;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface StepResult {
  stepId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface WorkflowEvent {
  type: string;
  source: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}
