/**
 * AI Configuration Store
 * Persistent storage for AI configuration using filesystem
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export type AIMode = 'serverless' | 'server';
export type AIProvider = 'puter' | 'huggingface' | 'gemini' | 'openrouter' | 'groq' | 'mistral';

interface AIConfigData {
  mode: AIMode;
  cachedModel: string | null;
  cachedProvider: AIProvider | null;
  cachedTimestamp: number | null;
}

const CONFIG_FILE = join(process.cwd(), '.ai-config.json');

// Default configuration
const DEFAULT_CONFIG: AIConfigData = {
  mode: 'server',
  cachedModel: null,
  cachedProvider: null,
  cachedTimestamp: null,
};

/**
 * Read configuration from file
 */
function readConfig(): AIConfigData {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[AI Config Store] Error reading config:', error);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Write configuration to file
 */
function writeConfig(config: AIConfigData): void {
  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('[AI Config Store] Error writing config:', error);
  }
}

/**
 * Get current AI mode
 */
export function getAIMode(): AIMode {
  const config = readConfig();
  return config.mode;
}

/**
 * Set AI mode
 */
export function setAIMode(mode: AIMode): void {
  const config = readConfig();
  config.mode = mode;
  // Clear cache when switching modes
  config.cachedModel = null;
  config.cachedProvider = null;
  config.cachedTimestamp = null;
  writeConfig(config);
  console.log(`[AI Config Store] Mode set to: ${mode}`);
}

/**
 * Get cached working model
 */
export function getCachedWorkingModel(): { provider: AIProvider; model: string } | null {
  const config = readConfig();
  
  if (!config.cachedModel || !config.cachedProvider || !config.cachedTimestamp) {
    return null;
  }

  const CACHE_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes (increased from 5 for rate limit optimization)
  const age = Date.now() - config.cachedTimestamp;

  if (age > CACHE_EXPIRATION_MS) {
    console.log('[AI Config Store] Cache expired, clearing...');
    clearCachedWorkingModel();
    return null;
  }

  return {
    provider: config.cachedProvider,
    model: config.cachedModel,
  };
}

/**
 * Set cached working model
 */
export function setCachedWorkingModel(provider: AIProvider, model: string): void {
  const config = readConfig();
  config.cachedModel = model;
  config.cachedProvider = provider;
  config.cachedTimestamp = Date.now();
  writeConfig(config);
  console.log(`[AI Config Store] Cached: ${provider}/${model}`);
}

/**
 * Clear cached working model
 */
export function clearCachedWorkingModel(): void {
  const config = readConfig();
  config.cachedModel = null;
  config.cachedProvider = null;
  config.cachedTimestamp = null;
  writeConfig(config);
  console.log('[AI Config Store] Cache cleared');
}

/**
 * Get configuration summary
 */
export function getConfigSummary() {
  const config = readConfig();
  const cached = getCachedWorkingModel();
  
  const activeProviders = config.mode === 'serverless'
    ? ['puter', 'huggingface']
    : ['mistral', 'gemini', 'openrouter', 'groq'];
  
  return {
    mode: config.mode,
    activeProviders,
    cachedModel: cached ? `${cached.provider}/${cached.model}` : null,
    cacheAge: config.cachedTimestamp ? Math.floor((Date.now() - config.cachedTimestamp) / 1000) : null,
  };
}
