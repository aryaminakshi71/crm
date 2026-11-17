/**
 * Cloudflare KV Storage Adapter for Better Auth
 *
 * Provides secondary storage for sessions and tokens using Cloudflare KV.
 */

import type {
  KVNamespace,
  KVNamespacePutOptions,
} from "@cloudflare/workers-types";
import type { SecondaryStorage } from "better-auth";

const AUTH_PREFIX = "auth:";

/**
 * Create a Better Auth secondary storage adapter using Cloudflare KV
 */
export function createKVStorage(kv: KVNamespace): SecondaryStorage {
  return {
    async get(key: string): Promise<string | null> {
      try {
        const value = await kv.get(`${AUTH_PREFIX}${key}`);
        return value;
      } catch (error) {
        console.error(`[Auth] Failed to get key from KV: ${key}`, error);
        return null;
      }
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      try {
        const options: KVNamespacePutOptions = {};
        if (ttl && ttl > 0) {
          // KV requires minimum 60 seconds TTL
          options.expirationTtl = Math.max(ttl, 60);
        }
        await kv.put(`${AUTH_PREFIX}${key}`, value, options);
      } catch (error) {
        console.error(`[Auth] Failed to set key in KV: ${key}`, error);
        throw error;
      }
    },

    async delete(key: string): Promise<void> {
      try {
        await kv.delete(`${AUTH_PREFIX}${key}`);
      } catch (error) {
        console.error(`[Auth] Failed to delete key from KV: ${key}`, error);
      }
    },

    async getAndDelete(key: string): Promise<string | null> {
      const value = await kv.get(`${AUTH_PREFIX}${key}`);
      await kv.delete(`${AUTH_PREFIX}${key}`);
      return value;
    },

    async increment(key: string, ttl?: number): Promise<number> {
      const current = Number((await kv.get(`${AUTH_PREFIX}${key}`)) ?? "0") + 1;
      const options: KVNamespacePutOptions = {};
      if (ttl && ttl > 0) options.expirationTtl = Math.max(ttl, 60);
      await kv.put(`${AUTH_PREFIX}${key}`, String(current), options);
      return current;
    },
  };
}
