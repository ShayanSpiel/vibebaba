// lib/memory/conversation-memory.ts

import { pb } from '../pocketbase';

/**
 * Conversation Memory Manager
 *
 * Tracks conversation history for multi-turn editing
 * Compatible with current AND future multi-tenant architecture
 */

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  nodeId?: string;  // Which node generated this (pm, frontend, etc.)
}

export interface ConversationMemory {
  projectId: string;
  messages: Message[];
  summary?: string;           // Auto-generated summary of conversation
  entities: EntityMemory;     // Tracked entities (components, features, etc.)

  // ✅ UNIFIED MEMORY: Full project state (replaces MCP Memory)
  projectConfig?: ProjectConfig;      // Complete project configuration
  userPreferences?: UserPreferences;  // User preferences
  workflowMetadata?: WorkflowMetadata; // Workflow execution data
}

export interface EntityMemory {
  components: string[];       // ["NavBar", "Hero", "ContactForm"]
  features: string[];         // ["dark mode", "authentication", "blog"]
  techStack: string[];        // ["Next.js", "Tailwind", "PocketBase"]
  designDecisions: string[];  // ["minimalist", "blue primary color"]
}

export interface ProjectConfig {
  // Core project data
  description: string;
  plan?: string;

  // Design & styling (FULL configs, not summaries)
  designSystem?: string;
  stylingConfig?: any;        // Complete 80+ design tokens

  // Backend configuration (FULL, not summary)
  backendConfig?: {
    collections: Array<{
      name: string;
      fields: Array<{
        name: string;
        type: string;
        required?: boolean;
      }>;
    }>;
    pages?: Array<{ name: string; route: string }>;
    apiEndpoints?: Array<{
      method: string;
      path: string;
      handler: string;
      collection: string;
      description: string;
    }>;
    needsBackend?: boolean;
  };

  // Frontend files (metadata, not full content)
  files?: Array<{
    path: string;
    size: number;
    purpose?: string;
  }>;

  // Context & metadata
  context?: {
    appType?: string;
    complexity?: string;
    designStyle?: string;
    visualTone?: string;
    animationLevel?: string;
    targetAudience?: string;
  };

  // Features list
  allRequestedFeatures?: Array<{
    id: string;
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    complexity: 'simple' | 'moderate' | 'complex';
    included_in_mvp: boolean;
    completed?: boolean;
  }>;
}

export interface UserPreferences {
  designStyle?: string;
  colorScheme?: string;
  prefersDarkMode?: boolean;
  favoriteComponents?: string[];
  typicalAudience?: string;
}

export interface WorkflowMetadata {
  completedNodes: string[];        // Nodes that executed
  totalDuration?: number;          // Total workflow time (ms)
  tokenUsage?: {
    total: number;
    byNode: Record<string, number>;
  };
  deployUrl?: string;              // Final deployment URL
  validationResult?: {
    valid: boolean;
    errors: number;
    warnings: number;
  };
  debugAttempts?: number;          // QA debugging attempts
  lastUpdated: Date;
}

/**
 * Conversation Memory Store
 *
 * Stores conversation history per project
 * In memory for now, can be persisted to PocketBase for multi-session
 */
class ConversationMemoryStore {
  private memories: Map<string, ConversationMemory> = new Map();

  /**
   * Get conversation memory for a project
   */
  getMemory(projectId: string): ConversationMemory {
    if (!this.memories.has(projectId)) {
      this.memories.set(projectId, {
        projectId,
        messages: [],
        entities: {
          components: [],
          features: [],
          techStack: [],
          designDecisions: []
        },
        projectConfig: undefined,
        userPreferences: undefined,
        workflowMetadata: undefined
      });
    }
    return this.memories.get(projectId)!;
  }

  /**
   * Add user message to memory
   */
  addUserMessage(projectId: string, content: string): void {
    const memory = this.getMemory(projectId);
    memory.messages.push({
      role: 'user',
      content,
      timestamp: new Date()
    });

    // Update entities (extract components, features mentioned)
    this.extractEntities(memory, content);
  }

  /**
   * Add assistant message to memory
   */
  addAssistantMessage(projectId: string, content: string, nodeId?: string): void {
    const memory = this.getMemory(projectId);
    memory.messages.push({
      role: 'assistant',
      content,
      timestamp: new Date(),
      nodeId
    });
  }

  /**
   * ✅ NEW: Store full project configuration
   */
  storeProjectConfig(projectId: string, config: ProjectConfig): void {
    const memory = this.getMemory(projectId);
    memory.projectConfig = config;
    console.log(`[Memory] Stored project config for ${projectId}`);
  }

  /**
   * ✅ NEW: Store user preferences
   */
  storeUserPreferences(projectId: string, preferences: UserPreferences): void {
    const memory = this.getMemory(projectId);
    memory.userPreferences = preferences;
    console.log(`[Memory] Stored user preferences for ${projectId}`);
  }

