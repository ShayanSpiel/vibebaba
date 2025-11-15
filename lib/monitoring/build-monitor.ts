/**
 * Build Monitor
 *
 * Monitors build processes and parses errors from various tools.
 * Supports JavaScript, TypeScript, and generic syntax errors.
 * Inspired by Bolt.new's build error detection patterns.
 */

export interface BuildError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  stack?: string;
  code?: string;
}

export interface BuildResult {
  success: boolean;
  errors: BuildError[];
  warnings: BuildError[];
  timestamp: number;
  duration?: number;
}

export class BuildMonitor {
  private errorPatterns: Record<string, RegExp>;

  constructor() {
    this.errorPatterns = {
      // TypeScript errors: file.ts:10:5 - error TS2304: Cannot find name 'foo'.
      typescript: /^(.+?):(\d+):(\d+)\s+-\s+error\s+TS(\d+):\s+(.+)$/gm,

      // JavaScript errors: Error: message at file.js:10:5
      javascript: /Error:\s+(.+?)\s+at\s+(.+?):(\d+):(\d+)/gm,

      // Generic syntax errors: SyntaxError: Unexpected token
      syntax: /SyntaxError:\s+(.+)/gm,

      // Webpack/Vite errors: ERROR in ./src/file.ts
      webpack: /ERROR\s+in\s+(.+?)$/gm,

      // ESLint errors: /path/to/file.js:10:5: error message
      eslint: /^(.+?):(\d+):(\d+):\s+(.+)$/gm,
    };
  }

  /**
   * Parse errors from build output
   */
  parseErrors(output: string): BuildError[] {
    const errors: BuildError[] = [];

    // Try each error pattern
    errors.push(...this.extractTypeScriptErrors(output));
    errors.push(...this.extractJavaScriptErrors(output));
    errors.push(...this.extractSyntaxErrors(output));
    errors.push(...this.extractWebpackErrors(output));
    errors.push(...this.extractESLintErrors(output));

    // Remove duplicates based on file, line, and message
    return this.deduplicateErrors(errors);
  }

  /**
   * Create a build result from output
   */
  createBuildResult(output: string, success: boolean = true): BuildResult {
    const allErrors = this.parseErrors(output);

    const errors = allErrors.filter((e) => e.severity === 'error');
    const warnings = allErrors.filter((e) => e.severity === 'warning');

    return {
      success: success && errors.length === 0,
      errors,
      warnings,
      timestamp: Date.now(),
    };
  }

  /**
   * Extract TypeScript errors
   */
  extractTypeScriptErrors(output: string): BuildError[] {
    const errors: BuildError[] = [];
    const regex = this.errorPatterns.typescript;
    regex.lastIndex = 0;
    let match;

    while ((match = regex.exec(output)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        message: match[5],
        severity: 'error',
        code: `TS${match[4]}`,
      });
    }

    return errors;
  }

  /**
   * Extract JavaScript runtime errors
   */
  extractJavaScriptErrors(output: string): BuildError[] {
    const errors: BuildError[] = [];
    const regex = this.errorPatterns.javascript;
    regex.lastIndex = 0;
    let match;

    while ((match = regex.exec(output)) !== null) {
      errors.push({
        file: match[2],
        line: parseInt(match[3], 10),
        column: parseInt(match[4], 10),
        message: match[1],
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Extract syntax errors
   */
  extractSyntaxErrors(output: string): BuildError[] {
    const errors: BuildError[] = [];
    const regex = this.errorPatterns.syntax;
    regex.lastIndex = 0;
    let match;

    while ((match = regex.exec(output)) !== null) {
      errors.push({
        file: 'unknown',
        line: 0,
        column: 0,
        message: match[1],
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Extract Webpack/Vite errors
   */
  extractWebpackErrors(output: string): BuildError[] {
    const errors: BuildError[] = [];
    const regex = this.errorPatterns.webpack;
    regex.lastIndex = 0;
    let match;

    while ((match = regex.exec(output)) !== null) {
      errors.push({
        file: match[1],
        line: 0,
        column: 0,
        message: 'Build error in file',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Extract ESLint errors
   */
  extractESLintErrors(output: string): BuildError[] {
    const errors: BuildError[] = [];
    const regex = this.errorPatterns.eslint;
    regex.lastIndex = 0;
    let match;

    while ((match = regex.exec(output)) !== null) {
      const severity = match[4].toLowerCase().includes('warning') ? 'warning' : 'error';

      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        message: match[4],
        severity,
      });
    }

    return errors;
  }

  /**
   * Deduplicate errors based on file, line, and message
   */
  private deduplicateErrors(errors: BuildError[]): BuildError[] {
    const seen = new Set<string>();
    const unique: BuildError[] = [];

    for (const error of errors) {
      const key = `${error.file}:${error.line}:${error.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(error);
      }
    }

    return unique;
  }

  /**
   * Format error for display
   */
  formatError(error: BuildError): string {
    const location = error.line > 0 ? `${error.file}:${error.line}:${error.column}` : error.file;
    return `[${error.severity.toUpperCase()}] ${location}: ${error.message}`;
  }

  /**
   * Format all errors for display
   */
  formatErrors(errors: BuildError[]): string {
    return errors.map((e) => this.formatError(e)).join('\n');
  }
}

// Singleton instance
let globalBuildMonitor: BuildMonitor | null = null;

/**
 * Get or create global build monitor instance
 */
export function getBuildMonitor(): BuildMonitor {
  if (!globalBuildMonitor) {
    globalBuildMonitor = new BuildMonitor();
  }
  return globalBuildMonitor;
}
