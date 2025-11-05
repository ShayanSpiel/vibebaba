// lib/langgraph/ai-with-logging.ts

import { generateWithFallback, AIGenerationResult } from '../ai';
import { aiConversationLogger, AIConversation } from './ai-conversation-logger';
import { shouldLog } from './logging-config';

/**
 * Wrapper around generateWithFallback that adds comprehensive logging
 *
 * This should be used by all LangGraph nodes instead of calling generateWithFallback directly
 */
export async function generateWithLogging(params: {
  prompt: string;
  projectId: string;
  nodeName: string;
  callType: AIConversation['callType'];
  estimatedTokens?: number;
  attempt?: number;
}): Promise<string> {
  const { prompt, projectId, nodeName, callType, estimatedTokens, attempt } = params;

  // Start logging (this emits ai:call:start event)
  const callId = aiConversationLogger.startAICall({
    projectId,
    nodeName,
    callType,
    model: 'auto-detect',  // Will be updated after generation
    provider: 'auto-detect',
    prompt,
    estimatedTokens,
    attempt
  });

  try {
    // Call the actual AI generation with metadata
    const result: AIGenerationResult = await generateWithFallback(prompt, true);

    // Complete logging (this emits ai:call:complete event)
    // OPTIMIZATION: Use actual token count from API response if available, otherwise estimate
    const actualTokens = result.tokenCount || estimatedTokens;
    aiConversationLogger.completeAICall(callId, {
      response: result.text,
      tokens: actualTokens,
      fallbacks: result.attemptsLog.filter(log => log.includes('FAILED')).map(log => {
        const match = log.match(/FAILED: ([^\s]+)/);
        return match ? match[1] : 'unknown';
      })
    });

    // Update the call with the actual model used
    const conversations = aiConversationLogger.getConversations(projectId);
    const lastConversation = conversations[conversations.length - 1];
    if (lastConversation && lastConversation.id === callId) {
      lastConversation.model = result.model;
      lastConversation.provider = result.provider;
    }

    return result.text;
  } catch (error) {
    // Fail logging (this emits ai:call:error event)
    aiConversationLogger.failAICall(callId, error as Error);
    throw error;
  }
}

/**
 * Helper to estimate tokens from prompt length
 * Rough estimate: 1 token ≈ 4 characters for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get AI conversation summary for a project (for debugging)
 */
export function getAIConversationSummary(projectId: string) {
  return aiConversationLogger.getProjectStats(projectId);
}

/**
 * Export AI conversations for a project (for debugging)
 */
export function exportAIConversations(projectId: string): string {
  return aiConversationLogger.exportConversations(projectId);
}
