/**
 * #done MCP Smart Caching System
 *
 * Caches MCP search results and memory queries to reduce API calls and tokens
 * Implements LRU eviction with configurable TTLs
 */

import { createHash } from 'crypto';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

/**
 * Generic LRU cache with TTL support
 */
export class MCPCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private ttl: number;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl || 24 * 60 * 60 * 1000; // Default: 24 hours
    this.maxSize = options.maxSize || 100; // Default: 100 entries
  }

  /**
   * Generate cache key from query and options
   */
  private generateKey(query: string, options?: any): string {
    const combined = JSON.stringify({ query, options });
    return createHash('md5').update(combined).digest('hex');
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  /**
   * Evict oldest entry if cache is full
   */
  private evictIfNeeded(): void {
    if (this.cache.size >= this.maxSize) {
      // Find least recently used (oldest timestamp, lowest hits)
      let oldestKey: string | null = null;
      let oldestScore = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        const score = entry.timestamp + entry.hits * 1000; // Favor frequently accessed items
        if (score < oldestScore) {
          oldestScore = score;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
        console.log('[MCP Cache] Evicted LRU entry');
      }
    }
  }

  /**
   * Get cached value
   */
  get(query: string, options?: any): T | null {
    const key = this.generateKey(query, options);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update hit count and timestamp (LRU)
    entry.hits++;
    entry.timestamp = Date.now();
    this.hits++;

    return entry.data;
  }

  /**
   * Set cached value
   */
  set(query: string, data: T, options?: any): void {
    const key = this.generateKey(query, options);

    this.evictIfNeeded();

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log('[MCP Cache] Cleared all entries');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + '%',
      ttl: this.ttl,
    };
  }

  /**
   * Invalidate entries matching pattern
   */
  invalidate(pattern: string): number {
    let count = 0;

    for (const key of this.cache.keys()) {
      // Simple pattern matching (can be improved with regex)
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[MCP Cache] Invalidated ${count} entries matching "${pattern}"`);
    }

    return count;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[MCP Cache] Cleaned up ${count} expired entries`);
    }

    return count;
  }
}

// Global cache instances with different TTLs
export const searchCache = new MCPCache({
  ttl: 24 * 60 * 60 * 1000, // 24 hours for search results
  maxSize: 100,
});

export const memoryCache = new MCPCache({
  ttl: 60 * 60 * 1000, // 1 hour for memory context (changes more frequently)
  maxSize: 50,
});

export const queryOptimizerCache = new MCPCache({
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days for optimized queries (rarely changes)
  maxSize: 200,
});

/**
 * Periodic cleanup job (run every hour)
 */
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupJob() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(
    () => {
      console.log('[MCP Cache] Running periodic cleanup...');
      const searchCleaned = searchCache.cleanup();
      const memoryCleaned = memoryCache.cleanup();
      const queryCleaned = queryOptimizerCache.cleanup();

      console.log(
        `[MCP Cache] Cleaned: ${searchCleaned + memoryCleaned + queryCleaned} total entries`
      );
    },
    60 * 60 * 1000
  ); // Every hour

  console.log('[MCP Cache] Started cleanup job');
}

export function stopCleanupJob() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('[MCP Cache] Stopped cleanup job');
  }
}

/**
 * Get all cache statistics
 */
export function getAllCacheStats() {
  return {
    search: searchCache.getStats(),
    memory: memoryCache.getStats(),
    queryOptimizer: queryOptimizerCache.getStats(),
  };
}
