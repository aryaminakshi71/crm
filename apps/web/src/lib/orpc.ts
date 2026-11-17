/**
 * oRPC Client
 *
 * Type-safe RPC client for calling the API.
 * Uses @orpc/tanstack-query for React Query integration.
 */

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../../../api/src/routers";
import { useAppStore } from "../stores/app-store";
import { platformFetch } from "./platform-api-client";

/**
 * Create the RPC link with fetch
 */
const rpcLink = new RPCLink({
  url:
    typeof window !== "undefined"
      ? `${window.location.origin}/api/rpc`
      : "http://localhost:8787/api/rpc",
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    const demoFlag =
      typeof window !== "undefined" ? localStorage.getItem("demo_mode") : null;

    let orgId = useAppStore.getState().currentOrganizationId;

    // Default to demo mode until real org context is set in the client store.
    const isDemo = demoFlag === "true" || !orgId;

    if (isDemo && !orgId) {
      orgId = "demo-org";
    }

    return platformFetch(input, {
      ...init,
      credentials: "include",
      headers: {
        ...((init?.headers as Record<string, string>) || {}),
        "x-demo-mode": isDemo ? "true" : "false",
        ...(orgId && { "x-organization-id": orgId }),
      },
    });
  },
});

/**
 * Keep client typing permissive to avoid breakage during API evolution.
 */
export const api: RouterClient<AppRouter> = createORPCClient(rpcLink);
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
export const modulesClient = api.modules;
export const nucleoClient = api.nucleo;
