// lib/langgraph/types.ts

import { Annotation } from '@langchain/langgraph';

/**
 * Design inspiration extracted from uploaded screenshots/UI references
 */
export interface DesignInspiration {
  source: 'screenshot' | 'brand' | 'url';

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };

  typography: {
    headingFont: string;
    bodyFont: string;
    scale: string[];
  };

  patterns: string[];
  spacing: number[];
  borderRadius: string;
  components: string[];
  suggestions: string;
  quality: number; // 0-100 confidence score
}

export interface EditingSession {
  // Original state before editing
  originalFiles: Array<{ path: string; content: string }>;

  // User's edit request
  userRequest: string;

  // Conversation history for context
  conversationHistory: Array<{ role: string; content: string }>;

  // Change scope determined by context analyzer
  changeScope: 'minor' | 'moderate' | 'major' | 'structural' | 'unknown';

  // Files that need modification
  filesToModify?: string[];

  // Sections to preserve (key: file path, value: preserved sections)
  preservedSections: Map<string, string[]>;

  // Changes applied during editing
  changesApplied?: string[];

  // File-level change tracking
  fileChanges?: Array<{
    path: string;
    changeType: 'modified' | 'added' | 'deleted';
    linesChanged?: number;
  }>;
}

export interface AppGenState {
  // User Input
  userDescription: string;
  userId: string;
  projectId: string;

  // Founder Output
  refinedRequirements?: string;
  businessContext?: {
    targetAudience: string;
    primaryGoal: string;
    successMetrics: string[];
  };

  // PM Output
  plan?: string;
  context?: {
    appType: string;
    complexity: string;
    designStyle: string;
    visualTone: string;
    animationLevel: string;
    targetAudience: string;
    pmPlan?: {
      needsBackend?: boolean;
      [key: string]: any;
    };
  };

  // UX Designer Output
  /** Selected design system for component generation */
  designSystem?: 'ant-design' | 'tailwind-shadcn' | 'v0-inspired' | 'enhanced-2025';
  /** User styling overrides (colors, fonts, etc.) */
  stylingConfig?: any;
  /** Design system instructions passed to Frontend node */
  designSystemPrompt?: string;
  /** Optional MCP research context from external sources */
  backgroundContext?: any;
  /** Example patterns or references */
  examples?: any[];

  // File Upload System
  /** Files uploaded by user for the project */
  uploadedFiles?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    purpose: 'asset' | 'design-reference' | 'both' | 'pending';
    designAnalysis?: DesignInspiration;
  }>;

  /** Design inspiration extracted from uploaded screenshots */
  designInspiration?: DesignInspiration;

  /** Feature-to-route mapping for proper feature placement (prevents wrong feature on wrong page) */
  featureRouteMapping?: Array<{
    featureId: string;
    route: string;
    file: string;
    purpose: string;
  }>;

  /** Curated image URLs from Unsplash for hero sections, features, and backgrounds */
  images?: {
    hero: string;
    feature1: string;
    feature2: string;
    feature3: string;
    background: string;
  };

  /** Generated brand assets (logos, favicons) - NEW */
  brandAssets?: {
    logo: string;
    logoDark?: string;
    favicon: string;
    icon192: string;
    icon512: string;
    appleTouchIcon: string;
  };

  // MCP Memory Context (loaded from memory service)
  memoryContext?: {
    userPreferences?: any;
    projectContext?: any;
    conversationHistory?: any[];
  };

  // NEW: LangChain Conversation Memory (Phase 2 - Memory Management)
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    nodeId?: string;
  }>;
  conversationSummary?: string;

  // Backend Engineer Output
  /** Database schema and API configuration for Express server */
  backendConfig?: {
    /** Database collections with fields */
    collections: Array<{
      name: string;
      fields: Array<{
        name: string;
        type: string;
        required?: boolean;
      }>;
    }>;
    /** Page routes derived from PM plan features */
    pages?: Array<{ name: string; route: string }>;
    /** API endpoints (legacy - derived from collections) */
    apiEndpoints?: Array<{
      method: string;
      path: string;
      handler: string;
      collection: string;
      description: string;
    }>;
    /** Collection relationships (legacy) */
    relationships?: Array<{
      from: string;
      to: string;
      type: string;
      foreignKey: string;
    }>;
    /** Project ID (legacy) */
    projectId?: string;
    /** Assigned port for API server (legacy) */
    port?: number | null;
    /** Whether backend is needed (legacy) */
    needsBackend?: boolean;
  };

  // Frontend Engineer Output
  /** Generated files with paths and content */
  files?: Array<{ path: string; content: string }>;
  /** Whether app has multiple pages/routes */
  isMultiPage?: boolean;

  /** File structure plan from Frontend Phase 1 (AI autonomy planning) */
  fileStructurePlan?: Array<{
    path: string;
    purpose: string;
    dependencies?: string[];
  }>;

  /** Tech stack metadata (always Next.js + TypeScript + Tailwind) */
  techStack?: {
    framework: 'nextjs';
    language: 'typescript';
    styling: 'tailwind';
  };

  // QA Manager Output
  validationResult?: {
    valid: boolean;
    files: Array<{ path: string; content: string }>;
    report: {
      errors: any[];
      warnings: any[];
      fixed: string[];
    };
  };
  debugAttempts?: number;

  // DevOps Engineer Output
  deployUrl?: string;

  // Workflow Metadata
  stage: string;
  completedNodes: string[];
  errors: any[];
  artifacts: Map<string, any>;

  // NEW: Editing Session (for iterative edits)
  editingSession?: EditingSession;

  // PHASE 3: Conversational Features
  /** Whether user input is required before proceeding */
  needsUserInput?: boolean;
  /** User input request details (API key, code snippet, clarification) */
  userInputRequest?: {
    type: 'api_key' | 'code_snippet' | 'env_var' | 'url' | 'clarification' | 'design_spec';
    question: string;
  };
  /** Last checkpoint ID for rollback functionality */
  lastCheckpointId?: string;

  /**
   * All features requested by user (for prioritization system)
   */
  allRequestedFeatures?: Array<{
    id: string;
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    dependencies: string[]; // Feature IDs that must exist first
    complexity: 'simple' | 'moderate' | 'complex';
    included_in_mvp: boolean; // Was this in the initial MVP?
    completed?: boolean; // Has this feature been added?
  }>;
}