  /**
   * ✅ NEW: Store workflow metadata
   */
  storeWorkflowMetadata(projectId: string, metadata: WorkflowMetadata): void {
    const memory = this.getMemory(projectId);
    memory.workflowMetadata = metadata;
    console.log(`[Memory] Stored workflow metadata for ${projectId}`);
  }

  /**
   * Extract entities from conversation
   * (Simple keyword extraction - can be enhanced with LLM)
   */
  private extractEntities(memory: ConversationMemory, text: string): void {
    const lowerText = text.toLowerCase();

    // Extract components
    const componentKeywords = ['navbar', 'hero', 'footer', 'form', 'button', 'modal', 'sidebar', 'table', 'card'];
    componentKeywords.forEach(keyword => {
      if (lowerText.includes(keyword) && !memory.entities.components.includes(keyword)) {
        memory.entities.components.push(keyword);
      }
    });

    // Extract features
    const featureKeywords = ['auth', 'login', 'dark mode', 'search', 'filter', 'pagination', 'comments', 'blog'];
    featureKeywords.forEach(keyword => {
      if (lowerText.includes(keyword) && !memory.entities.features.includes(keyword)) {
        memory.entities.features.push(keyword);
      }
    });

    // Extract tech stack
    const techKeywords = ['next.js', 'react', 'tailwind', 'typescript', 'pocketbase', 'stripe', 'prisma'];
    techKeywords.forEach(keyword => {
      if (lowerText.includes(keyword) && !memory.entities.techStack.includes(keyword)) {
        memory.entities.techStack.push(keyword);
      }
    });

    // Extract design decisions
    const designKeywords = ['minimalist', 'modern', 'dark', 'light', 'colorful', 'professional'];
    designKeywords.forEach(keyword => {
      if (lowerText.includes(keyword) && !memory.entities.designDecisions.includes(keyword)) {
        memory.entities.designDecisions.push(keyword);
      }
    });
  }

  /**
   * Get conversation history formatted for AI prompt
   *
   * Options:
   * - full: All messages
   * - window: Last N messages
   * - summary: Summarized version
   */
  getFormattedHistory(
    projectId: string,
    mode: 'full' | 'window' | 'summary' = 'window',
    windowSize: number = 5
  ): string {
    const memory = this.getMemory(projectId);

    if (memory.messages.length === 0) {
      return '';
    }

    if (mode === 'summary' && memory.summary) {
      return `\n\n## CONVERSATION SUMMARY\n${memory.summary}\n`;
    }

    let messages = memory.messages;
    if (mode === 'window') {
      messages = messages.slice(-windowSize);
    }

    const formatted = messages.map(msg => {
      const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
      const nodeInfo = msg.nodeId ? ` [${msg.nodeId}]` : '';
      return `${roleLabel}${nodeInfo}: ${msg.content}`;
    }).join('\n');

    return `\n\n## CONVERSATION HISTORY\n${formatted}\n`;
  }

  /**
   * Get entities summary for AI prompt
   */
  getEntitiesSummary(projectId: string): string {
    const memory = this.getMemory(projectId);
    const entities = memory.entities;

    if (
      entities.components.length === 0 &&
      entities.features.length === 0 &&
      entities.techStack.length === 0 &&
      entities.designDecisions.length === 0
    ) {
      return '';
    }

    let summary = '\n\n## PROJECT CONTEXT\n';

    if (entities.components.length > 0) {
      summary += `Components: ${entities.components.join(', ')}\n`;
    }
    if (entities.features.length > 0) {
      summary += `Features: ${entities.features.join(', ')}\n`;
    }
    if (entities.techStack.length > 0) {
      summary += `Tech Stack: ${entities.techStack.join(', ')}\n`;
    }
    if (entities.designDecisions.length > 0) {
      summary += `Design: ${entities.designDecisions.join(', ')}\n`;
    }

    return summary;
  }

  /**
   * Generate summary of conversation (for future LLM enhancement)
   *
   * Useful when conversation gets too long (> 10 messages)
   */
  async generateSummary(projectId: string): Promise<string> {
    const memory = this.getMemory(projectId);

    if (memory.messages.length < 3) {
      return ''; // Not enough context to summarize
    }

    // For now, return a simple summary
    // TODO: Can enhance with LLM call for better summarization
    const userMessages = memory.messages.filter(m => m.role === 'user');
    const summary = `User has made ${userMessages.length} requests. Latest features: ${memory.entities.features.join(', ') || 'none'}`;

    memory.summary = summary;
    return summary;
  }

  /**
   * Clear memory for a project (for testing or reset)
   */
  clearMemory(projectId: string): void {
    this.memories.delete(projectId);
  }

