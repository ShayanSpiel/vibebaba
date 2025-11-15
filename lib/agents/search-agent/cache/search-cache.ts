/**
 * SEARCH AGENT - SEARCH CACHE
 *
 * Multi-tenant caching for search results
 */

import { LRUCache } from 'lru-cache';
import { CACHE_TTL } from '../config';
import type { CachedSearch, SearchResult } from '../types';

/**
 * Search cache with LRU eviction
 */
export class SearchCache {
  private cache: LRUCache<string, CachedSearch>;

  constructor() {
    this.cache = new LRUCache<string, CachedSearch>({
      max: 1000, // Maximum 1000 cached searches
      ttl: 1000 * 60 * 60, // Default 1 hour TTL
      updateAgeOnGet: true, // Refresh TTL on access
    });
  }

  /**
   * Generate cache key from query and org
   */
  private getCacheKey(query: string, orgId: string): string {
    // Use hash to create compact key
    const normalized = query.toLowerCase().trim();
    return `${orgId}:${this.hashString(normalized)}`;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached search result
   */
  async get(query: string, orgId: string): Promise<SearchResult | null> {
    const key = this.getCacheKey(query, orgId);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (new Date() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit counter
    cached.hits++;
    this.cache.set(key, cached);

    console.log(`[SearchCache] Cache HIT for org ${orgId}: ${query}`);
    return cached.result;
  }

  /**
   * Set cached search result
   */
  async set(query: string, orgId: string, result: SearchResult, ttl?: number): Promise<void> {
    const key = this.getCacheKey(query, orgId);

    // Determine TTL based on intent category
    let cacheTTL = ttl || CACHE_TTL.codeSearch;

    if (result.intent) {
      switch (result.intent.category) {
        case 'brand-clone':
        case 'design-inspiration':
          cacheTTL = CACHE_TTL.brandGuidelines;
          break;
        case 'api-documentation':
          cacheTTL = CACHE_TTL.apiDocs;
          break;
        case 'general-knowledge':
          cacheTTL = CACHE_TTL.webSearch;
          break;
        default:
          cacheTTL = CACHE_TTL.codeSearch;
      }
    }

    const cachedSearch: CachedSearch = {
      searchId: result.metadata.searchId,
      orgId,
      query,
      intent: result.intent,
      result,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + cacheTTL * 1000),
      hits: 0,
    };

    this.cache.set(key, cachedSearch, { ttl: cacheTTL * 1000 });
    console.log(`[SearchCache] Cached result for org ${orgId}: ${query} (TTL: ${cacheTTL}s)`);
  }

  /**
   * Invalidate cache for organization
   */
  async invalidate(orgId: string): Promise<number> {
    let count = 0;

    for (const [key, value] of this.cache.entries()) {
      if (value.orgId === orgId) {
        this.cache.delete(key);
        count++;
      }
    }

    console.log(`[SearchCache] Invalidated ${count} entries for org ${orgId}`);
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('[SearchCache] Cache cleared');
  }
}

// Singleton instance
let searchCacheInstance: SearchCache | null = null;

export function getSearchCache(): SearchCache {
  if (!searchCacheInstance) {
    searchCacheInstance = new SearchCache();
  }
  return searchCacheInstance;
}
