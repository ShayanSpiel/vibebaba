// lib/langsmith/tracing.ts
/**
 * LangSmith Tracing Integration
 * Wraps node execution with LangSmith tracing for observability
 *
 * 🔧 NOTE: LangSmith SDK makes multiple API calls on import, causing 403 rate limit errors
 * This is a known issue with langsmith@0.3.x - upgrade to 0.4+ when available
 */

import type { AppGenState } from '@/lib/langgraph/types';

// 🔧 CRITICAL FIX: Singleton SDK initialization to prevent concurrent API calls
// Multiple nodes importing this file would trigger concurrent SDK loads, causing rate limits
let traceable: any;
let wrapOpenAI: any;
let sdkInitialized = false;
let sdkInitializing = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize LangSmith SDK once (singleton pattern)
 * Prevents concurrent API calls when multiple nodes load simultaneously
 */
async function initializeLangSmithSDK(): Promise<void> {
  // Already initialized - skip
  if (sdkInitialized) {
    return;
  }

  // Already initializing - wait for it to complete
  if (sdkInitializing && initPromise) {
    return initPromise;
  }

  // Start initialization
  sdkInitializing = true;
  initPromise = new Promise((resolve) => {
    try {
      console.log('[LangSmith] 🔄 Initializing SDK (singleton)...');
      const langsmith = require('langsmith/traceable');
      const wrappers = require('langsmith/wrappers');
      traceable = langsmith.traceable;
      wrapOpenAI = wrappers.wrapOpenAI;
      sdkInitialized = true;
      console.log('[LangSmith] ✅ SDK initialized successfully');
      resolve();
    } catch (error) {
      console.error('[LangSmith] ❌ Failed to initialize SDK:', error);
      resolve(); // Resolve anyway to prevent blocking
    } finally {
      sdkInitializing = false;
    }
  });

  return initPromise;
}

// Track if LangSmith is having issues (rate limits, auth errors, etc.)
let langSmithHealthy = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000; // Check every 60 seconds

/**
 * Check if LangSmith is enabled and healthy
 */
export function isLangSmithEnabled(): boolean {
  const enabled = !!(process.env.LANGCHAIN_API_KEY && process.env.LANGCHAIN_TRACING_V2 === 'true');

  if (!enabled) return false;

  // If unhealthy and within cooldown period, return false
  if (!langSmithHealthy && Date.now() - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return false;
  }

  // Reset health status after cooldown
  if (!langSmithHealthy && Date.now() - lastHealthCheck >= HEALTH_CHECK_INTERVAL) {
    console.log('[LangSmith] 🔄 Cooldown period over, re-enabling tracing');
    langSmithHealthy = true;
  }

  return true;
}

/**
 * Mark LangSmith as unhealthy (called on 403/429 errors)
 */
export function markLangSmithUnhealthy(error: string) {
  langSmithHealthy = false;
  lastHealthCheck = Date.now();
  console.warn(
    `[LangSmith] ⚠️ Temporarily disabled due to error: ${error}. Will retry in ${HEALTH_CHECK_INTERVAL / 1000}s`
  );
}

/**
 * Wrap a LangGraph node with LangSmith tracing
 *
 * Usage:
 * ```ts
 * export const pmNode = withLangSmithTracing('pm', async (state: AppGenState) => {
 *   // node implementation
 * });
 * ```
 */
export function withLangSmithTracing<T extends AppGenState>(
  nodeName: string,
  nodeFunction: (state: T) => Promise<Partial<T>>
): (state: T) => Promise<Partial<T>> {
  if (!isLangSmithEnabled()) {
    // Tracing disabled - return unwrapped function (no overhead)
    return nodeFunction;
  }

  // Return async wrapper that initializes SDK on first call
  return async (state: T) => {
    // 🎯 SINGLETON FIX: Initialize SDK only once, even if called by multiple nodes
    await initializeLangSmithSDK();

    // Safety check: ensure SDK was loaded successfully
    if (!traceable) {
      console.warn(`[LangSmith] ⚠️ SDK not available, running ${nodeName} without tracing`);
      return await nodeFunction(state);
    }

    // Wrap with traceable (creates trace span)
    const traced = traceable(nodeFunction, {
      name: `langgraph-${nodeName}-node`,
      project: process.env.LANGCHAIN_PROJECT || 'vibebaba-app-gen',
      tags: ['langgraph', 'node', nodeName],
      metadata: {
        nodeType: nodeName,
        framework: 'langgraph',
        version: '1.0.0',
      },
    });

    console.log(`[LangSmith] 🔍 Tracing ${nodeName} node`);

    try {
      const result = await traced(state);
      console.log(`[LangSmith] ✅ ${nodeName} trace complete`);
      return result;
    } catch (error: any) {
      // Check for rate limiting or auth errors
      const is403or429 =
        error?.message?.includes('403') ||
        error?.message?.includes('429') ||
        error?.status === 403 ||
        error?.status === 429;

      if (is403or429) {
        markLangSmithUnhealthy(error?.message || 'Rate limit or auth error');
        // Run without tracing
        console.warn(`[LangSmith] ⚠️ Running ${nodeName} without tracing due to error`);
        return await nodeFunction(state);
      }

      console.error(`[LangSmith] ❌ ${nodeName} trace error:`, error);
      // Still run the node even if tracing fails
      return await nodeFunction(state);
    }
  };
}

/**
 * Create a traced AI generation call
 *
 * Usage:
 * ```ts
 * const result = await traceAICall('pm-planning', async () => {
 *   return await generateWithFallback(prompt);
 * }, { userRequest, complexity });
 * ```
 */
export async function traceAICall<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  if (!isLangSmithEnabled()) {
    return operation();
  }

  // 🎯 SINGLETON FIX: Initialize SDK only once
  await initializeLangSmithSDK();

  if (!traceable) {
    console.warn('[LangSmith] ⚠️ SDK not available, running operation without tracing');
    return operation();
  }

  const traced = traceable(operation, {
    name: operationName,
    project: process.env.LANGCHAIN_PROJECT || 'vibebaba-app-gen',
    tags: ['ai-call', 'generation'],
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  });

  return traced();
}

/**
 * Log node execution metrics to LangSmith
 */
export function logNodeMetrics(
  nodeName: string,
  metrics: {
    duration: number;
    tokenUsage?: number;
    success: boolean;
    error?: string;
  }
) {
  if (!isLangSmithEnabled()) {
    return;
  }

  console.log(`[LangSmith] 📊 ${nodeName} metrics:`, {
    node: nodeName,
    ...metrics,
  });
}

/**
 * Wrap OpenAI client with LangSmith tracing
 * Call this once at app initialization
 */
export async function initializeLangSmithOpenAI(openAIClient: any) {
  if (!isLangSmithEnabled()) {
    return openAIClient;
  }

  // 🎯 SINGLETON FIX: Initialize SDK only once
  await initializeLangSmithSDK();

  if (!wrapOpenAI) {
    console.warn('[LangSmith] ⚠️ SDK not available, returning unwrapped OpenAI client');
    return openAIClient;
  }

  console.log('[LangSmith] 🔧 Wrapping OpenAI client');
  return wrapOpenAI(openAIClient);
}
