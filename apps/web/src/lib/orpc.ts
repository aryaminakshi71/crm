/**
 * oRPC Client
 *
 * Type-safe RPC client for calling the API.
 * Uses @orpc/tanstack-query for React Query integration.
 */

import type { AppRouter } from "@crm/api/router";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

/**
 * Create the RPC link with fetch
 */
const rpcLink = new RPCLink({
  url:
    typeof window !== "undefined"
      ? `${window.location.origin}/api/rpc`
      : "http://localhost:8787/api/rpc",
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    console.log("[oRPC] Fetching:", input);
    const isDemo =
      typeof window !== "undefined" &&
      localStorage.getItem("demo_mode") === "true";

    return fetch(input, {
      ...init,
      credentials: "include",
      headers: {
        ...((init?.headers as Record<string, string>) || {}),
        "x-demo-mode": isDemo ? "true" : "false",
      },
    });
  },
});

/**
 * Type-safe oRPC client
 */
export const api: RouterClient<AppRouter> = createORPCClient(rpcLink);

/**
 * TanStack Query integration for oRPC
 * Provides queryOptions/mutationOptions utilities
 *
 * Usage:
 * ```tsx
 * import { useQuery, useMutation } from "@tanstack/react-query";
 *
 * const { data, isLoading } = useQuery(orpc.dashboard.metrics.queryOptions());
 * const createContact = useMutation(orpc.contacts.create.mutationOptions());
 * ```
 */
export const orpc = createTanstackQueryUtils(api);

/**
 * Export specific routers for convenience
 */
export const contactsClient = api.contacts;
export const dealsClient = api.deals;
export const leadsClient = api.leads;
export const activitiesClient = api.activities;
export const dashboardClient = api.dashboard;
export const assetsClient = api.assets;
