/**
 * API Context Types
 *
 * Defines the context types for oRPC procedures.
 */

import type { Fetcher, KVNamespace, R2Bucket } from "@cloudflare/workers-types";
import type { Auth } from "@crm/auth";
import type { Logger } from "@crm/logger";

/**
 * Cloudflare Worker environment bindings
 */
export interface AppEnv {
  DATABASE?: { connectionString: string };
  DATABASE_URL?: string;
  REDIS_URL?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  CACHE: KVNamespace;
  BUCKET: R2Bucket;
  ASSETS?: Fetcher;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  VITE_PUBLIC_SITE_URL: string;
  NODE_ENV: string;
}

/**
 * Initial context provided at request start
 */
export interface InitialContext {
  env: AppEnv;
  headers: Headers;
  requestId: string;
  logger: Logger;
}

/**
 * Context after auth middleware
 */
export interface AuthContext extends InitialContext {
  auth: Auth;
  /** User from Better Auth session - inferred type */
  user: Auth["$Infer"]["Session"]["user"];
  /** Session from Better Auth - inferred type */
  session: Auth["$Infer"]["Session"]["session"];
  /** Present when authenticated via API key instead of session */
  apiKeyId?: string;
  /** API key permissions (format: "resource:action") */
  permissions?: string[];
}

/**
 * Context after organization middleware
 */
export interface OrgContext extends AuthContext {
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
  member: {
    id: string;
    role: "owner" | "admin" | "member";
  };
}

/**
 * Full context with all dependencies
 */
export type FullContext = OrgContext;
