/**
 * VALIDATION ERROR LOGGING SERVICE
 *
 * Logs validation errors to PocketBase for admin dashboard tracking
 * Also maintains in-memory cache for faster access
 */

import type { ValidationError } from '@/lib/langgraph/validation/post-gen/types';
import PocketBase from 'pocketbase';

// Use the deployment server PocketBase instance
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

// In-memory cache for validation data (for faster access)
const validationErrorsStore: ValidationErrorLog[] = [];
const validationSessionsStore: ValidationSessionLog[] = [];

// Max items to keep in memory (prevent memory leaks)
const MAX_ERRORS = 1000;
const MAX_SESSIONS = 100;

export interface ValidationErrorLog {
  id?: string;
  projectId: string;
  userId: string;
  endpoint: string; // Which API endpoint generated the error
  errorType: 'structure' | 'html' | 'css' | 'javascript' | 'placeholder' | 'multi-page';
  severity: 'error' | 'warning';
  rule: string;
  file: string;
  line: number;
  column?: number;
  message: string;
  suggestion?: string;
  context?: string;
  autoFixable: boolean;
  isFixed: boolean; // Whether it was auto-fixed
  attemptNumber: number; // Which generation attempt (1-3 for debugging engine)
  aiModel?: string;
  aiProvider?: string;
  filesGenerated: number;
  totalErrors: number;
  totalWarnings: number;
  timestamp?: string;
  durationMs?: number; // Time taken to process/fix
  created?: string;
  updated?: string;
}

export interface ValidationSessionLog {
  id?: string;
  projectId: string;
  userId: string;
  endpoint: string;
  sessionType: 'generation' | 'debug_attempt';
  attemptNumber: number;
  totalFiles: number;
  totalErrors: number;
  totalWarnings: number;
  totalFixed: number;
  wasSuccessful: boolean;
  aiModel?: string;
  aiProvider?: string;
  errorSummary: Record<string, number>; // rule -> count
  timestamp?: string;
  durationMs?: number; // Total session duration
  fullLog?: string; // Complete log output
  created?: string;
  updated?: string;
}

/**
 * Log a single validation error
 */
export async function logValidationError(
  error: ValidationError,
  context: {
    projectId: string;
    userId: string;
    endpoint: string;
    attemptNumber: number;
    totalErrors: number;
    totalWarnings: number;
    filesGenerated: number;
    isFixed?: boolean;
    aiModel?: string;
    aiProvider?: string;
    durationMs?: number;
  }
): Promise<void> {
  const startTime = Date.now();
  try {
    const timestamp = new Date().toISOString();
    const errorLog: ValidationErrorLog = {
      projectId: context.projectId,
      userId: context.userId,
      endpoint: context.endpoint,
      errorType: categorizeError(error.rule),
      severity: error.severity,
      rule: error.rule,
      file: error.file,
      line: error.line,
      column: error.column,
      message: error.message,
      suggestion: error.suggestion,
      context: error.context,
      autoFixable: error.autoFixable,
      isFixed: context.isFixed || false,
      attemptNumber: context.attemptNumber,
      aiModel: context.aiModel,
      aiProvider: context.aiProvider,
      filesGenerated: context.filesGenerated,
      totalErrors: context.totalErrors,
      totalWarnings: context.totalWarnings,
      timestamp,
      durationMs: context.durationMs,
    };

    // Save to PocketBase - skip for now, use in-memory only until schema is fixed
    // TODO: Re-enable once PocketBase schema has all required fields
    errorLog.id = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add to in-memory cache
    validationErrorsStore.unshift(errorLog); // Add to beginning

    // Trim if exceeded max
    if (validationErrorsStore.length > MAX_ERRORS) {
      validationErrorsStore.length = MAX_ERRORS;
    }

    const logTime = Date.now() - startTime;
    console.log(`[ValidationLogger] ✅ Logged error: ${error.rule} in ${error.file}:${error.line} (${logTime}ms)`);
  } catch (err) {
    console.error('[ValidationLogger] Failed to log error:', err);
    // Don't throw - logging failure shouldn't break the app
  }
}

/**
 * Log multiple validation errors in batch
 */
export async function logValidationErrors(
  errors: ValidationError[],
  context: {
    projectId: string;
    userId: string;
    endpoint: string;
    attemptNumber: number;
    totalErrors: number;
    totalWarnings: number;
    filesGenerated: number;
    fixedRules?: string[];
    aiModel?: string;
    aiProvider?: string;
  }
): Promise<void> {
  try {
    const fixedSet = new Set(context.fixedRules || []);

    // Log errors in parallel for performance
    await Promise.all(
      errors.map(error =>
        logValidationError(error, {
          ...context,
          isFixed: fixedSet.has(error.rule),
        })
      )
    );
  } catch (err) {
    console.error('[ValidationLogger] Failed to log errors:', err);
  }
}

