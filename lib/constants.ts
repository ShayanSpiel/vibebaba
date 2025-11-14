// lib/constants.ts

export const CONSTANTS = {
  // Timeouts (milliseconds)
  SSE_RECONNECT_TIMEOUT: 2000,
  API_REQUEST_TIMEOUT: 30000,
  DATABASE_SYNC_TIMEOUT: 2000,

  // Retry limits
  MAX_SSE_RETRIES: 3,
  MAX_API_RETRIES: 3,

  // UI constants
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,

  // Workflow
  MAX_WORKFLOW_STEPS: 50,
  MAX_ERROR_LOOP_RETRIES: 3,

  // Files
  SUPPORTED_FILE_EXTENSIONS: ['.tsx', '.ts', '.js', '.jsx', '.css', '.json', '.html', '.md'],
  EXCLUDED_PATHS: ['node_modules', '.next', 'dist', 'build', '.git'],
} as const;
