// lib/messaging/message-types.ts
/**
 * UNIFIED MESSAGE TYPES
 *
 * Defines all possible message events that can be sent to users.
 * Uses discriminated union for type safety.
 *
 * CRITICAL: This is the single source of truth for all user-facing messages.
 */

export type MessageType = 'success' | 'error' | 'info' | 'question' | 'warning';

/**
 * UI bubble types - explicit display styling
 * These map to specific visual treatments in ChatBubble component
 */
export type BubbleType =
  | 'user'
  | 'assistant'
  | 'thinking'
  | 'plan'
  | 'confirmation'
  | 'success'
  | 'error'
  | 'warning'
  | 'edit';

/**
 * Base message metadata
 */
export interface MessageMetadata {
  nodeId: string;
  requiresResponse?: boolean;
  inputType?: 'api_key' | 'code_snippet' | 'env_var' | 'url' | 'clarification';
  actions?: MessageAction[];
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Message actions (buttons/links user can interact with)
 */
export interface MessageAction {
  type: 'rollback' | 'feature-add' | 'confirmation' | 'view-details';
  label: string;
  data?: any;
}

/**
 * UNIFIED MESSAGE INTERFACE
 * Single source of truth for messages across backend and frontend
 *
 * This replaces:
 * - Frontend Message interface in ChatPanelClaude
 * - Backend MessageTemplate
 * - Stored Message in conversation-memory
 */
export interface UnifiedMessage {
  // Core message content
  role: 'user' | 'assistant' | 'system';
  content: string;

  // Explicit UI styling (no keyword detection needed)
  bubbleType?: BubbleType;

  // Metadata for functionality
  metadata: MessageMetadata;

  // Timestamp for ordering and deduplication
  timestamp: Date;

  // NEW: Expandable details for workflow messages
  details?: string;

  // User actions (buttons, confirmations, etc.)
  action?: {
    type: 'confirm-plan' | 'regenerate';
    label: string;
    onClick?: () => void; // Frontend only, not serialized
  };

  // Feature actions (Phase 2 feature suggestions)
  actions?: Array<{
    type: 'feature-add';
    featureId: string;
    label: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    disabled?: boolean;
    disabledReason?: string;
  }>;
}

/**
 * LEGACY: Formatted message ready for display
 * @deprecated Use UnifiedMessage instead
 */
export interface MessageTemplate {
  type: MessageType;
  content: string;
  metadata: MessageMetadata;
}

/**
 * ALL POSSIBLE MESSAGE EVENTS (Discriminated Union)
 *
 * Each event type has specific required fields.
 * TypeScript ensures all fields are provided.
 */
export type MessageEvent =
  // PM Node Events
  | {
      type: 'plan-ready';
      plan: string;
      phase1Features: string[];
      phase2Count: number;
      coreValue?: string;
      mvpFlow?: string[];
      details?: string; // Expandable details
    }
  | {
      type: 'incremental-feature-planned';
      featureCount: number;
      features: string[];
    }

  // UX Node Events
  | {
      type: 'design-ready';
      designSystem: string;
      colorPalette: { primary: string; secondary: string; accent: string };
      typography: string;
      componentCount: number;
    }

  // Frontend Node Events
  | {
      type: 'file-generation-complete';
      filesCreated: number;
      componentCount: number;
      routeCount: number;
      mainFeatures: string[];
      details?: string; // Expandable details
    }

  // Backend Node Events
  | {
      type: 'backend-complete';
      collections: Array<{ name: string; fields: string[] }>;
      endpoints: Array<{ method: string; path: string; description: string }>;
      needsAuth: boolean;
      details?: string; // Expandable details
    }

  // QA Node Events
  | {
      type: 'validation-complete';
      valid: boolean;
      errorCount: number;
      warningCount: number;
      autoFixedCount: number;
      criticalIssues?: string[];
      details?: string; // Expandable details
    }

  // DevOps Node Events
  | {
      type: 'deployment-success';
      filesDeployed: number;
      userFiles: number;
      scaffoldFiles: number;
      collections: string[];
      implementedFeatures: string[];
      previewUrl: string;
      details?: string; // Expandable details
    }
  | {
      type: 'deployment-failed';
      error: string;
      context?: string;
      filesGenerated: boolean;
    }

  // Context Analyzer Events
  | {
      type: 'analysis-complete';
      changeScope: 'minor' | 'moderate' | 'major';
      requiresFullWorkflow: boolean;
      interpretation: string;
      plan: string;
    }
  | {
      type: 'clarification-needed';
      question: string;
      reason: string;
    }

