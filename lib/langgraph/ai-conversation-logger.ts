// lib/langgraph/ai-conversation-logger.ts

import { workflowEvents } from './events';
import {
  LOGGING_CONFIG,
  truncateIfNeeded,
  createPreview,
  shouldLog
} from './logging-config';
import { nanoid } from 'nanoid';

/**
 * Represents a single AI conversation (prompt + response)
 */
export interface AIConversation {
  id: string;
  projectId: string;
  nodeName: string;
  callType: 'analysis' | 'generation' | 'validation' | 'fix' | 'review' | 'planning' | 'other';
  model: string;
  provider: string;  // 'gemini', 'openrouter', 'puter'

  // Timing
  startTime: string;
  endTime?: string;
  duration?: number;

  // Content (can be truncated if too large)
  prompt: string;
  response?: string;

  // Metadata
  tokens?: number;
  estimatedTokens?: number;
  attempt: number;
  fallbacks: string[];  // Models that were tried before success

  // Status
  success: boolean;
  error?: string;

  // For quick preview
  promptPreview: string;
  responsePreview?: string;
}

/**
 * Singleton service for logging AI conversations
 */
class AIConversationLogger {
  private conversations: Map<string, AIConversation[]> = new Map();
  private activeCallsMap: Map<string, AIConversation> = new Map();

  /**
   * Start tracking an AI call
   */
  startAICall(params: {
    projectId: string;
    nodeName: string;
    callType: AIConversation['callType'];
    model: string;
    provider: string;
    prompt: string;
    estimatedTokens?: number;
    attempt?: number;
  }): string {
    const callId = nanoid();
    const startTime = new Date().toISOString();

    const conversation: AIConversation = {
      id: callId,
      projectId: params.projectId,
      nodeName: params.nodeName,
      callType: params.callType,
      model: params.model,
      provider: params.provider,
      startTime,
      prompt: shouldLog('logAIPrompts')
        ? truncateIfNeeded(params.prompt, LOGGING_CONFIG.maxPromptLength)
        : '[Prompt logging disabled]',
      promptPreview: createPreview(params.prompt, LOGGING_CONFIG.promptPreviewLength),
      estimatedTokens: params.estimatedTokens,
      attempt: params.attempt || 1,
      fallbacks: [],
      success: false
    };

    // Store active call
    this.activeCallsMap.set(callId, conversation);

    // Emit start event
    if (shouldLog('enableSSE')) {
      workflowEvents.emit('ai:call:start', {
        type: 'ai:call:start',
        callId,
        projectId: params.projectId,
        nodeName: params.nodeName,
        callType: params.callType,
        model: params.model,
        provider: params.provider,
        promptPreview: conversation.promptPreview,
        estimatedTokens: params.estimatedTokens,
        attempt: params.attempt || 1,
        timestamp: startTime
      });
    }

    if (shouldLog('enableConsole') && LOGGING_CONFIG.debugMode) {
      console.log(`[AI Call] START ${params.nodeName} - ${params.callType} (${params.model}, ~${params.estimatedTokens || '?'} tokens)`);
    }

    return callId;
  }

  /**
   * Complete an AI call (success)
   */
  completeAICall(callId: string, params: {
    response: string;
    tokens?: number;
    fallbacks?: string[];
  }): void {
    const conversation = this.activeCallsMap.get(callId);
    if (!conversation) {
      console.warn(`[AI Conversation Logger] Call ID ${callId} not found`);
      return;
    }

    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(conversation.startTime).getTime();

    // Update conversation
    conversation.endTime = endTime;
    conversation.duration = duration;
    conversation.response = shouldLog('logAIResponses')
      ? truncateIfNeeded(params.response, LOGGING_CONFIG.maxResponseLength)
      : '[Response logging disabled]';
    conversation.responsePreview = createPreview(params.response, LOGGING_CONFIG.responsePreviewLength);
    conversation.tokens = params.tokens;
    conversation.fallbacks = params.fallbacks || [];
    conversation.success = true;

    // Store in project conversations
    this.storeConversation(conversation);

    // Remove from active calls
    this.activeCallsMap.delete(callId);

    // Emit complete event
    if (shouldLog('enableSSE')) {
      workflowEvents.emit('ai:call:complete', {
        type: 'ai:call:complete',
        callId,
        projectId: conversation.projectId,
        nodeName: conversation.nodeName,
        callType: conversation.callType,
        model: conversation.model,
        provider: conversation.provider,
        duration,
        tokens: params.tokens,
        responsePreview: conversation.responsePreview,
        fallbackUsed: (params.fallbacks?.length || 0) > 0,
        success: true,
        timestamp: endTime
      });
    }

    if (shouldLog('enableConsole') && LOGGING_CONFIG.debugMode) {
      console.log(`[AI Call] COMPLETE ${conversation.nodeName} - ${conversation.callType} (${duration}ms, ${params.tokens || '?'} tokens)`);
    }
  }

