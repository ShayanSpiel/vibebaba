import { GoogleGenerativeAI } from "@google/generative-ai";
import { getMCPManager, formatToolsForPrompt, parseToolCalls } from "../mcp/client";
import { getServersForContext, getMCPToolInstructions, isMCPEnabled } from "../mcp/config";
import { getCachedWorkingModel, setCachedWorkingModel, clearCachedWorkingModel, getAIMode, type AIProvider } from "./ai-config-store";
import { getAIThrottler } from "./ai-throttler";
import { getRateLimitTracker } from "../monitoring/rate-limit-tracker";

type Locale = "en" | "fa" | "ar";

// Gemini API configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Available models in priority order (VERIFIED WORKING MODELS ONLY)
// Only models verified to exist and work with the Gemini API
const GEMINI_MODELS = [
  // TIER 1: High RPD (200-250 requests/day) - VERIFIED WORKING ✅
  "gemini-2.0-flash-exp",                      // Experimental (best quality, 50 RPD)
  "gemini-2.0-flash",                          // Stable 2.0 Flash (1M context, 200 RPD)
  "gemini-1.5-flash",                          // Most reliable (1M context, high RPD)
  "gemini-1.5-flash-002",                      // Flash latest version
  "gemini-1.5-flash-8b",                       // Smaller fast variant

  // TIER 2: Pro models (50 RPD) - Best quality ⭐
  "gemini-1.5-pro",                            // Most capable
  "gemini-1.5-pro-002",                        // Pro latest

  // TIER 3: Legacy models (backup)
  "gemini-1.0-pro",                            // Original Pro
];

// OpenRouter configuration - Use function to read env var lazily
const getOpenRouterApiKey = () => process.env.OPENROUTER_API_KEY || "";
// ALL FREE OpenRouter models (no credits required)
const OPENROUTER_FREE_MODELS = [
  // TIER 1: Most capable models (Best first)
  "qwen/qwen3-235b-a22b:free",                 // Qwen 3 235B - Largest model
  "deepseek/deepseek-r1-0528:free",            // DeepSeek R1 - Advanced reasoning
  "deepseek/deepseek-chat-v3.1:free",          // DeepSeek V3.1 - Excellent reasoning
  "deepseek/deepseek-chat-v3-0324:free",       // DeepSeek V3 (March version)
  "alibaba/tongyi-deepresearch-30b-a3b:free",  // Alibaba Tongyi DeepResearch 30B
  "tngtech/deepseek-r1t2-chimera:free",        // DeepSeek R1T2 Chimera - Hybrid model

  // TIER 2: Large 70B+ models
  "meta-llama/llama-3.3-70b-instruct:free",    // Llama 3.3 70B - Latest Meta
  "moonshotai/kimi-dev-72b:free",              // Moonshot Kimi 72B

  // TIER 3: Medium 30B-32B models
  "qwen/qwen-2.5-coder-32b-instruct:free",     // Qwen 2.5 Coder 32B - Best for coding
  "qwen/qwen3-30b-a3b:free",                   // Qwen 3 30B
  "qwen/qwen3-coder:free",                     // Qwen 3 Coder
  "google/gemma-3-27b-it:free",                // Gemma 3 27B

  // TIER 4: Small but powerful models
  "mistralai/mistral-small-3.2-24b-instruct:free", // Mistral Small 3.2 24B
  "openai/gpt-oss-20b:free",                   // OpenAI GPT-OSS 20B
  "agentica-org/deepcoder-14b-preview:free",   // DeepCoder 14B - Code specialist
  "microsoft/mai-ds-r1:free",                  // Microsoft MAI-DS R1
  "z-ai/glm-4.5-air:free",                     // GLM 4.5 Air

  // TIER 5: Fast models
  "meituan/longcat-flash-chat:free",           // Meituan LongCat Flash
  "nvidia/nemotron-nano-9b-v2:free",           // NVIDIA Nemotron Nano 9B

  // TIER 6: Trial/Alpha models
  "openrouter/andromeda-alpha",                // OpenRouter Andromeda Alpha
];

