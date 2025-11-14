// lib/memory/conversation-memory.ts

import { pb } from '../database/pocketbase';

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

  // ✅ NEW: Full context awareness for AutoGen
  validationContext?: ValidationContext;    // All validation fixes applied
  techStackContext?: TechStackContext;      // Tech stack constraints
  fileMetadata?: Record<string, FileMetadata>; // Per-file metadata
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
 * ✅ NEW: Validation Context
 *
 * Tracks all validation fixes applied during workflow
 * Critical for AutoGen to know what's already been fixed
 */
export interface ValidationContext {
  iconReplacements: Array<{
    from: string;           // Invalid icon name (e.g., 'CreditCard')
    to: string;             // Valid replacement (e.g., 'Square')
    files: string[];        // Which files were affected
    timestamp: Date;
  }>;

  importFixes: Array<{
    file: string;           // File path
    fix: 'added' | 'removed' | 'deduplicated';
    imports: string[];      // Which imports were affected
    timestamp: Date;
  }>;

  contrastFixes: Array<{
    file: string;
    issue: string;          // Description of contrast issue
    fix: string;            // What was changed
    timestamp: Date;
  }>;

  typeScriptFixes: Array<{
    file: string;
    error: string;
    fix: string;
    timestamp: Date;
  }>;
}

/**
 * ✅ NEW: Tech Stack Context
 *
 * Full awareness of tech stack constraints
 */
export interface TechStackContext {
  framework: 'Next.js';
  version: '14' | '15';
  typescript: boolean;
  styling: 'Tailwind CSS';
  icons: 'lucide-react';
  validIcons: string[];              // List of valid icon names
  backend?: {
    type: 'PocketBase';
    collections: Array<{
      name: string;
      fields: Array<{ name: string; type: string }>;
    }>;
    apiEndpoints: Array<{
      method: string;
      path: string;
      description: string;
    }>;
  };
  stateManagement?: 'zustand' | 'context';
  dataFetching?: 'direct' | 'react-query';
}

/**
 * ✅ NEW: File Metadata
 *
 * Track imports, validations, modifications per file
 */
export interface FileMetadata {
  path: string;
  size: number;
  purpose?: string;

  validations: Array<{
    type: 'icon' | 'import' | 'typescript' | 'contrast';
    passed: boolean;
    issues?: string[];
    fixes?: string[];
    timestamp: Date;
  }>;

  imports: {
    icons: string[];        // Which icons this file uses
    hooks: string[];        // Which React hooks
    types: string[];        // Which TypeScript types
  };

  lastModified: Date;
  modifiedBy: 'frontend' | 'qa' | 'autogen' | 'user';
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
   * Get conversation memory for a project (async - loads from DB if not in cache)
   */
  async getMemory(projectId: string): Promise<ConversationMemory> {
    // Check in-memory cache first
    if (this.memories.has(projectId)) {
      return this.memories.get(projectId)!;
    }

    // Try loading from PocketBase
    console.log(`[Memory] Loading from database: ${projectId}`);
    const loaded = await this.loadMemory(projectId);

    if (loaded) {
      console.log(`[Memory] ✅ Loaded from DB: ${loaded.messages.length} messages, ${loaded.projectConfig?.files?.length || 0} files`);
      return loaded;
    }

    // Create new memory if doesn't exist
    console.log(`[Memory] Creating new memory for: ${projectId}`);
    const newMemory: ConversationMemory = {
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
      workflowMetadata: undefined,
      // ✅ NEW: Initialize validation context
      validationContext: {
        iconReplacements: [],
        importFixes: [],
        contrastFixes: [],
        typeScriptFixes: []
      },
      techStackContext: undefined,
      fileMetadata: {}
    };

    this.memories.set(projectId, newMemory);
    return newMemory;
  }

