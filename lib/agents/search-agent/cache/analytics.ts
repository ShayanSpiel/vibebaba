/**
 * SEARCH AGENT - ANALYTICS
 *
 * Track search agent usage and performance
 */

import type { SearchAnalytics } from '../types';

/**
 * Analytics tracker for search agent
 */
export class SearchAnalyticsTracker {
  private analytics: SearchAnalytics[] = [];
  private maxEntries = 10000; // Keep last 10k entries in memory

  /**
   * Track search analytics
   */
  async track(analytics: SearchAnalytics): Promise<void> {
    this.analytics.push(analytics);

    // Trim if exceeds max
    if (this.analytics.length > this.maxEntries) {
      this.analytics = this.analytics.slice(-this.maxEntries);
    }

    console.log(`[Analytics] Tracked search ${analytics.searchId} for org ${analytics.orgId}`);

    // TODO: Persist to PocketBase
    // await pb.collection('search_analytics').create(analytics);
  }

  /**
   * Get analytics for organization
   */
  async getAnalytics(
    orgId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<SearchAnalytics[]> {
    let results = this.analytics.filter((a) => a.orgId === orgId);

    if (options?.startDate) {
      results = results.filter((a) => a.timestamp >= options.startDate!);
    }

    if (options?.endDate) {
      results = results.filter((a) => a.timestamp <= options.endDate!);
    }

    if (options?.limit) {
      results = results.slice(-options.limit);
    }

    return results;
  }

  /**
   * Get aggregated statistics
   */
  async getAggregatedStats(orgId: string): Promise<{
    totalSearches: number;
    successRate: number;
    averageDuration: number;
    topIntents: { intent: string; count: number }[];
    toolUsage: { tool: string; count: number }[];
  }> {
    const orgAnalytics = this.analytics.filter((a) => a.orgId === orgId);

    const totalSearches = orgAnalytics.length;
    const successfulSearches = orgAnalytics.filter((a) => a.success).length;
    const successRate = totalSearches > 0 ? successfulSearches / totalSearches : 0;

    const averageDuration =
      orgAnalytics.reduce((sum, a) => sum + a.duration, 0) / (totalSearches || 1);

    // Top intents
    const intentCounts = new Map<string, number>();
    for (const analytics of orgAnalytics) {
      const count = intentCounts.get(analytics.intent) || 0;
      intentCounts.set(analytics.intent, count + 1);
    }

    const topIntents = Array.from(intentCounts.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Tool usage
    const toolCounts = new Map<string, number>();
    for (const analytics of orgAnalytics) {
      for (const tool of analytics.toolsUsed) {
        const count = toolCounts.get(tool) || 0;
        toolCounts.set(tool, count + 1);
      }
    }

    const toolUsage = Array.from(toolCounts.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalSearches,
      successRate,
      averageDuration,
      topIntents,
      toolUsage,
    };
  }

  /**
   * Clear analytics
   */
  clear(): void {
    this.analytics = [];
    console.log('[Analytics] Cleared all analytics');
  }
}

// Singleton instance
let analyticsTrackerInstance: SearchAnalyticsTracker | null = null;

export function getAnalyticsTracker(): SearchAnalyticsTracker {
  if (!analyticsTrackerInstance) {
    analyticsTrackerInstance = new SearchAnalyticsTracker();
  }
  return analyticsTrackerInstance;
}