/**
 * Modern Annotation-based State Definition
 *
 * This replaces the manual channel configuration in workflow.ts
 * Benefits:
 * - More concise (60 lines vs 274 lines)
 * - Better type safety
 * - Automatic array accumulation via reducers
 * - Same performance as manual channels
 */
export const AppGenAnnotation = Annotation.Root({
  // User Input
  userDescription: Annotation<string>(),
  userId: Annotation<string>(),
  projectId: Annotation<string>(),

  // Founder Output
  refinedRequirements: Annotation<string | undefined>(),
  businessContext: Annotation<{
    targetAudience: string;
    primaryGoal: string;
    successMetrics: string[];
  } | undefined>(),

  // PM Output
  plan: Annotation<string | undefined>(),
  context: Annotation<{
    appType: string;
    complexity: string;
    designStyle: string;
    visualTone: string;
    animationLevel: string;
    targetAudience: string;
    pmPlan?: {
      needsBackend?: boolean;
      [key: string]: any;
    };
  } | undefined>(),

  // UX Designer Output
  designSystem: Annotation<'ant-design' | 'tailwind-shadcn' | 'v0-inspired' | 'enhanced-2025' | undefined>(),
  stylingConfig: Annotation<any>(),
  designSystemPrompt: Annotation<string | undefined>(),
  backgroundContext: Annotation<any>(),
  examples: Annotation<any[] | undefined>(),

  // Feature-to-route mapping
  featureRouteMapping: Annotation<Array<{
    featureId: string;
    route: string;
    file: string;
    purpose: string;
  }> | undefined>(),

  // Curated image URLs
  images: Annotation<{
    hero: string;
    feature1: string;
    feature2: string;
    feature3: string;
    background: string;
  } | undefined>(),

  // MCP Memory Context
  memoryContext: Annotation<{
    userPreferences?: any;
    projectContext?: any;
    conversationHistory?: any[];
  } | undefined>(),

  // NEW: LangChain Conversation Memory
  conversationHistory: Annotation<Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    nodeId?: string;
  }> | undefined>(),
  conversationSummary: Annotation<string | undefined>(),

  // Backend Engineer Output
  backendConfig: Annotation<{
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
    relationships?: Array<{
      from: string;
      to: string;
      type: string;
      foreignKey: string;
    }>;
    projectId?: string;
    port?: number | null;
    needsBackend?: boolean;
  } | undefined>(),

  // Frontend Engineer Output
  files: Annotation<Array<{ path: string; content: string }> | undefined>(),
  isMultiPage: Annotation<boolean | undefined>(),
  fileStructurePlan: Annotation<Array<{
    path: string;
    purpose: string;
    dependencies?: string[];
  }> | undefined>(),
  techStack: Annotation<{
    framework: 'nextjs';
    language: 'typescript';
    styling: 'tailwind';
  } | undefined>(),

  // QA Manager Output
  validationResult: Annotation<{
    valid: boolean;
    files: Array<{ path: string; content: string }>;
    report: {
      errors: any[];
      warnings: any[];
      fixed: string[];
    };
  } | undefined>(),
  debugAttempts: Annotation<number | undefined>(),

  // DevOps Engineer Output
  deployUrl: Annotation<string | undefined>(),

  // Workflow Metadata with Reducers (Auto-accumulation)
  stage: Annotation<string>(),
  completedNodes: Annotation<string[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => []
  }),
  errors: Annotation<any[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => []
  }),
  artifacts: Annotation<Map<string, any>>({
    reducer: (left, right) => new Map([...left, ...right]),
    default: () => new Map()
  }),

  // Editing Session
  editingSession: Annotation<EditingSession | undefined>(),

  // Conversational Features
  needsUserInput: Annotation<boolean | undefined>(),
  userInputRequest: Annotation<{
    type: 'api_key' | 'code_snippet' | 'env_var' | 'url' | 'clarification' | 'design_spec';
    question: string;
  } | undefined>(),
  lastCheckpointId: Annotation<string | undefined>(),

  // All Features (with reducer for accumulation)
  allRequestedFeatures: Annotation<Array<{
    id: string;
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    dependencies: string[];
    complexity: 'simple' | 'moderate' | 'complex';
    included_in_mvp: boolean;
    completed?: boolean;
  }> | undefined>({
    reducer: (left = [], right = []) => {
      // Merge features, avoiding duplicates by id
      const merged = [...left];
      right.forEach(newFeature => {
        if (!merged.find(f => f.id === newFeature.id)) {
          merged.push(newFeature);
        }
      });
      return merged;
    },
    default: () => []
  })
});

/**
 * Extract the state type from annotation
 * Use this type for all node functions
 */
export type AppGenStateFromAnnotation = typeof AppGenAnnotation.State;
