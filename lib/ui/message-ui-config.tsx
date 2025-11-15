/**
 * MESSAGE UI CONFIGURATION
 *
 * Single source of truth for all chat message styling, colors, and icons.
 * This file centralizes all message appearance logic previously scattered in ChatBubble.tsx.
 *
 * To update message colors:
 * 1. Modify the config below
 * 2. Changes automatically apply to ChatBubble and Brand Guidelines page
 * 3. No need to update multiple files!
 */

import type { ReactNode } from 'react';

// ============================================
// ROLE CONFIGURATIONS (All Grey/Neutral)
// ============================================

export interface RoleConfig {
  name: string;
  icon: string; // SVG path or icon name
  bgClass: string;
  iconColor: string;
  keywords: string[];
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  pm: {
    name: 'Product Manager',
    icon: 'document',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-300',
    keywords: ['product manager', 'pm'],
  },
  frontend: {
    name: 'Frontend Engineer',
    icon: 'code',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-300',
    keywords: ['frontend engineer', 'frontend'],
  },
  backend: {
    name: 'Backend Engineer',
    icon: 'database',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-300',
    keywords: ['backend engineer', 'backend'],
  },
  ux: {
    name: 'UX Designer',
    icon: 'paint',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-300',
    keywords: ['ux designer', 'designer'],
  },
  founder: {
    name: 'Managing Director',
    icon: 'briefcase',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-300',
    keywords: ['managing director', 'founder'],
  },
  devops: {
    name: 'DevOps Engineer',
    icon: 'server',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-300',
    keywords: ['devops', 'deployment'],
  },
  qa: {
    name: 'QA Engineer',
    icon: 'check-circle',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-300',
    keywords: ['qa engineer', 'quality'],
  },
};

// ============================================
// STATUS CONFIGURATIONS
// ============================================

export interface StatusConfig {
  name: string;
  icon: string;
  iconGradient: string; // Gradient for icon background
  bgClass: string; // Background for message (optional/transparent for solid gradients)
  borderClass?: string; // Border for message (when using transparent bg)
  solidGradient?: string; // Solid gradient for full background
  keywords: string[];
  priority: number; // Higher number = higher priority in detection
}

export const STATUS_CONFIGS: Record<string, StatusConfig> = {
  // PRIORITY 1: Edit success (highest)
  editSuccess: {
    name: 'Edit Success',
    icon: 'checkmark',
    iconGradient: 'bg-gradient-success',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/40',
    keywords: ["here's what i changed", "here's what changed", 'edited files', 'added features'],
    priority: 100,
  },

  // PRIORITY 2: Error/Failure
  error: {
    name: 'Error',
    icon: 'x',
    iconGradient: 'bg-gradient-error',
    solidGradient: 'bg-gradient-to-br from-red-500 to-red-600',
    bgClass: 'bg-error/10',
    borderClass: 'border-error/40',
    keywords: ['error', 'failed', 'failure', 'something went wrong', "couldn't", 'could not', 'unable to', 'failed to'],
    priority: 90,
  },

  // PRIORITY 3: Success/Completion
  success: {
    name: 'Success',
    icon: 'checkmark',
    iconGradient: 'bg-gradient-success',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/40',
    keywords: ['done', 'completed', 'ready', 'successfully', 'success!', 'applied', 'finished', 'all set'],
    priority: 80,
  },

  // PRIORITY 4: Question/Clarification
  question: {
    name: 'Question',
    icon: 'warning',
    iconGradient: 'bg-gradient-to-br from-amber-500 to-yellow-600',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/40',
    keywords: ['question', 'clarify', 'clarification', 'which ', 'what ', 'please provide', 'please share', 'could you', 'can you', 'would you like', '??'],
    priority: 70,
  },

  // PRIORITY 5: Warning
  warning: {
    name: 'Warning',
    icon: 'warning',
    iconGradient: 'bg-gradient-to-br from-amber-500 to-yellow-600',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/40',
    keywords: ['warning', 'caution', 'be careful', 'watch out'],
    priority: 60,
  },

  // PRIORITY 6: Info/Note
  info: {
    name: 'Information',
    icon: 'info',
    iconGradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
    bgClass: 'bg-info/10',
    borderClass: 'border-info/40',
    keywords: ['note:', 'important:', 'please note', 'fyi', 'info:', 'tip:'],
    priority: 50,
  },
};

