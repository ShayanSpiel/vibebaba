/**
 * VALIDATION TYPE DEFINITIONS
 */

export interface ValidationError {
  file: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning';
  message: string;
  rule: string;
  autoFixable: boolean;
  suggestion?: string;
  context?: string;
}

export interface ValidationResult {
  valid: boolean;
  files: Array<{ path: string; content: string }>;
  report: {
    errors: ValidationError[];
    warnings: ValidationError[];
    fixed: string[];
  };
}

export interface ValidationOptions {
  autoFix?: boolean;
  strict?: boolean;
  isMultiPage?: boolean;
  skipHTML?: boolean;
  skipCSS?: boolean;
  skipJS?: boolean;
}

export interface FileToValidate {
  path: string;
  content: string;
}
