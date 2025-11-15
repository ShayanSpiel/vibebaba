// lib/repositories/base.repository.ts
import PocketBase from 'pocketbase';
import { type CollectionName, config } from '@/lib/config';
import { logger } from '@/lib/logger';

export class BaseRepository<T = any> {
  protected pb: PocketBase;
  protected collectionName: CollectionName;
  protected cache: Map<string, { data: T; expires: number }> = new Map();
  protected cacheTTL: number = 300; // 5 minutes default

  constructor(collectionName: CollectionName, cacheTTL?: number) {
    this.pb = new PocketBase(config.POCKETBASE_URL);
    this.collectionName = collectionName;
    if (cacheTTL) this.cacheTTL = cacheTTL;
  }

  /**
   * Get single record by ID with caching
   */
  async findById(id: string, skipCache = false): Promise<T | null> {
    const cacheKey = `${this.collectionName}:${id}`;

    // Check cache first
    if (!skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return cached.data;
      }
    }

    try {
      const record = await this.pb.collection(this.collectionName).getOne(id);

      // Store in cache
      this.cache.set(cacheKey, {
        data: record as T,
        expires: Date.now() + this.cacheTTL * 1000,
      });

      return record as T;
    } catch (error: any) {
      if (error.status === 404) {
        logger.debug(`Record not found: ${this.collectionName}/${id}`);
        return null;
      }
      logger.error(`Error fetching ${this.collectionName}/${id}:`, {}, error);
      throw error;
    }
  }

  /**
   * Find records with filter
   */
  async find(filter?: string, options?: { sort?: string; limit?: number }): Promise<T[]> {
    try {
      const records = await this.pb
        .collection(this.collectionName)
        .getList(1, options?.limit || 50, {
          filter,
          sort: options?.sort,
        });
      return records.items as T[];
    } catch (error: any) {
      logger.error(`Error querying ${this.collectionName}:`, {}, error);
      throw error;
    }
  }

  /**
   * Create new record
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const record = await this.pb.collection(this.collectionName).create(data);

      // Invalidate cache for this collection
      this.invalidateCache();

      return record as T;
    } catch (error: any) {
      logger.error(`Error creating ${this.collectionName}:`, {}, error);
      throw error;
    }
  }

  /**
   * Update record
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const record = await this.pb.collection(this.collectionName).update(id, data);

      // Invalidate cache for this record
      this.invalidateCache(id);

      return record as T;
    } catch (error: any) {
      logger.error(`Error updating ${this.collectionName}/${id}:`, {}, error);
      throw error;
    }
  }

  /**
   * Delete record
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.pb.collection(this.collectionName).delete(id);

      // Invalidate cache
      this.invalidateCache(id);

      return true;
    } catch (error: any) {
      logger.error(`Error deleting ${this.collectionName}/${id}:`, {}, error);
      throw error;
    }
  }

  /**
   * Invalidate cache
   */
  invalidateCache(id?: string) {
    if (id) {
      this.cache.delete(`${this.collectionName}:${id}`);
      logger.debug(`Cache invalidated: ${this.collectionName}:${id}`);
    } else {
      // Clear all cache for this collection
      const keys = Array.from(this.cache.keys()).filter((key) =>
        key.startsWith(`${this.collectionName}:`)
      );
      keys.forEach((key) => this.cache.delete(key));
      logger.debug(`Cache cleared: ${this.collectionName}`);
    }
  }

  /**
   * Clear expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
      }
    }
  }
}
