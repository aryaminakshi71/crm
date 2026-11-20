const viteEnv =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> })
    .env || {};
const DEFAULT_TIMEOUT_MS = Number(
  viteEnv.VITE_API_TIMEOUT_MS ||
    (typeof process !== "undefined"
      ? process.env.VITE_API_TIMEOUT_MS
      : undefined) ||
    15000,
);
const DEFAULT_RETRIES = Number(
  viteEnv.VITE_API_RETRIES ||
    (typeof process !== "undefined"
      ? process.env.VITE_API_RETRIES
      : undefined) ||
    1,
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isStreamingBody(body: unknown): boolean {
  if (!body) return false;
  const type = Object.prototype.toString.call(body);
  return (
    type === "[object ReadableStream]" ||
    type === "[object BytesStream]" ||
    type === "[object BodyReadableStream]"
  );
}

export async function platformFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const retries = Math.max(0, DEFAULT_RETRIES);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    // Clone Request objects before each attempt — a Request's body stream is
    // consumed on the first fetch() call and cannot be reused on retry.
    const fetchInput =
      input instanceof Request && attempt > 0 ? input.clone() : input;

    try {
      // Determine if we need duplex mode for streaming
      const streamingBody =
        init?.body || (fetchInput instanceof Request ? fetchInput.body : null);

      // Build fetch options with duplex if needed
      const fetchOptions: RequestInit = {
        ...init,
        credentials: "include",
        signal: controller.signal,
      };

      if (isStreamingBody(streamingBody)) {
        (fetchOptions as any).duplex = "half";
      }

      const response = await fetch(fetchInput as RequestInfo | URL, fetchOptions);

      if (
        (response.status >= 500 || response.status === 429) &&
        attempt < retries
      ) {
        await sleep(200 * (attempt + 1));
        continue;
      }

      return response;
    } catch (error: any) {
      // If we get a stream-related error, try to handle it gracefully
      if (
        attempt === 0 &&
        (error?.message?.includes("ReadableStream") ||
          error?.message?.includes("duplex"))
      ) {
        // Retry with body converted to string if possible
        try {
          let bodyStr: string | undefined;
          if (init?.body && typeof init.body === "string") {
            bodyStr = init.body;
          } else if (init?.body instanceof ReadableStream) {
            // Try to read the stream
            const reader = init.body.getReader();
            const chunks: Uint8Array[] = [];
            try {
              let result = await reader.read();
              while (!result.done) {
                chunks.push(result.value);
                result = await reader.read();
              }
              const allBytes = new Uint8Array(
                chunks.reduce((acc, chunk) => acc + chunk.length, 0),
              );
              let offset = 0;
              for (const chunk of chunks) {
                allBytes.set(chunk, offset);
                offset += chunk.length;
              }
              bodyStr = new TextDecoder().decode(allBytes);
            } catch {
              // Can't read stream, continue with error
            }
          }

          if (bodyStr) {
            const response = await fetch(input, {
              ...init,
              body: bodyStr,
              credentials: "include",
              signal: controller.signal,
            });
            clearTimeout(timer);
            return response;
          }
        } catch {
          // Fall through to throw original error
        }
      }

      if (attempt >= retries) {
        throw error;
      }
      await sleep(200 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error("platformFetch exhausted retries");
}
