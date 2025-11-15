/**
 * Rate Limit Tracker
 * Tracks rate limits and cooldowns for AI providers
 * Prevents hammering rate-limited APIs
 */

export interface RateLimitInfo {
  provider: string;
  model: string;
  lastRateLimit: number;
  rateLimitCount: number;
  cooldownUntil: number;
  limitType?: 'per-minute' | 'per-day' | 'unknown'; // Track limit type
}

export class RateLimitTracker {
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private readonly baseCooldownMs = 5000; // 5 seconds base cooldown
  private readonly maxCooldownMs = 60000; // 60 seconds max cooldown
  private readonly dailyLimitCooldownMs = 24 * 60 * 60 * 1000; // 24 hours for daily limits

  /**
   * Record a rate limit hit
   */
  recordRateLimit(provider: string, model: string, errorMessage?: string): void {
    const key = `${provider}:${model}`;
    const existing = this.rateLimits.get(key);

    // Detect limit type from error message
    let limitType: 'per-minute' | 'per-day' | 'unknown' = 'unknown';
    let cooldownMs = this.baseCooldownMs;

    if (errorMessage) {
      if (errorMessage.includes('free-models-per-day')) {
        limitType = 'per-day';
        cooldownMs = this.dailyLimitCooldownMs; // 24 hours for daily limits
      } else if (errorMessage.includes('free-models-per-min')) {
        limitType = 'per-minute';
        cooldownMs = 60000; // 1 minute for per-minute limits
      }
    }

    if (existing) {
      // For daily limits, keep 24h cooldown; for minute limits, use exponential backoff
      if (limitType !== 'per-day') {
        const cooldownMultiplier = Math.min(
          2 ** existing.rateLimitCount,
          this.maxCooldownMs / this.baseCooldownMs
        );
        cooldownMs = this.baseCooldownMs * cooldownMultiplier;
      }

      this.rateLimits.set(key, {
        provider,
        model,
        lastRateLimit: Date.now(),
        rateLimitCount: existing.rateLimitCount + 1,
        cooldownUntil: Date.now() + cooldownMs,
        limitType,
      });

      console.log(
        `[Rate Limit] ${provider}/${model} rate limited (${limitType}). Count: ${existing.rateLimitCount + 1}, Cooldown: ${Math.ceil(cooldownMs / 1000)}s`
      );
    } else {
      this.rateLimits.set(key, {
        provider,
        model,
        lastRateLimit: Date.now(),
        rateLimitCount: 1,
        cooldownUntil: Date.now() + cooldownMs,
        limitType,
      });

      console.log(
        `[Rate Limit] ${provider}/${model} rate limited (${limitType}). First occurrence, Cooldown: ${Math.ceil(cooldownMs / 1000)}s`
      );
    }
  }

  /**
   * Check if a provider/model is currently rate limited
   */
  isRateLimited(provider: string, model: string): boolean {
    const key = `${provider}:${model}`;
    const info = this.rateLimits.get(key);

    if (!info) {
      return false;
    }

    const now = Date.now();
    if (now < info.cooldownUntil) {
      const remainingMs = info.cooldownUntil - now;
      console.log(
        `[Rate Limit] ${provider}/${model} still in cooldown. Remaining: ${Math.ceil(remainingMs / 1000)}s`
      );
      return true;
    }

    // Cooldown expired, clear it
    this.rateLimits.delete(key);
    console.log(`[Rate Limit] ${provider}/${model} cooldown expired. Available again.`);
    return false;
  }

  /**
   * Get cooldown time remaining in milliseconds
   */
  getCooldownRemaining(provider: string, model: string): number {
    const key = `${provider}:${model}`;
    const info = this.rateLimits.get(key);

    if (!info) {
      return 0;
    }

    const now = Date.now();
    return Math.max(0, info.cooldownUntil - now);
  }

  /**
   * Check if a provider has any rate-limited models
   */
  isProviderRateLimited(provider: string): boolean {
    for (const [key, info] of this.rateLimits.entries()) {
      if (info.provider === provider && Date.now() < info.cooldownUntil) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get rate limit statistics
   */
  getStats(): {
    totalRateLimits: number;
    activeRateLimits: number;
    providers: Record<string, number>;
  } {
    const now = Date.now();
    let activeCount = 0;
    const providerCounts: Record<string, number> = {};

    for (const info of this.rateLimits.values()) {
      if (now < info.cooldownUntil) {
        activeCount++;
      }

      providerCounts[info.provider] = (providerCounts[info.provider] || 0) + 1;
    }

    return {
      totalRateLimits: this.rateLimits.size,
      activeRateLimits: activeCount,
      providers: providerCounts,
    };
  }

  /**
   * Clear all rate limits (use carefully!)
   */
  clearAll(): void {
    this.rateLimits.clear();
    console.log('[Rate Limit] All rate limits cleared');
  }

  /**
   * Clear rate limits for a specific provider
   */
  clearProvider(provider: string): void {
    const keys = Array.from(this.rateLimits.keys()).filter((key) => key.startsWith(`${provider}:`));
    keys.forEach((key) => this.rateLimits.delete(key));
    console.log(`[Rate Limit] Cleared ${keys.length} rate limits for ${provider}`);
  }

  /**
   * Get all rate-limited models
   */
  getRateLimitedModels(): RateLimitInfo[] {
    const now = Date.now();
    return Array.from(this.rateLimits.values()).filter((info) => now < info.cooldownUntil);
  }

  /**
   * Wait for cooldown if rate limited
   */
  async waitForCooldown(provider: string, model: string): Promise<void> {
    const remaining = this.getCooldownRemaining(provider, model);
    if (remaining > 0) {
      console.log(
        `[Rate Limit] Waiting ${Math.ceil(remaining / 1000)}s for ${provider}/${model} cooldown...`
      );
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }
}

// Singleton instance for global use
let globalRateLimitTracker: RateLimitTracker | null = null;

/**
 * Get or create global rate limit tracker
 */
export function getRateLimitTracker(): RateLimitTracker {
  if (!globalRateLimitTracker) {
    globalRateLimitTracker = new RateLimitTracker();
  }
  return globalRateLimitTracker;
}

/**
 * Reset global rate limit tracker
 */
export function resetRateLimitTracker(): void {
  globalRateLimitTracker = new RateLimitTracker();
}
