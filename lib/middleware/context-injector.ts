/**
 * Context Injector Middleware
 * Automatically injects relevant context into AI requests
 */

import { getContextEngine } from '../services/context-engine';
import { formatMemoryForPrompt } from '../services/memory-service';

export async function injectContext(
  prompt: string,
  options: {
    userId?: string;
    projectId?: string;
    sessionId?: string;
    phase: 'planning' | 'prototype' | 'editing';
  }
): Promise<string> {
  const contextEngine = getContextEngine();

  // Analyze what context is needed
  const requirements = contextEngine.analyzeRequest(prompt, options.phase);

  console.log('[Context] Requirements:', requirements);

  // Fetch relevant context
  const context = await contextEngine.fetchContext(requirements, {
    userId: options.userId,
    projectId: options.projectId,
    sessionId: options.sessionId,
    searchQuery: prompt
  });

  console.log('[Context] Fetched keys:', Object.keys(context));

  // Format and inject
  const memoryContext = formatMemoryForPrompt(context);

  if (memoryContext) {
    return `${memoryContext}\n\n${prompt}`;
  }

  return prompt;
}

/**
 * Inject context with fallback (won't fail if memory unavailable)
 */
export async function safeInjectContext(
  prompt: string,
  options: {
    userId?: string;
    projectId?: string;
    sessionId?: string;
    phase: 'planning' | 'prototype' | 'editing';
  }
): Promise<string> {
  try {
    return await injectContext(prompt, options);
  } catch (error) {
    console.error('[Context] Failed to inject context, using original prompt:', error);
    return prompt;
  }
}