// Mistral configuration - Use functions to read env vars lazily (after dotenv loads)
// NOTE: Codestral uses dedicated endpoint (codestral.mistral.ai) with CODESTRAL_API_KEY
// Other Mistral models use standard endpoint (api.mistral.ai) with MISTRAL_API_KEY
const getMistralApiKey = () => process.env.MISTRAL_API_KEY || "";
const getCodestralApiKey = () => process.env.CODESTRAL_API_KEY || "";

// VERIFIED WORKING MODELS (Tested 2025-11-10) ✅
const MISTRAL_MODELS = [
  "ministral-3b-latest",            // Ultra fast - 3B params (standard endpoint)
  "ministral-8b-latest",            // Fast - 8B params (standard endpoint)
  "codestral-latest",               // Code specialist (DEDICATED endpoint: codestral.mistral.ai)
  "mistral-small-latest",           // Balanced - good quality/speed (standard endpoint)
  "mistral-large-latest",           // Most capable - Latest (standard endpoint)
  "mistral-large-2411",             // Most capable - 123B params (standard endpoint)
];

// Groq configuration - Use function to read env var lazily
const getGroqApiKey = () => process.env.GROQ_API_KEY || "";

// TIMEOUT CONFIGURATION: Optimized for better UX
const AI_REQUEST_TIMEOUT = 60000; // 60 seconds per AI request - better user experience

/**
 * Create a fetch request with timeout
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 60 seconds)
 * @returns Promise<Response>
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = AI_REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs / 1000} seconds`);
    }
    throw error;
  }
}

// ALL FREE Groq models (extremely fast inference)
const GROQ_FREE_MODELS = [
  // TIER 1: Production Models (Fast & Reliable)
  "llama-3.3-70b-versatile",                   // Meta Llama 3.3 70B - Most capable
  "llama-3.1-8b-instant",                      // Meta Llama 3.1 8B - Ultra fast
  "openai/gpt-oss-120b",                       // OpenAI GPT-OSS 120B - Very large
  "openai/gpt-oss-20b",                        // OpenAI GPT-OSS 20B

  // TIER 2: Preview Models (Experimental)
  "meta-llama/llama-4-maverick-17b-128e-instruct",  // Llama 4 Maverick
  "meta-llama/llama-4-scout-17b-16e-instruct",      // Llama 4 Scout
  "moonshotai/kimi-k2-instruct-0905",          // Moonshot Kimi K2
  "qwen/qwen3-32b",                            // Qwen 3 32B

  // TIER 3: Compound Systems (Agentic)
  "groq/compound",                             // Groq Compound - With tools
  "groq/compound-mini",                        // Groq Compound Mini
];

// Type for AI generation result with metadata
export interface AIGenerationResult {
  text: string;
  model: string;
  provider: "claude" | "gemini" | "openrouter" | "groq" | "mistral";
  attemptsLog: string[];
  tokenCount?: number;  // Actual token count from API response
}

/**
 * Try to generate content with automatic fallback to different models
 * Returns both the generated text AND metadata about which model was used
 */
