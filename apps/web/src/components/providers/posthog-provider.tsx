"use client";

import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (initialized || typeof window === "undefined") return;
    if (!POSTHOG_KEY) {
      console.warn("[PostHog] No VITE_PUBLIC_POSTHOG_KEY set, skipping init");
      return;
    }

    initialized = true;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: false,
      session_recording: { consentMode: "requires_consent" },
      enable_heatmaps: false,
      loaded: (posthog) => {
        console.log("[PostHog] initialized");
      },
    });
  }, []);

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
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
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return;

  posthog.identify(userId, properties);
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
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return;

  posthog.group("organization", orgId, properties);
}

export function resetUser() {
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return;

  posthog.reset();
}
