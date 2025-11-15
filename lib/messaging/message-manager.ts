// lib/messaging/message-manager.ts
/**
 * UNIFIED MESSAGE MANAGER
 *
 * Single API for sending messages to users.
 * Handles both:
 * - Persistence (conversation memory in database)
 * - Display (real-time SSE events to UI)
 *
 * CRITICAL: Use this instead of calling addAssistantMessage() + emitChatMessage() separately.
 */

import { emitChatMessage } from '@/lib/langgraph/utils/logging/events';
import { addAssistantMessage, conversationMemoryStore } from '@/lib/memory/conversation-memory';
import type { MessageEvent, UnifiedMessage } from './message-types';
import { formatMessageEvent } from './message-types';

export interface SendMessageOptions {
  /**
   * Save to conversation memory database (default: true)
   */
  persist?: boolean;

  /**
   * Display in UI via SSE (default: true)
   */
  display?: boolean;

  /**
   * Message priority (affects UI styling)
   */
  priority?: 'high' | 'normal' | 'low';

  /**
   * Skip if identical message sent recently (prevents duplicates)
   */
  deduplicateWindow?: number; // milliseconds
}

/**
 * Message Manager Singleton
 *
 * Use this for ALL user-facing messages in nodes.
 */
class MessageManager {
  private recentMessages: Map<string, { content: string; timestamp: number }> = new Map();

  /**
   * Send a typed message event (PRIMARY API)
   *
   * @example
   * await messageManager.sendEvent(projectId, {
   *   type: 'plan-ready',
   *   plan,
   *   phase1Features: phase1Features.map(f => f.name),
   *   phase2Count: phase2Features.length
   * }, 'pm');
   */
  async sendEvent(
    projectId: string,
    event: MessageEvent,
    nodeId: string,
    options?: SendMessageOptions
  ): Promise<void> {
    console.log(`[MessageManager] 📨 sendEvent called - type: ${event.type}, nodeId: ${nodeId}`);
    const message = formatMessageEvent(event, nodeId);
    console.log(
      `[MessageManager] 📝 Formatted message (first 200 chars): ${message.content.substring(0, 200)}...`
    );
    await this.sendMessage(projectId, message, options);
  }

  /**
   * Send a pre-formatted message (FALLBACK API)
   *
   * Use this for custom messages not covered by MessageEvent types.
   * Prefer sendEvent() when possible for type safety.
   *
   * @example
   * await messageManager.sendMessage(projectId, {
   *   role: 'assistant',
   *   content: 'Custom message',
   *   bubbleType: 'success',
   *   metadata: { nodeId: 'custom' },
   *   timestamp: new Date()
   * });
   */
  async sendMessage(
    projectId: string,
    message: UnifiedMessage,
    options?: SendMessageOptions
  ): Promise<void> {
    const { persist = true, display = true, priority, deduplicateWindow } = options || {};

    // Deduplication check
    if (deduplicateWindow) {
      const key = `${projectId}:${message.metadata.nodeId}`;
      const recent = this.recentMessages.get(key);
      const now = Date.now();

      if (
        recent &&
        recent.content === message.content &&
        now - recent.timestamp < deduplicateWindow
      ) {
        console.log(
          `[MessageManager] Skipping duplicate message from ${message.metadata.nodeId} (sent ${now - recent.timestamp}ms ago)`
        );
        return;
      }

      // Update recent messages cache
      this.recentMessages.set(key, { content: message.content, timestamp: now });

      // Cleanup old entries (keep last 100)
      if (this.recentMessages.size > 100) {
        const oldest = Array.from(this.recentMessages.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)
          .slice(0, 50);
        oldest.forEach(([k]) => this.recentMessages.delete(k));
      }
    }

    // 1. Persist to conversation memory (database)
    if (persist) {
      try {
        await addAssistantMessage(projectId, message.content, message.metadata.nodeId);
        console.log(`[MessageManager] ✅ Persisted message from ${message.metadata.nodeId}`);
      } catch (error) {
        console.error(`[MessageManager] ❌ Failed to persist message:`, error);
        // Continue to display even if persistence fails
      }
    }

    // 2. Display in UI (SSE)
    if (display) {
      try {
        // Map bubbleType to SSE type (SSE has limited types)
        const mapBubbleTypeToSSEType = (
          bubbleType?: string
        ): 'info' | 'success' | 'warning' | 'question' => {
          switch (bubbleType) {
            case 'success':
              return 'success';
            case 'error':
            case 'warning':
              return 'warning';
            case 'confirmation':
            case 'plan':
              return 'question';
            default:
              return 'info';
          }
        };

        // Send full UnifiedMessage via SSE with bubbleType
        emitChatMessage(projectId, message.content, {
          type: mapBubbleTypeToSSEType(message.bubbleType),
          requiresResponse: message.metadata.requiresResponse,
          inputType: message.metadata.inputType,
          bubbleType: message.bubbleType, // Pass explicit bubble type for client
          metadata: {
            ...message.metadata,
            details: message.details, // NEW: Pass details through metadata
          },
        });
        console.log(
          `[MessageManager] 💬 Displayed message from ${message.metadata.nodeId} (bubbleType: ${message.bubbleType})`
        );
      } catch (error) {
        console.error(`[MessageManager] ❌ Failed to emit chat message:`, error);
      }
    }
  }

