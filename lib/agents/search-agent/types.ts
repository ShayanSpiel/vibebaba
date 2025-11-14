/**
 * SEARCH AGENT - TYPE DEFINITIONS
 *
 * Complete type system for the search agent
 */

// ============================================================================
// INTENT TYPES
// ============================================================================

export type IntentCategory =
  | 'code-search'           // Find code examples, repos
  | 'brand-clone'           // Replicate brand/design from URL or name
  | 'design-inspiration'    // Get design ideas, layouts
  | 'content-research'      // Research content, tone, copy
  | 'api-documentation'     // Find API documentation
  | 'tutorial-search'       // Find tutorials, guides
  | 'library-comparison'    // Compare libraries, tools
  | 'general-knowledge'     // General web search
  // EXPANDABLE: Add new categories as needed
  | 'ai-model-search'       // Future: Find AI models
  | 'dataset-search'        // Future: Find datasets
  | 'pricing-research'      // Future: Competitor pricing
  | 'feature-research';     // Future: Feature analysis

export interface ColorIntent {
  name: string;
  hex?: string;
  rgb?: string;
  tailwind?: string;
}

export interface SearchIntent {
  // Core intent
  category: IntentCategory;
  subCategory?: string;

  // Extracted entities
  techStack?: string[];       // ['nextjs', 'typescript', 'tailwind']
  features?: string[];        // ['authentication', 'collaboration', 'dashboard']
  brandMentions?: string[];   // ['linear', 'stripe', 'notion']
  colors?: {
    primary?: ColorIntent;
    secondary?: ColorIntent;
    accent?: ColorIntent;
    others?: ColorIntent[];
  };
  designStyle?: string[];     // ['trendy', 'high-end', 'minimal', 'modern']
  urls?: string[];            // URLs mentioned for cloning

  // Search strategy
  searchSources: ('github' | 'exa' | 'web' | 'duckduckgo' | 'brave' | 'brand' | 'docs')[];
  requiresScreenshot: boolean;
  requiresCodeExtraction: boolean;
  requiresBrandScraping: boolean;
  requiresCloneAnalysis: boolean;

  // Priority & confidence
  confidence: number;         // 0-1
  priority: 'low' | 'medium' | 'high';

  // Generated queries
  queries?: {
    github?: string[];
    exa?: string[];
    web?: string[];
  };
}

// ============================================================================
// SEARCH CONTEXT
// ============================================================================

export interface SearchContext {
  // User context
  userId?: string;
  orgId: string;

  // Caller context (for result filtering)
  caller?: 'pm-node' | 'editor-node' | 'context-analyzer' | 'input-detector' | 'general';

  // App context (if called from app creation)
  appType?: 'web-app' | 'dashboard' | 'landing-page' | 'blog' | 'ecommerce' | 'saas';
  features?: string[];
  techStack?: string[];

  // Constraints
  maxResults?: number;
  timeout?: number;           // milliseconds
  cacheEnabled?: boolean;

  // Previous search context (for multi-turn)
  previousSearches?: SearchResult[];
}

// ============================================================================
// SEARCH RESULTS
// ============================================================================

export interface SearchResult {
  success: boolean;
  intent: SearchIntent;

  // Retrieved data
  repositories?: GitHubRepository[];
  code?: ExtractedCode[];
  brandGuidelines?: BrandGuideline[];
  designTokens?: DesignTokens;
  webResults?: WebSearchResult[];
  cloneAnalysis?: CloneAnalysis;

  // Metadata
  metadata: {
    searchId: string;
    orgId: string;
    timestamp: Date;
    duration: number;        // milliseconds
    toolsUsed: string[];
    cacheHit: boolean;
    tokensUsed: number;
  };

  // Errors (if any tools failed)
  errors?: ToolError[];
}

export interface GitHubRepository {
  fullName: string;           // owner/repo
  description: string;
  stars: number;
  url: string;
  language: string;
  topics: string[];
  readme?: string;
  relevanceScore?: number;    // 0-1
}

export interface ExtractedCode {
  repo: string;               // owner/repo
  path: string;
  content: string;
  language: string;
  size: number;
  relevanceScore?: number;
  adaptedContent?: string;    // Code adapted to user's stack
}

export interface BrandGuideline {
  brandName: string;
  source: string;             // URL where found

  colors?: {
    primary?: ColorIntent;
    secondary?: ColorIntent;
    accent?: ColorIntent;
    background?: ColorIntent;
    text?: ColorIntent;
    others?: ColorIntent[];
  };

  typography?: {
    fontFamily: string;
    headingFont?: string;
    bodyFont?: string;
    sizes?: {
      h1?: string;
      h2?: string;
      h3?: string;
      body?: string;
      small?: string;
    };
    weights?: {
      light?: number;
      regular?: number;
      medium?: number;
      bold?: number;
    };
  };

