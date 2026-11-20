"use client";

import { useEffect, useState, type ReactNode } from "react";

const GA_MEASUREMENT_ID = import.meta.env.VITE_PUBLIC_GA_MEASUREMENT_ID;

let loaded = false;
let loading = false;

/**
 * Load the gtag.js script dynamically.
 * Only loads after analytics consent is given.
 */
export function initGA(): void {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID) {
    console.warn("[GA4] No VITE_PUBLIC_GA_MEASUREMENT_ID set, skipping init");
    return;
  }
  if (loaded || loading) return;

  loading = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  script.onload = () => {
    loading = false;
    loaded = true;

    // Initialize gtag
    if (window.gtag) {
      window.gtag("js", new Date().toISOString());
      window.gtag("config", GA_MEASUREMENT_ID, {
        transport_type: "beacon",
      });
      console.log("[GA4] initialized");
    }
  };

  script.onerror = () => {
    loading = false;
    console.error("[GA4] Failed to load gtag.js");
  };
}

/**
 * Track a page view in GA4.
 */
export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID) return;
  if (!loaded) return;

  if (window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: path,
    });
  }
}

/**
 * Track an event in GA4.
 */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID) return;
  if (!loaded) return;

  if (window.gtag) {
    window.gtag("event", name, properties);
  }
}

/**
 * Track a conversion in GA4.
 */
export function trackConversion(conversionId: string, value?: number): void {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID) return;
  if (!loaded) return;

  if (window.gtag) {
    window.gtag("event", "conversion", {
      send_to: conversionId,
      value: value,
    });
  }
}

/**
 * Check if GA4 has been loaded.
 */
export function isGALoaded(): boolean {
  return loaded;
}

interface CookieConsent {
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: number;
}

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const consentStr = localStorage.getItem("cookie_consent");
    if (!consentStr) return false;

    const consent: CookieConsent = JSON.parse(consentStr);
    return consent.analytics === true;
  } catch {
    return false;
  }
}

/**
 * GA4 Provider component that auto-initializes when consent is given.
 */
export function GA4Provider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(loaded);

  useEffect(() => {
    if (loaded) {
      setInitialized(true);
      return;
    }

    // Check consent periodically until granted
    const checkConsent = () => {
      if (hasAnalyticsConsent()) {
        initGA();
        setInitialized(true);
        return true;
      }
      return false;
    };

    if (checkConsent()) return;

    const interval = setInterval(() => {
      if (checkConsent()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Record<string, unknown>,
      config?: Record<string, unknown>,
    ) => void;
  }
}
