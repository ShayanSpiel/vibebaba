/**
 * SEARCH AGENT - CONFIGURATION
 *
 * Default configuration and config builder
 */

import type { SearchAgentConfig } from './types';

/**
 * Default configuration for search agent
 */
export const DEFAULT_CONFIG: Omit<SearchAgentConfig, 'orgId'> = {
  // Tool enablement (all enabled by default)
  enableExa: true,
  enableGitHub: true,
  enableDuckDuckGo: true,
  enableBrave: true,
  enableCodeExtraction: true,
  enableBrandScraping: true,
  enableCloneAnalysis: true,
  enableContentScraping: true,

  // RAG settings
  enableVectorStore: true,
  vectorStoreProvider: 'memory',  // Upgrade to Pinecone/Supabase for production

  // Cache settings
  cacheEnabled: true,
  cacheTTL: 3600,                 // 1 hour

  // Quotas (generous for free tier)
  maxSearchesPerDay: 100,
  maxCodeFilesPerSearch: 10,
  maxScreenshotsPerSearch: 5,

  // Timeouts
  searchTimeout: 30000,           // 30 seconds
  scrapeTimeout: 15000,           // 15 seconds

  // LLM settings
  llmModel: 'claude-3-5-sonnet-20241022',
  llmTemperature: 0,
};

/**
 * Build search agent config with overrides
 */
export function buildConfig(
  orgId: string,
  overrides?: Partial<SearchAgentConfig>
): SearchAgentConfig {
  return {
    ...DEFAULT_CONFIG,
    orgId,
    ...overrides,
  };
}

/**
 * Quota limits by operation type
 */
export const QUOTA_LIMITS = {
  // Free tier limits (per org per day)
  FREE_TIER: {
    searches: 100,
    codeExtractions: 50,
    brandScrapes: 20,
    screenshots: 30,
    cloneAnalyses: 10,
  },

  // Paid tier limits (future)
  PAID_TIER: {
    searches: 1000,
    codeExtractions: 500,
    brandScrapes: 200,
    screenshots: 300,
    cloneAnalyses: 100,
  },
};

/**
 * Cache TTL by result type
 */
export const CACHE_TTL = {
  codeSearch: 3600,              // 1 hour
  brandGuidelines: 86400,        // 24 hours (brands don't change often)
  webSearch: 1800,               // 30 minutes
  cloneAnalysis: 43200,          // 12 hours
  apiDocs: 7200,                 // 2 hours
};

/**
 * Tool costs (for analytics - all $0 for free tier)
 */
export const TOOL_COSTS = {
  exaSearch: 0,                  // FREE tier: 1000/month
  githubSearch: 0,               // FREE unlimited
  duckduckgoSearch: 0,           // FREE unlimited
  braveSearch: 0,                // FREE unlimited
  codeExtraction: 0,             // FREE (uses GitHub API)
  brandScraping: 0,              // FREE (Puppeteer + Gemini Vision free tier)
  cloneAnalysis: 0,              // FREE
  contentScraping: 0,            // FREE
  embedding: 0,                  // FREE tier: 2M tokens/day
  llm: 0,                        // FREE tier: 100k tokens/day
};

/**
 * API endpoints for external services
 */
export const API_ENDPOINTS = {
  exa: 'https://api.exa.ai',
  github: 'https://api.github.com',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com/v1',
  mistral: 'https://api.mistral.ai',
};

/**
 * Environment variable keys
 */
export const ENV_KEYS = {
  EXA_API_KEY: 'EXA_API_KEY',
  GITHUB_TOKEN: 'GITHUB_TOKEN',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  MISTRAL_API_KEY: 'MISTRAL_API_KEY',
};

/**
 * Validate environment variables
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  // Required
  if (!process.env.ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY');

  // Optional but recommended
  if (!process.env.EXA_API_KEY) console.warn('[SearchAgent] EXA_API_KEY not set - Exa search disabled');
  if (!process.env.GITHUB_TOKEN) console.warn('[SearchAgent] GITHUB_TOKEN not set - GitHub rate limits apply');
  if (!process.env.OPENAI_API_KEY) console.warn('[SearchAgent] OPENAI_API_KEY not set - Embeddings disabled');
  if (!process.env.GEMINI_API_KEY) console.warn('[SearchAgent] GEMINI_API_KEY not set - Vision analysis disabled');
  if (!process.env.MISTRAL_API_KEY) console.warn('[SearchAgent] MISTRAL_API_KEY not set - Mistral LLM disabled');

  return {
    valid: missing.length === 0,
    missing,
  };
}
