/**
 * UTM Capture Hook
 *
 * Captures UTM parameters and click IDs from URL on page load.
 * Stores in sessionStorage for use across the session.
 */

import { useCallback, useEffect } from "react";

export interface UTMCapture {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  gclid: string | null;
  msclkid: string | null;
  fbclid: string | null;
}

const STORAGE_KEY = "nucleo_utms";

function getUTMsFromURL(): UTMCapture {
  if (typeof window === "undefined") {
    return emptyUTM();
  }

  const params = new URLSearchParams(window.location.search);

  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmTerm: params.get("utm_term"),
    utmContent: params.get("utm_content"),
    gclid: params.get("gclid"),
    msclkid: params.get("msclkid"),
    fbclid: params.get("fbclid"),
  };
}

function emptyUTM(): UTMCapture {
  return {
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmTerm: null,
    utmContent: null,
    gclid: null,
    msclkid: null,
    fbclid: null,
  };
}

function hasUTMs(utms: UTMCapture): boolean {
  return !!(
    utms.utmSource ||
    utms.utmMedium ||
    utms.utmCampaign ||
    utms.utmTerm ||
    utms.utmContent ||
    utms.gclid ||
    utms.msclkid ||
    utms.fbclid
  );
}

export function useUTMCapture() {
  // Capture UTM params from URL and store in sessionStorage
  const captureUTMs = useCallback(() => {
    const utms = getUTMsFromURL();
    if (hasUTMs(utms)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utms));
    }
    return utms;
  }, []);

  // Get stored UTM params
  const getUTMs = useCallback((): UTMCapture => {
    if (typeof window === "undefined") {
      return emptyUTM();
    }

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as UTMCapture;
      }
    } catch {
      // Ignore parse errors
    }

    return emptyUTM();
  }, []);

  // Clear stored UTM params
  const clearUTMs = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Check if visitor came from paid ad
  const isPaidTraffic = useCallback((): boolean => {
    const utms = getUTMs();
    return !!(utms.gclid || utms.msclkid || utms.fbclid);
  }, [getUTMs]);

  // Get UTM params as query string (for attaching to form submissions)
  const getUTMQueryString = useCallback((): string => {
    const utms = getUTMs();
    const params = new URLSearchParams();

    if (utms.utmSource) params.set("utm_source", utms.utmSource);
    if (utms.utmMedium) params.set("utm_medium", utms.utmMedium);
    if (utms.utmCampaign) params.set("utm_campaign", utms.utmCampaign);
    if (utms.utmTerm) params.set("utm_term", utms.utmTerm);
    if (utms.utmContent) params.set("utm_content", utms.utmContent);
    if (utms.gclid) params.set("gclid", utms.gclid);
    if (utms.msclkid) params.set("msclkid", utms.msclkid);
    if (utms.fbclid) params.set("fbclid", utms.fbclid);

    return params.toString();
  }, [getUTMs]);

  // Capture UTM params on mount (page load)
  useEffect(() => {
    captureUTMs();
  }, [captureUTMs]);

  return {
    captureUTMs,
    getUTMs,
    clearUTMs,
    isPaidTraffic,
    getUTMQueryString,
  };
}

// Export singleton for non-React usage
export const utmCapture = {
  capture: (): UTMCapture => {
    if (typeof window === "undefined") {
      return emptyUTM();
    }
    const utms = getUTMsFromURL();
    if (hasUTMs(utms)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utms));
    }
    return utms;
  },

  get: (): UTMCapture => {
    if (typeof window === "undefined") {
      return emptyUTM();
    }
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as UTMCapture;
      }
    } catch {
      // Ignore
    }
    return emptyUTM();
  },

  clear: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  },
};
