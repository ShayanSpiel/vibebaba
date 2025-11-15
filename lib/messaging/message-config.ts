// lib/messaging/message-config.ts
/**
 * MESSAGE CONFIGURATION SYSTEM
 *
 * Allows customization of workflow messages without code changes.
 * Enables dynamic message selection based on workflow state, node, and custom conditions.
 *
 * Use cases:
 * - Customize messages per workflow type (initial-generation, editing, feature-add)
 * - A/B test different message formats
 * - Add workflow-specific actions (buttons, alerts)
 * - Localize messages for different languages
 * - Adjust message tone for different user segments
 */

import type { AppGenState } from '../langgraph/types';
import type { BubbleType } from './message-types';

/**
 * Configuration for a single message that can be triggered by workflow events
 */
export interface MessageConfig {
  /** Unique identifier for this config */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description of when this config is used */
  description: string;

  /** Event that triggers this message */
  trigger:
    | 'workflow:start'
    | 'workflow:complete'
    | 'workflow:error'
    | 'node:start'
    | 'node:complete'
    | 'node:error'
    | 'feature:added'
    | 'validation:complete'
    | 'deployment:complete'
    | 'custom';

  /** Conditions that must be met for this config to apply */
  conditions?: {
    /** Match specific workflow type */
    workflowType?: 'initial-generation' | 'editing' | 'feature-add' | 'validation' | 'deployment';

    /** Match specific node name */
    nodeName?: string;

    /** Match specific stage */
    stage?: 'planning' | 'building' | 'editing' | 'deploying' | 'complete';

    /** Custom condition function (evaluated at runtime) */
    customCheck?: (state: AppGenState, eventData?: any) => boolean;
  };

  /** Message configuration */
  message: {
    /** Message content (can be string or template function) */
    content: string | ((data: any, state?: AppGenState) => string);

    /** Visual bubble type */
    bubbleType: BubbleType;

    /** Optional metadata */
    metadata?: {
      /** Node that sends this message */
      nodeId?: string;

      /** Whether message requires user response */
      requiresResponse?: boolean;

      /** Custom type field */
      type?: string;
    };

    /** Optional action buttons */
    actions?: Array<{
      /** Action type (for handler lookup) */
      type: string;

      /** Button label */
      label: string;

      /** Handler function name or API endpoint */
      handler: string;

      /** Optional data passed to handler */
      data?: Record<string, any>;

      /** Whether button is disabled */
      disabled?: boolean;

      /** Reason for disabled state */
      disabledReason?: string;
    }>;

    /** Optional alerts/notifications */
    alerts?: {
      /** Show alert? */
      show: boolean;

      /** Alert type */
      type: 'info' | 'warning' | 'success' | 'error';

      /** Alert message */
      message: string;

      /** Alert position */
      position?: 'top' | 'bottom' | 'inline';
    };
  };

  /** Priority (higher = shown first if multiple configs match) */
  priority: number;

  /** Whether this config is enabled */
  enabled: boolean;

  /** Version (for A/B testing) */
  version?: string;

  /** Target audience (for segmentation) */
  audience?: 'all' | 'new-users' | 'power-users' | 'beta-testers';
}

/**
 * Default message configurations for common workflows
 */