  spacing?: {
    scale?: number[];         // [4, 8, 12, 16, 24, 32, 48, 64]
    unit?: string;            // 'px' | 'rem'
  };

  borderRadius?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    full?: string;
  };

  shadows?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };

  extractedAt: Date;
  confidence: number;         // 0-1
}

export interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, any>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
  relevanceScore?: number;
}

export interface CloneAnalysis {
  url: string;
  framework: string | null;   // 'nextjs' | 'react' | 'vue' | etc.
  componentLibrary: string | null; // 'tailwind' | 'mui' | 'chakra' | etc.

  layouts: {
    page: string;
    sections: string[];
    components: string[];
  }[];

  designTokens: DesignTokens;

  screenshots?: {
    page: string;
    url: string;
    base64?: string;
  }[];
}

export interface ToolError {
  tool: string;
  error: string;
  recoverable: boolean;
  fallbackUsed?: string;
}

// ============================================================================
// AGENT CONFIGURATION
// ============================================================================

export interface SearchAgentConfig {
  // Organization
  orgId: string;
  userId?: string;

  // Tool enablement
  enableExa: boolean;
  enableGitHub: boolean;
  enableDuckDuckGo: boolean;
  enableBrave: boolean;
  enableCodeExtraction: boolean;
  enableBrandScraping: boolean;
  enableCloneAnalysis: boolean;
  enableContentScraping: boolean;

  // RAG settings
  enableVectorStore: boolean;
  vectorStoreProvider?: 'memory' | 'pinecone' | 'supabase';

  // Cache settings
  cacheEnabled: boolean;
  cacheTTL: number;           // seconds

  // Quotas
  maxSearchesPerDay?: number;
  maxCodeFilesPerSearch?: number;
  maxScreenshotsPerSearch?: number;

  // Timeouts
  searchTimeout?: number;     // milliseconds
  scrapeTimeout?: number;     // milliseconds

  // LLM settings
  llmModel?: string;          // Default: claude-3-5-sonnet-20241022
  llmTemperature?: number;    // Default: 0
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CachedSearch {
  searchId: string;
  orgId: string;
  query: string;
  intent: SearchIntent;
  result: SearchResult;
  timestamp: Date;
  expiresAt: Date;
  hits: number;
}

export interface QuotaUsage {
  orgId: string;
  operation: string;
  count: number;
  cost: number;
  period: 'daily' | 'monthly';
  resetAt: Date;
}

export interface UsageStats {
  orgId: string;
  period: {
    start: Date;
    end: Date;
  };

  searches: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
  };

  tools: {
    [toolName: string]: {
      calls: number;
      successes: number;
      failures: number;
    };
  };

  tokens: {
    total: number;
    embedding: number;
    llm: number;
  };

  costs: {
    total: number;        // Always $0 for free tier
    breakdown: Record<string, number>;
  };
}

// ============================================================================
// TOOL SCHEMAS
// ============================================================================

export interface ExaSearchInput {
  query: string;
  numResults?: number;
  category?: 'research paper' | 'github' | 'tweet' | 'company';
}

export interface GitHubSearchInput {
  query: string;
  language?: string;
  stars?: string;
  numResults?: number;
}

export interface DuckDuckGoSearchInput {
  query: string;
  numResults?: number;
}

export interface BraveSearchInput {
  query: string;
  numResults?: number;
}

export interface CodeExtractorInput {
  repo: string;              // owner/repo
  paths?: string[];
  features?: string[];
  maxFiles?: number;
}

export interface BrandScraperInput {
  brand: string;             // Brand name or URL
  extractColors?: boolean;
  extractTypography?: boolean;
  extractSpacing?: boolean;
}

export interface CloneAnalyzerInput {
  url: string;
  analyzePages?: string[];   // Default: ['/', '/features', '/pricing']
  extractCode?: boolean;
}

export interface ContentScraperInput {
  url: string;
  extractTone?: boolean;
  extractCopy?: boolean;
  sections?: string[];       // CSS selectors
}

// ============================================================================
// VECTOR STORE TYPES
// ============================================================================

export interface CodeChunk {
  id: string;
  repo: string;
  path: string;
  content: string;
  language: string;
  startLine: number;
  endLine: number;
  embedding?: number[];
  metadata: Record<string, any>;
}

export interface SemanticSearchResult {
  chunk: CodeChunk;
  score: number;
  rank: number;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface SearchAnalytics {
  searchId: string;
  orgId: string;
  userId?: string;

  query: string;
  intent: IntentCategory;

  duration: number;
  success: boolean;

  toolsUsed: string[];
  toolDurations: Record<string, number>;
  toolErrors: Record<string, string>;

  resultsCount: {
    repositories: number;
    codeFiles: number;
    webResults: number;
    brandGuidelines: number;
  };

  cacheHit: boolean;
  tokensUsed: number;

  timestamp: Date;
}