  /**
   * Fail an AI call
   */
  failAICall(callId: string, error: Error | string): void {
    const conversation = this.activeCallsMap.get(callId);
    if (!conversation) {
      console.warn(`[AI Conversation Logger] Call ID ${callId} not found`);
      return;
    }

    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(conversation.startTime).getTime();

    // Update conversation
    conversation.endTime = endTime;
    conversation.duration = duration;
    conversation.success = false;
    conversation.error = typeof error === 'string' ? error : error.message;

    // Store in project conversations
    this.storeConversation(conversation);

    // Remove from active calls
    this.activeCallsMap.delete(callId);

    // Emit error event
    if (shouldLog('enableSSE')) {
      workflowEvents.emit('ai:call:error', {
        type: 'ai:call:error',
        callId,
        projectId: conversation.projectId,
        nodeName: conversation.nodeName,
        callType: conversation.callType,
        model: conversation.model,
        duration,
        error: conversation.error,
        timestamp: endTime
      });
    }

    if (shouldLog('enableConsole')) {
      console.error(`[AI Call] ERROR ${conversation.nodeName} - ${conversation.callType}: ${conversation.error}`);
    }
  }

  /**
   * Store conversation in project list
   */
  private storeConversation(conversation: AIConversation): void {
    const projectConversations = this.conversations.get(conversation.projectId) || [];
    projectConversations.push(conversation);

    // Limit conversations per project
    if (projectConversations.length > LOGGING_CONFIG.maxConversationsPerProject) {
      projectConversations.shift(); // Remove oldest
    }

    this.conversations.set(conversation.projectId, projectConversations);
  }

  /**
   * Get all conversations for a project
   */
  getConversations(projectId: string): AIConversation[] {
    return this.conversations.get(projectId) || [];
  }

  /**
   * Get conversations for a specific node
   */
  getNodeConversations(projectId: string, nodeName: string): AIConversation[] {
    const allConversations = this.getConversations(projectId);
    return allConversations.filter(c => c.nodeName === nodeName);
  }

  /**
   * Get summary statistics for a project
   */
  getProjectStats(projectId: string): {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalDuration: number;
    totalTokens: number;
    averageDuration: number;
    modelUsage: Record<string, number>;
    callTypeBreakdown: Record<string, number>;
  } {
    const conversations = this.getConversations(projectId);

    const stats = {
      totalCalls: conversations.length,
      successfulCalls: conversations.filter(c => c.success).length,
      failedCalls: conversations.filter(c => !c.success).length,
      totalDuration: conversations.reduce((sum, c) => sum + (c.duration || 0), 0),
      totalTokens: conversations.reduce((sum, c) => sum + (c.tokens || 0), 0),
      averageDuration: 0,
      modelUsage: {} as Record<string, number>,
      callTypeBreakdown: {} as Record<string, number>
    };

    stats.averageDuration = stats.totalCalls > 0
      ? stats.totalDuration / stats.totalCalls
      : 0;

    // Model usage
    conversations.forEach(c => {
      stats.modelUsage[c.model] = (stats.modelUsage[c.model] || 0) + 1;
    });

    // Call type breakdown
    conversations.forEach(c => {
      stats.callTypeBreakdown[c.callType] = (stats.callTypeBreakdown[c.callType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export conversations to JSON
   */
  exportConversations(projectId: string): string {
    const conversations = this.getConversations(projectId);
    const stats = this.getProjectStats(projectId);

    return JSON.stringify({
      projectId,
      timestamp: new Date().toISOString(),
      stats,
      conversations
    }, null, 2);
  }

  /**
   * Clear conversations for a project (memory management)
   */
  clearProject(projectId: string): void {
    this.conversations.delete(projectId);
  }

  /**
   * Clear all conversations (memory management)
   */
  clearAll(): void {
    this.conversations.clear();
    this.activeCallsMap.clear();
  }
}

// Singleton instance
export const aiConversationLogger = new AIConversationLogger();