export async function generateWithFallback(prompt: string): Promise<string>;
export async function generateWithFallback(prompt: string, returnMetadata: true): Promise<AIGenerationResult>;
export async function generateWithFallback(prompt: string, returnMetadata?: boolean): Promise<string | AIGenerationResult> {
  const attemptsLog: string[] = [];

  // SERVER MODE: Use Gemini, OpenRouter, Groq
  const serverMsg = '🖥️  Using server mode (Gemini + OpenRouter + Groq)';
  console.log(`[AI] ${serverMsg}`);
  attemptsLog.push(serverMsg);

  // CHECK CACHE FIRST: Use last working model if available
  const cached = getCachedWorkingModel();
  if (cached) {
    try {
      const cacheMsg = `🎯 Using cached working model: ${cached.provider}/${cached.model}`;
      console.log(`[AI] ${cacheMsg}`);
      attemptsLog.push(cacheMsg);

      let text: string;
      let tokenCount: number | undefined;

      // Try the cached model based on provider
      if (cached.provider === 'mistral') {
        // Use correct endpoint and API key based on model type
        const isCodestralModel = cached.model.includes("codestral");
        const apiEndpoint = isCodestralModel
          ? "https://codestral.mistral.ai/v1/chat/completions"
          : "https://api.mistral.ai/v1/chat/completions";
        const apiKey = isCodestralModel ? getCodestralApiKey() : getMistralApiKey();

        const response = await fetchWithTimeout(apiEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: cached.model,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        text = data.choices[0].message.content;
        tokenCount = data.usage?.total_tokens;
      } else if (cached.provider === 'gemini') {
        const model = genAI.getGenerativeModel({ model: cached.model });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        tokenCount = (response as any).usageMetadata?.totalTokenCount;
      } else if (cached.provider === 'openrouter') {
        const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${getOpenRouterApiKey()}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://vibebaba.app",
            "X-Title": "Vibebaba",
          },
          body: JSON.stringify({
            model: cached.model,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        text = data.choices[0].message.content;
      } else if (cached.provider === 'groq') {
        const response = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${getGroqApiKey()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: cached.model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 8192, // Increased from 4096 to support longer code generation
            temperature: 0, // Deterministic code generation
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        text = data.choices[0].message.content;
        tokenCount = data.usage?.total_tokens;
      } else {
        throw new Error(`Unknown cached provider: ${cached.provider}`);
      }

      const successMsg = `✅ CACHE HIT: ${cached.provider}/${cached.model} worked!`;
      console.log(`[AI] ${successMsg}`);
      attemptsLog.push(successMsg);

      if (returnMetadata) {
        return { text, model: cached.model, provider: cached.provider, attemptsLog, tokenCount };
      }
      return text;
    } catch (error: any) {
      const failMsg = `❌ CACHE MISS: ${cached.provider}/${cached.model} failed - ${error.message}`;
      console.warn(`[AI] ${failMsg}`);
      attemptsLog.push(failMsg);
      clearCachedWorkingModel(); // Clear failed cache
      // Continue to full fallback chain below
    }
  }

  // FIRST PRIORITY: Try Gemini models (TEMPORARY - for testing JSX issue)
  const rateLimitTracker = getRateLimitTracker();
  const throttler = getAIThrottler();

  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    try {
      const modelName = GEMINI_MODELS[i];

      // OPTIMIZATION: Skip rate-limited models
      if (rateLimitTracker.isRateLimited('gemini', modelName)) {
        const skipMsg = `⏭️  SKIPPING: ${modelName} - Rate limited (in cooldown)`;
        console.log(`[AI] ${skipMsg}`);
        attemptsLog.push(skipMsg);
        continue;
      }

      const attemptMsg = `🤖 Trying Gemini model: ${modelName} (${i + 1}/${GEMINI_MODELS.length})`;
      console.log(`[AI] ${attemptMsg}`);
      attemptsLog.push(attemptMsg);

      // OPTIMIZATION: Throttle request to prevent rate limits
      const result = await throttler.enqueue(async () => {
        const model = genAI.getGenerativeModel({ model: modelName });
        return await model.generateContent(prompt);
      });

      const response = await result.response;

      // Extract actual token count from API response
      const tokenCount = (response as any).usageMetadata?.totalTokenCount;
      const successMsg = `✅ SUCCESS: ${modelName} - Generated ${response.text().length} characters${tokenCount ? ` (${tokenCount} tokens)` : ''}`;
      console.log(`[AI] ${successMsg}`);
      attemptsLog.push(successMsg);

      // Cache this working model
      setCachedWorkingModel('gemini', modelName);

      if (returnMetadata) {
        return {
          text: response.text(),
          model: modelName,
          provider: "gemini",
          attemptsLog,
          tokenCount
        };
      }
      return response.text();
    } catch (error: any) {
      const failMsg = `❌ FAILED: ${GEMINI_MODELS[i]} - ${error.message}`;
      console.warn(`[AI] ${failMsg}`);
      attemptsLog.push(failMsg);

      // OPTIMIZATION: Detect and track rate limit errors
      const isRateLimitError =
        error.message?.includes("429") ||
        error.message?.includes("quota") ||
        error.message?.includes("overload");

      if (isRateLimitError) {
        rateLimitTracker.recordRateLimit('gemini', GEMINI_MODELS[i], error.message);
        const trackMsg = `⚠️  RATE LIMIT TRACKED: ${GEMINI_MODELS[i]} - Will skip for cooldown period`;
        console.log(`[AI] ${trackMsg}`);
        attemptsLog.push(trackMsg);
        continue; // Continue to next model
      }

      // Continue trying other Gemini models for these errors:
      // - 503: Service overloaded / unavailable
      // - unavailable: Service unavailable
      const shouldRetryWithNextModel =
        error.message?.includes("503") ||
        error.message?.includes("unavailable");

      if (shouldRetryWithNextModel) {
        continue;
      }

      // For other errors (auth, invalid request, etc.), skip to OpenRouter
      break;
    }
  }

  // SECOND PRIORITY: If all Gemini models failed, try Mistral models as fallback
  const mistralMsg = `🔄 All ${GEMINI_MODELS.length} Gemini models failed, trying Mistral models (fallback)...`;
  console.log(`[AI] ${mistralMsg}`);
  attemptsLog.push(mistralMsg);

  for (let i = 0; i < MISTRAL_MODELS.length; i++) {
    try {
      const modelName = MISTRAL_MODELS[i];

      // OPTIMIZATION: Skip rate-limited models
      if (rateLimitTracker.isRateLimited('mistral', modelName)) {
        const skipMsg = `⏭️  SKIPPING: ${modelName} - Rate limited (in cooldown)`;
        console.log(`[AI] ${skipMsg}`);
        attemptsLog.push(skipMsg);
        continue;
      }

      const attemptMsg = `🤖 Trying Mistral model: ${modelName} (${i + 1}/${MISTRAL_MODELS.length})`;
      console.log(`[AI] ${attemptMsg}`);
      attemptsLog.push(attemptMsg);

      // Codestral uses DEDICATED endpoint with CODESTRAL_API_KEY
      // Other Mistral models use STANDARD endpoint with MISTRAL_API_KEY
      const isCodestralModel = modelName.includes("codestral");
      const apiEndpoint = isCodestralModel
        ? "https://codestral.mistral.ai/v1/chat/completions"  // Dedicated Codestral endpoint
        : "https://api.mistral.ai/v1/chat/completions";       // Standard Mistral endpoint
      const apiKey = isCodestralModel ? getCodestralApiKey() : getMistralApiKey();

      // OPTIMIZATION: Throttle request to prevent rate limits
      const response = await throttler.enqueue(async () => {
        return await fetchWithTimeout(apiEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: "user", content: prompt }],
          }),
        });
      });

      if (!response.ok) {
        // Try to parse as JSON, fallback to text if it fails
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          // Response is not JSON, try to read as text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            // Ignore text parsing error, use default
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const tokenCount = data.usage?.total_tokens;
      const successMsg = `✅ SUCCESS: ${modelName} via Mistral - Generated ${content.length} characters${tokenCount ? ` (${tokenCount} tokens)` : ''}`;
      console.log(`[AI] ${successMsg}`);
      attemptsLog.push(successMsg);

      // Cache this working model
      setCachedWorkingModel('mistral', modelName);

      if (returnMetadata) {
        return {
          text: content,
          model: modelName,
          provider: "mistral",
          attemptsLog,
          tokenCount
        };
      }
      return content;
    } catch (error: any) {
      const failMsg = `❌ FAILED: ${MISTRAL_MODELS[i]} - ${error.message}`;
      console.warn(`[AI] ${failMsg}`);
      attemptsLog.push(failMsg);

      // OPTIMIZATION: Track rate limits and capacity errors for Mistral
      const isRateLimitError =
        error.message?.includes("429") ||
        error.message?.includes("rate limit") ||
        error.message?.includes("rate_limit") ||
        error.message?.includes("quota") ||
        error.message?.includes("service_tier_capacity_exceeded") ||
        error.message?.includes("Service tier capacity exceeded");

      if (isRateLimitError) {
        rateLimitTracker.recordRateLimit('mistral', MISTRAL_MODELS[i], error.message);
        const trackMsg = `⚠️  RATE LIMIT TRACKED: ${MISTRAL_MODELS[i]} - Will skip for cooldown period`;
        console.log(`[AI] ${trackMsg}`);
        attemptsLog.push(trackMsg);
      }

      continue;
    }
  }

  // THIRD PRIORITY: If all Gemini + Mistral models failed, try OpenRouter
  const openrouterMsg = `🔄 All ${GEMINI_MODELS.length} Gemini + ${MISTRAL_MODELS.length} Mistral models failed, trying OpenRouter models...`;
  console.log(`[AI] ${openrouterMsg}`);
  attemptsLog.push(openrouterMsg);

  // Track consecutive per-minute rate limits to add intelligent delays
  let consecutivePerMinuteFailures = 0;

  for (let i = 0; i < OPENROUTER_FREE_MODELS.length; i++) {
    try {
      const modelName = OPENROUTER_FREE_MODELS[i];

      // OPTIMIZATION: Skip rate-limited models
      if (rateLimitTracker.isRateLimited('openrouter', modelName)) {
        const skipMsg = `⏭️  SKIPPING: ${modelName} - Rate limited (in cooldown)`;
        console.log(`[AI] ${skipMsg}`);
        attemptsLog.push(skipMsg);
        continue;
      }

      const attemptMsg = `🤖 Trying OpenRouter model: ${modelName} (${i + 1}/${OPENROUTER_FREE_MODELS.length})`;
      console.log(`[AI] ${attemptMsg}`);
      attemptsLog.push(attemptMsg);

      // OPTIMIZATION: Throttle request to prevent rate limits
      const response = await throttler.enqueue(async () => {
        return await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${getOpenRouterApiKey()}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://vibebaba.app",
            "X-Title": "Vibebaba",
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        });
      });

      if (!response.ok) {
        // Try to parse as JSON, fallback to text if it fails
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          // Response is not JSON, try to read as text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            // Ignore text parsing error, use default
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const successMsg = `✅ SUCCESS: ${modelName} via OpenRouter - Generated ${content.length} characters`;
      console.log(`[AI] ${successMsg}`);
      attemptsLog.push(successMsg);

      // Cache this working model
      setCachedWorkingModel('openrouter', modelName);

      if (returnMetadata) {
        return {
          text: content,
          model: modelName,
          provider: "openrouter",
          attemptsLog
        };
      }
      return content;
    } catch (error: any) {
      const failMsg = `❌ FAILED: ${OPENROUTER_FREE_MODELS[i]} - ${error.message}`;
      console.warn(`[AI] ${failMsg}`);
      attemptsLog.push(failMsg);

      // OPTIMIZATION: Track rate limits for OpenRouter
      const isRateLimitError =
        error.message?.includes("429") ||
        error.message?.includes("rate limit") ||
        error.message?.includes("quota");

      if (isRateLimitError) {
        rateLimitTracker.recordRateLimit('openrouter', OPENROUTER_FREE_MODELS[i], error.message);
        const trackMsg = `⚠️  RATE LIMIT TRACKED: ${OPENROUTER_FREE_MODELS[i]} - Will skip for cooldown period`;
        console.log(`[AI] ${trackMsg}`);
        attemptsLog.push(trackMsg);

        // If this is a per-minute rate limit, track consecutive failures
        if (error.message?.includes("free-models-per-min")) {
          consecutivePerMinuteFailures++;

          // After 3 consecutive per-minute failures, add exponential backoff delay
          if (consecutivePerMinuteFailures >= 3) {
            const delayMs = Math.min(5000 * Math.pow(2, consecutivePerMinuteFailures - 3), 30000); // Max 30s
            const delayMsg = `⏸️  Pausing ${delayMs}ms after ${consecutivePerMinuteFailures} consecutive per-minute rate limits...`;
            console.log(`[AI] ${delayMsg}`);
            attemptsLog.push(delayMsg);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        } else {
          consecutivePerMinuteFailures = 0; // Reset on non-per-minute errors
        }
      }

      continue;
    }
  }

  // FOURTH PRIORITY: If all other models failed, try Groq (ultra-fast inference)
  const groqMsg = `🔄 All Gemini + Mistral + OpenRouter models failed, trying Groq models (ultra-fast inference)...`;
  console.log(`[AI] ${groqMsg}`);
  attemptsLog.push(groqMsg);

  for (let i = 0; i < GROQ_FREE_MODELS.length; i++) {
    try {
      const modelName = GROQ_FREE_MODELS[i];

      // OPTIMIZATION: Skip rate-limited models
      if (rateLimitTracker.isRateLimited('groq', modelName)) {
        const skipMsg = `⏭️  SKIPPING: ${modelName} - Rate limited (in cooldown)`;
        console.log(`[AI] ${skipMsg}`);
        attemptsLog.push(skipMsg);
        continue;
      }

      const attemptMsg = `🤖 Trying Groq model: ${modelName} (${i + 1}/${GROQ_FREE_MODELS.length})`;
      console.log(`[AI] ${attemptMsg}`);
      attemptsLog.push(attemptMsg);

      // OPTIMIZATION: Throttle request to prevent rate limits
      const response = await throttler.enqueue(async () => {
        return await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${getGroqApiKey()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 8192, // Increased from 4096 to support longer code generation
            temperature: 0, // Deterministic code generation
          }),
        });
      });

      if (!response.ok) {
        // Try to parse as JSON, fallback to text if it fails
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          // Response is not JSON, try to read as text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            // Ignore text parsing error, use default
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const tokenCount = data.usage?.total_tokens;
      const successMsg = `✅ SUCCESS: ${modelName} via Groq - Generated ${content.length} characters${tokenCount ? ` (${tokenCount} tokens)` : ''}`;
      console.log(`[AI] ${successMsg}`);
      attemptsLog.push(successMsg);

      // Cache this working model
      setCachedWorkingModel('groq', modelName);

      if (returnMetadata) {
        return {
          text: content,
          model: modelName,
          provider: "groq",
          attemptsLog,
          tokenCount
        };
      }
      return content;
    } catch (error: any) {
      const failMsg = `❌ FAILED: ${GROQ_FREE_MODELS[i]} - ${error.message}`;
      console.warn(`[AI] ${failMsg}`);
      attemptsLog.push(failMsg);

      // OPTIMIZATION: Track rate limits for Groq
      const isRateLimitError =
        error.message?.includes("429") ||
        error.message?.includes("rate limit") ||
        error.message?.includes("quota");

      if (isRateLimitError) {
        rateLimitTracker.recordRateLimit('groq', GROQ_FREE_MODELS[i], error.message);
        const trackMsg = `⚠️  RATE LIMIT TRACKED: ${GROQ_FREE_MODELS[i]} - Will skip for cooldown period`;
        console.log(`[AI] ${trackMsg}`);
        attemptsLog.push(trackMsg);
      }

      continue;
    }
  }

  // All models failed (Gemini, Mistral, OpenRouter, and Groq)
  const errorMsg = `❌ All AI models (${GEMINI_MODELS.length} Gemini + ${MISTRAL_MODELS.length} Mistral + ${OPENROUTER_FREE_MODELS.length} OpenRouter + ${GROQ_FREE_MODELS.length} Groq = ${GEMINI_MODELS.length + MISTRAL_MODELS.length + OPENROUTER_FREE_MODELS.length + GROQ_FREE_MODELS.length} models) are currently unavailable. Please try again later.`;
  attemptsLog.push(errorMsg);
  throw new Error(errorMsg);
}

