/**
 * SEARCH AGENT - MAIN EXPORTS
 *
 * Universal search and retrieval engine
 */

export { SearchAgent } from './agent';
export { analyzeIntent } from './intent-analyzer';
export { buildConfig, DEFAULT_CONFIG, validateEnv } from './config';
export { getSearchCache } from './cache/search-cache';
export { getQuotaManager } from './cache/quota-manager';
export { getAnalyticsTracker } from './cache/analytics';
export { getCodeVectorStore } from './rag/vector-store';

export type {
  SearchAgentConfig,
  SearchContext,
  SearchResult,
  SearchIntent,
  IntentCategory,
  GitHubRepository,
  ExtractedCode,
  BrandGuideline,
  DesignTokens,
  WebSearchResult,
  CloneAnalysis,
  UsageStats,
  SearchAnalytics,
} from './types';
