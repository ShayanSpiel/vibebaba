/**
 * Memory Service - Wrapper around MCP Memory Server
 * Provides high-level functions for storing and retrieving context
 *
 * Uses @modelcontextprotocol/server-memory for persistent knowledge graph
 */

import { getMCPManager } from '../mcp-client';

export interface UserPreferences {
  designStyle?: string;
  colorScheme?: string;
  prefersDarkMode?: boolean;
  favoriteComponents?: string[];
  learningNotes?: string[];
  typicalAudience?: string;
}

export interface ProjectContext {
  projectId: string;
  description: string;
  plan?: string;
  designDecisions?: string[];
  componentChoices?: string[];
  technicalStack?: string[];
  timestamp: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class MemoryService {
  private mcpManager = getMCPManager();

  /**
   * Store user preference
   */
  async storeUserPreference(userId: string, key: string, value: any): Promise<void> {
    try {
      // First, try to get existing entity
      const existing = await this.getUserPreferences(userId);

      if (existing) {
        // Add observation to existing entity
        await this.mcpManager.callTool('memory', 'add_observations', {
          observations: [{
            entityName: `user_${userId}`,
            contents: [`${key}: ${JSON.stringify(value)}`]
          }]
        });
      } else {
        // Create new entity
        await this.mcpManager.callTool('memory', 'create_entities', {
          entities: [{
            name: `user_${userId}`,
            entityType: 'user',
            observations: [`${key}: ${JSON.stringify(value)}`]
          }]
        });
      }

      console.log(`[Memory] Stored user preference: ${userId} → ${key}`);
    } catch (error) {
      console.error('[Memory] Failed to store user preference:', error);
      // Silent failure - memory is optional
    }
  }

  /**
   * Get all user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const result = await this.mcpManager.callTool('memory', 'open_nodes', {
        names: [`user_${userId}`]
      });

      const entities = (result as any)?.entities || [];
      const entity = entities[0];

      if (!entity) return null;

      // Parse observations into preferences
      const preferences: UserPreferences = {};
      entity.observations?.forEach((obs: string) => {
        const colonIndex = obs.indexOf(': ');
        if (colonIndex === -1) return;

        const key = obs.substring(0, colonIndex);
        const value = obs.substring(colonIndex + 2);

        try {
          (preferences as any)[key] = JSON.parse(value);
        } catch {
          (preferences as any)[key] = value;
        }
      });

      return preferences;
    } catch (error) {
      console.error('[Memory] Failed to get user preferences:', error);
      return null;
    }
  }

  /**
   * Store project context
   */
  async storeProjectContext(projectId: string, context: ProjectContext): Promise<void> {
    try {
      const observations = [
        `description: ${context.description}`,
        context.plan ? `plan: ${context.plan}` : '',
        `design_decisions: ${JSON.stringify(context.designDecisions || [])}`,
        `component_choices: ${JSON.stringify(context.componentChoices || [])}`,
        `technical_stack: ${JSON.stringify(context.technicalStack || [])}`,
        `timestamp: ${context.timestamp}`
      ].filter(Boolean);

      // Check if project exists
      const existing = await this.getProjectContext(projectId);

      if (existing) {
        // Add observations to existing project
        await this.mcpManager.callTool('memory', 'add_observations', {
          observations: [{
            entityName: `project_${projectId}`,
            contents: observations
          }]
        });
      } else {
        // Create new project entity
        await this.mcpManager.callTool('memory', 'create_entities', {
          entities: [{
            name: `project_${projectId}`,
            entityType: 'project',
            observations
          }]
        });
      }

      console.log(`[Memory] Stored project context: ${projectId}`);
    } catch (error) {
      console.error('[Memory] Failed to store project context:', error);
    }
  }

  /**
   * Get project context
   */
  async getProjectContext(projectId: string): Promise<ProjectContext | null> {
    try {
      const result = await this.mcpManager.callTool('memory', 'open_nodes', {
        names: [`project_${projectId}`]
      });

      const entities = (result as any)?.entities || [];
      const entity = entities[0];

      if (!entity) return null;

      // Parse observations
      const context: Partial<ProjectContext> = { projectId };
      entity.observations?.forEach((obs: string) => {
        const colonIndex = obs.indexOf(': ');
        if (colonIndex === -1) return;

        const key = obs.substring(0, colonIndex);
        const value = obs.substring(colonIndex + 2);

        if (key === 'design_decisions' || key === 'component_choices' || key === 'technical_stack') {
          try {
            (context as any)[key] = JSON.parse(value);
          } catch {
            (context as any)[key] = [];
          }
        } else if (key === 'timestamp') {
          (context as any)[key] = parseInt(value);
        } else {
          (context as any)[key] = value;
        }
      });

      return context as ProjectContext;
    } catch (error) {
      console.error('[Memory] Failed to get project context:', error);
      return null;
    }
  }

  /**
   * Store conversation message
   */
  async storeConversation(sessionId: string, message: ConversationMessage): Promise<void> {
    try {
      // Check if session exists
      const existing = await this.getConversationHistory(sessionId, 1);

      if (existing.length > 0) {
        // Add to existing session
        await this.mcpManager.callTool('memory', 'add_observations', {
          observations: [{
            entityName: `session_${sessionId}`,
            contents: [JSON.stringify(message)]
          }]
        });
      } else {
        // Create new session entity
        await this.mcpManager.callTool('memory', 'create_entities', {
          entities: [{
            name: `session_${sessionId}`,
            entityType: 'session',
            observations: [JSON.stringify(message)]
          }]
        });
      }

      console.log(`[Memory] Stored conversation: ${sessionId}`);
    } catch (error) {
      console.error('[Memory] Failed to store conversation:', error);
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId: string, limit: number = 50): Promise<ConversationMessage[]> {
    try {
      const result = await this.mcpManager.callTool('memory', 'open_nodes', {
        names: [`session_${sessionId}`]
      });

      const entities = (result as any)?.entities || [];
      const entity = entities[0];

      if (!entity) return [];

      // Parse observations into messages
      const messages: ConversationMessage[] = [];
      entity.observations?.forEach((obs: string) => {
        try {
          messages.push(JSON.parse(obs));
        } catch (error) {
          console.warn('[Memory] Failed to parse message:', obs);
        }
      });

      // Return most recent messages
      return messages.slice(-limit);
    } catch (error) {
      console.error('[Memory] Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Create knowledge graph relations
   */
  async linkEntities(from: string, to: string, relationType: string): Promise<void> {
    try {
      await this.mcpManager.callTool('memory', 'create_relations', {
        relations: [{ from, to, relationType }]
      });
      console.log(`[Memory] Linked: ${from} → ${to} (${relationType})`);
    } catch (error) {
      console.error('[Memory] Failed to link entities:', error);
    }
  }

  /**
   * Search memory by query
   */
  async searchMemory(query: string): Promise<any[]> {
    try {
      const result = await this.mcpManager.callTool('memory', 'search_nodes', {
        query
      });
      return (result as any)?.entities || [];
    } catch (error) {
      console.error('[Memory] Failed to search memory:', error);
      return [];
    }
  }

  /**
   * Get entire knowledge graph
   */
  async getKnowledgeGraph(): Promise<any> {
    try {
      return await this.mcpManager.callTool('memory', 'read_graph', {});
    } catch (error) {
      console.error('[Memory] Failed to read knowledge graph:', error);
      return null;
    }
  }

  /**
   * Add observation to existing entity (or create entity if it doesn't exist)
   */
  async addObservation(entityName: string, observation: string): Promise<void> {
    try {
      // First, check if entity exists
      const result = await this.mcpManager.callTool('memory', 'open_nodes', {
        names: [entityName]
      });

      const entities = (result as any)?.entities || [];
      const entityExists = entities.length > 0;

      if (entityExists) {
        // Add observation to existing entity
        await this.mcpManager.callTool('memory', 'add_observations', {
          observations: [{
            entityName,
            contents: [observation]
          }]
        });
        console.log(`[Memory] Added observation to existing entity: ${entityName}`);
      } else {
        // Entity doesn't exist, create it first
        // Extract entity type from entity name (e.g., "user_123" -> "user", "project_abc" -> "project")
        const entityType = entityName.split('_')[0];

        await this.mcpManager.callTool('memory', 'create_entities', {
          entities: [{
            name: entityName,
            entityType,
            observations: [observation]
          }]
        });
        console.log(`[Memory] Created new entity and added observation: ${entityName} (type: ${entityType})`);
      }
    } catch (error) {
      console.error('[Memory] Failed to add observation:', error);
      // Silent failure - memory is optional
    }
  }

  /**
   * Clear user memory (for privacy/testing)
   */
  async clearUserMemory(userId: string): Promise<void> {
    try {
      await this.mcpManager.callTool('memory', 'delete_entities', {
        entityNames: [`user_${userId}`]
      });
      console.log(`[Memory] Cleared user memory: ${userId}`);
    } catch (error) {
      console.error('[Memory] Failed to clear user memory:', error);
    }
  }

  /**
   * Clear project memory (for cleanup)
   */
  async clearProjectMemory(projectId: string): Promise<void> {
    try {
      await this.mcpManager.callTool('memory', 'delete_entities', {
        entityNames: [`project_${projectId}`]
      });
      console.log(`[Memory] Cleared project memory: ${projectId}`);
    } catch (error) {
      console.error('[Memory] Failed to clear project memory:', error);
    }
  }

  /**
   * Clear session/conversation history
   */
  async clearSession(sessionId: string): Promise<void> {
    try {
      await this.mcpManager.callTool('memory', 'delete_entities', {
        entityNames: [`session_${sessionId}`]
      });
      console.log(`[Memory] Cleared session: ${sessionId}`);
    } catch (error) {
      console.error('[Memory] Failed to clear session:', error);
    }
  }
}

// Singleton instance
let memoryServiceInstance: MemoryService | null = null;

export function getMemoryService(): MemoryService {
  if (!memoryServiceInstance) {
    memoryServiceInstance = new MemoryService();
  }
  return memoryServiceInstance;
}

/**
 * Helper function to build context string for AI prompts
 */
export function formatMemoryForPrompt(context: {
  userPreferences?: UserPreferences | null;
  projectContext?: ProjectContext | null;
  conversationHistory?: ConversationMessage[];
}): string {
  let prompt = '';

  if (context.userPreferences) {
    prompt += '\n\n━━━ USER PREFERENCES ━━━\n';
    if (context.userPreferences.designStyle) {
      prompt += `Design Style: ${context.userPreferences.designStyle}\n`;
    }
    if (context.userPreferences.colorScheme) {
      prompt += `Color Scheme: ${context.userPreferences.colorScheme}\n`;
    }
    if (context.userPreferences.prefersDarkMode !== undefined) {
      prompt += `Prefers Dark Mode: ${context.userPreferences.prefersDarkMode ? 'Yes' : 'No'}\n`;
    }
    if (context.userPreferences.favoriteComponents?.length) {
      prompt += `Favorite Components: ${context.userPreferences.favoriteComponents.join(', ')}\n`;
    }
    if (context.userPreferences.learningNotes?.length) {
      prompt += '\nLearned About User:\n';
      context.userPreferences.learningNotes.slice(-5).forEach(note => {
        prompt += `- ${note}\n`;
      });
    }
  }

  if (context.projectContext) {
    prompt += '\n\n━━━ PROJECT CONTEXT ━━━\n';
    prompt += `Project: ${context.projectContext.description}\n`;
    if (context.projectContext.plan) {
      prompt += `\nPlan:\n${context.projectContext.plan}\n`;
    }
    if (context.projectContext.designDecisions?.length) {
      prompt += '\nDesign Decisions:\n';
      context.projectContext.designDecisions.forEach(decision => {
        prompt += `- ${decision}\n`;
      });
    }
    if (context.projectContext.componentChoices?.length) {
      prompt += '\nComponent Choices:\n';
      context.projectContext.componentChoices.forEach(choice => {
        prompt += `- ${choice}\n`;
      });
    }
  }

  if (context.conversationHistory?.length) {
    prompt += '\n\n━━━ CONVERSATION HISTORY (Last 10) ━━━\n';
    context.conversationHistory.slice(-10).forEach(msg => {
      prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    });
  }

  if (prompt) {
    prompt += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  }

  return prompt;
}
