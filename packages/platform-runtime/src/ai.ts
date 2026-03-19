/**
 * AI Runtime - Reliability patterns for AI operations
 */

export interface AiRuntimeConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
}

export interface AiRuntime {
  complete(messages: AiMessage[], config?: AiRuntimeConfig): Promise<AiCompletionResult>;
  stream(messages: AiMessage[], config?: AiRuntimeConfig): Promise<AsyncIterable<string>>;
}

export function createAiRuntime(apiKey: string, baseUrl?: string): AiRuntime {
  const endpoint = baseUrl || "https://api.openai.com/v1";

  async function complete(messages: AiMessage[], config: AiRuntimeConfig = {}): Promise<AiCompletionResult> {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || "gpt-4",
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices[0]?.message;
    const usage = data.usage;

    return {
      content: message?.content || "",
      usage: usage ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      } : undefined,
      cost: usage ? (usage.total_tokens * 0.00001) : undefined, // Rough cost estimate
    };
  }

  async function* stream(messages: AiMessage[], config: AiRuntimeConfig = {}): AsyncIterable<string> {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || "gpt-4",
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {}
        }
      }
    }
  }

  return { complete, stream };
}
