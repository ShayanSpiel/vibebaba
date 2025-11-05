/**
 * PocketBase Utility Functions
 * Provides safe filter escaping and other utilities for PocketBase operations
 */

/**
 * Escapes special characters in filter values to prevent filter injection
 * Similar to SQL injection, PocketBase filters can be manipulated if not properly escaped
 *
 * @param value - The value to escape
 * @returns Escaped value safe for use in PocketBase filters
 */
export function escapeFilterValue(value: string): string {
  if (typeof value !== 'string') {
    return String(value);
  }

  // Escape quotes and backslashes
  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/'/g, "\\'");    // Escape single quotes
}

/**
 * Creates a safe filter string with escaped values
 *
 * @param field - The field name
 * @param operator - The comparison operator (=, !=, >, <, etc.)
 * @param value - The value to compare
 * @returns Safe filter string
 */
export function createSafeFilter(field: string, operator: string, value: string | number | boolean): string {
  // Validate field name (alphanumeric and underscore only)
  if (!/^[a-zA-Z0-9_]+$/.test(field)) {
    throw new Error(`Invalid field name: ${field}`);
  }

  // Validate operator
  const validOperators = ['=', '!=', '>', '<', '>=', '<=', '~', '!~'];
  if (!validOperators.includes(operator)) {
    throw new Error(`Invalid operator: ${operator}`);
  }

  // Handle different value types
  if (typeof value === 'string') {
    return `${field} ${operator} "${escapeFilterValue(value)}"`;
  } else if (typeof value === 'number') {
    return `${field} ${operator} ${value}`;
  } else if (typeof value === 'boolean') {
    return `${field} ${operator} ${value}`;
  }

  throw new Error(`Unsupported value type: ${typeof value}`);
}

/**
 * Combines multiple filters with AND/OR logic
 *
 * @param filters - Array of filter strings
 * @param operator - Logic operator ('&&' for AND, '||' for OR)
 * @returns Combined filter string
 */
export function combineFilters(filters: string[], operator: '&&' | '||' = '&&'): string {
  return `(${filters.join(` ${operator} `)})`;
}

/**
 * Validates and sanitizes collection name to prevent injection
 *
 * @param collection - Collection name to validate
 * @returns Valid collection name
 * @throws Error if collection name is invalid
 */
export function validateCollectionName(collection: string): string {
  // Collection names should be alphanumeric with underscores
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(collection)) {
    throw new Error(`Invalid collection name: ${collection}`);
  }

  // Prevent reserved/system collections
  const reservedCollections = ['_superusers', '_admins', '_collections'];
  if (reservedCollections.includes(collection)) {
    throw new Error(`Cannot access system collection: ${collection}`);
  }

  return collection;
}

/**
 * Safely parses and validates record ID
 *
 * @param id - Record ID to validate
 * @returns Valid record ID
 * @throws Error if ID is invalid
 */
export function validateRecordId(id: string): string {
  // PocketBase IDs are 15-character alphanumeric strings
  if (!/^[a-zA-Z0-9]{15}$/.test(id)) {
    throw new Error(`Invalid record ID format: ${id}`);
  }

  return id;
}

/**
 * Rate limiter for preventing abuse
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private windowMs: number = 60000,  // 1 minute default
    private maxRequests: number = 10    // 10 requests default
  ) {}

  /**
   * Check if request should be allowed
   *
   * @param identifier - Unique identifier (user ID, IP, etc.)
   * @returns true if within limits, false if rate limited
   */
  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];

    // Filter out old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);

    return true;
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clean up old entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [identifier, requests] of this.requests.entries()) {
      const activeRequests = requests.filter(timestamp => timestamp > windowStart);

      if (activeRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, activeRequests);
      }
    }
  }
}

/**
 * Sanitize error messages for production
 *
 * @param error - The error object
 * @param isDevelopment - Whether running in development mode
 * @returns Safe error message
 */
export function sanitizeError(error: any, isDevelopment: boolean = process.env.NODE_ENV === 'development'): string {
  if (isDevelopment) {
    return error.message || 'An error occurred';
  }

  // Production: return generic messages based on error type
  const safeMessages: Record<string, string> = {
    'SQLITE_CONSTRAINT': 'Database constraint violation',
    'UNIQUE constraint failed': 'Record already exists',
    'FOREIGN KEY constraint failed': 'Invalid reference',
    'NOT NULL constraint failed': 'Required field missing',
    'Unauthorized': 'Authentication required',
    'Forbidden': 'Insufficient permissions',
    'Not Found': 'Resource not found',
  };

  // Check for known error patterns
  const errorMessage = error.message || '';
  for (const [pattern, safeMessage] of Object.entries(safeMessages)) {
    if (errorMessage.includes(pattern)) {
      return safeMessage;
    }
  }

  // Default generic message
  return 'An error occurred. Please try again later.';
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string, allowedDomains?: string[]): boolean {
  try {
    const parsed = new URL(url);

    // Check protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Check domain whitelist if provided
    if (allowedDomains && allowedDomains.length > 0) {
      return allowedDomains.some(domain => parsed.hostname.endsWith(domain));
    }

    return true;
  } catch {
    return false;
  }
}
