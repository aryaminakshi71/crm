"use client";
// import posthog from "posthog-js";
// import { PostHogProvider as PHProvider } from "posthog-js/react";
import { type ReactNode } from "react";

export function PostHogProvider({ children }: { children: ReactNode }) {
  // useEffect(() => {
  //   if (typeof window !== "undefined" && env.VITE_PUBLIC_POSTHOG_KEY) {
  //     posthog.init(env.VITE_PUBLIC_POSTHOG_KEY, {
  //       // ...
  //     });
  //   }
  // }, []);

  // if (!env.VITE_PUBLIC_POSTHOG_KEY) {
  //   return <>{children}</>;
  // }

  // return <PHProvider client={posthog}>{children}</PHProvider>;
  return <>{children}</>;
}

export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    createdAt?: Date | string;
    [key: string]: unknown;
  },
) {
  // Stub
}

export function setOrganization(
  orgId: string,
  properties?: {
    name?: string;
    slug?: string;
    createdAt?: Date | string;
    [key: string]: unknown;
  },
) {
  // Stub
}

export function resetUser() {
  // Stub
}