/**
 * Log a validation session (summary of entire validation attempt)
 */
export async function logValidationSession(
  session: Omit<ValidationSessionLog, 'id' | 'created' | 'updated'>
): Promise<void> {
  const startTime = Date.now();
  try {
    const timestamp = session.timestamp || new Date().toISOString();
    const sessionLog: ValidationSessionLog = {
      ...session,
      timestamp,
    };

    // Save to PocketBase - skip for now, use in-memory only until schema is fixed
    // TODO: Re-enable once PocketBase schema has all required fields
    sessionLog.id = `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add to in-memory cache
    validationSessionsStore.unshift(sessionLog);

    // Trim if exceeded max
    if (validationSessionsStore.length > MAX_SESSIONS) {
      validationSessionsStore.length = MAX_SESSIONS;
    }

    const logTime = Date.now() - startTime;
    console.log(`[ValidationLogger] ✅ Logged session: ${session.sessionType} attempt ${session.attemptNumber} (${logTime}ms)`);
  } catch (err) {
    console.error('[ValidationLogger] Failed to log session:', err);
  }
}

/**
 * Get all stored validation errors
 */
export function getAllValidationErrors(): ValidationErrorLog[] {
  return [...validationErrorsStore]; // Return copy
}

/**
 * Get all stored validation sessions
 */
export function getAllValidationSessions(): ValidationSessionLog[] {
  return [...validationSessionsStore]; // Return copy
}

/**
 * Get validation error statistics for a project
 */
export async function getProjectValidationStats(projectId: string) {
  try {
    const errors = validationErrorsStore.filter(e => e.projectId === projectId);
    const sessions = validationSessionsStore.filter(s => s.projectId === projectId);

    return {
      totalErrors: errors.filter(e => e.severity === 'error').length,
      totalWarnings: errors.filter(e => e.severity === 'warning').length,
      totalFixed: errors.filter(e => e.isFixed).length,
      totalSessions: sessions.length,
      successfulSessions: sessions.filter(s => s.wasSuccessful).length,
      mostCommonErrors: getMostCommonErrors(errors),
      errorsByType: groupBy(errors, 'errorType'),
      recentErrors: errors.slice(0, 10),
    };
  } catch (err) {
    console.error('[ValidationLogger] Failed to get stats:', err);
    return null;
  }
}

/**
 * Get all validation errors with pagination and filters
 */
export async function getValidationErrors(options: {
  page?: number;
  perPage?: number;
  projectId?: string;
  userId?: string;
  severity?: 'error' | 'warning';
  errorType?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const {
      page = 1,
      perPage = 50,
      projectId,
      userId,
      severity,
      errorType,
      startDate,
      endDate,
    } = options;

    // Try to fetch from PocketBase first
    try {
      const filters: string[] = [];
      if (projectId) filters.push(`project_id = "${projectId}"`);
      if (userId) filters.push(`user_id = "${userId}"`);
      if (severity) filters.push(`severity = "${severity}"`);
      if (errorType) filters.push(`error_type = "${errorType}"`);
      if (startDate) filters.push(`timestamp >= "${startDate}"`);
      if (endDate) filters.push(`timestamp <= "${endDate}"`);

      const filterStr = filters.length > 0 ? filters.join(' && ') : '';

      const result = await pb.collection('validation_errors').getList(page, perPage, {
        filter: filterStr,
        sort: '-timestamp',
      });

      return {
        items: result.items.map(convertPbErrorToLog),
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      };
    } catch (pbErr) {
      console.warn('[ValidationLogger] Failed to fetch from PocketBase, using in-memory cache:', pbErr);

      // Fallback to in-memory data
      let filtered = [...validationErrorsStore];

      if (projectId) filtered = filtered.filter(e => e.projectId === projectId);
      if (userId) filtered = filtered.filter(e => e.userId === userId);
      if (severity) filtered = filtered.filter(e => e.severity === severity);
      if (errorType) filtered = filtered.filter(e => e.errorType === errorType);
      if (startDate) filtered = filtered.filter(e => e.timestamp && e.timestamp >= startDate);
      if (endDate) filtered = filtered.filter(e => e.timestamp && e.timestamp <= endDate);

      // Paginate
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const items = filtered.slice(start, end);

      return {
        items,
        page,
        perPage,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / perPage),
      };
    }
  } catch (err) {
    console.error('[ValidationLogger] Failed to get errors:', err);
    return null;
  }
}

/**
 * Get validation sessions with pagination and filters
 */
export async function getValidationSessions(options: {
  page?: number;
  perPage?: number;
  projectId?: string;
  userId?: string;
  wasSuccessful?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const {
      page = 1,
      perPage = 50,
      projectId,
      userId,
      wasSuccessful,
      startDate,
      endDate,
    } = options;

    // Try to fetch from PocketBase first
    try {
      const filters: string[] = [];
      if (projectId) filters.push(`project_id = "${projectId}"`);
      if (userId) filters.push(`user_id = "${userId}"`);
      if (wasSuccessful !== undefined) filters.push(`was_successful = ${wasSuccessful}`);
      if (startDate) filters.push(`timestamp >= "${startDate}"`);
      if (endDate) filters.push(`timestamp <= "${endDate}"`);

      const filterStr = filters.length > 0 ? filters.join(' && ') : '';

      const result = await pb.collection('validation_sessions').getList(page, perPage, {
        filter: filterStr,
        sort: '-timestamp',
      });

      return {
        items: result.items.map(convertPbSessionToLog),
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      };
    } catch (pbErr) {
      console.warn('[ValidationLogger] Failed to fetch sessions from PocketBase, using in-memory cache:', pbErr);

      // Fallback to in-memory data
      let filtered = [...validationSessionsStore];

      if (projectId) filtered = filtered.filter(s => s.projectId === projectId);
      if (userId) filtered = filtered.filter(s => s.userId === userId);
      if (wasSuccessful !== undefined) filtered = filtered.filter(s => s.wasSuccessful === wasSuccessful);
      if (startDate) filtered = filtered.filter(s => s.timestamp && s.timestamp >= startDate);
      if (endDate) filtered = filtered.filter(s => s.timestamp && s.timestamp <= endDate);

      // Paginate
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const items = filtered.slice(start, end);

      return {
        items,
        page,
        perPage,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / perPage),
      };
    }
  } catch (err) {
    console.error('[ValidationLogger] Failed to get sessions:', err);
    return null;
  }
}

/**
 * Helper: Categorize error by rule name
 */
function categorizeError(rule: string): ValidationErrorLog['errorType'] {
  if (rule.includes('doctype') || rule.includes('link') || rule.includes('tag-pair') || rule.includes('extension')) {
    return 'structure';
  }
  if (rule.includes('hash-routing') || rule.includes('multipage')) {
    return 'multi-page';
  }
  if (rule.startsWith('html-')) {
    return 'html';
  }
  if (rule.startsWith('css-')) {
    return 'css';
  }
  if (rule.startsWith('js-')) {
    return 'javascript';
  }
  if (rule.includes('placeholder')) {
    return 'placeholder';
  }
  return 'structure';
}

/**
 * Helper: Get most common errors
 */
function getMostCommonErrors(errors: any[]): Array<{ rule: string; count: number }> {
  const counts: Record<string, number> = {};
  errors.forEach(e => {
    counts[e.rule] = (counts[e.rule] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Helper: Group by property
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Helper: Convert PocketBase error record to ValidationErrorLog
 */
function convertPbErrorToLog(record: any): ValidationErrorLog {
  return {
    id: record.id,
    projectId: record.project_id,
    userId: record.user_id,
    endpoint: record.endpoint,
    errorType: record.error_type,
    severity: record.severity,
    rule: record.rule,
    file: record.file,
    line: record.line,
    column: record.column,
    message: record.message,
    suggestion: record.suggestion,
    context: record.context,
    autoFixable: record.auto_fixable,
    isFixed: record.is_fixed,
    attemptNumber: record.attempt_number,
    aiModel: record.ai_model,
    aiProvider: record.ai_provider,
    filesGenerated: record.files_generated,
    totalErrors: record.total_errors,
    totalWarnings: record.total_warnings,
    timestamp: record.timestamp,
    durationMs: record.duration_ms,
    created: record.created,
    updated: record.updated,
  };
}

/**
 * Helper: Convert PocketBase session record to ValidationSessionLog
 */
function convertPbSessionToLog(record: any): ValidationSessionLog {
  return {
    id: record.id,
    projectId: record.project_id,
    userId: record.user_id,
    endpoint: record.endpoint,
    sessionType: record.session_type,
    attemptNumber: record.attempt_number,
    totalFiles: record.total_files,
    totalErrors: record.total_errors,
    totalWarnings: record.total_warnings,
    totalFixed: record.total_fixed,
    wasSuccessful: record.was_successful,
    aiModel: record.ai_model,
    aiProvider: record.ai_provider,
    errorSummary: record.error_summary,
    timestamp: record.timestamp,
    durationMs: record.duration_ms,
    fullLog: record.full_log,
    created: record.created,
    updated: record.updated,
  };
}
