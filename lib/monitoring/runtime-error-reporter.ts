/**
 * Runtime Error Reporter
 *
 * Injects error reporting into generated HTML to catch runtime errors
 * and send them back to the parent application.
 * Inspired by Bolt.new's runtime error monitoring.
 */

export interface RuntimeError {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  error?: string;
}

/**
 * Create error reporter script to inject into generated HTML
 * This script will catch runtime errors and send them to the parent window
 */
export function createErrorReporterScript(): string {
  return `
<script>
(function() {
  // Runtime error handler
  window.addEventListener('error', function(event) {
    try {
      const errorData = {
        type: 'RUNTIME_ERROR',
        error: {
          message: event.message || 'Unknown error',
          stack: event.error?.stack || '',
          timestamp: Date.now(),
          url: event.filename || window.location.href,
          lineNumber: event.lineno || 0,
          columnNumber: event.colno || 0,
        }
      };

      // Send to parent window
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(errorData, '*');
      }

      // Also log to console for debugging
      console.error('Runtime Error:', errorData.error);
    } catch (e) {
      console.error('Error reporter failed:', e);
    }
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', function(event) {
    try {
      const errorData = {
        type: 'UNHANDLED_REJECTION',
        error: {
          message: event.reason?.message || String(event.reason) || 'Unhandled Promise Rejection',
          stack: event.reason?.stack || '',
          timestamp: Date.now(),
          url: window.location.href,
        }
      };

      // Send to parent window
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(errorData, '*');
      }

      // Log to console
      console.error('Unhandled Rejection:', errorData.error);
    } catch (e) {
      console.error('Error reporter failed:', e);
    }
  });

  // Console error interceptor (optional, can be verbose)
  const originalConsoleError = console.error;
  console.error = function(...args) {
    try {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      const errorData = {
        type: 'CONSOLE_ERROR',
        error: {
          message: message,
          timestamp: Date.now(),
          url: window.location.href,
        }
      };

      // Send to parent window (only for actual errors, not warnings)
      if (window.parent && window.parent !== window && message.toLowerCase().includes('error')) {
        window.parent.postMessage(errorData, '*');
      }
    } catch (e) {
      // Fail silently
    }

    // Call original console.error
    originalConsoleError.apply(console, args);
  };

  // Report successful load
  window.addEventListener('load', function() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'APP_LOADED',
        timestamp: Date.now(),
      }, '*');
    }
  });
})();
</script>
  `.trim();
}

/**
 * Create error listener for parent window
 * Returns a function to add as event listener
 */
export function createErrorListener(
  onError: (error: RuntimeError) => void,
  onLoad?: () => void
): (event: MessageEvent) => void {
  return function (event: MessageEvent) {
    // Only handle messages from our iframe
    if (!event.data || typeof event.data !== 'object') {
      return;
    }

    const { type, error } = event.data;

    switch (type) {
      case 'RUNTIME_ERROR':
      case 'UNHANDLED_REJECTION':
      case 'CONSOLE_ERROR':
        if (error) {
          onError(error);
        }
        break;

      case 'APP_LOADED':
        if (onLoad) {
          onLoad();
        }
        break;
    }
  };
}

/**
 * Inject error reporter into HTML content
 */
export function injectErrorReporter(htmlContent: string): string {
  const errorScript = createErrorReporterScript();

  // Try to inject before closing </head> tag
  if (htmlContent.includes('</head>')) {
    return htmlContent.replace('</head>', `${errorScript}\n</head>`);
  }

  // If no </head>, try before </body>
  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', `${errorScript}\n</body>`);
  }

  // If no </body>, try before </html>
  if (htmlContent.includes('</html>')) {
    return htmlContent.replace('</html>', `${errorScript}\n</html>`);
  }

  // If nothing works, append to end
  return htmlContent + '\n' + errorScript;
}

/**
 * Format runtime error for display
 */
export function formatRuntimeError(error: RuntimeError): string {
  let output = `Runtime Error: ${error.message}\n`;

  if (error.url) {
    output += `File: ${error.url}`;
    if (error.lineNumber) {
      output += `:${error.lineNumber}`;
      if (error.columnNumber) {
        output += `:${error.columnNumber}`;
      }
    }
    output += '\n';
  }

  if (error.stack) {
    output += `\nStack Trace:\n${error.stack}\n`;
  }

  return output;
}

/**
 * Extract error message without stack trace
 */
export function extractErrorMessage(error: RuntimeError): string {
  // Remove stack trace from message if it's included
  const message = error.message || 'Unknown error';
  const stackStart = message.indexOf('\n    at ');

  if (stackStart > -1) {
    return message.substring(0, stackStart).trim();
  }

  return message.trim();
}

/**
 * Check if error is critical (should stop execution)
 */
export function isCriticalError(error: RuntimeError): boolean {
  const message = error.message.toLowerCase();

  // Critical errors
  const criticalPatterns = [
    'syntaxerror',
    'referenceerror',
    'typeerror: cannot read',
    'uncaught',
    'fatal',
  ];

  return criticalPatterns.some((pattern) => message.includes(pattern));
}

/**
 * Group similar errors
 */
export class RuntimeErrorCollector {
  private errors: Map<string, RuntimeError[]> = new Map();
  private maxErrorsPerType = 10;

  addError(error: RuntimeError): void {
    const key = this.getErrorKey(error);
    const existing = this.errors.get(key) || [];

    existing.push(error);

    // Limit number of errors per type
    if (existing.length > this.maxErrorsPerType) {
      existing.shift();
    }

    this.errors.set(key, existing);
  }

  getErrors(): RuntimeError[] {
    const allErrors: RuntimeError[] = [];

    for (const errors of this.errors.values()) {
      allErrors.push(...errors);
    }

    // Sort by timestamp (newest first)
    return allErrors.sort((a, b) => b.timestamp - a.timestamp);
  }

  getErrorCount(): number {
    return this.errors.size;
  }

  getUniqueErrors(): RuntimeError[] {
    const unique: RuntimeError[] = [];

    for (const errors of this.errors.values()) {
      if (errors.length > 0) {
        unique.push(errors[0]); // Take first of each type
      }
    }

    return unique.sort((a, b) => b.timestamp - a.timestamp);
  }

  clear(): void {
    this.errors.clear();
  }

  private getErrorKey(error: RuntimeError): string {
    // Create key based on message (without line numbers)
    const message = extractErrorMessage(error);
    return message
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/:\d+:\d+/g, ':N:N') // Replace line:col with :N:N
      .toLowerCase()
      .trim();
  }
}
