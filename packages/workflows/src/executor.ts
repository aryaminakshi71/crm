/**
 * Workflow Executor
 */

import type { WorkflowStep, StepResult } from "./types";

export interface WorkflowExecutorOptions {
  maxConcurrentRuns?: number;
  defaultTimeout?: number;
  enableCompensation?: boolean;
}

export class WorkflowExecutor {
  private readonly options: Required<WorkflowExecutorOptions>;

  constructor(options: WorkflowExecutorOptions = {}) {
    this.options = {
      maxConcurrentRuns: options.maxConcurrentRuns ?? 10,
      defaultTimeout: options.defaultTimeout ?? 300000, // 5 min
      enableCompensation: options.enableCompensation ?? false,
    };
  }

  async execute(
    step: WorkflowStep,
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<StepResult> {
    const result: StepResult = {
      stepId: step.id,
      success: false,
      startedAt: new Date(),
    };

    try {
      const timeout = (step.config.timeout as number) || this.options.defaultTimeout;
      const output = await this.executeWithTimeout(this.executeStep(step, input, context), timeout);
      result.output = output;
      result.success = true;
    } catch (error) {
      result.error = String(error);
    }

    result.completedAt = new Date();
    return result;
  }

  private async executeStep(
    step: WorkflowStep,
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    switch (step.type) {
      case "action":
        return this.executeAction(step, input, context);
      case "condition":
        return this.executeCondition(step, input, context);
      case "transform":
        return this.executeTransform(step, input, context);
      case "delay":
        return this.executeDelay(step, input, context);
      case "end":
        return { done: true };
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeAction(
    step: WorkflowStep,
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    const { action, params = {} } = step.config;
    // Action execution would call external services
    return { action, executed: true, params, input };
  }

  private async executeCondition(
    step: WorkflowStep,
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<boolean> {
    const { expression } = step.config;
    // Simple condition evaluation
    return true;
  }

  private async executeTransform(
    step: WorkflowStep,
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    const { mapping = {} } = step.config as { mapping?: Record<string, unknown> };
    // Data transformation
    return { ...input, ...mapping };
  }

  private async executeDelay(
    step: WorkflowStep,
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<void> {
    const { duration = 1000 } = step.config;
    await new Promise((resolve) => setTimeout(resolve, duration as number));
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Step timed out after ${timeout}ms`)), timeout)
      ),
    ]);
  }
}
