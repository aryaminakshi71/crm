/**
 * Advanced Auth Configuration
 *
 * Cookie settings, ID generation, MFA, and other advanced options.
 */

import type { BetterAuthOptions } from "better-auth";

export interface AdvancedConfig {
  /** Use secure cookies (HTTPS only) */
  useSecureCookies?: boolean;
  /** Cookie prefix for namespacing */
  cookiePrefix?: string;
  /** Custom ID generator */
  generateId?: () => string;
  /** MFA (TOTP) configuration */
  mfa?: {
    /** Require MFA for all operations (stricter) */
    enforceOnAllOperations?: boolean;
    /** Time window for TOTP codes (in seconds) */
    maxAge?: number;
    /** Number of TOTP devices allowed per account */
    limit?: number;
    /** Custom TOTP issuer name */
    issuer?: string;
  };
}

/**
 * Create advanced configuration
 */
export function advancedConfig(
  config: AdvancedConfig = {},
): BetterAuthOptions["advanced"] {
  const {
    useSecureCookies = true,
    cookiePrefix = "saas-layer",
    generateId = () => crypto.randomUUID(),
    mfa,
  } = config;

  return {
    useSecureCookies,
    cookiePrefix,
    database: {
      generateId,
    },
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: useSecureCookies,
    },
    mfa,
  };
}
