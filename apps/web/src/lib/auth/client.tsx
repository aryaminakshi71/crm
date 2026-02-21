/**
 * Auth Client Configuration
 *
 * Better Auth client setup for TanStack Start.
 */

"use client";

import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Create auth client for the web app
 */
export function createAuthClientForWeb() {
  return createAuthClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : "",
    plugins: [organizationClient()],
    fetchOptions: {
      credentials: "include",
    },
  });
}

/**
 * Default auth client instance
 */
export const authClient = createAuthClientForWeb();

// Re-export hooks from Better Auth
export const { useSession, signIn, signOut } = authClient;
