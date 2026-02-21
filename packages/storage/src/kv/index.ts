import type {
  KVNamespace,
  KVNamespacePutOptions,
} from "@cloudflare/workers-types";

export interface KVStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Create a KV storage wrapper
 */
export function createKVStorage(kv: KVNamespace): KVStorage {
  return {
    async get(key: string): Promise<string | null> {
      return kv.get(key);
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      const options: KVNamespacePutOptions = {};
      if (ttl && ttl > 0) {
        options.expirationTtl = Math.max(ttl, 60);
      }
      await kv.put(key, value, options);
    },

    async delete(key: string): Promise<void> {
      await kv.delete(key);
    },
  };
}