  /**
   * Send multiple messages in sequence
   *
   * Useful for complex multi-part messages.
   */
  async sendMessages(
    projectId: string,
    messages: Array<{ event: MessageEvent; nodeId: string }>,
    options?: SendMessageOptions
  ): Promise<void> {
    for (const { event, nodeId } of messages) {
      await this.sendEvent(projectId, event, nodeId, options);
    }
  }

  /**
   * Send a success message (convenience method)
   */
  async sendSuccess(
    projectId: string,
    message: string,
    nodeId: string,
    details?: string,
    options?: SendMessageOptions
  ): Promise<void> {
    await this.sendEvent(projectId, { type: 'success', message, details }, nodeId, options);
  }

  /**
   * Send an error message (convenience method)
   */
  async sendError(
    projectId: string,
    error: string,
    nodeId: string,
    context?: string,
    suggestion?: string,
    options?: SendMessageOptions
  ): Promise<void> {
    await this.sendEvent(
      projectId,
      { type: 'error', error, context, suggestion },
      nodeId,
      { ...options, priority: 'high' } // Errors are always high priority
    );
  }

  /**
   * Send a question (convenience method)
   */
  async sendQuestion(
    projectId: string,
    question: string,
    nodeId: string,
    inputType?: string,
    options?: SendMessageOptions
  ): Promise<void> {
    await this.sendEvent(projectId, { type: 'question', question, inputType }, nodeId, options);
  }

  /**
   * Send an info message (convenience method)
   */
  async sendInfo(
    projectId: string,
    message: string,
    nodeId: string,
    options?: SendMessageOptions
  ): Promise<void> {
    await this.sendEvent(projectId, { type: 'info', message }, nodeId, options);
  }

  /**
   * Send a warning message (convenience method)
   */
  async sendWarning(
    projectId: string,
    message: string,
    nodeId: string,
    action?: string,
    options?: SendMessageOptions
  ): Promise<void> {
    await this.sendEvent(projectId, { type: 'warning', message, action }, nodeId, options);
  }

  /**
   * Clear recent messages cache (for testing)
   */
  clearCache(): void {
    this.recentMessages.clear();
  }
}

/**
 * Singleton instance
 */
export const messageManager = new MessageManager();

/**
 * MIGRATION GUIDE
 *
 * OLD PATTERN (BROKEN - PM node bug):
 * ```typescript
 * // Only saves to memory, never shows in UI!
 * addAssistantMessage(state.projectId, message, 'pm');
 * ```
 *
 * OLD PATTERN (CORRECT BUT VERBOSE):
 * ```typescript
 * // Must remember to call BOTH functions
 * await addAssistantMessage(state.projectId, message, 'pm');
 * emitChatMessage(state.projectId, message, { type: 'success' });
 * ```
 *
 * NEW PATTERN (SIMPLE & TYPE-SAFE):
 * ```typescript
 * // Automatically handles both persistence and display
 * await messageManager.sendEvent(state.projectId, {
 *   type: 'plan-ready',
 *   plan,
 *   phase1Features: phase1Features.map(f => f.name),
 *   phase2Count: phase2Features.length
 * }, 'pm');
 * ```
 *
 * BENEFITS:
 * - ✅ Can't forget to display message (common bug)
 * - ✅ Type-safe (compiler catches missing fields)
 * - ✅ Consistent formatting across all nodes
 * - ✅ Automatic deduplication
 * - ✅ Single place to change message format
 */
