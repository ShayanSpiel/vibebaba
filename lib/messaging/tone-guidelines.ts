// lib/messaging/tone-guidelines.ts
/**
 * TONE & VOICE GUIDELINES
 *
 * Defines the consistent voice/tone for all user-facing messages.
 * All messages should be: Professional, Friendly, Helpful, Concise
 */

/**
 * VOICE: Who we are
 * - Expert assistant (knowledgeable, confident)
 * - Helpful partner (collaborative, supportive)
 * - Professional developer (technical, precise)
 */

/**
 * TONE: How we communicate
 * - Professional-Friendly: Not overly casual, but warm and approachable
 * - Action-Oriented: Focus on what's happening and what's next
 * - Clear & Concise: No fluff, but not robotic
 * - Positive & Encouraging: Celebrate successes, frame challenges constructively
 */

/**
 * EMOJI USAGE STANDARDS
 *
 * Use emojis purposefully to enhance clarity, not for decoration.
 * Each emoji has a specific meaning in our system.
 */
export const EMOJI_STANDARDS = {
  // Success & Completion
  SUCCESS: '✅', // Task completed successfully
  DEPLOYED: '🚀', // App deployed
  READY: '✨', // Something is ready to use
  CHECKMARK: '✓', // Item in list is done/included

  // Progress & Status
  BUILDING: '🔨', // Currently building/generating
  ANALYZING: '🔍', // Analyzing/investigating
  THINKING: '💭', // Processing/thinking
  WORKING: '⚙️', // Working on something

  // Information & Guidance
  INFO: '💡', // Helpful tip or information
  IMPORTANT: '📌', // Important note
  NOTE: '📝', // General note
  DOCS: '📚', // Documentation reference

  // Questions & Input
  QUESTION: '❓', // Asking user for input
  CLARIFICATION: '🤔', // Need clarification

  // Errors & Issues
  ERROR: '❌', // Error occurred
  WARNING: '⚠️', // Warning/caution
  CRITICAL: '🚨', // Critical issue

  // Features & Components
  FEATURE: '✅', // Feature implemented
  COMPONENT: '🧩', // Component created
  DATABASE: '🗄️', // Database/storage
  API: '🔌', // API/endpoint
  AUTH: '🔐', // Authentication
  FILE: '📄', // File operation
  CODE: '💻', // Code-related

  // Special Cases
  PHASE: '🚀', // Phase indicator (Phase 1, Phase 2)
  LATER: '⏳', // Coming later/Phase 2
  IDEA: '💡', // Suggestion/idea
  LINK: '🔗', // Link/URL
} as const;

/**
 * MESSAGE TEMPLATES & PATTERNS
 */

// Success Messages
export const SUCCESS_PATTERNS = {
  // Generic success
  generic: (action: string) => `✅ ${action} completed successfully!`,

  // File operations
  filesCreated: (count: number) => `✅ Created ${count} file${count > 1 ? 's' : ''} successfully`,
  filesUpdated: (count: number) => `✅ Updated ${count} file${count > 1 ? 's' : ''} successfully`,

  // Deployment
  deployed: () => `🚀 Your app has been deployed successfully!`,

  // Features
  featuresImplemented: (count: number) => `✅ Implemented ${count} feature${count > 1 ? 's' : ''}`,

  // Validation
  validationPassed: () => `✅ Validation passed - your code is ready!`,
};

// Error Messages
export const ERROR_PATTERNS = {
  // Generic error
  generic: (what: string) => `❌ **Error:** ${what}`,

  // With context
  withContext: (error: string, context: string) =>
    `❌ **Error:** ${error}\n\n**Context:** ${context}`,

  // With suggestion
  withSuggestion: (error: string, suggestion: string) =>
    `❌ **Error:** ${error}\n\n**Suggestion:** ${suggestion}`,

  // Build/deploy errors
  buildFailed: (reason: string) => `❌ Build failed: ${reason}`,
  deployFailed: (reason: string) => `❌ Deployment failed: ${reason}`,

  // Validation errors
  validationFailed: (errorCount: number) =>
    `⚠️ Found ${errorCount} validation issue${errorCount > 1 ? 's' : ''} that need attention`,
};

// Question Messages
export const QUESTION_PATTERNS = {
  // Generic question
  generic: (question: string) => `❓ ${question}`,

  // Clarification needed
  clarification: (what: string, why: string) =>
    `I need clarification about ${what}.\n\n**Why I'm asking:** ${why}`,

  // Input required
  inputRequired: (what: string, type: string) => `I need your ${type} to proceed with ${what}.`,

  // Choice/decision
  choice: (question: string, options: string[]) =>
    `${question}\n\n**Options:**\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`,
};

// Info Messages
export const INFO_PATTERNS = {
  // Generic info
  generic: (message: string) => `💡 ${message}`,

  // Progress updates
  analyzing: (what: string) => `🔍 Analyzing ${what}...`,
  building: (what: string) => `🔨 Building ${what}...`,
  generating: (what: string) => `✨ Generating ${what}...`,

  // Status updates
  ready: (what: string) => `✨ ${what} is ready!`,
  complete: (what: string) => `✅ ${what} complete`,
};

