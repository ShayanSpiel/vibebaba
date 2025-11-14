// lib/langgraph/logging-config.ts

/**
 * Centralized logging configuration for the app generation pipeline
 */
export const LOGGING_CONFIG = {
  // ===== LOGGING LEVELS =====
  // Control what gets logged to reduce noise or increase visibility

  logAIPrompts: true,           // Log full AI prompts (can be large)
  logAIResponses: true,          // Log full AI responses (can be large)
  logIntermediateSteps: true,    // Log progress events within nodes
  logPerformance: true,          // Track timing and performance metrics
  logAutoGenDetails: true,       // Log AutoGen sub-agent details
  logErrorDiffs: true,           // Track error reduction across attempts

  // ===== OUTPUT CHANNELS =====
  // Control where logs are sent

  enableSSE: true,               // Stream logs via Server-Sent Events
  enableConsole: true,           // Output to console.log (server-side)
  enablePersistence: false,      // Save logs to disk/database (future)

  // ===== SIZE LIMITS =====
  // Prevent memory issues with large prompts/responses

  maxPromptLength: 50000,        // Truncate prompts after this many characters
  maxResponseLength: 50000,      // Truncate responses after this many characters
  maxConversationsPerProject: 200, // Max AI conversations to keep in memory

  // ===== PREVIEW LENGTHS =====
  // For quick preview in events before full text

  promptPreviewLength: 200,      // Characters to show in preview
  responsePreviewLength: 200,    // Characters to show in preview

  // ===== PERFORMANCE TRACKING =====
  // Control performance metric collection

  trackNodeDuration: true,
  trackAIDuration: true,
  trackTokenUsage: true,

  // ===== DEBUG MODE =====
  // Extra verbose logging for troubleshooting

  debugMode: process.env.NODE_ENV === 'development'
};

/**
 * Helper to check if a log type is enabled
 */
export function shouldLog(logType: keyof typeof LOGGING_CONFIG): boolean {
  return LOGGING_CONFIG[logType] === true;
}

/**
 * Truncate text to configured max length
 */
export function truncateIfNeeded(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + `... [truncated ${text.length - maxLength} chars]`;
}

/**
 * Create preview of text (first N characters)
 */
export function createPreview(text: string, previewLength: number): string {
  if (!text) return '';
  if (text.length <= previewLength) return text;
  return text.substring(0, previewLength) + '...';
}