  /**
   * Add user message to memory
   */
  async addUserMessage(projectId: string, content: string): Promise<void> {
    const memory = await this.getMemory(projectId);
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
  async addAssistantMessage(projectId: string, content: string, nodeId?: string): Promise<void> {
    const memory = await this.getMemory(projectId);
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
  async storeProjectConfig(projectId: string, config: ProjectConfig): Promise<void> {
    const memory = await this.getMemory(projectId);
    memory.projectConfig = config;
    console.log(`[Memory] Stored project config for ${projectId}`);
  }

  /**
   * ✅ NEW: Store user preferences
   */
  async storeUserPreferences(projectId: string, preferences: UserPreferences): Promise<void> {
    const memory = await this.getMemory(projectId);
    memory.userPreferences = preferences;
    console.log(`[Memory] Stored user preferences for ${projectId}`);
  }

  /**
   * ✅ NEW: Store workflow metadata
   */
  async storeWorkflowMetadata(projectId: string, metadata: WorkflowMetadata): Promise<void> {
    const memory = await this.getMemory(projectId);
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
  async getFormattedHistory(
    projectId: string,
    mode: 'full' | 'window' | 'summary' = 'window',
    windowSize: number = 5
  ): Promise<string> {
    const memory = await this.getMemory(projectId);

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
  async getEntitiesSummary(projectId: string): Promise<string> {
    const memory = await this.getMemory(projectId);
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
    const memory = await this.getMemory(projectId);

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
    const memory = await this.getMemory(projectId);

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
        // ✅ NEW: Save validation and tech stack context
        validationContext: memory.validationContext ? JSON.stringify(memory.validationContext) : null,
        techStackContext: memory.techStackContext ? JSON.stringify(memory.techStackContext) : null,
        fileMetadata: memory.fileMetadata ? JSON.stringify(memory.fileMetadata) : null,
        updatedAt: new Date().toISOString()
      };

      if (existing.length > 0) {
        await pb.collection('conversation_memory').update(existing[0].id, data);
        console.log(`[Memory] ✅ Updated memory for project ${projectId}`);
      } else {
        // Validate data before creating
        const requiredFields = ['projectId', 'messages', 'projectConfig', 'workflowMetadata', 'entities', 'summary'];
        const missingFields = requiredFields.filter(field => !(field in data));

        if (missingFields.length > 0) {
          console.error(`[Memory] ❌ Missing required fields: ${missingFields.join(', ')}`);
          console.error('[Memory] Data:', JSON.stringify(data, null, 2));
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Check for oversized fields (PocketBase has limits)
        const jsonFields = ['messages', 'projectConfig', 'workflowMetadata', 'entities'];
        for (const field of jsonFields) {
          const size = data[field as keyof typeof data]?.length || 0;
          if (size > 5_000_000) { // 5MB limit
            console.warn(`[Memory] ⚠️  Field ${field} is very large (${(size / 1_000_000).toFixed(2)}MB)`);
          }
        }

        await pb.collection('conversation_memory').create(data);
        console.log(`[Memory] ✅ Created memory for project ${projectId}`);
      }

      // Log what was saved
      console.log(`[Memory] 💾 Saved: ${memory.messages.length} messages, ${Object.keys(memory.entities).length} entity types`);
      if (memory.projectConfig) console.log(`[Memory] 💾 Project config: ${memory.projectConfig.files?.length || 0} files, backend=${!!memory.projectConfig.backendConfig}`);
      if (memory.workflowMetadata) console.log(`[Memory] 💾 Workflow: ${memory.workflowMetadata.completedNodes?.length || 0} nodes, ${memory.workflowMetadata.totalDuration}ms`);
    } catch (error: any) {
      console.error('[Memory] Failed to save:', error);
      if (error.response) {
        console.error('[Memory] Error details:', JSON.stringify(error.response, null, 2));
      }
      // Don't throw - allow workflow to continue even if memory save fails
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

      // Helper to safely parse JSON (handles both string and object)
      const safeParse = (value: any, fallback: any = null) => {
        if (!value) return fallback;
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (e) {
            console.error('[Memory] Failed to parse JSON:', value?.substring(0, 100));
            return fallback;
          }
        }
        return value; // Already an object
      };

      const memory: ConversationMemory = {
        projectId,
        messages: safeParse(record.messages, []),
        summary: record.summary,
        entities: safeParse(record.entities, {}),
        // ✅ NEW: Load full project state
        projectConfig: safeParse(record.projectConfig, undefined),
        userPreferences: safeParse(record.userPreferences, undefined),
        workflowMetadata: safeParse(record.workflowMetadata, undefined),
        // ✅ NEW: Load validation and tech stack context
        validationContext: safeParse(record.validationContext, {
          iconReplacements: [],
          importFixes: [],
          contrastFixes: [],
          typeScriptFixes: []
        }),
        techStackContext: safeParse(record.techStackContext, undefined),
        fileMetadata: safeParse(record.fileMetadata, {})
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

export async function addUserMessage(projectId: string, content: string): Promise<void> {
  await conversationMemoryStore.addUserMessage(projectId, content);
}

export async function addAssistantMessage(projectId: string, content: string, nodeId?: string): Promise<void> {
  await conversationMemoryStore.addAssistantMessage(projectId, content, nodeId);
}

/**
 * ✅ ENHANCED: Get full project context for AutoGen
 *
 * Returns comprehensive context including:
 * - Tech stack constraints
 * - Validation history (icon replacements, import fixes)
 * - Backend API structure
 * - File metadata
 * - Conversation history
 */
export async function getConversationContext(projectId: string): Promise<string> {
  const memory = await conversationMemoryStore.getMemory(projectId);
  let context = '';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. TECH STACK CONTEXT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (memory.techStackContext) {
    context += '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    context += 'TECH STACK CONTEXT\n';
    context += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    context += `Framework: ${memory.techStackContext.framework} ${memory.techStackContext.version}\n`;
    context += `TypeScript: ${memory.techStackContext.typescript ? 'Yes' : 'No'}\n`;
    context += `Styling: ${memory.techStackContext.styling}\n`;
    context += `Icons: ${memory.techStackContext.icons}\n`;
    if (memory.techStackContext.validIcons && memory.techStackContext.validIcons.length > 0) {
      context += `Valid Icons: ${memory.techStackContext.validIcons.join(', ')}\n`;
    }
    if (memory.techStackContext.backend) {
      context += `Backend: ${memory.techStackContext.backend.type}\n`;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. VALIDATION HISTORY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (memory.validationContext) {
    context += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    context += 'RECENT VALIDATIONS\n';
    context += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

    // Icon Replacements
    if (memory.validationContext.iconReplacements.length > 0) {
      context += '\n✅ Icon Replacements (frontend):\n';
      memory.validationContext.iconReplacements.forEach(r => {
        context += `  - Replaced ${r.from} → ${r.to} in ${r.files.join(', ')} (invalid icon)\n`;
      });
    }

    // Import Fixes
    if (memory.validationContext.importFixes.length > 0) {
      context += '\n✅ Import Fixes:\n';
      memory.validationContext.importFixes.forEach(f => {
        const action = f.fix === 'added' ? 'Added' : f.fix === 'removed' ? 'Removed' : 'De-duplicated';
        context += `  - ${action} ${f.imports.join(', ')} in ${f.file}\n`;
      });
    }

    // Contrast Fixes
    if (memory.validationContext.contrastFixes.length > 0) {
      context += '\n✅ Contrast Fixes:\n';
      memory.validationContext.contrastFixes.forEach(f => {
        context += `  - ${f.file}: ${f.fix}\n`;
      });
    }

    // TypeScript Fixes
    if (memory.validationContext.typeScriptFixes.length > 0) {
      context += '\n✅ TypeScript Fixes:\n';
      memory.validationContext.typeScriptFixes.forEach(f => {
        context += `  - ${f.file}: ${f.fix}\n`;
      });
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. BACKEND API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (memory.projectConfig?.backendConfig?.apiEndpoints && memory.projectConfig.backendConfig.apiEndpoints.length > 0) {
    context += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    context += 'BACKEND API\n';
    context += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    memory.projectConfig.backendConfig.apiEndpoints.forEach(e => {
      context += `- ${e.method} ${e.path}: ${e.description}\n`;
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. FILE METADATA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (memory.fileMetadata && Object.keys(memory.fileMetadata).length > 0) {
    context += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    context += 'GENERATED FILES\n';
    context += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    Object.entries(memory.fileMetadata).forEach(([path, meta]) => {
      const iconCount = meta.imports.icons.length;
      const validationCount = meta.validations.length;
      context += `- ${path}: ${iconCount} icons, ${validationCount} validations\n`;
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. CONVERSATION HISTORY (last 5 messages)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const history = await conversationMemoryStore.getFormattedHistory(projectId, 'window', 5);
  const entities = await conversationMemoryStore.getEntitiesSummary(projectId);

  context += history;
  context += entities;

  return context;
}

export function clearConversationMemory(projectId: string): void {
  conversationMemoryStore.clearMemory(projectId);
}

/**
 * ✅ NEW: Convenience functions for unified memory storage
 */
export async function storeProjectConfig(projectId: string, config: ProjectConfig): Promise<void> {
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
  await conversationMemoryStore.storeProjectConfig(projectId, config);
}

export async function storeUserPreferences(projectId: string, preferences: UserPreferences): Promise<void> {
  await conversationMemoryStore.storeUserPreferences(projectId, preferences);
}

export async function storeWorkflowMetadata(projectId: string, metadata: WorkflowMetadata): Promise<void> {
  await conversationMemoryStore.storeWorkflowMetadata(projectId, metadata);
}

/**
 * ✅ NEW: Store validation context (icon replacements, import fixes, etc.)
 */
export async function storeValidationContext(
  projectId: string,
  context: Partial<ValidationContext>
): Promise<void> {
  const memory = await conversationMemoryStore.getMemory(projectId);

  if (!memory.validationContext) {
    memory.validationContext = {
      iconReplacements: [],
      importFixes: [],
      contrastFixes: [],
      typeScriptFixes: []
    };
  }

  // Append new context to existing
  if (context.iconReplacements) {
    memory.validationContext.iconReplacements.push(...context.iconReplacements);
  }
  if (context.importFixes) {
    memory.validationContext.importFixes.push(...context.importFixes);
  }
  if (context.contrastFixes) {
    memory.validationContext.contrastFixes.push(...context.contrastFixes);
  }
  if (context.typeScriptFixes) {
    memory.validationContext.typeScriptFixes.push(...context.typeScriptFixes);
  }

  console.log(`[Memory] ✅ Stored validation context for ${projectId}`);
  console.log(`[Memory] 📊 Total validations: ${memory.validationContext.iconReplacements.length} icons, ${memory.validationContext.importFixes.length} imports`);
}

/**
 * ✅ NEW: Store tech stack context
 */
export async function storeTechStackContext(
  projectId: string,
  context: TechStackContext
): Promise<void> {
  const memory = await conversationMemoryStore.getMemory(projectId);
  memory.techStackContext = context;
  console.log(`[Memory] ✅ Stored tech stack context for ${projectId}`);
}

/**
 * ✅ NEW: Store file metadata
 */
export async function storeFileMetadata(
  projectId: string,
  filePath: string,
  metadata: FileMetadata
): Promise<void> {
  const memory = await conversationMemoryStore.getMemory(projectId);

  if (!memory.fileMetadata) {
    memory.fileMetadata = {};
  }

  memory.fileMetadata[filePath] = metadata;
  console.log(`[Memory] ✅ Stored metadata for ${filePath}`);
}
