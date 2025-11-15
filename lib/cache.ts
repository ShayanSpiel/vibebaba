/**
 * Request Caching System
 * Caches API responses to reduce server load and improve performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
  lastAccessed: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 100; // Maximum number of cache entries
  private hitCount = 0;
  private missCount = 0;

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access tracking for LRU
    entry.hits++;
    entry.lastAccessed = now;
    this.hitCount++;

    return entry.data as T;
  }

  /**
   * Evict least recently used entry (LRU)
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      console.log(`[Cache] LRU evicted: ${lruKey}`);
    }
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Evict LRU entry if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const now = Date.now();
    const timeToLive = ttl || this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + timeToLive,
      hits: 0,
      lastAccessed: now,
    });
  }

  /**
   * Delete cached entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const globalCache = new RequestCache();

// Cleanup expired entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      globalCache.cleanup();
    },
    10 * 60 * 1000
  );
}

/**
 * Cached fetch wrapper
 * @param key - Cache key
 * @param fetcher - Function that fetches data
 * @param ttl - Time to live in milliseconds (default: 5 minutes)
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = globalCache.get<T>(key);
  if (cached !== null) {
    console.log(`[Cache] HIT: ${key}`);
    return cached;
  }

  // Fetch fresh data
  console.log(`[Cache] MISS: ${key}`);
  const data = await fetcher();

  // Store in cache
  globalCache.set(key, data, ttl);

  return data;
}

/**
 * Invalidate cache by key or pattern
 */
export function invalidateCache(keyOrPattern: string): void {
  if (keyOrPattern.includes('*')) {
    // Pattern matching
    const pattern = new RegExp(keyOrPattern.replace('*', '.*'));
    for (const key of Array.from(globalCache['cache'].keys())) {
      if (pattern.test(key)) {
        globalCache.delete(key);
      }
    }
  } else {
    globalCache.delete(keyOrPattern);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const total = globalCache['hitCount'] + globalCache['missCount'];
  return {
    size: globalCache.size(),
    maxSize: globalCache['maxSize'],
    hits: globalCache['hitCount'],
    misses: globalCache['missCount'],
    hitRate: total > 0 ? ((globalCache['hitCount'] / total) * 100).toFixed(2) + '%' : '0%',
    entries: Array.from(globalCache['cache'].entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      expiresIn: Math.max(0, entry.expiresAt - Date.now()),
      lastAccessed: entry.lastAccessed,
    })),
  };
}

export default globalCache;
