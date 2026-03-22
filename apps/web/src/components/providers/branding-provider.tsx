"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

// Build-time brand defaults from environment variables
const DEFAULT_BRAND_NAME = import.meta.env.VITE_BRAND_NAME ?? "Nucleo One";
const DEFAULT_PRIMARY_COLOR = import.meta.env.VITE_PRIMARY_COLOR ?? null;
const DEFAULT_LOGO_URL = import.meta.env.VITE_LOGO_URL ?? null;
const DEFAULT_TAGLINE = import.meta.env.VITE_BRAND_TAGLINE ?? "All-in-One Business Management Platform";
const DEFAULT_SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL ?? "support@nucleoone.com";
const DEFAULT_TWITTER_HANDLE = import.meta.env.VITE_TWITTER_HANDLE ?? "@nucleoone";
const DEFAULT_THEME_COLOR = import.meta.env.VITE_THEME_COLOR ?? "#e11d48";

export interface BrandConfig {
  brandName: string;
  tagline: string;
  logoUrl: string | null;
  primaryColor: string | null;
  themeColor: string;
  supportEmail: string;
  twitterHandle: string;
}

const BrandingContext = createContext<BrandConfig>({
  brandName: DEFAULT_BRAND_NAME,
  tagline: DEFAULT_TAGLINE,
  logoUrl: DEFAULT_LOGO_URL,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  themeColor: DEFAULT_THEME_COLOR,
  supportEmail: DEFAULT_SUPPORT_EMAIL,
  twitterHandle: DEFAULT_TWITTER_HANDLE,
});

/**
 * Convert hex color to HSL string (for CSS variable injection)
 * e.g. "#e11d48" -> "343 91% 50%"
 */
function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const brand: BrandConfig = {
    brandName: DEFAULT_BRAND_NAME,
    tagline: DEFAULT_TAGLINE,
    logoUrl: DEFAULT_LOGO_URL,
    primaryColor: DEFAULT_PRIMARY_COLOR,
    themeColor: DEFAULT_THEME_COLOR,
    supportEmail: DEFAULT_SUPPORT_EMAIL,
    twitterHandle: DEFAULT_TWITTER_HANDLE,
  };

  useEffect(() => {
    if (!DEFAULT_PRIMARY_COLOR) return;
    const hsl = hexToHsl(DEFAULT_PRIMARY_COLOR);
    if (!hsl) return;
    // Inject CSS variable override at runtime
    const root = document.documentElement;
    root.style.setProperty("--primary", hsl);
    // Derive a readable foreground — always white for saturated colors
    root.style.setProperty("--primary-foreground", "210 40% 98%");
  }, []);

  return (
    <BrandingContext.Provider value={brand}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandConfig {
  return useContext(BrandingContext);
}