export const DEFAULT_MESSAGE_CONFIGS: MessageConfig[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WORKFLOW START MESSAGES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'workflow-start-initial',
    name: 'Initial Generation Start',
    description: 'Message shown when starting initial app generation',
    trigger: 'workflow:start',
    conditions: {
      workflowType: 'initial-generation',
      stage: 'planning',
    },
    message: {
      content: 'Starting to build your app...',
      bubbleType: 'assistant',
      metadata: {
        type: 'info',
      },
    },
    priority: 100,
    enabled: true,
    version: '1.0',
    audience: 'all',
  },

  {
    id: 'workflow-start-editing',
    name: 'Editing Workflow Start',
    description: 'Message shown when starting edit workflow',
    trigger: 'workflow:start',
    conditions: {
      workflowType: 'editing',
      stage: 'editing',
    },
    message: {
      content: 'Making your requested changes...',
      bubbleType: 'assistant',
      metadata: {
        type: 'info',
      },
    },
    priority: 90,
    enabled: true,
    version: '1.0',
    audience: 'all',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // NODE COMPLETION MESSAGES WITH ACTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'backend-complete-with-actions',
    name: 'Backend Complete with API Docs Button',
    description: 'Backend completion message with action to view API docs',
    trigger: 'node:complete',
    conditions: {
      nodeName: 'backend',
    },
    message: {
      content: (data) => {
        const collectionCount = data?.collections?.length || 0;
        const endpointCount = data?.endpoints?.length || 0;
        return `Backend ready with ${collectionCount} ${collectionCount === 1 ? 'collection' : 'collections'} and ${endpointCount} API ${endpointCount === 1 ? 'endpoint' : 'endpoints'}`;
      },
      bubbleType: 'success',
      actions: [
        {
          type: 'view-api-docs',
          label: 'View API Docs',
          handler: 'openApiDocs',
          disabled: false,
        },
      ],
    },
    priority: 80,
    enabled: true,
    version: '1.0',
    audience: 'all',
  },

  {
    id: 'deployment-success-with-launch',
    name: 'Deployment Success with Launch Button',
    description: 'Deployment success message with button to launch app',
    trigger: 'deployment:complete',
    message: {
      content: (data) => {
        const url = data?.deployUrl || 'your app';
        return `Your app has been deployed successfully! 🚀`;
      },
      bubbleType: 'success',
      actions: [
        {
          type: 'launch-app',
          label: 'Launch App',
          handler: 'openDeployedApp',
          disabled: false,
        },
        {
          type: 'share-app',
          label: 'Share',
          handler: 'shareApp',
          disabled: false,
        },
      ],
    },
    priority: 100,
    enabled: true,
    version: '1.0',
    audience: 'all',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ERROR MESSAGES WITH ALERTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'workflow-error-with-support',
    name: 'Workflow Error with Support Alert',
    description: 'Error message with alert and support action',
    trigger: 'workflow:error',
    message: {
      content: (data) => {
        const errorMsg = data?.error || 'Unknown error';
        return `Something went wrong: ${errorMsg}`;
      },
      bubbleType: 'error',
      alerts: {
        show: true,
        type: 'error',
        message: 'Our team has been notified. You can try again or contact support.',
        position: 'inline',
      },
      actions: [
        {
          type: 'retry',
          label: 'Try Again',
          handler: 'retryWorkflow',
          disabled: false,
        },
        {
          type: 'contact-support',
          label: 'Contact Support',
          handler: 'openSupportChat',
          disabled: false,
        },
      ],
    },
    priority: 100,
    enabled: true,
    version: '1.0',
    audience: 'all',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FEATURE SUGGESTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'feature-suggestions',
    name: 'Suggested Features After Completion',
    description: 'Show suggested features after workflow completes',
    trigger: 'workflow:complete',
    conditions: {
      workflowType: 'initial-generation',
      customCheck: (state) => {
        // Only show if we have suggested features
        const allFeatures = state.allRequestedFeatures?.length || 0;
        const phase1Features = state.phase1Features?.length || 0;
        return allFeatures > phase1Features;
      },
    },
    message: {
      content: 'Your app is ready! Here are some features you might want to add:',
      bubbleType: 'assistant',
      metadata: {
        type: 'info',
      },
    },
    priority: 50,
    enabled: true,
    version: '1.0',
    audience: 'all',
  },
];

/**
 * Match message configs to current workflow state and event
 */
export function matchMessageConfigs(
  trigger: MessageConfig['trigger'],
  state: AppGenState,
  eventData?: any
): MessageConfig[] {
  return DEFAULT_MESSAGE_CONFIGS.filter((config) => {
    // Must match trigger
    if (config.trigger !== trigger) return false;

    // Must be enabled
    if (!config.enabled) return false;

    // Check conditions if specified
    if (config.conditions) {
      const { workflowType, nodeName, stage, customCheck } = config.conditions;

      // Check workflow type
      if (workflowType && state.workflowType !== workflowType) {
        return false;
      }

      // Check node name
      if (nodeName && eventData?.nodeName !== nodeName) {
        return false;
      }

      // Check stage
      if (stage && state.stage !== stage) {
        return false;
      }

      // Check custom condition
      if (customCheck && !customCheck(state, eventData)) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)
}

/**
 * Get the best matching config for current context
 */
export function getBestMatchingConfig(
  trigger: MessageConfig['trigger'],
  state: AppGenState,
  eventData?: any
): MessageConfig | null {
  const matches = matchMessageConfigs(trigger, state, eventData);
  return matches[0] || null;
}

/**
 * Render message content from config
 */
export function renderMessageContent(
  config: MessageConfig,
  data: any,
  state?: AppGenState
): string {
  const { content } = config.message;

  if (typeof content === 'function') {
    return content(data, state);
  }

  return content;
}

/**
 * Get message configuration by ID
 */
export function getMessageConfigById(id: string): MessageConfig | null {
  return DEFAULT_MESSAGE_CONFIGS.find((config) => config.id === id) || null;
}

/**
 * Add or update message configuration
 * (For admin UI - allows runtime config updates)
 */
export function upsertMessageConfig(config: MessageConfig): void {
  const existingIndex = DEFAULT_MESSAGE_CONFIGS.findIndex((c) => c.id === config.id);

  if (existingIndex >= 0) {
    // Update existing
    DEFAULT_MESSAGE_CONFIGS[existingIndex] = config;
  } else {
    // Add new
    DEFAULT_MESSAGE_CONFIGS.push(config);
  }
}

/**
 * Disable message configuration by ID
 */
export function disableMessageConfig(id: string): void {
  const config = DEFAULT_MESSAGE_CONFIGS.find((c) => c.id === id);
  if (config) {
    config.enabled = false;
  }
}

/**
 * Enable message configuration by ID
 */
export function enableMessageConfig(id: string): void {
  const config = DEFAULT_MESSAGE_CONFIGS.find((c) => c.id === id);
  if (config) {
    config.enabled = true;
  }
}
