/**
 * In-Memory Cache with TTL
 *
 * Simple caching layer for dashboard queries and expensive operations.
 * Can be replaced with Redis or Cloudflare KV in production.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 60 seconds)
  maxSize?: number; // Maximum number of entries (default: 100)
}

// In-memory cache store
const cache = new Map<string, CacheEntry<any>>();
const MAX_CACHE_SIZE = 100;
const DEFAULT_TTL = 60_000; // 60 seconds

/**
 * Get a value from cache
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value as T;
}

/**
 * Set a value in cache with TTL
 */
export function setCache<T>(key: string, value: T, options: CacheOptions = {}): void {
  const ttl = options.ttl ?? DEFAULT_TTL;
  const maxSize = options.maxSize ?? MAX_CACHE_SIZE;

  // Evict oldest entry if at capacity
  if (cache.size >= maxSize && !cache.has(key)) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }

  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Delete a specific key from cache
 */
export function deleteCache(key: string): void {
  cache.delete(key);
}

/**
 * Clear all cache entries matching a prefix
 */
export function clearCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const entry of cache.values()) {
    if (now > entry.expiresAt) {
      expiredEntries++;
    } else {
      validEntries++;
    }
  }

  return {
    totalEntries: cache.size,
    validEntries,
    expiredEntries,
    maxSize: MAX_CACHE_SIZE,
  };
}

/**
 * Create a cached version of a function
 * Returns the cached result if available and not expired
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = getCache<T>(key);

  if (cached !== null) {
    return cached;
  }

  const result = await fetchFn();
  setCache(key, result, options);
  return result;
}

/**
 * Cache keys generator for common queries
 */
export const cacheKeys = {
  summary: (orgId: string) => `summary:${orgId}`,
  hrmSummary: (orgId: string) => `hrm:summary:${orgId}`,
  dealsList: (orgId: string) => `deals:list:${orgId}`,
  leadsList: (orgId: string) => `leads:list:${orgId}`,
  ticketsList: (orgId: string, status?: string) =>
    status ? `tickets:list:${orgId}:${status}` : `tickets:list:${orgId}`,
  projectsList: (orgId: string) => `projects:list:${orgId}`,
  invoicesList: (orgId: string) => `invoices:list:${orgId}`,
  campaignsList: (orgId: string) => `campaigns:list:${orgId}`,
  enterpriseSummary: (orgId: string) => `enterprise:summary:${orgId}`,
  intelligenceSummary: (orgId: string) => `intelligence:summary:${orgId}`,
  operationsSummary: (orgId: string) => `operations:summary:${orgId}`,
};

/**
 * Invalidate cache for an organization
 * Call this when data changes to ensure fresh reads
 */
export function invalidateOrgCache(orgId: string): void {
  clearCachePrefix(`:${orgId}`);
  // Also clear root org-level caches
  cache.delete(`summary:${orgId}`);
  cache.delete(`hrm:summary:${orgId}`);
  cache.delete(`enterprise:summary:${orgId}`);
  cache.delete(`intelligence:summary:${orgId}`);
  cache.delete(`operations:summary:${orgId}`);
}
