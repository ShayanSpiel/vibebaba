/**
 * Context Relevance Engine
 * Automatically determines what context is needed for each request
 */

import { getMemoryService } from './memory-service';

export interface ContextRequirements {
  needsUserPreferences: boolean;
  needsProjectContext: boolean;
  needsConversationHistory: boolean;
  needsRelatedProjects: boolean;
  needsExamples: boolean;
  needsTemplates: boolean;
}

export class ContextEngine {
  private memoryService = getMemoryService();

  /**
   * Analyze request and determine context needs
   */
  analyzeRequest(request: string, phase: 'planning' | 'prototype' | 'editing'): ContextRequirements {
    const lowerRequest = request.toLowerCase();

    return {
      // User preferences needed if request mentions style/design
      needsUserPreferences:
        lowerRequest.includes('design') ||
        lowerRequest.includes('style') ||
        lowerRequest.includes('color') ||
        lowerRequest.includes('dark') ||
        lowerRequest.includes('light') ||
        phase === 'prototype',

      // Project context needed for editing or if references "the app"
      needsProjectContext:
        phase === 'editing' ||
        lowerRequest.includes('the app') ||
        lowerRequest.includes('my project') ||
        lowerRequest.includes('current'),

      // Conversation history needed if request uses "previous", "earlier", etc.
      needsConversationHistory:
        lowerRequest.includes('previous') ||
        lowerRequest.includes('earlier') ||
        lowerRequest.includes('you said') ||
        lowerRequest.includes('before') ||
        lowerRequest.includes('we discussed') ||
        phase === 'editing',

      // Related projects needed if request mentions "like", "similar"
      needsRelatedProjects:
        lowerRequest.includes('like') ||
        lowerRequest.includes('similar') ||
        lowerRequest.includes('clone') ||
        lowerRequest.includes('copy'),

      // Examples needed if request is vague or asks for inspiration
      needsExamples:
        lowerRequest.includes('example') ||
        lowerRequest.includes('inspiration') ||
        lowerRequest.includes('ideas') ||
        phase === 'planning',

      // Templates needed if request is standard pattern
      needsTemplates:
        lowerRequest.includes('landing page') ||
        lowerRequest.includes('dashboard') ||
        lowerRequest.includes('login') ||
        lowerRequest.includes('pricing')
    };
  }

  /**
   * Fetch all relevant context based on requirements
   */
  async fetchContext(
    requirements: ContextRequirements,
    options: {
      userId?: string;
      projectId?: string;
      sessionId?: string;
      searchQuery?: string;
    }
  ): Promise<{
    userPreferences?: any;
    projectContext?: any;
    conversationHistory?: any[];
    relatedProjects?: any[];
    examples?: any[];
    templates?: any[];
  }> {
    const context: any = {};

    // Fetch in parallel for speed
    const promises: Promise<void>[] = [];

    if (requirements.needsUserPreferences && options.userId) {
      promises.push(
        this.memoryService.getUserPreferences(options.userId)
          .then(prefs => { context.userPreferences = prefs; })
          .catch(err => console.warn('[Context] Failed to fetch user preferences:', err))
      );
    }

    if (requirements.needsProjectContext && options.projectId) {
      promises.push(
        this.memoryService.getProjectContext(options.projectId)
          .then(ctx => { context.projectContext = ctx; })
          .catch(err => console.warn('[Context] Failed to fetch project context:', err))
      );
    }

    if (requirements.needsConversationHistory && options.sessionId) {
      promises.push(
        this.memoryService.getConversationHistory(options.sessionId)
          .then(history => { context.conversationHistory = history; })
          .catch(err => console.warn('[Context] Failed to fetch conversation history:', err))
      );
    }

    if (requirements.needsRelatedProjects && options.searchQuery) {
      promises.push(
        this.memoryService.searchMemory(options.searchQuery)
          .then(projects => { context.relatedProjects = projects; })
          .catch(err => console.warn('[Context] Failed to search memory:', err))
      );
    }

    // Wait for all fetches
    await Promise.all(promises);

    return context;
  }

  /**
   * Rank context by relevance
   */
  rankContext(context: any[], query: string): any[] {
    // Simple relevance scoring (can be improved with embeddings)
    const queryWords = query.toLowerCase().split(' ');

    return context.map(item => {
      const itemText = JSON.stringify(item).toLowerCase();
      const relevance = queryWords.filter(word => itemText.includes(word)).length;
      return { item, relevance };
    })
    .sort((a, b) => b.relevance - a.relevance)
    .map(({ item }) => item);
  }

  /**
   * Determine if context is sufficient
   */
  isContextSufficient(context: any, requirements: ContextRequirements): boolean {
    if (requirements.needsUserPreferences && !context.userPreferences) {
      return false;
    }
    if (requirements.needsProjectContext && !context.projectContext) {
      return false;
    }
    // Other requirements are optional
    return true;
  }
}

// Singleton
let contextEngineInstance: ContextEngine | null = null;

export function getContextEngine(): ContextEngine {
  if (!contextEngineInstance) {
    contextEngineInstance = new ContextEngine();
  }
  return contextEngineInstance;
}
