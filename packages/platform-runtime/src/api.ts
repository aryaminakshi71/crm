/**
 * Platform Fetch - API client with retry logic
 */

export interface PlatformFetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  retryOn?: number[];
}

export interface PlatformFetchResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

const DEFAULT_RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

export function createPlatformFetch(baseUrl?: string) {
  return async function platformFetch<T = unknown>(
    endpoint: string,
    options: PlatformFetchOptions = {}
  ): Promise<PlatformFetchResponse<T>> {
    const {
      retries = 3,
      retryDelay = 1000,
      retryOn = DEFAULT_RETRY_STATUS_CODES,
      ...fetchOptions
    } = options;

    const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;
    let lastError: string;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            "Content-Type": "application/json",
            ...fetchOptions.headers,
          },
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          return { data, status: response.status, ok: true };
        }

        if (!retryOn.includes(response.status)) {
          const error = await response.text().catch(() => "Unknown error");
          return { error, status: response.status, ok: false };
        }

        lastError = `HTTP ${response.status}: ${response.statusText}`;
      } catch (error) {
        lastError = String(error);
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }

    return { error: lastError, status: 0, ok: false };
  };
}
