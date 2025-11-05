/**
 * Error Context Enrichment
 *
 * Provides enriched context for errors to improve AI suggestion quality.
 * Includes file history, recent changes, and previous fix attempts.
 * Inspired by Bolt.new's context-aware error handling.
 */

import { FileTracker, FileChange } from './file-tracker';
import { ErrorLoopDetector, ErrorAttempt } from './error-loop-detector';

export interface ErrorContext {
  error: string;
  errorType?: 'syntax' | 'runtime' | 'compile' | 'unknown';
  relevantFiles: string[];
  recentChanges: FileChange[];
  previousAttempts: ErrorAttempt[];
  userContext?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface EnrichedPrompt {
  originalPrompt: string;
  enrichedPrompt: string;
  context: ErrorContext;
}

/**
 * Enrich error with contextual information
 */
export async function enrichErrorContext(
  error: string,
  projectFiles: Array<{ path: string; content: string }>,
  fileTracker?: FileTracker,
  errorDetector?: ErrorLoopDetector,
  userContext?: string
): Promise<ErrorContext> {
  const errorType = detectErrorType(error);
  const relevantFiles = findRelevantFiles(error, projectFiles);
  const recentChanges = fileTracker ? fileTracker.getRecentChanges(300000) : [];
  const previousAttempts = errorDetector ? errorDetector.getHistory(error) : [];

  return {
    error,
    errorType,
    relevantFiles,
    recentChanges,
    previousAttempts,
    userContext,
    timestamp: Date.now(),
  };
}

/**
 * Build an enriched prompt with error context
 */
export function buildContextualPrompt(
  context: ErrorContext,
  originalPrompt: string,
  includeHistory: boolean = true
): EnrichedPrompt {
  let enrichedPrompt = originalPrompt;

  enrichedPrompt += '\n\n## Error Context\n';
  enrichedPrompt += `Error Type: ${context.errorType || 'unknown'}\n`;
  enrichedPrompt += `Error Message: ${context.error}\n`;

  if (context.relevantFiles.length > 0) {
    enrichedPrompt += `\nRelevant Files: ${context.relevantFiles.join(', ')}\n`;
  }

  if (context.recentChanges.length > 0) {
    enrichedPrompt += `\n### Recent Changes (Last 5 minutes)\n`;
    const changesSummary = context.recentChanges
      .slice(0, 5)
      .map(
        (change) =>
          `- ${change.path} (${change.operation}) at ${new Date(change.timestamp).toLocaleTimeString()}`
      )
      .join('\n');
    enrichedPrompt += changesSummary + '\n';
  }

  if (includeHistory && context.previousAttempts.length > 0) {
    enrichedPrompt += `\n### Previous Fix Attempts (${context.previousAttempts.length})\n`;
    enrichedPrompt += `⚠️  This error has been encountered ${context.previousAttempts.length} time(s) before.\n`;
    enrichedPrompt += `Please provide a DIFFERENT solution than these previous attempts:\n\n`;

    context.previousAttempts.forEach((attempt, index) => {
      enrichedPrompt += `**Attempt ${index + 1}** (${attempt.endpoint}):\n`;
      enrichedPrompt += `${attempt.solution.substring(0, 200)}${attempt.solution.length > 200 ? '...' : ''}\n\n`;
    });

    enrichedPrompt += `\nImportant: Analyze why the previous attempts failed and provide a fundamentally different approach.\n`;
  }

  if (context.userContext) {
    enrichedPrompt += `\n### User Context\n${context.userContext}\n`;
  }

  return {
    originalPrompt,
    enrichedPrompt,
    context,
  };
}

function detectErrorType(error: string): 'syntax' | 'runtime' | 'compile' | 'unknown' {
  const lowerError = error.toLowerCase();

  if (
    lowerError.includes('syntaxerror') ||
    lowerError.includes('unexpected token') ||
    lowerError.includes('unexpected identifier') ||
    lowerError.includes('missing')
  ) {
    return 'syntax';
  }

  if (
    lowerError.includes('typeerror') ||
    lowerError.includes('referenceerror') ||
    lowerError.includes('is not defined') ||
    lowerError.includes('cannot read') ||
    lowerError.includes('undefined')
  ) {
    return 'runtime';
  }

  if (
    lowerError.includes('compile') ||
    lowerError.includes('build failed') ||
    lowerError.includes('error ts') ||
    lowerError.includes('type error')
  ) {
    return 'compile';
  }

  return 'unknown';
}

function findRelevantFiles(
  error: string,
  projectFiles: Array<{ path: string; content: string }>
): string[] {
  const relevantFiles: string[] = [];

  const filePathRegex = /([a-zA-Z0-9_\-/]+\.(html|js|css|ts|jsx|tsx))/g;
  const matches = error.match(filePathRegex);

  if (matches) {
    matches.forEach((match) => {
      const file = projectFiles.find((f) => f.path.includes(match));
      if (file && !relevantFiles.includes(file.path)) {
        relevantFiles.push(file.path);
      }
    });
  }

  if (relevantFiles.length === 0) {
    const keywords = extractKeywords(error);

    projectFiles.forEach((file) => {
      const matchCount = keywords.filter((keyword) =>
        file.content.toLowerCase().includes(keyword)
      ).length;

      if (matchCount >= 2) {
        relevantFiles.push(file.path);
      }
    });
  }

  return relevantFiles.slice(0, 5);
}

function extractKeywords(error: string): string[] {
  const keywords: string[] = [];

  const identifierRegex = /['"`]([a-zA-Z_$][a-zA-Z0-9_$]*)['"`]/g;
  let match;

  while ((match = identifierRegex.exec(error)) !== null) {
    keywords.push(match[1].toLowerCase());
  }

  const commonTerms = error
    .toLowerCase()
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 3 &&
        !['error', 'undefined', 'cannot', 'failed', 'the', 'and', 'for'].includes(
          word
        )
    );

  keywords.push(...commonTerms);

  return [...new Set(keywords)];
}

export function summarizeErrorContext(context: ErrorContext): string {
  return `
Error Context Summary:
- Type: ${context.errorType}
- Relevant Files: ${context.relevantFiles.length}
- Recent Changes: ${context.recentChanges.length}
- Previous Attempts: ${context.previousAttempts.length}
- Loop Detected: ${context.previousAttempts.length >= 3 ? 'YES' : 'NO'}
  `.trim();
}

export function isErrorLoopSuggested(context: ErrorContext): boolean {
  return context.previousAttempts.length >= 3;
}

export function getRecommendedAction(
  context: ErrorContext
): 'retry' | 'manual' | 'skip' {
  if (isErrorLoopSuggested(context)) {
    return 'manual';
  }

  if (context.previousAttempts.length === 0) {
    return 'retry';
  }

  if (context.previousAttempts.length < 3) {
    return 'retry';
  }

  return 'skip';
}
