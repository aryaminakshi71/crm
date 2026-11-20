/**
 * Workflow Engine
 */

import type { Workflow, WorkflowRun, WorkflowStep, StepResult, RunStatus } from "./types";
import { WorkflowExecutor } from "./executor";

export interface WorkflowEngineOptions {
  maxConcurrentRuns?: number;
  defaultTimeout?: number;
  enableCompensation?: boolean;
}

export class WorkflowEngine {
  private executor: WorkflowExecutor;
  private runs = new Map<string, WorkflowRun>();
  private workflows = new Map<string, Workflow>();

  constructor(options: WorkflowEngineOptions = {}) {
    this.executor = new WorkflowExecutor(options);
  }

  register(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  unregister(workflowId: string): void {
    this.workflows.delete(workflowId);
  }

  get(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  async trigger(workflowId: string, triggerData: Record<string, unknown>): Promise<WorkflowRun> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const run: WorkflowRun = {
      id: crypto.randomUUID(),
      workflowId,
      triggerData,
      status: "pending",
      stepResults: new Map(),
      startedAt: new Date(),
    };

    this.runs.set(run.id, run);

    // Execute asynchronously
    this.executeRun(run, workflow).catch((error) => {
      run.status = "failed";
      run.error = String(error);
      run.completedAt = new Date();
    });

    return run;
  }

  private async executeRun(run: WorkflowRun, workflow: Workflow): Promise<void> {
    run.status = "running";

    try {
      for (const step of workflow.steps) {
        run.currentStepId = step.id;

        const result = await this.executor.execute(step, run.triggerData, this.getStepContext(run));

        run.stepResults.set(step.id, result);

        if (!result.success) {
          if (step.onError && workflow.errorHandling === "retry") {
            // Continue to error handler
          } else if (!result.success && workflow.errorHandling !== "skip") {
            run.status = "failed";
            run.error = result.error;
            run.completedAt = new Date();
            return;
          }
        }

        if (step.type === "end" || (result.success && !step.next)) {
          break;
        }
      }

      run.status = "completed";
      run.completedAt = new Date();
    } catch (error) {
      run.status = "failed";
      run.error = String(error);
      run.completedAt = new Date();
    }
  }

  private getStepContext(run: WorkflowRun): Record<string, unknown> {
    const context: Record<string, unknown> = { ...run.triggerData };
    for (const [stepId, result] of run.stepResults.entries()) {
      context[`step_${stepId}`] = result.output;
    }
    return context;
  }

  getRun(runId: string): WorkflowRun | undefined {
    return this.runs.get(runId);
  }

  cancelRun(runId: string): boolean {
    const run = this.runs.get(runId);
    if (!run) return false;
    if (run.status === "running") {
      run.status = "cancelled";
      run.completedAt = new Date();
      return true;
    }
    return false;
  }

  listRuns(workflowId?: string): WorkflowRun[] {
    const runs = Array.from(this.runs.values());
    if (workflowId) {
      return runs.filter((r) => r.workflowId === workflowId);
    }
    return runs;
  }
}
