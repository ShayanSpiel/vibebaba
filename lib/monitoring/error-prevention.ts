/**
 * Error Loop Prevention Utilities (inspired by Bolt.new)
 *
 * Provides mechanisms to prevent infinite loops and errors:
 * - Retry limiting with exponential backoff
 * - Circuit breaker pattern
 * - Error deduplication
 * - Rate limiting
 * - Timeout management
 */

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = config;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      console.warn(`[ErrorPrevention] Attempt ${attempt}/${maxAttempts} failed:`, error);

      // Check if we should retry
      if (attempt < maxAttempts && shouldRetry(error, attempt)) {
        console.log(`[ErrorPrevention] Retrying in ${delay}ms...`);
        await sleep(delay);

        // Exponential backoff
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      } else {
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Circuit breaker to prevent cascading failures
 */
export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private successes: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      resetTimeout: config.resetTimeout || 60000, // 1 minute
      monitoringPeriod: config.monitoringPeriod || 10000, // 10 seconds
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure >= this.config.resetTimeout) {
        console.log('[CircuitBreaker] Attempting to close circuit (half-open)');
        this.state = 'half-open';
        this.successes = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - operation blocked');
      }
    }

    try {
      const result = await operation();

      // Success
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === 'half-open') {
      this.successes++;

      // After 2 successes in half-open state, close circuit
      if (this.successes >= 2) {
        console.log('[CircuitBreaker] Circuit CLOSED');
        this.state = 'closed';
        this.successes = 0;
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      console.warn('[CircuitBreaker] Failure in half-open state - reopening circuit');
      this.state = 'open';
      this.successes = 0;
    } else if (this.failures >= this.config.failureThreshold) {
      console.error(`[CircuitBreaker] Failure threshold reached (${this.failures}) - opening circuit`);
      this.state = 'open';
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Error deduplicator to prevent logging same error repeatedly
 */
export class ErrorDeduplicator {
  private errorCache: Map<string, { count: number; firstSeen: number; lastSeen: number }> = new Map();
  private readonly cacheTimeout: number;

  constructor(cacheTimeout: number = 60000) {
    this.cacheTimeout = cacheTimeout;
  }

  /**
   * Check if error is duplicate (returns true if it should be logged)
   */
  shouldLog(error: Error | string, context?: string): boolean {
    const errorKey = this.getErrorKey(error, context);
    const now = Date.now();

    const cached = this.errorCache.get(errorKey);

    if (cached) {
      // Update existing entry
      cached.count++;
      cached.lastSeen = now;

      // Only log every 10th occurrence after first
      const shouldLog = cached.count === 1 || cached.count % 10 === 0;

      if (shouldLog) {
        console.log(`[ErrorDedup] Error occurred ${cached.count} times in ${(now - cached.firstSeen) / 1000}s`);
      }

      return shouldLog;
    } else {
      // New error
      this.errorCache.set(errorKey, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
      });

      // Clean up old entries
      this.cleanup();

      return true;
    }
  }

  private getErrorKey(error: Error | string, context?: string): string {
    const message = typeof error === 'string' ? error : error.message;
    return context ? `${context}:${message}` : message;
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.errorCache.entries()) {
      if (now - entry.lastSeen > this.cacheTimeout) {
        this.errorCache.delete(key);
      }
    }
  }

  clear(): void {
    this.errorCache.clear();
  }
}

/**
 * Rate limiter to prevent excessive requests
 */
export class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequests: config.maxRequests || 10,
      windowMs: config.windowMs || 60000, // 1 minute
    };
  }

  /**
   * Check if request is allowed
   */
  isAllowed(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove old requests outside window
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);

    // Check if under limit
    if (this.requests.length < this.config.maxRequests) {
      this.requests.push(now);
      return true;
    }

    console.warn(`[RateLimiter] Rate limit exceeded: ${this.requests.length}/${this.config.maxRequests} requests in ${this.config.windowMs}ms`);
    return false;
  }

  /**
   * Get time until next allowed request
   */
  getTimeUntilNextRequest(): number {
    if (this.requests.length < this.config.maxRequests) {
      return 0;
    }

    const oldestRequest = this.requests[0];
    const windowStart = Date.now() - this.config.windowMs;

    return Math.max(0, oldestRequest - windowStart);
  }

  reset(): void {
    this.requests = [];
  }
}

/**
 * Timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function to prevent rapid-fire calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastRun: number = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun >= limitMs) {
      func(...args);
      lastRun = now;
    }
  };
}

/**
 * Execution guard to prevent duplicate concurrent executions
 */
export class ExecutionGuard {
  private executing: Set<string> = new Set();

  /**
   * Execute operation if not already running
   */
  async execute<T>(key: string, operation: () => Promise<T>): Promise<T | null> {
    if (this.executing.has(key)) {
      console.warn(`[ExecutionGuard] Operation ${key} already executing, skipping`);
      return null;
    }

    this.executing.add(key);

    try {
      return await operation();
    } finally {
      this.executing.delete(key);
    }
  }

  isExecuting(key: string): boolean {
    return this.executing.has(key);
  }

  clear(): void {
    this.executing.clear();
  }
}

/**
 * Error boundary for async operations
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T,
  onError?: (error: any) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('[SafeExecute] Operation failed:', error);

    if (onError) {
      try {
        onError(error);
      } catch (handlerError) {
        console.error('[SafeExecute] Error handler failed:', handlerError);
      }
    }

    return fallback;
  }
}

// Global instances
export const globalCircuitBreaker = new CircuitBreaker();
export const globalErrorDeduplicator = new ErrorDeduplicator();
export const globalRateLimiter = new RateLimiter({ maxRequests: 100, windowMs: 60000 });
export const globalExecutionGuard = new ExecutionGuard();
