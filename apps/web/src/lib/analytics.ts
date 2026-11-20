/**
 * Analytics tracking helper that dispatches to PostHog and GA4 based on consent.
 */

interface CookieConsent {
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: number;
}

/**
 * Check if analytics consent has been given.
 * Reads from localStorage "cookie_consent" key.
 */
export function hasAnalyticsConsent(): boolean {
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
 * Track a page view in both PostHog and GA4 if consented.
 */
export function trackPageView(
  path: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  const pageProps = {
    ...properties,
    path,
    timestamp: new Date().toISOString(),
  };

  // PostHog
  if (window.posthog?.capture) {
    window.posthog.capture("page_view", pageProps);
  }

  // GA4
  if (window.gtag) {
    window.gtag("config", import.meta.env.VITE_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: path,
      ...properties,
    });
  }
}

/**
 * Track an event in both PostHog and GA4 if consented.
 */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  const eventProps = {
    ...properties,
    timestamp: new Date().toISOString(),
  };

  // PostHog
  if (window.posthog?.capture) {
    window.posthog.capture(name, eventProps);
  }

  // GA4
  if (window.gtag) {
    window.gtag("event", name, eventProps);
  }
}

/**
 * Track a conversion in both PostHog and GA4 if consented.
 */
export function trackConversion(
  conversionName: string,
  value?: number,
): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  const conversionProps: Record<string, unknown> = {
    conversion_name: conversionName,
    timestamp: new Date().toISOString(),
  };

  if (value !== undefined) {
    conversionProps.value = value;
  }

  // PostHog - track as a custom event
  if (window.posthog?.capture) {
    window.posthog.capture(`conversion_${conversionName}`, conversionProps);
  }

  // GA4 - track as conversion
  const measurementId = import.meta.env.VITE_PUBLIC_GA_MEASUREMENT_ID;
  if (window.gtag && measurementId) {
    window.gtag("event", "conversion", {
      send_to: conversionName,
      value: value,
    });
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      identify: (userId: string, properties?: Record<string, unknown>) => void;
      group: (groupType: string, groupId: string, properties?: Record<string, unknown>) => void;
      reset: () => void;
    };
    gtag: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Record<string, unknown>,
      config?: Record<string, unknown>,
    ) => void;
  }
}
