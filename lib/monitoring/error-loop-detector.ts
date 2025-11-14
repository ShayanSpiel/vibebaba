/**
 * Error Loop Detector
 *
 * Prevents infinite error-fix loops by tracking error attempts and
 * stopping repeated failed attempts.
 * Inspired by Bolt.new's error prevention patterns.
 */

export interface ErrorAttempt {
  error: string;
  errorHash: string;
  attemptNumber: number;
  timestamp: number;
  solution: string;
  endpoint: string;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface ErrorLoopConfig {
  maxAttempts?: number;
  timeWindow?: number;
  enabled?: boolean;
}

export class ErrorLoopDetector {
  private errorHistory: Map<string, ErrorAttempt[]> = new Map();
  private maxAttempts: number;
  private timeWindow: number;
  private enabled: boolean;

  constructor(config: ErrorLoopConfig = {}) {
    this.maxAttempts = config.maxAttempts || 3;
    this.timeWindow = config.timeWindow || 60000; // 1 minute default
    this.enabled = config.enabled !== undefined ? config.enabled : true;
  }

  /**
   * Record an error attempt
   * Returns false if max attempts exceeded, true otherwise
   */
  recordError(
    error: string,
    solution: string,
    endpoint: string,
    success: boolean = false,
    metadata?: Record<string, any>
  ): boolean {
    if (!this.enabled) {
      return true;
    }

    const errorHash = this.normalizeError(error);
    const history = this.errorHistory.get(errorHash) || [];

    // Clean old attempts outside time window
    const recentAttempts = this.filterRecentAttempts(history);

    const attempt: ErrorAttempt = {
      error,
      errorHash,
      attemptNumber: recentAttempts.length + 1,
      timestamp: Date.now(),
      solution,
      endpoint,
      success,
      metadata,
    };

    recentAttempts.push(attempt);
    this.errorHistory.set(errorHash, recentAttempts);

    // If this attempt was successful, clear the history
    if (success) {
      this.clearHistory(errorHash);
      return true;
    }

    // Check if we've exceeded max attempts
    return recentAttempts.length < this.maxAttempts;
  }

  /**
   * Check if we can attempt to fix this error
   */
  canAttempt(error: string): boolean {
    if (!this.enabled) {
      return true;
    }

    const errorHash = this.normalizeError(error);
    const history = this.errorHistory.get(errorHash) || [];
    const recentAttempts = this.filterRecentAttempts(history);

    return recentAttempts.length < this.maxAttempts;
  }

  /**
   * Get attempt history for an error
   */
  getHistory(error: string): ErrorAttempt[] {
    const errorHash = this.normalizeError(error);
    const history = this.errorHistory.get(errorHash) || [];
    return this.filterRecentAttempts(history);
  }

  /**
   * Get all error hashes currently being tracked
   */
  getAllErrorHashes(): string[] {
    return Array.from(this.errorHistory.keys());
  }

  /**
   * Get total attempt count for an error
   */
  getAttemptCount(error: string): number {
    return this.getHistory(error).length;
  }

  /**
   * Check if an error loop has been detected
   */
  isLoopDetected(error: string): boolean {
    if (!this.enabled) {
      return false;
    }

    const history = this.getHistory(error);
    return history.length >= this.maxAttempts;
  }

  /**
   * Clear history for a specific error or all errors
   */
  clearHistory(errorHash?: string): void {
    if (errorHash) {
      this.errorHistory.delete(errorHash);
    } else {
      this.errorHistory.clear();
    }
  }

