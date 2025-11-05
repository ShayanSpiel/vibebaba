/**
 * File Tracker
 *
 * Tracks file changes, modifications, and provides change history.
 * Inspired by Bolt.new's file system management patterns.
 */

import { createHash } from 'crypto';

export interface FileChange {
  path: string;
  content: string;
  previousContent?: string;
  timestamp: number;
  modified: boolean;
  operation: 'create' | 'update' | 'delete';
  hash: string;
}

export interface FileMetadata {
  content: string;
  modified: boolean;
  timestamp: number;
  hash: string;
  size: number;
}

export interface FileMap {
  [filePath: string]: FileMetadata;
}

export class FileTracker {
  private fileHistory: Map<string, FileChange[]> = new Map();
  private currentState: FileMap = {};
  private maxHistoryPerFile: number;

  constructor(maxHistoryPerFile: number = 10) {
    this.maxHistoryPerFile = maxHistoryPerFile;
  }

  /**
   * Record a file change (create, update, or delete)
   */
  recordChange(
    path: string,
    content: string,
    operation: 'create' | 'update' | 'delete' = 'update'
  ): void {
    const previousContent = this.currentState[path]?.content;
    const hash = this.hashContent(content);
    const timestamp = Date.now();

    // Check if content actually changed
    const modified = !this.currentState[path] || this.currentState[path].hash !== hash;

    const change: FileChange = {
      path,
      content,
      previousContent,
      timestamp,
      modified,
      operation,
      hash,
    };

    // Add to history
    const history = this.fileHistory.get(path) || [];
    history.push(change);

    // Limit history size
    if (history.length > this.maxHistoryPerFile) {
      history.shift();
    }

    this.fileHistory.set(path, history);

    // Update current state
    if (operation === 'delete') {
      delete this.currentState[path];
    } else {
      this.currentState[path] = {
        content,
        modified,
        timestamp,
        hash,
        size: content.length,
      };
    }
  }

  /**
   * Get recent changes within a time window (in milliseconds)
   */
  getRecentChanges(timeWindow: number = 60000): FileChange[] {
    const now = Date.now();
    const changes: FileChange[] = [];

    for (const history of this.fileHistory.values()) {
      for (const change of history) {
        if (now - change.timestamp <= timeWindow) {
          changes.push(change);
        }
      }
    }

    // Sort by timestamp (most recent first)
    return changes.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get full history for a specific file
   */
  getFileHistory(path: string): FileChange[] {
    return this.fileHistory.get(path) || [];
  }

  /**
   * Check if content has changed compared to current state
   */
  hasChanged(path: string, newContent: string): boolean {
    const currentHash = this.currentState[path]?.hash;
    if (!currentHash) {
      return true; // File doesn't exist, so it's a change
    }

    const newHash = this.hashContent(newContent);
    return currentHash !== newHash;
  }

  /**
   * Get current state of all files
   */
  getCurrentState(): FileMap {
    return { ...this.currentState };
  }

  /**
   * Get current state of a specific file
   */
  getFile(path: string): FileMetadata | null {
    return this.currentState[path] || null;
  }

  /**
   * Get all tracked file paths
   */
  getFilePaths(): string[] {
    return Object.keys(this.currentState);
  }

  /**
   * Clear history for a specific file or all files
   */
  clearHistory(path?: string): void {
    if (path) {
      this.fileHistory.delete(path);
    } else {
      this.fileHistory.clear();
    }
  }

  /**
   * Reset tracker to initial state
   */
  reset(): void {
    this.fileHistory.clear();
    this.currentState = {};
  }

  /**
   * Get statistics about tracked files
   */
  getStats(): {
    totalFiles: number;
    totalSize: number;
    totalChanges: number;
    mostModified: { path: string; changes: number } | null;
  } {
    const totalFiles = Object.keys(this.currentState).length;
    const totalSize = Object.values(this.currentState).reduce(
      (sum, file) => sum + file.size,
      0
    );

    let totalChanges = 0;
    let mostModified: { path: string; changes: number } | null = null;

    for (const [path, history] of this.fileHistory.entries()) {
      totalChanges += history.length;

      if (!mostModified || history.length > mostModified.changes) {
        mostModified = { path, changes: history.length };
      }
    }

    return {
      totalFiles,
      totalSize,
      totalChanges,
      mostModified,
    };
  }

  /**
   * Load state from existing project files
   */
  loadFromProjectFiles(files: Array<{ path: string; content: string }>): void {
    this.reset();

    for (const file of files) {
      this.recordChange(file.path, file.content, 'create');
    }
  }

  /**
   * Generate hash for content comparison
   * Using SHA-256 for reliable content comparison
   */
  private hashContent(content: string): string {
    // For browser compatibility, use a simple hash
    // In Node.js, this would use crypto.createHash('sha256')
    if (typeof window === 'undefined') {
      // Server-side
      try {
        return createHash('sha256').update(content).digest('hex');
      } catch {
        // Fallback to simple hash
        return this.simpleHash(content);
      }
    } else {
      // Client-side - use simple hash
      return this.simpleHash(content);
    }
  }

  /**
   * Simple hash function for browser environments
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// Singleton instance for global use
let globalFileTracker: FileTracker | null = null;

/**
 * Get or create global file tracker instance
 */
export function getFileTracker(): FileTracker {
  if (!globalFileTracker) {
    globalFileTracker = new FileTracker();
  }
  return globalFileTracker;
}

/**
 * Reset global file tracker
 */
export function resetFileTracker(): void {
  globalFileTracker = new FileTracker();
}
