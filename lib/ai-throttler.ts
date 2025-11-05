/**
 * AI Request Throttler
 *
 * Throttles AI requests to prevent excessive API calls and rate limiting.
 * Queues requests and processes them sequentially with delays.
 * Inspired by Bolt.new's request management patterns.
 */

export interface ThrottlerConfig {
  minDelay?: number;
  maxConcurrent?: number;
  enabled?: boolean;
}

export interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
}

export class AIRequestThrottler {
  private requestQueue: QueuedRequest<any>[] = [];
  private processing = false;
  private minDelay: number;
  private maxConcurrent: number;
  private enabled: boolean;
  private requestCount = 0;
  private requestHistory: number[] = [];
  private resetInterval = 60000; // 1 minute

  constructor(config: ThrottlerConfig = {}) {
    this.minDelay = config.minDelay || 1000; // 1 second default
    this.maxConcurrent = config.maxConcurrent || 1; // Sequential by default
    this.enabled = config.enabled !== undefined ? config.enabled : true;

    // Reset request count every minute
    setInterval(() => {
      this.cleanupHistory();
    }, this.resetInterval);
  }

  /**
   * Enqueue a request to be executed
   */
  async enqueue<T>(request: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return await request();
    }

    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest<T> = {
        id: this.generateId(),
        execute: request,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.requestQueue.push(queuedRequest);
      this.processQueue();
    });
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;

      try {
        // Wait for minimum delay if needed
        const timeSinceLastRequest = this.getTimeSinceLastRequest();
        if (timeSinceLastRequest < this.minDelay) {
          await this.delay(this.minDelay - timeSinceLastRequest);
        }

        // Execute the request
        const result = await request.execute();

        // Record request
        this.recordRequest();

        // Resolve the promise
        request.resolve(result);
      } catch (error) {
        // Reject the promise
        request.reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Check if requests are being throttled
   */
  isThrottled(): boolean {
    if (!this.enabled) {
      return false;
    }

    return this.requestQueue.length > 0 || this.processing;
  }

  /**
   * Get number of queued requests
   */
  getQueueLength(): number {
    return this.requestQueue.length;
  }

  /**
   * Get request rate (requests per minute)
   */
  getRequestRate(): number {
    this.cleanupHistory();
    return this.requestHistory.length;
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    // Reject all queued requests
    this.requestQueue.forEach((request) => {
      request.reject(new Error('Queue cleared'));
    });

    this.requestQueue = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: ThrottlerConfig): void {
    if (config.minDelay !== undefined) {
      this.minDelay = config.minDelay;
    }
    if (config.maxConcurrent !== undefined) {
      this.maxConcurrent = config.maxConcurrent;
    }
    if (config.enabled !== undefined) {
      this.enabled = config.enabled;
    }
  }

  /**
   * Enable or disable throttling
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    // If disabling, process queue immediately
    if (!enabled && this.requestQueue.length > 0) {
      this.processing = false;
      this.processQueue();
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    queueLength: number;
    processing: boolean;
    requestRate: number;
    totalRequests: number;
    enabled: boolean;
  } {
    return {
      queueLength: this.requestQueue.length,
      processing: this.processing,
      requestRate: this.getRequestRate(),
      totalRequests: this.requestCount,
      enabled: this.enabled,
    };
  }

  /**
   * Record a request
   */
  private recordRequest(): void {
    this.requestCount++;
    this.requestHistory.push(Date.now());
  }

  /**
   * Clean up old history (older than reset interval)
   */
  private cleanupHistory(): void {
    const cutoff = Date.now() - this.resetInterval;
    this.requestHistory = this.requestHistory.filter((time) => time > cutoff);
  }

  /**
   * Get time since last request
   */
  private getTimeSinceLastRequest(): number {
    if (this.requestHistory.length === 0) {
      return Infinity;
    }

    const lastRequestTime = this.requestHistory[this.requestHistory.length - 1];
    return Date.now() - lastRequestTime;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance for global use
let globalThrottler: AIRequestThrottler | null = null;

/**
 * Get or create global AI request throttler
 */
export function getAIThrottler(): AIRequestThrottler {
  if (!globalThrottler) {
    const config: ThrottlerConfig = {
      minDelay: parseInt(process.env.AI_REQUEST_MIN_DELAY || '1000'),
      maxConcurrent: parseInt(process.env.AI_REQUEST_MAX_CONCURRENT || '1'),
      enabled: process.env.ENABLE_AI_THROTTLING !== 'false',
    };
    globalThrottler = new AIRequestThrottler(config);
  }
  return globalThrottler;
}

/**
 * Reset global throttler
 */
export function resetAIThrottler(): void {
  const config: ThrottlerConfig = {
    minDelay: parseInt(process.env.AI_REQUEST_MIN_DELAY || '1000'),
    maxConcurrent: parseInt(process.env.AI_REQUEST_MAX_CONCURRENT || '1'),
    enabled: process.env.ENABLE_AI_THROTTLING !== 'false',
  };
  globalThrottler = new AIRequestThrottler(config);
}