export async function generatePlan(appDescription: string, locale: Locale = "en") {
  // Simple prompt - i18n system not yet implemented
  const prompt = `Generate a project plan for: ${appDescription}`;

  return await generateWithFallback(prompt);
}

/**
 * Generate with MCP tools support
 * This function can use MCP tools to enhance AI responses
 * Now includes automatic memory context injection
 */
/**
 * Generate code with Codestral priority
 * Tries Codestral first (specialized for code), then falls back to standard models
 * Use this for code generation tasks (frontend, backend, etc.)
 */
export async function generateCodeWithCodestral(prompt: string): Promise<string>;
export async function generateCodeWithCodestral(prompt: string, returnMetadata: true): Promise<AIGenerationResult>;
export async function generateCodeWithCodestral(prompt: string, returnMetadata?: boolean): Promise<string | AIGenerationResult> {
  const attemptsLog: string[] = [];

  const codestralMsg = '🚀 CODESTRAL PRIORITY MODE: Trying Codestral first for code generation';
  console.log(`[AI] ${codestralMsg}`);
  attemptsLog.push(codestralMsg);

  const rateLimitTracker = getRateLimitTracker();
  const throttler = getAIThrottler();

  // TRY CODESTRAL FIRST (specialized for code generation)
  const codestralModel = "codestral-latest";

  if (!rateLimitTracker.isRateLimited('mistral', codestralModel)) {
    try {
      const attemptMsg = `🤖 Trying Codestral: ${codestralModel} (Code Specialist)`;
      console.log(`[AI] ${attemptMsg}`);
      attemptsLog.push(attemptMsg);

      const response = await throttler.enqueue(async () => {
        return await fetchWithTimeout("https://codestral.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${getCodestralApiKey()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: codestralModel,
            messages: [{ role: "user", content: prompt }],
          }),
        });
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            // Ignore
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const tokenCount = data.usage?.total_tokens;
      const successMsg = `✅ SUCCESS: ${codestralModel} (Code Specialist) - Generated ${content.length} characters${tokenCount ? ` (${tokenCount} tokens)` : ''}`;
      console.log(`[AI] ${successMsg}`);
      attemptsLog.push(successMsg);

      // Cache this working model
      setCachedWorkingModel('mistral', codestralModel);

      if (returnMetadata) {
        return {
          text: content,
          model: codestralModel,
          provider: "mistral",
          attemptsLog,
          tokenCount
        };
      }
      return content;
    } catch (error: any) {
      const failMsg = `❌ FAILED: ${codestralModel} - ${error.message}`;
      console.warn(`[AI] ${failMsg}`);
      attemptsLog.push(failMsg);

      // Track rate limits
      const isRateLimitError =
        error.message?.includes("429") ||
        error.message?.includes("rate limit") ||
        error.message?.includes("quota");

      if (isRateLimitError) {
        rateLimitTracker.recordRateLimit('mistral', codestralModel, error.message);
        const trackMsg = `⚠️  RATE LIMIT TRACKED: ${codestralModel}`;
        console.log(`[AI] ${trackMsg}`);
        attemptsLog.push(trackMsg);
      }
    }
  } else {
    const skipMsg = `⏭️  SKIPPING: ${codestralModel} - Rate limited (in cooldown)`;
    console.log(`[AI] ${skipMsg}`);
    attemptsLog.push(skipMsg);
  }

  // FALLBACK: If Codestral failed, use standard fallback chain
  const fallbackMsg = '🔄 Codestral unavailable, falling back to standard models...';
  console.log(`[AI] ${fallbackMsg}`);
  attemptsLog.push(fallbackMsg);

  const result = await generateWithFallback(prompt, true);

  // Merge attempts logs
  result.attemptsLog = [...attemptsLog, ...result.attemptsLog];

  if (returnMetadata) {
    return result;
  }
  return result.text;
}