// ============================================
// TOPIC CONFIGURATIONS (Database, Code, Design, etc.)
// ============================================

export interface TopicConfig {
  name: string;
  icon: string;
  gradient: string;
  keywords: string[];
  priority: number;
}

export const TOPIC_CONFIGS: Record<string, TopicConfig> = {
  database: {
    name: 'Database/Backend',
    icon: 'database',
    gradient: 'bg-gradient-blue',
    keywords: ['database', 'schema', 'backend', 'data'],
    priority: 40,
  },
  design: {
    name: 'UI/Design',
    icon: 'paint',
    gradient: 'bg-gradient-purple',
    keywords: ['design', 'ui', 'interface', 'layout', 'styling'],
    priority: 35,
  },
  code: {
    name: 'Code/Building',
    icon: 'code',
    gradient: 'bg-gradient-orange',
    keywords: ['code', 'building', 'writing', 'updating', 'component'],
    priority: 30,
  },
  thinking: {
    name: 'Analysis/Thinking',
    icon: 'lightbulb',
    gradient: 'bg-gradient-cyan',
    keywords: ['analyz', 'understanding', 'thinking', 'planning'],
    priority: 25,
  },
  starting: {
    name: 'Starting/Acknowledgment',
    icon: 'zap',
    gradient: 'bg-gradient-brand-br',
    keywords: ['got it', 'perfect', 'on it', 'starting'],
    priority: 20,
  },
};

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export const DEFAULT_CONFIG = {
  name: 'Default AI Message',
  icon: 'message',
  gradient: 'bg-gradient-info',
  bgClass: 'bg-background-raised',
  borderClass: 'border-border-light',
};

// ============================================
// USER MESSAGE CONFIGURATION
// ============================================

export const USER_MESSAGE_CONFIG = {
  gradient: 'bg-gradient-brand',
  textColor: 'text-white',
  borderRadius: 'rounded-xl rounded-tr-sm',
  shadow: 'shadow-lg',
};

// ============================================
// ICON SVG COMPONENTS
// ============================================

export const MESSAGE_ICONS: Record<string, ReactNode> = {
  // Role icons
  document: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  code: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  database: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  paint: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  briefcase: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  server: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
  'check-circle': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),

  // Status icons
  checkmark: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  zap: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  message: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Detect message type from content
 * Returns the detected configuration or default
 */
export function detectMessageType(content: string): {
  type: 'role' | 'status' | 'topic' | 'default';
  config: RoleConfig | StatusConfig | TopicConfig | typeof DEFAULT_CONFIG;
  roleIcon?: boolean;
} {
  const lowerContent = content.toLowerCase();

  // PRIORITY 1: Check for role header format: "**Product Manager**: ..."
  const roleHeaderMatch = content.match(/\*\*([^:]+)\*\*:/);
  if (roleHeaderMatch) {
    const roleText = roleHeaderMatch[1].toLowerCase();
    for (const [key, roleConfig] of Object.entries(ROLE_CONFIGS)) {
      if (roleConfig.keywords.some(keyword => roleText.includes(keyword))) {
        return { type: 'role', config: roleConfig, roleIcon: true };
      }
    }
  }

  // PRIORITY 2-6: Check status configs (sorted by priority)
  const sortedStatuses = Object.entries(STATUS_CONFIGS).sort(
    ([, a], [, b]) => b.priority - a.priority
  );

  for (const [key, statusConfig] of sortedStatuses) {
    if (statusConfig.keywords.some(keyword => lowerContent.includes(keyword))) {
      return { type: 'status', config: statusConfig };
    }
  }

  // PRIORITY 7-11: Check topic configs (sorted by priority)
  const sortedTopics = Object.entries(TOPIC_CONFIGS).sort(
    ([, a], [, b]) => b.priority - a.priority
  );

  for (const [key, topicConfig] of sortedTopics) {
    if (topicConfig.keywords.some(keyword => lowerContent.includes(keyword))) {
      return { type: 'topic', config: topicConfig };
    }
  }

  // Default
  return { type: 'default', config: DEFAULT_CONFIG };
}
