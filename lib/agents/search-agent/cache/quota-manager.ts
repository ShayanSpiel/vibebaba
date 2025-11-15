/**
 * SEARCH AGENT - QUOTA MANAGER
 *
 * Multi-tenant quota tracking and enforcement
 */

import { QUOTA_LIMITS } from '../config';
import type { QuotaUsage, UsageStats } from '../types';

/**
 * In-memory quota tracking (replace with PocketBase in production)
 */
export class QuotaManager {
  private usage: Map<string, Map<string, number>> = new Map();
  private resetTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Get usage key
   */
  private getUsageKey(orgId: string, operation: string): string {
    return `${orgId}:${operation}`;
  }

  /**
   * Get current usage for operation
   */
  async getUsage(orgId: string, operation: string): Promise<number> {
    const key = this.getUsageKey(orgId, operation);

    if (!this.usage.has(orgId)) {
      this.usage.set(orgId, new Map());
    }

    const orgUsage = this.usage.get(orgId)!;
    return orgUsage.get(operation) || 0;
  }

  /**
   * Get limit for operation
   */
  async getLimit(orgId: string, operation: string): Promise<number> {
    // For now, all orgs get free tier limits
    // In future, check org subscription level
    const limits = QUOTA_LIMITS.FREE_TIER;

    switch (operation) {
      case 'search':
        return limits.searches;
      case 'code_extraction':
        return limits.codeExtractions;
      case 'brand_scrape':
        return limits.brandScrapes;
      case 'screenshot':
        return limits.screenshots;
      case 'clone_analysis':
        return limits.cloneAnalyses;
      default:
        return 100; // Default limit
    }
  }

  /**
   * Check if operation allowed under quota
   */
  async checkQuota(orgId: string, operation: string): Promise<boolean> {
    const usage = await this.getUsage(orgId, operation);
    const limit = await this.getLimit(orgId, operation);

    const allowed = usage < limit;

    if (!allowed) {
      console.warn(
        `[QuotaManager] Quota exceeded for org ${orgId}, operation ${operation}: ${usage}/${limit}`
      );
    }

    return allowed;
  }

  /**
   * Track usage for operation
   */
  async trackUsage(orgId: string, operation: string, cost: number = 1): Promise<void> {
    if (!this.usage.has(orgId)) {
      this.usage.set(orgId, new Map());
      this.scheduleReset(orgId);
    }

    const orgUsage = this.usage.get(orgId)!;
    const currentUsage = orgUsage.get(operation) || 0;
    const newUsage = currentUsage + cost;

    orgUsage.set(operation, newUsage);

    console.log(
      `[QuotaManager] Tracked usage for org ${orgId}, operation ${operation}: ${newUsage}`
    );

    // TODO: Persist to PocketBase
    // await pb.collection('search_usage').create({
    //   org_id: orgId,
    //   operation,
    //   cost,
    //   timestamp: new Date(),
    // });
  }

  /**
   * Schedule daily reset for organization
   */
  private scheduleReset(orgId: string): void {
    // Clear existing timer
    const existingTimer = this.resetTimers.get(orgId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Calculate time until midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Schedule reset
    const timer = setTimeout(() => {
      this.resetUsage(orgId);
      this.scheduleReset(orgId); // Reschedule for next day
    }, msUntilMidnight);

    this.resetTimers.set(orgId, timer);
    console.log(
      `[QuotaManager] Scheduled reset for org ${orgId} in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`
    );
  }

  /**
   * Reset usage for organization
   */
  async resetUsage(orgId: string): Promise<void> {
    this.usage.delete(orgId);
    console.log(`[QuotaManager] Reset usage for org ${orgId}`);
  }

  /**
   * Get usage statistics for organization
   */
  async getUsageStats(orgId: string): Promise<UsageStats> {
    const orgUsage = this.usage.get(orgId) || new Map();

    const stats: UsageStats = {
      orgId,
      period: {
        start: this.getStartOfDay(),
        end: new Date(),
      },
      searches: {
        total: orgUsage.get('search') || 0,
        successful: 0, // TODO: Track separately
        failed: 0,
        cached: 0,
      },
      tools: {},
      tokens: {
        total: 0,
        embedding: 0,
        llm: 0,
      },
      costs: {
        total: 0, // Always $0 for free tier
        breakdown: {},
      },
    };

    // Populate tool stats
    for (const [operation, count] of orgUsage.entries()) {
      if (operation !== 'search') {
        stats.tools[operation] = {
          calls: count,
          successes: count, // Simplified
          failures: 0,
        };
      }
    }

    return stats;
  }

  /**
   * Get start of current day
   */
  private getStartOfDay(): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  /**
   * Cleanup on shutdown
   */
  cleanup(): void {
    for (const timer of this.resetTimers.values()) {
      clearTimeout(timer);
    }
    this.resetTimers.clear();
    this.usage.clear();
    console.log('[QuotaManager] Cleaned up');
  }
}

// Singleton instance
let quotaManagerInstance: QuotaManager | null = null;

export function getQuotaManager(): QuotaManager {
  if (!quotaManagerInstance) {
    quotaManagerInstance = new QuotaManager();
  }
  return quotaManagerInstance;
}
