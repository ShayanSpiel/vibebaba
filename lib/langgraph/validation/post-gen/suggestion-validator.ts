/**
 * Suggestion Validator
 *
 * Prevents duplicate AI suggestions by tracking and comparing
 * previous solutions for the same error.
 * Inspired by Bolt.new's error prevention patterns.
 */

export interface SuggestionRecord {
  errorHash: string;
  suggestionHash: string;
  suggestion: string;
  timestamp: number;
  endpoint: string;
}

export class SuggestionValidator {
  private suggestionHistory: Map<string, Set<string>> = new Map();
  private fullHistory: Map<string, SuggestionRecord[]> = new Map();
  private maxHistoryPerError: number;

  constructor(maxHistoryPerError: number = 10) {
    this.maxHistoryPerError = maxHistoryPerError;
  }

  /**
   * Check if a suggestion is a duplicate
   * Returns true if duplicate, false if unique
   */
  isDuplicateSuggestion(error: string, suggestion: string, endpoint: string = 'unknown'): boolean {
    const errorHash = this.hashError(error);
    const suggestionHash = this.hashSuggestion(suggestion);

    const seenSuggestions = this.suggestionHistory.get(errorHash) || new Set();

    if (seenSuggestions.has(suggestionHash)) {
      return true; // Duplicate found
    }

    // Record this suggestion
    this.recordSuggestion(errorHash, suggestionHash, suggestion, endpoint);

    return false;
  }

  /**
   * Record a suggestion in the history
   */
  private recordSuggestion(
    errorHash: string,
    suggestionHash: string,
    suggestion: string,
    endpoint: string
  ): void {
    // Add to hash set for quick duplicate detection
    const seenSuggestions = this.suggestionHistory.get(errorHash) || new Set();
    seenSuggestions.add(suggestionHash);
    this.suggestionHistory.set(errorHash, seenSuggestions);

    // Add to full history for analysis
    const fullRecords = this.fullHistory.get(errorHash) || [];
    fullRecords.push({
      errorHash,
      suggestionHash,
      suggestion,
      timestamp: Date.now(),
      endpoint,
    });

    // Limit history size
    if (fullRecords.length > this.maxHistoryPerError) {
      const removed = fullRecords.shift();
      if (removed) {
        seenSuggestions.delete(removed.suggestionHash);
      }
    }

    this.fullHistory.set(errorHash, fullRecords);
  }

  /**
   * Get all suggestions for an error
   */
  getSuggestions(error: string): SuggestionRecord[] {
    const errorHash = this.hashError(error);
    return this.fullHistory.get(errorHash) || [];
  }

  /**
   * Get suggestion count for an error
   */
  getSuggestionCount(error: string): number {
    const errorHash = this.hashError(error);
    return this.suggestionHistory.get(errorHash)?.size || 0;
  }

  /**
   * Check if we have any suggestions for an error
   */
  hasSuggestions(error: string): boolean {
    return this.getSuggestionCount(error) > 0;
  }

  /**
   * Clear suggestion history for a specific error or all errors
   */
  clearHistory(error?: string): void {
    if (error) {
      const errorHash = this.hashError(error);
      this.suggestionHistory.delete(errorHash);
      this.fullHistory.delete(errorHash);
    } else {
      this.suggestionHistory.clear();
      this.fullHistory.clear();
    }
  }

  /**
   * Get similarity score between two suggestions (0-1)
   * Returns 1 for identical, 0 for completely different
   */
  getSimilarityScore(suggestion1: string, suggestion2: string): number {
    const hash1 = this.extractCodeContent(suggestion1);
    const hash2 = this.extractCodeContent(suggestion2);

    if (hash1 === hash2) {
      return 1.0;
    }

    // Simple character-based similarity
    const set1 = new Set(hash1.split(''));
    const set2 = new Set(hash2.split(''));
    const intersection = new Set([...set1].filter((x) => set2.has(x)));

    return intersection.size / Math.max(set1.size, set2.size);
  }

  /**
   * Find similar suggestions (similarity > threshold)
   */
  findSimilarSuggestions(
    error: string,
    suggestion: string,
    threshold: number = 0.8
  ): SuggestionRecord[] {
    const suggestions = this.getSuggestions(error);

    return suggestions.filter((record) => {
      const similarity = this.getSimilarityScore(record.suggestion, suggestion);
      return similarity >= threshold;
    });
  }

  /**
   * Get statistics about suggestion tracking
   */
  getStats(): {
    totalErrors: number;
    totalSuggestions: number;
    averageSuggestionsPerError: number;
    mostSuggested: { errorHash: string; count: number } | null;
  } {
    let totalSuggestions = 0;
    let mostSuggested: { errorHash: string; count: number } | null = null;

    for (const [errorHash, suggestions] of this.suggestionHistory.entries()) {
      const count = suggestions.size;
      totalSuggestions += count;

      if (!mostSuggested || count > mostSuggested.count) {
        mostSuggested = { errorHash, count };
      }
    }

    const totalErrors = this.suggestionHistory.size;

    return {
      totalErrors,
      totalSuggestions,
      averageSuggestionsPerError: totalErrors > 0 ? totalSuggestions / totalErrors : 0,
      mostSuggested,
    };
  }

  /**
   * Hash an error message for comparison
   * Normalizes error to ignore variable data
   */
  private hashError(error: string): string {
    // Normalize error message
    const normalized = error
      .replace(/:\d+:\d+/g, ':X:X') // Remove line:column
      .replace(/\/[\w\-./]+\//g, '/') // Remove file paths
      .replace(/[A-Z]:\\[\w\-\\]+\\/g, '/') // Remove Windows paths
      .replace(/\d{13}/g, 'TS') // Remove timestamps
      .replace(/0x[0-9a-fA-F]+/g, '0xADDR') // Remove memory addresses
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase()
      .trim();

    // Create hash using simple hash function
    return this.simpleHash(normalized);
  }

  /**
   * Hash a suggestion for comparison
   * Focuses on code content, ignoring explanatory text
   */
  private hashSuggestion(suggestion: string): string {
    // Extract code content
    const codeContent = this.extractCodeContent(suggestion);

    // Create hash
    return this.simpleHash(codeContent);
  }

  /**
   * Extract code blocks from suggestion
   * Focuses on actual code changes, not explanations
   */
  private extractCodeContent(suggestion: string): string {
    // Extract code blocks (markdown format)
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = suggestion.match(codeBlockRegex) || [];

    if (codeBlocks.length > 0) {
      // Remove the ``` markers and join
      return codeBlocks.map((block) => block.replace(/```[\w]*\n?/g, '').trim()).join('\n');
    }

    // If no code blocks, use the whole suggestion
    // but normalize it
    return suggestion
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase()
      .trim();
  }

  /**
   * Simple hash function for strings
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Singleton instance for global use
let globalSuggestionValidator: SuggestionValidator | null = null;

/**
 * Get or create global suggestion validator instance
 */
export function getSuggestionValidator(): SuggestionValidator {
  if (!globalSuggestionValidator) {
    globalSuggestionValidator = new SuggestionValidator();
  }
  return globalSuggestionValidator;
}

/**
 * Reset global suggestion validator
 */
export function resetSuggestionValidator(): void {
  globalSuggestionValidator = new SuggestionValidator();
}