  /**
   * Get statistics about error tracking
   */
  getStats(): {
    totalErrors: number;
    totalAttempts: number;
    loopsDetected: number;
    mostAttempted: { errorHash: string; attempts: number } | null;
  } {
    let totalAttempts = 0;
    let loopsDetected = 0;
    let mostAttempted: { errorHash: string; attempts: number } | null = null;

    for (const [errorHash, history] of this.errorHistory.entries()) {
      const recentAttempts = this.filterRecentAttempts(history);
      totalAttempts += recentAttempts.length;

      if (recentAttempts.length >= this.maxAttempts) {
        loopsDetected++;
      }

      if (!mostAttempted || recentAttempts.length > mostAttempted.attempts) {
        mostAttempted = { errorHash, attempts: recentAttempts.length };
      }
    }

    return {
      totalErrors: this.errorHistory.size,
      totalAttempts,
      loopsDetected,
      mostAttempted,
    };
  }

  /**
   * Get human-readable error summary
   */
  getErrorSummary(error: string): string {
    const history = this.getHistory(error);

    if (history.length === 0) {
      return 'No attempts recorded for this error.';
    }

    const attemptCount = history.length;
    const endpoints = [...new Set(history.map((h) => h.endpoint))];
    const lastAttempt = history[history.length - 1];

    return `
Error has been attempted ${attemptCount} time(s).
Endpoints tried: ${endpoints.join(', ')}
Last attempt: ${new Date(lastAttempt.timestamp).toLocaleString()}
${this.isLoopDetected(error) ? '⚠️  Error loop detected - max attempts reached!' : ''}
    `.trim();
  }

  /**
   * Update configuration
   */
  updateConfig(config: ErrorLoopConfig): void {
    if (config.maxAttempts !== undefined) {
      this.maxAttempts = config.maxAttempts;
    }
    if (config.timeWindow !== undefined) {
      this.timeWindow = config.timeWindow;
    }
    if (config.enabled !== undefined) {
      this.enabled = config.enabled;
    }
  }

  /**
   * Enable or disable error loop detection
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Filter attempts within the time window
   */
  private filterRecentAttempts(attempts: ErrorAttempt[]): ErrorAttempt[] {
    const now = Date.now();
    return attempts.filter(
      (attempt) => now - attempt.timestamp < this.timeWindow
    );
  }

  /**
   * Normalize error message for comparison
   * Removes variable data like file paths, line numbers, timestamps
   */
  private normalizeError(error: string): string {
    return (
      error
        // Remove line:column references
        .replace(/:\d+:\d+/g, ':X:X')
        // Remove file paths (both Unix and Windows)
        .replace(/\/[\w\-./]+\//g, '/')
        .replace(/[A-Z]:\\[\w\-\\]+\\/g, '/')
        // Remove timestamps
        .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP')
        .replace(/\d{13}/g, 'TIMESTAMP')
        // Remove memory addresses
        .replace(/0x[0-9a-fA-F]+/g, '0xADDR')
        // Remove specific numbers (versions, counts, etc.)
        .replace(/\d+/g, 'N')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Convert to lowercase
        .toLowerCase()
        .trim()
    );
  }
}

// Singleton instance for global use
let globalErrorDetector: ErrorLoopDetector | null = null;

/**
 * Get or create global error loop detector instance
 */
export function getErrorLoopDetector(): ErrorLoopDetector {
  if (!globalErrorDetector) {
    const config: ErrorLoopConfig = {
      maxAttempts: parseInt(process.env.MAX_ERROR_ATTEMPTS || '3'),
      timeWindow: parseInt(process.env.ERROR_LOOP_TIME_WINDOW || '60000'),
      enabled: process.env.ENABLE_ERROR_LOOP_DETECTION !== 'false',
    };
    globalErrorDetector = new ErrorLoopDetector(config);
  }
  return globalErrorDetector;
}

/**
 * Reset global error loop detector
 */
export function resetErrorLoopDetector(): void {
  const config: ErrorLoopConfig = {
    maxAttempts: parseInt(process.env.MAX_ERROR_ATTEMPTS || '3'),
    timeWindow: parseInt(process.env.ERROR_LOOP_TIME_WINDOW || '60000'),
    enabled: process.env.ENABLE_ERROR_LOOP_DETECTION !== 'false',
  };
  globalErrorDetector = new ErrorLoopDetector(config);
}