  // Editor Node Events
  | {
      type: 'editing-complete';
      editedFiles: string[];
      changesApplied: Array<{ type: string; description: string }>;
      summary: string;
    }
  | {
      type: 'rollback-offer';
      editedFiles: string[];
      changes: string;
      checkpointId: string;
    }

  // Input Detector Events
  | {
      type: 'input-required';
      question: string;
      inputType: 'api_key' | 'code_snippet' | 'env_var' | 'url' | 'clarification';
      reason: string;
    }

  // Generic Events
  | {
      type: 'success';
      message: string;
      details?: string;
    }
  | {
      type: 'error';
      error: string;
      context?: string;
      suggestion?: string;
    }
  | {
      type: 'question';
      question: string;
      inputType?: string;
    }
  | {
      type: 'info';
      message: string;
    }
  | {
      type: 'warning';
      message: string;
      action?: string;
    };

/**
 * Format a MessageEvent into a user-facing UnifiedMessage
 *
 * This is the SINGLE source of truth for message formatting.
 * Change format here, all nodes updated automatically.
 *
 * CRITICAL: Always sets explicit bubbleType - no keyword detection needed!
 */
export function formatMessageEvent(event: MessageEvent, nodeId: string): UnifiedMessage {
  const timestamp = new Date();

  switch (event.type) {
    // PM Node
    case 'plan-ready':
      return {
        role: 'assistant',
        content: formatPlanReadyMessage(event),
        bubbleType: 'success',
        metadata: { nodeId, priority: 'high' },
        timestamp,
        details: event.details || formatPlanDetails(event),
      };

    case 'incremental-feature-planned':
      return {
        role: 'assistant',
        content: `🎯 Implementing ${event.featureCount} feature(s) immediately:\n\n${event.features.map((f) => `- ${f}`).join('\n')}`,
        bubbleType: 'assistant',
        metadata: { nodeId },
        timestamp,
      };

    // UX Node
    case 'design-ready':
      return {
        role: 'assistant',
        content: formatDesignReadyMessage(event),
        bubbleType: 'success',
        metadata: { nodeId },
        timestamp,
      };

    // Frontend Node
    case 'file-generation-complete':
      return {
        role: 'assistant',
        content: formatFileGenerationMessage(event),
        bubbleType: 'success',
        metadata: { nodeId },
        timestamp,
      };

    // Backend Node
    case 'backend-complete':
      return {
        role: 'assistant',
        content: formatBackendCompleteMessage(event),
        bubbleType: 'success',
        metadata: { nodeId },
        timestamp,
        details: event.details || formatBackendDetails(event),
      };

    // QA Node
    case 'validation-complete':
      return {
        role: 'assistant',
        content: formatValidationCompleteMessage(event),
        bubbleType: event.valid ? 'success' : 'warning',
        metadata: { nodeId },
        timestamp,
        details: event.details || formatValidationDetails(event),
      };

    // DevOps Node
    case 'deployment-success':
      return {
        role: 'assistant',
        content: formatDeploymentSuccessMessage(event),
        bubbleType: 'success',
        metadata: { nodeId, priority: 'high' },
        timestamp,
        details: event.details || formatDeploymentDetails(event),
      };

    case 'deployment-failed':
      return {
        role: 'assistant',
        content: `❌ **Deployment Failed**\n\n${event.error}${event.context ? `\n\n**Context:** ${event.context}` : ''}${event.filesGenerated ? '\n\n*Note: Files were generated but could not be deployed.*' : ''}`,
        bubbleType: 'error',
        metadata: { nodeId, priority: 'high' },
        timestamp,
      };

    // Context Analyzer
    case 'analysis-complete':
      return {
        role: 'assistant',
        content: `Got it! I'll ${event.changeScope === 'minor' ? 'make a quick edit' : 'analyze and update'} your app.\n\n**Understanding:** ${event.interpretation}\n\n**Plan:** ${event.plan}`,
        bubbleType: 'assistant',
        metadata: { nodeId },
        timestamp,
      };

    case 'clarification-needed':
      return {
        role: 'assistant',
        content: `I need clarification about your request.\n\n**Question:** ${event.question}\n\n**Why I'm asking:** ${event.reason}`,
        bubbleType: 'warning',
        metadata: { nodeId, requiresResponse: true, inputType: 'clarification' },
        timestamp,
      };

    // Editor Node
    case 'editing-complete':
      return {
        role: 'assistant',
        content: formatEditingCompleteMessage(event),
        bubbleType: 'edit',
        metadata: { nodeId },
        timestamp,
      };

    case 'rollback-offer':
      return {
        role: 'assistant',
        content: formatRollbackOfferMessage(event),
        bubbleType: 'assistant',
        metadata: {
          nodeId,
          actions: [
            { type: 'rollback', label: 'Undo Changes', data: { checkpointId: event.checkpointId } },
          ],
        },
        timestamp,
      };

    // Input Detector
    case 'input-required':
      return {
        role: 'assistant',
        content: `${event.question}\n\n**Why I need this:** ${event.reason}`,
        bubbleType: 'warning',
        metadata: { nodeId, requiresResponse: true, inputType: event.inputType },
        timestamp,
      };

    // Generic Events
    case 'success':
      return {
        role: 'assistant',
        content: `✅ ${event.message}${event.details ? `\n\n${event.details}` : ''}`,
        bubbleType: 'success',
        metadata: { nodeId },
        timestamp,
      };

    case 'error':
      return {
        role: 'assistant',
        content: `❌ **Error:** ${event.error}${event.context ? `\n\n**Context:** ${event.context}` : ''}${event.suggestion ? `\n\n**Suggestion:** ${event.suggestion}` : ''}`,
        bubbleType: 'error',
        metadata: { nodeId, priority: 'high' },
        timestamp,
      };

    case 'question':
      return {
        role: 'assistant',
        content: event.question,
        bubbleType: 'warning',
        metadata: { nodeId, requiresResponse: true, inputType: event.inputType as any },
        timestamp,
      };

    case 'info':
      return {
        role: 'assistant',
        content: `💡 ${event.message}`,
        bubbleType: 'assistant',
        metadata: { nodeId },
        timestamp,
      };

    case 'warning':
      return {
        role: 'assistant',
        content: `⚠️ ${event.message}${event.action ? `\n\n**Action needed:** ${event.action}` : ''}`,
        bubbleType: 'warning',
        metadata: { nodeId },
        timestamp,
      };

    default: {
      // TypeScript ensures this is unreachable if all cases handled
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

/**
 * HELPER FORMATTERS
 * Consistent formatting for complex messages
 */

function formatPlanReadyMessage(event: Extract<MessageEvent, { type: 'plan-ready' }>): string {
  // Summary message only - details go in expandable section
  return `Creating plan for ${event.phase1Features.length} feature${event.phase1Features.length === 1 ? '' : 's'}${event.phase2Count > 0 ? ` (${event.phase2Count} more in Phase 2)` : ''}`;
}

function formatPlanDetails(event: Extract<MessageEvent, { type: 'plan-ready' }>): string {
  const sections: string[] = [];

  // Add plan
  sections.push(event.plan);

  // Add divider
  sections.push('\n---\n');

  // Show feature count
  sections.push(`**Building ${event.phase1Features.length} feature${event.phase1Features.length === 1 ? '' : 's'} now:**`);
  event.phase1Features.forEach(f => sections.push(`- ${f}`));

  if (event.phase2Count > 0) {
    sections.push('');
    sections.push(`*${event.phase2Count} additional feature${event.phase2Count === 1 ? '' : 's'} planned for Phase 2*`);
  }

  // Add core value if provided
  if (event.coreValue) {
    sections.push('');
    sections.push(`**Core Value:** ${event.coreValue}`);
  }

  // Add MVP flow if provided
  if (event.mvpFlow && event.mvpFlow.length > 0) {
    sections.push('');
    sections.push(`**MVP Flow:** ${event.mvpFlow.join(' → ')}`);
  }

  return sections.join('\n');
}

function formatDesignReadyMessage(event: Extract<MessageEvent, { type: 'design-ready' }>): string {
  return `✨ **Design System Ready**

**Style:** ${event.designSystem}

**Colors:**
- Primary: ${event.colorPalette.primary}
- Secondary: ${event.colorPalette.secondary}
- Accent: ${event.colorPalette.accent}

**Typography:** ${event.typography}

**Components:** ${event.componentCount} shadcn/ui components configured`;
}

function formatFileGenerationMessage(
  event: Extract<MessageEvent, { type: 'file-generation-complete' }>
): string {
  return `✅ **Files Generated**

**Created:** ${event.filesCreated} files
- ${event.componentCount} components
- ${event.routeCount} routes

**Main Features:**
${event.mainFeatures.map((f) => `✅ ${f}`).join('\n')}`;
}

function formatBackendCompleteMessage(
  event: Extract<MessageEvent, { type: 'backend-complete' }>
): string {
  // Summary only
  return `Generated ${event.collections.length} database collection${event.collections.length === 1 ? '' : 's'} and ${event.endpoints.length} API endpoint${event.endpoints.length === 1 ? '' : 's'}`;
}

function formatBackendDetails(
  event: Extract<MessageEvent, { type: 'backend-complete' }>
): string {
  const sections: string[] = [];

  // Collections
  sections.push(`**Database Collections (${event.collections.length}):**`);
  event.collections.forEach((col) => {
    sections.push(`- **${col.name}**: ${col.fields.join(', ')}`);
  });
  sections.push('');

  // API Endpoints
  sections.push(`**API Endpoints (${event.endpoints.length}):**`);
  event.endpoints.forEach((ep) => {
    sections.push(`- ${ep.method} ${ep.path}: ${ep.description}`);
  });

  // Auth warning
  if (event.needsAuth) {
    sections.push('');
    sections.push('🔐 *Authentication endpoints included*');
  }

  return sections.join('\n');
}

function formatValidationCompleteMessage(
  event: Extract<MessageEvent, { type: 'validation-complete' }>
): string {
  if (event.valid) {
    return `All validation checks passed successfully!`;
  }
  return `Found ${event.errorCount} error${event.errorCount === 1 ? '' : 's'} and ${event.warningCount} warning${event.warningCount === 1 ? '' : 's'}`;
}

function formatValidationDetails(
  event: Extract<MessageEvent, { type: 'validation-complete' }>
): string {
  if (event.valid) {
    return `All checks passed successfully!${event.autoFixedCount > 0 ? `\n\n*Auto-fixed ${event.autoFixedCount} minor issue(s)*` : ''}`;
  }

  const sections: string[] = [];
  sections.push(`**Validation Results:**`);
  sections.push(`- Errors: ${event.errorCount}`);
  sections.push(`- Warnings: ${event.warningCount}`);

  if (event.autoFixedCount > 0) {
    sections.push(`- Auto-fixed: ${event.autoFixedCount}`);
  }

  if (event.criticalIssues && event.criticalIssues.length > 0) {
    sections.push('');
    sections.push('**Critical Issues:**');
    event.criticalIssues.forEach((issue) => {
      sections.push(`- ${issue}`);
    });
  }

  return sections.join('\n');
}

function formatDeploymentSuccessMessage(
  event: Extract<MessageEvent, { type: 'deployment-success' }>
): string {
  return `Deployed ${event.filesDeployed} files successfully!`;
}

function formatDeploymentDetails(
  event: Extract<MessageEvent, { type: 'deployment-success' }>
): string {
  const sections: string[] = [];

  sections.push(
    `**Files Deployed:** ${event.filesDeployed} total (${event.userFiles} app files + ${event.scaffoldFiles} config files)`
  );
  sections.push('');

  // Database info
  if (event.collections.length > 0) {
    sections.push(`**Database:**`);
    sections.push(
      `${event.collections.length} collection${event.collections.length > 1 ? 's' : ''}: ${event.collections.join(', ')}`
    );
    sections.push('');
  }

  // Implemented features
  if (event.implementedFeatures.length > 0) {
    sections.push(`**Implemented Features:**`);
    event.implementedFeatures.forEach(f => sections.push(`- ${f}`));
    sections.push('');
  }

  sections.push('The app is ready - you can preview it now! ✨');

  return sections.join('\n');
}

function formatEditingCompleteMessage(
  event: Extract<MessageEvent, { type: 'editing-complete' }>
): string {
  return `✅ **Success!** I updated ${event.editedFiles.length} file(s).

**Changes:**
${event.changesApplied.map((c) => `- ${c.type}: ${c.description}`).join('\n')}

${event.summary}`;
}

function formatRollbackOfferMessage(
  event: Extract<MessageEvent, { type: 'rollback-offer' }>
): string {
  return `✅ **Changes Applied**

**Edited Files:**
${event.editedFiles.map((f) => `- ${f}`).join('\n')}

**Summary:**
${event.changes}

*Not happy with the changes? You can undo them.*`;
}

/**
 * UTILITY: Format feature list consistently
 */
export function formatFeatureList(features: Array<{ name: string } | string>): string {
  return features.map((f) => (typeof f === 'string' ? `✅ ${f}` : `✅ ${f.name}`)).join('\n');
}

/**
 * UTILITY: Format collection list consistently
 */
export function formatCollectionList(
  collections: Array<{ name: string; fields?: string[] }>
): string {
  return collections
    .map((c) => {
      if (c.fields && c.fields.length > 0) {
        return `- **${c.name}**: ${c.fields.join(', ')}`;
      }
      return `- ${c.name}`;
    })
    .join('\n');
}
