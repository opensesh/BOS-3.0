/**
 * Bounded LRU cache for IP geolocation data
 *
 * Prevents unbounded cache growth that was causing ~2 MB+ of fetch-cache
 * entries in production. Uses a simple Map-based LRU with TTL per entry.
 *
 * Config:
 * - Max 10,000 entries (~5 MB memory estimate)
 * - 5-minute TTL per entry
 * - Automatic cleanup on set operations
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface GeoLocationData {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  lat: number;
  lon: number;
}

const MAX_ENTRIES = 10_000;
const TTL_MS = 5 * 60 * 1000; // 5 minutes

// Simple Map-based LRU cache
// Map maintains insertion order, so we can evict oldest entries
const cache = new Map<string, CacheEntry<GeoLocationData | null>>();

/**
 * Get cached geolocation data for an IP address
 * Returns undefined if not in cache or expired
 */
export function getGeoCache(ip: string): GeoLocationData | null | undefined {
  const entry = cache.get(ip);

  if (!entry) {
    return undefined;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(ip);
    return undefined;
  }

  // Move to end (most recently used) by re-inserting
  cache.delete(ip);
  cache.set(ip, entry);

  return entry.value;
}

/**
 * Set geolocation data in cache
 * Automatically evicts oldest entries if cache is full
 */
export function setGeoCache(ip: string, data: GeoLocationData | null): void {
  // Evict oldest entries if at capacity
  // Delete 10% when full to avoid frequent evictions
  if (cache.size >= MAX_ENTRIES) {
    const deleteCount = Math.ceil(MAX_ENTRIES * 0.1);
    const iterator = cache.keys();

    for (let i = 0; i < deleteCount; i++) {
      const key = iterator.next().value;
      if (key) {
        cache.delete(key);
      }
    }
  }

  cache.set(ip, {
    value: data,
    expiresAt: Date.now() + TTL_MS,
  });
}

/**
 * Get cache statistics (for debugging/monitoring)
 */
export function getGeoCacheStats(): { size: number; maxSize: number } {
  return {
    size: cache.size,
    maxSize: MAX_ENTRIES,
  };
}

/**
 * Clear all cache entries (useful for testing)
 */
export function clearGeoCache(): void {
  cache.clear();
}
