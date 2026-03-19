/**
 * Agent Executor
 */

import type { AgentConfig, ExecutionResult, Message } from "./types";
import { StreamingChat } from "./chat";

export interface ExecutorOptions {
  apiKey: string;
  baseUrl?: string;
}

export class AgentExecutor {
  private chat: StreamingChat;

  constructor(options: ExecutorOptions) {
    this.chat = new StreamingChat(options);
  }

  async execute(
    config: AgentConfig,
    task: string,
    context?: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      const messages = this.buildMessages(config, task, context);

      const output = await this.chat.send({
        messages,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });

      return {
        success: true,
        output,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  async *executeStream(
    config: AgentConfig,
    task: string,
    context?: Record<string, unknown>
  ): AsyncIterable<string> {
    const messages = this.buildMessages(config, task, context);

    yield* this.chat.stream({
      messages,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
  }

  private buildMessages(
    config: AgentConfig,
    task: string,
    context?: Record<string, unknown>
  ): Message[] {
    const messages: Message[] = [];

    if (config.systemPrompt) {
      messages.push({
        id: crypto.randomUUID(),
        role: "system",
        content: config.systemPrompt,
        createdAt: new Date(),
      });
    }

    if (context) {
      messages.push({
        id: crypto.randomUUID(),
        role: "system",
        content: `Context: ${JSON.stringify(context)}`,
        createdAt: new Date(),
      });
    }

    messages.push({
      id: crypto.randomUUID(),
      role: "user",
      content: task,
      createdAt: new Date(),
    });

    return messages;
  }
}