/**
 * WRITING STYLE GUIDELINES
 */

export const STYLE_GUIDELINES = {
  // DO: Use active voice
  activeVoice: {
    good: 'I created 5 files',
    bad: '5 files were created',
  },

  // DO: Be specific
  specific: {
    good: 'I updated 3 components: Header, Footer, and Sidebar',
    bad: 'I updated some components',
  },

  // DO: Focus on user benefit
  userFocused: {
    good: 'Your app is ready - you can preview it now!',
    bad: 'Deployment process completed',
  },

  // DO: Use positive framing for challenges
  positiveFraming: {
    good: 'I found 3 issues that need quick fixes',
    bad: 'Your code has 3 errors',
  },

  // DON'T: Use technical jargon unnecessarily
  avoidJargon: {
    good: 'I saved your settings',
    bad: 'I persisted your configuration to the database',
  },

  // DON'T: Be overly verbose
  concise: {
    good: 'I updated your files',
    bad: 'I have successfully completed the process of updating your files',
  },

  // DON'T: Use exclamation marks excessively
  moderateEnthusiasm: {
    good: 'Your app is deployed successfully! 🚀',
    bad: 'Your app is deployed!!! Congratulations!!! Amazing!!!',
  },
};

/**
 * SECTION TITLES (Consistent Naming)
 */
export const SECTION_TITLES = {
  // Plan/Overview
  overview: 'Overview',
  plan: 'Plan',
  summary: 'Summary',

  // Features
  phase1Features: '🚀 Phase 1 Features (Building Now)',
  phase2Features: '⏳ Phase 2 Features (Coming Later)',
  featuresImplemented: 'Features Implemented',
  featuresDetected: 'Features Detected',

  // Files & Code
  filesCreated: 'Files Created',
  filesUpdated: 'Files Updated',
  filesEdited: 'Edited Files',
  changes: 'Changes',

  // Database & Backend
  database: 'Database',
  collections: 'Database Collections',
  apiEndpoints: 'API Endpoints',
  backend: 'Backend',

  // Design
  design: 'Design',
  colors: 'Colors',
  typography: 'Typography',
  components: 'Components',

  // Validation & Errors
  validationResults: 'Validation Results',
  issues: 'Issues Found',
  criticalIssues: 'Critical Issues',
  suggestions: 'Suggestions',

  // Next Steps
  nextSteps: 'Next Steps',
  whatHappensNext: 'What Happens Next',
  actionNeeded: 'Action Needed',
};

/**
 * FORMATTING HELPERS
 */

/**
 * Format a list of items consistently
 */
export function formatList(
  items: string[],
  style: 'bullet' | 'numbered' | 'checkmark' = 'bullet'
): string {
  switch (style) {
    case 'bullet':
      return items.map((item) => `- ${item}`).join('\n');
    case 'numbered':
      return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
    case 'checkmark':
      return items.map((item) => `✅ ${item}`).join('\n');
  }
}

/**
 * Format a count with proper pluralization
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural || `${singular}s`}`;
}

/**
 * Format a time duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * TONE VALIDATION (For Testing)
 *
 * Check if a message follows tone guidelines
 */
export function validateTone(message: string): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for excessive exclamation marks
  const exclamationCount = (message.match(/!/g) || []).length;
  if (exclamationCount > 2) {
    warnings.push('Too many exclamation marks - use them sparingly');
  }

  // Check for passive voice indicators (simple heuristic)
  const passiveIndicators = [
    'was created',
    'were created',
    'was updated',
    'were updated',
    'was generated',
  ];
  if (passiveIndicators.some((indicator) => message.toLowerCase().includes(indicator))) {
    warnings.push('Consider using active voice (e.g., "I created" instead of "was created")');
  }

  // Check for overly technical jargon
  const jargon = ['persisted', 'instantiated', 'initialized', 'serialized', 'deserialized'];
  if (jargon.some((term) => message.toLowerCase().includes(term))) {
    warnings.push('Consider using simpler language instead of technical jargon');
  }

  // Check minimum length (too short might be unclear)
  if (message.trim().length < 10 && !message.includes('✅') && !message.includes('❌')) {
    warnings.push('Message might be too short - add more context');
  }

  // Check maximum length (too long might be verbose)
  if (message.length > 500) {
    warnings.push('Message might be too long - consider breaking into sections');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * USAGE EXAMPLES
 *
 * Example 1: Success message following guidelines
 * ```typescript
 * const message = `${SUCCESS_PATTERNS.deployed()}
 *
 * **${SECTION_TITLES.filesCreated}:** ${formatCount(15, 'file')}
 * **${SECTION_TITLES.collections}:** users, products, orders
 *
 * ${SECTION_TITLES.featuresImplemented}:
 * ${formatList(['Landing Page', 'Dashboard', 'Profile'], 'checkmark')}
 *
 * Your app is ready - preview it now! ${EMOJI_STANDARDS.READY}`;
 * ```
 *
 * Example 2: Error message with constructive tone
 * ```typescript
 * const message = ERROR_PATTERNS.withSuggestion(
 *   'TypeScript found type mismatches in 3 files',
 *   'I can auto-fix these for you, or you can review them manually.'
 * );
 * ```
 */
