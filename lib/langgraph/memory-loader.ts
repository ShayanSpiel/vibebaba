/**
 * #done MCP Memory Loader for LangGraph Workflow
 *
 * Loads user preferences, project context, and conversation history
 * from MCP Memory server and formats for AI consumption
 */

import { getMemoryService } from '../services/memory-service';

export interface MemoryContext {
  userPreferences?: any;
  projectContext?: any;
  conversationHistory?: any[];
}

/**
 * Load all relevant memory context for workflow initialization
 *
 * @param userId - User ID for preference loading
 * @param projectId - Project ID for context loading (optional for new projects)
 * @param sessionId - Session ID for conversation history (optional)
 * @returns Memory context object (never fails, returns empty object on error)
 */
export async function loadMemoryContext(
  userId: string,
  projectId?: string,
  sessionId?: string
): Promise<MemoryContext> {
  const memoryService = getMemoryService();
  const context: MemoryContext = {};

  console.log('[Memory Loader] Loading context...');
  console.log(`  - User ID: ${userId}`);
  console.log(`  - Project ID: ${projectId || 'none (new project)'}`);
  console.log(`  - Session ID: ${sessionId || 'none'}`);

  // Load in parallel for speed
  const promises: Promise<void>[] = [];

  // Load user preferences
  promises.push(
    memoryService.getUserPreferences(userId)
      .then(prefs => {
        if (prefs) {
          context.userPreferences = prefs;
          console.log('[Memory Loader] ✅ Loaded user preferences');
        } else {
          console.log('[Memory Loader] ℹ️  No user preferences found');
        }
      })
      .catch(err => {
        console.warn('[Memory Loader] ⚠️ Failed to load user preferences:', err.message);
      })
  );

  // Load project context (only if projectId exists)
  if (projectId) {
    promises.push(
      memoryService.getProjectContext(projectId)
        .then(ctx => {
          if (ctx) {
            context.projectContext = ctx;
            console.log('[Memory Loader] ✅ Loaded project context');
          } else {
            console.log('[Memory Loader] ℹ️  No project context found');
          }
        })
        .catch(err => {
          console.warn('[Memory Loader] ⚠️ Failed to load project context:', err.message);
        })
    );
  }

  // Load conversation history (only if sessionId exists)
  if (sessionId) {
    promises.push(
      memoryService.getConversationHistory(sessionId, 20) // Last 20 messages
        .then(history => {
          if (history && history.length > 0) {
            context.conversationHistory = history;
            console.log(`[Memory Loader] ✅ Loaded ${history.length} conversation messages`);
          } else {
            console.log('[Memory Loader] ℹ️  No conversation history found');
          }
        })
        .catch(err => {
          console.warn('[Memory Loader] ⚠️ Failed to load conversation history:', err.message);
        })
    );
  }

  // Wait for all loads to complete
  await Promise.all(promises);

  // Log summary
  const loaded: string[] = [];
  if (context.userPreferences) loaded.push('user preferences');
  if (context.projectContext) loaded.push('project context');
  if (context.conversationHistory) loaded.push('conversation history');

  if (loaded.length > 0) {
    console.log(`[Memory Loader] 📦 Loaded: ${loaded.join(', ')}`);
  } else {
    console.log('[Memory Loader] ℹ️  No memory context available (first-time user or new project)');
  }

  return context;
}

/**
 * Store project context after workflow completion
 *
 * @param projectId - Project ID
 * @param state - Final workflow state
 */