export async function generateWithMCP(
  prompt: string,
  context: "planning" | "prototype" | "chat" = "chat",
  options: {
    maxToolCalls?: number;
    userId?: string;
    projectId?: string;
    sessionId?: string;
  } = {}
): Promise<string> {
  const maxToolCalls = options.maxToolCalls || 3;

  // Check if MCP is enabled
  if (!isMCPEnabled()) {
    console.log("[MCP] MCP is disabled, using standard generation");
    return await generateWithFallback(prompt);
  }

  // Get available servers for this context
  const servers = getServersForContext(context);
  if (servers.length === 0) {
    console.log(`[MCP] No servers configured for context: ${context}`);
    return await generateWithFallback(prompt);
  }

  console.log(`[MCP] Using servers: ${servers.join(", ")} for context: ${context}`);

  try {
    const mcpManager = getMCPManager();

    // AUTO-INJECT MEMORY CONTEXT (uses conversation memory)
    const { getConversationContext } = await import('../memory/conversation-memory');
    let enhancedPrompt = prompt;

    if (options.projectId) {
      console.log('[MCP] Injecting conversation memory context...');
      const conversationContext = await getConversationContext(options.projectId);

      if (conversationContext) {
        enhancedPrompt = conversationContext + '\n\n' + prompt;
        console.log('[MCP] Conversation memory context injected successfully');
      }
    }

    // Get all available tools
    const toolsByServer = await mcpManager.getAllTools(servers);
    if (toolsByServer.every((ts) => ts.tools.length === 0)) {
      console.log("[MCP] No tools available, using standard generation");
      return await generateWithFallback(enhancedPrompt);
    }

    // Add tool information to prompt
    const toolInstructions = getMCPToolInstructions(servers);
    const toolList = formatToolsForPrompt(toolsByServer);
    const finalPrompt = `${enhancedPrompt}\n\n${toolInstructions}\n${toolList}`;

    // First AI call with tool awareness
    let response = await generateWithFallback(finalPrompt);
    let toolCallCount = 0;

    // Execute tool calls if present
    while (response.includes("TOOL_CALL:") && toolCallCount < maxToolCalls) {
      console.log(`[MCP] Tool call iteration ${toolCallCount + 1}/${maxToolCalls}`);

      const toolCalls = parseToolCalls(response);
      if (toolCalls.length === 0) break;

      console.log(`[MCP] Found ${toolCalls.length} tool calls`);

      // Execute all tool calls
      const toolResults = [];
      for (const { server, tool, args } of toolCalls) {
        try {
          console.log(`[MCP] Executing ${server}.${tool}`);
          const result = await mcpManager.callTool(server, tool, args);
          toolResults.push({
            server,
            tool,
            args,
            result,
            success: true,
          });
        } catch (error: any) {
          console.error(`[MCP] Tool call failed: ${server}.${tool}`, error.message);
          toolResults.push({
            server,
            tool,
            args,
            error: error.message,
            success: false,
          });
        }
      }

      // Feed tool results back to AI
      const toolResultsPrompt = `
Previous response: ${response}

Tool execution results:
${JSON.stringify(toolResults, null, 2)}

Now, use these results to generate your final response. Do not make more tool calls.`;

      response = await generateWithFallback(toolResultsPrompt);
      toolCallCount++;
    }

    // Clean up tool call syntax from final response
    response = response.replace(/TOOL_CALL:.*?\)/g, "").trim();

    return response;
  } catch (error) {
    console.error("[MCP] Error in MCP generation, falling back to standard:", error);
    return await generateWithFallback(prompt);
  }
}
