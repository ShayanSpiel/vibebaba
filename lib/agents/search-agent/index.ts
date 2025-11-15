/**
 * SEARCH AGENT - MAIN EXPORTS
 *
 * Universal search and retrieval engine
 */

export { SearchAgent } from './agent';
export { getAnalyticsTracker } from './cache/analytics';
export { getQuotaManager } from './cache/quota-manager';
export { getSearchCache } from './cache/search-cache';
export { buildConfig, DEFAULT_CONFIG, validateEnv } from './config';
export { analyzeIntent } from './intent-analyzer';
export { getCodeVectorStore } from './rag/vector-store';

export type {
  BrandGuideline,
  CloneAnalysis,
  DesignTokens,
  ExtractedCode,
  GitHubRepository,
  IntentCategory,
  SearchAgentConfig,
  SearchAnalytics,
  SearchContext,
  SearchIntent,
  SearchResult,
  UsageStats,
  WebSearchResult,
} from './types';
