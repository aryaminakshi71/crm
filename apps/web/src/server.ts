/// <reference types="@cloudflare/workers-types" />

import { api } from "@crm/api/app";
import { honoIntegration, withSentry } from "@sentry/cloudflare";
import handler from "@tanstack/react-start/server-entry";
import type { getRouter } from "./router";

type Env = Record<string, unknown>;

export interface CloudflareRequestContext {
  cloudflare: {
    env: Env;
    ctx: ExecutionContext;
  };
}

declare module "@tanstack/react-start" {
  interface Register {
    ssr: true;
    router: ReturnType<typeof getRouter>;
    server: {
      requestContext: CloudflareRequestContext;
    };
  }
}

export default withSentry(
  (env: Env = {}) => {
    const safeEnv = env || process.env || {};
    return {
      dsn: (safeEnv as any).SENTRY_DSN || (safeEnv as any).VITE_PUBLIC_SENTRY_DSN,
      environment:
        (safeEnv as any).SENTRY_ENVIRONMENT || (safeEnv as any).NODE_ENV || "development",
      release: (safeEnv as any).SENTRY_RELEASE,
      tracesSampleRate: (safeEnv as any).NODE_ENV === "production" ? 0.1 : 1.0,
      integrations: [honoIntegration()],
    };
  },
  {
    async fetch(
      request: Request,
      env: Env | undefined,
      ctx: ExecutionContext,
    ): Promise<Response> {
      const safeEnv = env ?? {};
      (process as any).env = { ...process.env, ...safeEnv };

      const url = new URL(request.url);

      // Handle API routes - integrated API
      if (url.pathname.startsWith("/api")) {
        return api.fetch(request, safeEnv as any, ctx);
      }

      return handler.fetch(request, {
        context: {
          cloudflare: { env: safeEnv, ctx },
        },
      } as Parameters<typeof handler.fetch>[1]);
    },
  },
);