  /**
   * Persist memory to PocketBase (for multi-session support)
   *
   * ✅ UPDATED: Now saves full project config, user preferences, and workflow metadata
   */
  async saveMemory(projectId: string): Promise<void> {
    const memory = this.getMemory(projectId);

    try {
      // Check if memory record exists
      const existing = await pb.collection('conversation_memory').getFullList({
        filter: `projectId = "${projectId}"`
      });

      const data = {
        projectId,
        messages: JSON.stringify(memory.messages),
        summary: memory.summary || '',
        entities: JSON.stringify(memory.entities),
        // ✅ NEW: Save full project state
        projectConfig: memory.projectConfig ? JSON.stringify(memory.projectConfig) : null,
        userPreferences: memory.userPreferences ? JSON.stringify(memory.userPreferences) : null,
        workflowMetadata: memory.workflowMetadata ? JSON.stringify(memory.workflowMetadata) : null,
        updatedAt: new Date().toISOString()
      };

      if (existing.length > 0) {
        await pb.collection('conversation_memory').update(existing[0].id, data);
        console.log(`[Memory] ✅ Updated memory for project ${projectId}`);
      } else {
        await pb.collection('conversation_memory').create(data);
        console.log(`[Memory] ✅ Created memory for project ${projectId}`);
      }

      // Log what was saved
      console.log(`[Memory] 💾 Saved: ${memory.messages.length} messages, ${Object.keys(memory.entities).length} entity types`);
      if (memory.projectConfig) console.log(`[Memory] 💾 Project config: ${memory.projectConfig.files?.length || 0} files, backend=${!!memory.projectConfig.backendConfig}`);
      if (memory.workflowMetadata) console.log(`[Memory] 💾 Workflow: ${memory.workflowMetadata.completedNodes.length} nodes, ${memory.workflowMetadata.totalDuration}ms`);
    } catch (error) {
      console.error('[Memory] Failed to save:', error);
    }
  }

  /**
   * Load memory from PocketBase (for multi-session support)
   */
  async loadMemory(projectId: string): Promise<ConversationMemory | null> {
    try {
      const records = await pb.collection('conversation_memory').getFullList({
        filter: `projectId = "${projectId}"`
      });

      if (records.length === 0) {
        return null;
      }

      const record = records[0];
      const memory: ConversationMemory = {
        projectId,
        messages: JSON.parse(record.messages),
        summary: record.summary,
        entities: JSON.parse(record.entities),
        // ✅ NEW: Load full project state
        projectConfig: record.projectConfig ? JSON.parse(record.projectConfig) : undefined,
        userPreferences: record.userPreferences ? JSON.parse(record.userPreferences) : undefined,
        workflowMetadata: record.workflowMetadata ? JSON.parse(record.workflowMetadata) : undefined
      };

      this.memories.set(projectId, memory);
      console.log(`[Memory] ✅ Loaded full project state for ${projectId}`);
      if (memory.projectConfig) console.log(`[Memory] 📦 Project config: ${memory.projectConfig.files?.length || 0} files, backend=${!!memory.projectConfig.backendConfig}`);
      if (memory.workflowMetadata) console.log(`[Memory] 📦 Workflow: ${memory.workflowMetadata.completedNodes.length} nodes, ${memory.workflowMetadata.totalDuration}ms`);

      return memory;
    } catch (error) {
      console.error('[Memory] Failed to load:', error);
      return null;
    }
  }
}

// Singleton instance
export const conversationMemoryStore = new ConversationMemoryStore();

/**
 * Convenience functions
 */

export function addUserMessage(projectId: string, content: string): void {
  conversationMemoryStore.addUserMessage(projectId, content);
}

export function addAssistantMessage(projectId: string, content: string, nodeId?: string): void {
  conversationMemoryStore.addAssistantMessage(projectId, content, nodeId);
}

export function getConversationContext(projectId: string): string {
  const history = conversationMemoryStore.getFormattedHistory(projectId, 'window', 5);
  const entities = conversationMemoryStore.getEntitiesSummary(projectId);
  return history + entities;
}

export function clearConversationMemory(projectId: string): void {
  conversationMemoryStore.clearMemory(projectId);
}

/**
 * ✅ NEW: Convenience functions for unified memory storage
 */
export function storeProjectConfig(projectId: string, config: ProjectConfig): void {
  // 🔍 DEBUG: Log what config we're receiving
  console.log('[ConversationMemory] 📦 storeProjectConfig called');
  console.log('[ConversationMemory] 📦   - projectId:', projectId);
  console.log('[ConversationMemory] 📦   - stylingConfig exists?', !!config.stylingConfig);
  if (config.stylingConfig) {
    console.log('[ConversationMemory] 📦   - stylingConfig keys:', Object.keys(config.stylingConfig));
    console.log('[ConversationMemory] 📦   - has brand?', !!config.stylingConfig.brand);
    console.log('[ConversationMemory] 📦   - has enhancedColors?', !!config.stylingConfig.enhancedColors);
    console.log('[ConversationMemory] 📦   - has components?', !!config.stylingConfig.components);
  }
  conversationMemoryStore.storeProjectConfig(projectId, config);
}

export function storeUserPreferences(projectId: string, preferences: UserPreferences): void {
  conversationMemoryStore.storeUserPreferences(projectId, preferences);
}

export function storeWorkflowMetadata(projectId: string, metadata: WorkflowMetadata): void {
  conversationMemoryStore.storeWorkflowMetadata(projectId, metadata);
}
