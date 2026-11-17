import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { getRouter } from "./router";
import { agentsApi } from "./server/api";

type Env = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetch: any = async (request: Request, env: Env, ctx: any) => {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/")) {
    // Pass environment to API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (agentsApi.fetch as any)(request, env);
  }

  const router = getRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler: any = (createStartHandler as any)(defaultStreamHandler, {
    getRouter: () => router,
  });

  return handler(request);
};

export type ServerEntry = { fetch: typeof fetch };

export default {
  fetch,
} satisfies ServerEntry;
