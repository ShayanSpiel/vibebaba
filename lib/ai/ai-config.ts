/**
 * AI Configuration - Single Source of Truth
 *
 * SWITCH BETWEEN SERVERLESS AND SERVER AI HERE:
 * Change AI_MODE to switch backends instantly
 */

export type AIMode = 'serverless' | 'server';
export type AIProvider = 'puter' | 'huggingface' | 'gemini' | 'openrouter' | 'groq' | 'mistral';

// ============================================
// 🎯 CHANGE THIS TO SWITCH AI BACKENDS
// ============================================
export let AI_MODE: AIMode = 'server'; // 'serverless' = Puter/HuggingFace, 'server' = Gemini/OpenRouter/Groq

// Model caching: stick with a working model until it fails
let cachedWorkingModel: {
  provider: AIProvider;
  model: string;
  timestamp: number;
} | null = null;

const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

// ============================================
// AI Mode Configurations
// ============================================

export const AI_CONFIG = {
  serverless: {
    name: 'Serverless AI (Puter + HuggingFace)',
    providers: ['puter', 'huggingface'] as AIProvider[],
    defaultModel: 'openrouter:openai/gpt-4o-mini',
    features: {
      streaming: true,
      vision: true,
      textToImage: true,
    },
    cost: 'FREE (user-pays or HF free tier)',
    notes: 'Runs in browser or via HuggingFace inference API',
  },
  server: {
    name: 'Server-Side AI (Mistral + Gemini + OpenRouter + Groq)',
    providers: ['mistral', 'gemini', 'openrouter', 'groq'] as AIProvider[],
    defaultModel: 'mistral-small-latest',
    features: {
      streaming: false,
      vision: false,
      textToImage: false,
    },
    cost: 'Your API costs',
    notes: 'Uses your API keys - runs on server with Mistral priority + 58 free models',
  },
} as const;

/**
 * Get current AI mode configuration
 */
export function getCurrentAIConfig() {
  return AI_CONFIG[AI_MODE];
}

/**
 * Get current AI mode
 */
export function getAIMode(): AIMode {
  return AI_MODE;
}

/**
 * Set AI mode (serverless or server)
 */
export function setAIMode(mode: AIMode): void {
  AI_MODE = mode;
  clearCachedWorkingModel(); // Clear cache when switching modes
  console.log(`[AI Config] Switched to ${mode} mode`);
}

/**
 * Check if using serverless AI
 */
export function isServerlessAI(): boolean {
  return AI_MODE === 'serverless';
}

/**
 * Check if using server-side AI
 */
export function isServerSideAI(): boolean {
  return AI_MODE === 'server';
}

/**
 * Get AI mode name for display
 */
export function getAIModeName(): string {
  return AI_CONFIG[AI_MODE].name;
}

/**
 * Get active providers for current mode
 */
export function getActiveProviders(): AIProvider[] {
  return AI_CONFIG[AI_MODE].providers;
}

/**
 * Get cached working model (if still valid)
 */
export function getCachedWorkingModel(): { provider: AIProvider; model: string } | null {
  if (!cachedWorkingModel) return null;

  const age = Date.now() - cachedWorkingModel.timestamp;
  if (age > CACHE_EXPIRATION_MS) {
    console.log('[AI Config] Cache expired, clearing...');
    cachedWorkingModel = null;
    return null;
  }

  return {
    provider: cachedWorkingModel.provider,
    model: cachedWorkingModel.model,
  };
}

/**
 * Set cached working model (call when model succeeds)
 */
export function setCachedWorkingModel(provider: AIProvider, model: string): void {
  cachedWorkingModel = {
    provider,
    model,
    timestamp: Date.now(),
  };
  console.log(`[AI Config] ✅ Cached working model: ${provider}/${model}`);
}

/**
 * Clear cached working model (call when model fails)
 */
export function clearCachedWorkingModel(): void {
  if (cachedWorkingModel) {
    console.log(
      `[AI Config] ❌ Cleared cached model: ${cachedWorkingModel.provider}/${cachedWorkingModel.model}`
    );
  }
  cachedWorkingModel = null;
}

/**
 * Get configuration summary
 */
export function getConfigSummary() {
  const cached = getCachedWorkingModel();
  return {
    mode: AI_MODE,
    activeProviders: getActiveProviders(),
    cachedModel: cached ? `${cached.provider}/${cached.model}` : null,
    cacheAge: cachedWorkingModel
      ? Math.floor((Date.now() - cachedWorkingModel.timestamp) / 1000)
      : null,
  };
}

/**
 * Log current AI configuration (for debugging)
 */
export function logAIConfig() {
  const config = getCurrentAIConfig();
  const cached = getCachedWorkingModel();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚙️  AI CONFIGURATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Mode:', AI_MODE);
  console.log('Name:', config.name);
  console.log('Providers:', config.providers.join(', '));
  console.log('Default Model:', config.defaultModel);
  console.log('Cost:', config.cost);
  console.log('Cached Model:', cached ? `${cached.provider}/${cached.model}` : 'None');
  console.log('Notes:', config.notes);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Auto-log config in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => logAIConfig(), 500);
}
