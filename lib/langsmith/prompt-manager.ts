// lib/langsmith/prompt-manager.ts
import { getLangSmithClient } from './client';

/**
 * Cache for loaded prompts to avoid repeated API calls
 */
const promptCache = new Map<string, { prompt: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * A/B test configuration
 */
export interface ABTestConfig {
  enabled: boolean;
  variants: {
    name: string;
    promptName: string; // Format: "owner/prompt-name" or "owner/prompt-name:version"
    weight: number; // 0-100, should sum to 100 across variants
  }[];
  strategy: 'random' | 'user-hash'; // random = pure random, user-hash = consistent per user
}

/**
 * Metrics tracked for each prompt execution
 */
export interface PromptMetrics {
  promptName: string;
  variant?: string;
  tokensUsed?: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  timestamp: string;
  userId?: string;
  projectId?: string;
}

/**
 * Fetch a prompt from LangSmith Hub with caching
 */
export async function fetchPrompt(promptName: string, useCache = true): Promise<any> {
  // Check cache first
  if (useCache) {
    const cached = promptCache.get(promptName);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[LangSmith] Using cached prompt: ${promptName}`);
      return cached.prompt;
    }
  }

  const client = getLangSmithClient();

  try {
    console.log(`[LangSmith] Fetching prompt from Hub: ${promptName}`);
    const prompt = await client.pullPromptCommit(promptName);

    // Cache the prompt
    promptCache.set(promptName, {
      prompt,
      timestamp: Date.now(),
    });

    return prompt;
  } catch (error: any) {
    console.error(`[LangSmith] Failed to fetch prompt "${promptName}":`, error.message);
    throw new Error(
      `Failed to fetch prompt from LangSmith Hub. ` +
        `Make sure the prompt "${promptName}" exists and is public, or you have access to it.`
    );
  }
}

/**
 * Select a variant for A/B testing
 */
export function selectVariant(
  config: ABTestConfig,
  userId?: string
): { name: string; promptName: string } {
  if (!config.enabled || config.variants.length === 0) {
    throw new Error('A/B test config is invalid or not enabled');
  }

  // Single variant - no selection needed
  if (config.variants.length === 1) {
    return config.variants[0];
  }

  // Validate weights sum to 100
  const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    console.warn(`[LangSmith] Variant weights sum to ${totalWeight}, not 100. Normalizing...`);
  }

  let selector: number;

  if (config.strategy === 'user-hash' && userId) {
    // Consistent selection per user (same user always gets same variant)
    selector = simpleHash(userId) % 100;
  } else {
    // Random selection
    selector = Math.random() * 100;
  }

  // Select variant based on cumulative weights
  let cumulative = 0;
  for (const variant of config.variants) {
    cumulative += variant.weight;
    if (selector < cumulative) {
      return variant;
    }
  }

  // Fallback to last variant
  return config.variants[config.variants.length - 1];
}

/**
 * Simple hash function for consistent user-based selection
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Fetch prompt with A/B testing support
 */
export async function fetchPromptWithABTest(
  config: ABTestConfig,
  userId?: string
): Promise<{ prompt: any; variant: string }> {
  const selected = selectVariant(config, userId);

  console.log(`[LangSmith] A/B Test - Selected variant: "${selected.name}"`);
  console.log(`[LangSmith]   Prompt: ${selected.promptName}`);

  const prompt = await fetchPrompt(selected.promptName);

  return {
    prompt,
    variant: selected.name,
  };
}

/**
 * Track prompt execution metrics
 */
export async function trackPromptMetrics(metrics: PromptMetrics) {
  try {
    // Log to console for now
    console.log(`[LangSmith Metrics]`, {
      prompt: metrics.promptName,
      variant: metrics.variant,
      latency: `${metrics.latencyMs}ms`,
      tokens: metrics.tokensUsed,
      success: metrics.success,
      error: metrics.error,
    });

    // TODO: Send to LangSmith or your analytics service
    // You can use client.createRun() or custom metrics endpoint
  } catch (error) {
    console.error('[LangSmith] Failed to track metrics:', error);
  }
}

/**
 * Format prompt with variables
 */
export function formatPrompt(prompt: any, variables: Record<string, any>): string {
  try {
    // LangSmith prompts have a .format() method
    if (typeof prompt.format === 'function') {
      return prompt.format(variables);
    }

    // Fallback: manual string replacement
    let formatted = prompt.toString();
    for (const [key, value] of Object.entries(variables)) {
      formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }

    return formatted;
  } catch (error) {
    console.error('[LangSmith] Failed to format prompt:', error);
    throw error;
  }
}

/**
 * Clear prompt cache (useful for testing or force refresh)
 */
export function clearPromptCache() {
  promptCache.clear();
  console.log('[LangSmith] Prompt cache cleared');
}