export async function storeProjectContext(
  projectId: string,
  state: {
    userDescription: string;
    plan?: string;
    designSystem?: string;
    stylingConfig?: any; // ✅ ADD STYLING CONFIG (branding persistence)
    backendConfig?: any;
    files?: any[];
    context?: any;
  }
): Promise<void> {
  const memoryService = getMemoryService();

  try {
    console.log(`[Memory Loader] Storing project context for ${projectId}...`);

    await memoryService.storeProjectContext(projectId, {
      projectId,
      description: state.userDescription,
      plan: state.plan,
      designDecisions: [
        state.designSystem ? `Design System: ${state.designSystem}` : '',
        state.context?.designStyle ? `Design Style: ${state.context.designStyle}` : '',
        state.context?.visualTone ? `Visual Tone: ${state.context.visualTone}` : '',
        // ✅ ADD STYLING CONFIG DETAILS (branding persistence)
        state.stylingConfig?.colorTheme?.primary ? `Primary Color: ${state.stylingConfig.colorTheme.primary}` : '',
        state.stylingConfig?.colorTheme?.mode ? `Color Mode: ${state.stylingConfig.colorTheme.mode}` : '',
        state.stylingConfig?.typography?.bodyFont ? `Body Font: ${state.stylingConfig.typography.bodyFont}` : '',
        state.stylingConfig?.typography?.headingFont ? `Heading Font: ${state.stylingConfig.typography.headingFont}` : '',
        state.stylingConfig?.brand?.brandName ? `Brand Name: ${state.stylingConfig.brand.brandName}` : '',
      ].filter(Boolean),
      componentChoices: state.files?.map(f => f.path) || [],
      technicalStack: [
        'Next.js 15',
        'React 19',
        'TypeScript',
        'Tailwind CSS',
        state.designSystem || 'Custom Components'
      ],
      timestamp: Date.now()
    });

    console.log('[Memory Loader] ✅ Stored project context');
  } catch (error: any) {
    console.warn('[Memory Loader] ⚠️ Failed to store project context:', error.message);
  }
}

/**
 * Store user preference learned during workflow
 *
 * @param userId - User ID
 * @param key - Preference key
 * @param value - Preference value
 */
export async function storeUserPreference(
  userId: string,
  key: string,
  value: any
): Promise<void> {
  const memoryService = getMemoryService();

  try {
    await memoryService.storeUserPreference(userId, key, value);
    console.log(`[Memory Loader] ✅ Stored user preference: ${key}`);
  } catch (error: any) {
    console.warn(`[Memory Loader] ⚠️ Failed to store user preference: ${error.message}`);
  }
}

/**
 * Format memory context for AI prompt injection
 *
 * @param context - Memory context
 * @returns Formatted string for prompt (empty if no context)
 */
export function formatMemoryContextForPrompt(context: MemoryContext): string {
  if (!context.userPreferences && !context.projectContext && !context.conversationHistory?.length) {
    return '';
  }

  let prompt = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  prompt += '💾 MEMORY CONTEXT (from previous interactions)\n';
  prompt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  // User Preferences
  if (context.userPreferences) {
    prompt += '👤 USER PREFERENCES:\n';
    const prefs = context.userPreferences;

    if (prefs.designStyle) {
      prompt += `   • Preferred Design Style: ${prefs.designStyle}\n`;
    }
    if (prefs.colorScheme) {
      prompt += `   • Color Scheme: ${prefs.colorScheme}\n`;
    }
    if (prefs.prefersDarkMode !== undefined) {
      prompt += `   • Dark Mode: ${prefs.prefersDarkMode ? 'Yes' : 'No'}\n`;
    }
    if (prefs.favoriteComponents?.length) {
      prompt += `   • Favorite Components: ${prefs.favoriteComponents.join(', ')}\n`;
    }
    if (prefs.typicalAudience) {
      prompt += `   • Target Audience: ${prefs.typicalAudience}\n`;
    }
    prompt += '\n';
  }

  // Project Context
  if (context.projectContext) {
    prompt += '📂 PROJECT CONTEXT:\n';
    const proj = context.projectContext;

    if (proj.description) {
      prompt += `   • Description: ${proj.description}\n`;
    }
    if (proj.plan) {
      prompt += `   • Plan: ${proj.plan.substring(0, 200)}...\n`;
    }
    if (proj.designDecisions?.length) {
      prompt += `   • Design Decisions:\n`;
      proj.designDecisions.slice(0, 3).forEach((d: string) => {
        prompt += `     - ${d}\n`;
      });
    }
    if (proj.technicalStack?.length) {
      prompt += `   • Tech Stack: ${proj.technicalStack.join(', ')}\n`;
    }
    prompt += '\n';
  }

  // Conversation History
  if (context.conversationHistory?.length) {
    prompt += '💬 RECENT CONVERSATION:\n';
    context.conversationHistory.slice(-5).forEach((msg: any) => {
      const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
      const content = msg.content.substring(0, 150);
      prompt += `   ${role}: ${content}${msg.content.length > 150 ? '...' : ''}\n`;
    });
    prompt += '\n';
  }

  prompt += '⚠️  IMPORTANT: Use this context to personalize your response and maintain\n';
  prompt += 'consistency with the user\'s preferences and project history.\n';
  prompt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  return prompt;
}
