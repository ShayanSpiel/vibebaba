/**
 * High-performance in-memory cache for credit data
 * Optimized for Mac performance with minimal overhead
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CreditsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 60000; // 60 seconds - optimized for performance (Phase 1)
  private readonly MAX_ENTRIES = 10000; // Increased for better capacity

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Expired - remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // Prevent memory leak - remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_ENTRIES) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries for a user
   */
  invalidateUser(userId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`credits:${userId}`) || key.startsWith(`available:${userId}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.MAX_ENTRIES,
      defaultTTL: this.DEFAULT_TTL,
    };
  }

  /**
   * Warm cache with multiple user IDs
   * Pre-loads credits for active users
   */
  async warmCache(userIds: string[], loader: (userId: string) => Promise<any>): Promise<void> {
    const promises = userIds.map(async (userId) => {
      try {
        const data = await loader(userId);
        this.set(`credits:${userId}`, data);
      } catch (error) {
        console.error(`Failed to warm cache for user ${userId}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get multiple cache entries at once
   * Optimized for batch operations (e.g., admin dashboard)
   */
  getMany<T>(keys: string[]): Map<string, T> {
    const result = new Map<string, T>();
    const now = Date.now();

    for (const key of keys) {
      const entry = this.cache.get(key);

      if (entry && now - entry.timestamp <= entry.ttl) {
        result.set(key, entry.data as T);
      }
    }

    return result;
  }

  /**
   * Set multiple cache entries at once
   */
  setMany<T>(entries: Map<string, T>, ttl: number = this.DEFAULT_TTL): void {
    for (const [key, data] of entries.entries()) {
      this.set(key, data, ttl);
    }
  }
}

// Singleton instance
export const creditsCache = new CreditsCache();
