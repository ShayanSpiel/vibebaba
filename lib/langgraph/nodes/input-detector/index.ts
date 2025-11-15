// @ts-nocheck
/**
 * INPUT DETECTOR NODE
 *
 * Role: Universal input analyzer that understands user intent with AI reasoning
 *
 * Responsibilities:
 * - Understand user intent through AI reasoning (not keyword matching)
 * - Detect missing requirements (API keys, files, clarifications)
 * - Converse with user if needed
 * - Classify intent type (question/task/search/clarification)
 * - Pass enriched reasoning context to Tech Lead node
 * - Domain-agnostic (works for code and future non-code workflows)
 */

import { traceAICall, withLangSmithTracing } from '@/lib/langsmith/tracing';
import { getConversationContext } from '@/lib/memory/conversation-memory';
import { messageManager } from '@/lib/messaging/message-manager';
import type { AppGenState } from '../../types';
import { estimateTokens, generateWithLogging } from '../../utils/logging/ai-with-logging';
import { extractAndParseJson } from '../../utils/json-parser';

/**
 * Analyze user intent with AI reasoning
 * Returns structured reasoning context for downstream nodes
 */
async function analyzeIntentWithReasoning(
  userInput: string,
  conversationHistory: string | null,
  uploadedFiles: AppGenState['uploadedFiles'],
  projectId: string
): Promise<{
  intent: string;
  intentType: 'question' | 'task' | 'search' | 'clarification';
  confidence: number;
  entities: string[];
  detectedRequirements?: string[];
  missingInfo: string[];
  canProceed: boolean;
  suggestedAction: 'answer_question' | 'route_to_tech_lead' | 'ask_for_input' | 'search';
  reasoning: string;
  chainOfThought: string[];
  alternatives?: Array<{
    action: string;
    confidence: number;
    reason: string;
  }>;
  questionToAsk?: string;
}> {
  const prompt = buildReasoningPrompt(userInput, conversationHistory, uploadedFiles);

  const estimatedTokensAnalysis = estimateTokens(prompt);
  console.log(
    `[Input Detector] 🤖 AI Call: Intent Analysis (~${estimatedTokensAnalysis} tokens)`
  );

  const response = await generateWithLogging({
    prompt,
    projectId,
    nodeName: 'input-detector',
    callType: 'reasoning',
    estimatedTokens: estimatedTokensAnalysis,
  });

  console.log('[Input Detector] 📝 RAW AI RESPONSE (first 500 chars):');
  console.log(response.substring(0, 500));

  try {
    const analysisData = extractAndParseJson(response);

    if (!analysisData || Object.keys(analysisData).length === 0) {
      throw new Error('No valid JSON found in response');
    }

    console.log('[Input Detector] ✅ Successfully parsed reasoning response');
    console.log(`[Input Detector] 🎯 Intent: ${analysisData.intent}`);
    console.log(`[Input Detector] 📊 Confidence: ${analysisData.confidence}`);
    console.log(`[Input Detector] 🔀 Suggested Action: ${analysisData.suggestedAction}`);

    return analysisData;
  } catch (parseError) {
    console.error('[Input Detector] ❌ Failed to parse reasoning, using intelligent fallback');
    console.error('[Input Detector] Parse error:', parseError);

    // Intelligent fallback based on simple heuristics
    return intelligentFallbackReasoning(userInput, uploadedFiles);
  }
}

/**
 * Fallback reasoning when AI parsing fails
 * Uses simple heuristics to make a safe decision
 */
function intelligentFallbackReasoning(
  userInput: string,
  uploadedFiles: AppGenState['uploadedFiles']
): any {
  const lower = userInput.toLowerCase();

  // Question detection
  const isQuestion =
    lower.startsWith('how') ||
    lower.startsWith('why') ||
    lower.startsWith('what') ||
    lower.startsWith('where') ||
    lower.includes('?');

  if (isQuestion) {
    return {
      intent: 'User is asking a question',
      intentType: 'question',
      confidence: 0.7,
      entities: [],
      missingInfo: [],
      canProceed: true,
      suggestedAction: 'answer_question',
      reasoning: 'Detected question pattern in user input',
      chainOfThought: ['Input contains question keywords or question mark', 'Likely a question'],
    };
  }

  // Search detection
  const isSearch =
    lower.includes('search') ||
    lower.includes('find') ||
    lower.includes('look up') ||
    lower.includes('clone') ||
    lower.includes('like');

  if (isSearch) {
    return {
      intent: 'User wants to search for something',
      intentType: 'search',
      confidence: 0.7,
      entities: [],
      missingInfo: [],
      canProceed: true,
      suggestedAction: 'search',
      reasoning: 'Detected search keywords in user input',
      chainOfThought: ['Input contains search-related keywords', 'Likely a search request'],
    };
  }

  // Default: assume it's a task
  return {
    intent: 'User wants to accomplish a task',
    intentType: 'task',
    confidence: 0.6,
    entities: [],
    missingInfo: [],
    canProceed: true,
    suggestedAction: 'route_to_tech_lead',
    reasoning: 'No specific pattern detected, assuming task',
    chainOfThought: ['No question or search keywords', 'Assuming task-based request'],
  };
}

/**
 * Build optimized reasoning prompt (~40 lines)
 */
function buildReasoningPrompt(
  userInput: string,
  conversationHistory: string | null,
  uploadedFiles: AppGenState['uploadedFiles']
): string {
  return `You are an intelligent input analyzer. Understand the user's intent and determine if you can proceed.

REASONING PROCESS:
1. What is the user trying to accomplish?
2. What type of request is this? (question/task/search/clarification)
3. What information is already available?
4. What information is missing?
5. What's the best next action?

CONVERSATION HISTORY:
${conversationHistory || 'No previous conversation'}

UPLOADED FILES:
${uploadedFiles && uploadedFiles.length > 0 ? uploadedFiles.map((f) => `• ${f.fileName} (${f.purpose})`).join('\n') : 'None'}

USER INPUT:
"${userInput}"

ANALYZE AND RETURN JSON:
{
  "intent": "Brief description of what user wants (1 sentence)",
  "intentType": "question" | "task" | "search" | "clarification",
  "confidence": 0.0-1.0,
  "entities": ["keyword1", "keyword2"],
  "detectedRequirements": ["database", "authentication", "api"],
  "missingInfo": ["api_key", "url", "clarification"] or [],
  "canProceed": true/false,
  "suggestedAction": "answer_question" | "route_to_tech_lead" | "ask_for_input" | "search",
  "reasoning": "I believe this is a... because...",
  "chainOfThought": ["step 1", "step 2", "step 3"],
  "alternatives": [
    { "action": "alternative approach", "confidence": 0.0-1.0, "reason": "why" }
  ],
  "questionToAsk": "If missingInfo is not empty, what question to ask user?"
}

IMPORTANT:
- If user uploaded files and refers to them, DON'T ask for them again
- If conversation history shows user already provided info, DON'T ask again
- Questions (starts with how/why/what, contains ?) → suggestedAction: "answer_question"
- Tasks (add feature, fix bug, change design) → suggestedAction: "route_to_tech_lead"
- Search (find, clone, like X) → suggestedAction: "search"
- Missing critical info → suggestedAction: "ask_for_input", canProceed: false

Return ONLY valid JSON.`;
}

/**
 * INPUT DETECTOR NODE - REASONING-BASED
 *
 * Analyzes user requests using AI reasoning to detect:
 * - User intent and goal
 * - Whether external input is needed
 * - What type of request it is (question/task/search)
 * - Pass reasoning context to Tech Lead for intelligent routing
 */
async function inputDetectorNodeImpl(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    const userRequest = state.editingSession?.userRequest || state.userDescription || '';

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Input Detector] 🚀 Starting input detector node (REASONING-BASED)');
    console.log(
      `[Input Detector] 📝 User Request: "${userRequest.substring(0, 100)}${userRequest.length > 100 ? '...' : ''}"`
    );
    console.log(`[Input Detector] 📎 Uploaded Files: ${state.uploadedFiles?.length || 0}`);

    // Load conversation context
    console.log('[Input Detector] 💬 Loading conversation memory...');
    const conversationContext = await getConversationContext(state.projectId);
    if (conversationContext) {
      console.log('[Input Detector] ✅ Loaded conversation context');
      console.log('[Input Detector] 📝 Context length:', conversationContext.length, 'characters');
    }

    // Send status message to user
    await messageManager.sendInfo(
      state.projectId,
      'Understanding your request...',
      'input-detector'
    );

    // Analyze intent with AI reasoning
    const reasoning = await analyzeIntentWithReasoning(
      userRequest,
      conversationContext,
      state.uploadedFiles,
      state.projectId
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Input Detector] 🎯 REASONING ANALYSIS:');
    console.log(`[Input Detector] Intent: ${reasoning.intent}`);
    console.log(`[Input Detector] Type: ${reasoning.intentType}`);
    console.log(`[Input Detector] Confidence: ${reasoning.confidence}`);
    console.log(`[Input Detector] Entities: ${reasoning.entities.join(', ')}`);
    console.log(`[Input Detector] Can Proceed: ${reasoning.canProceed}`);
    console.log(`[Input Detector] Suggested Action: ${reasoning.suggestedAction}`);
    console.log(`[Input Detector] Reasoning: ${reasoning.reasoning}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check if we need user input
    if (!reasoning.canProceed && reasoning.missingInfo.length > 0) {
      console.log('[Input Detector] ⏸️ Missing information - pausing workflow');
      console.log(`[Input Detector] 📋 Missing: ${reasoning.missingInfo.join(', ')}`);

      await messageManager.sendInfo(
        state.projectId,
        reasoning.questionToAsk || 'I need some additional information to proceed.',
        'input-detector'
      );

      const duration = Date.now() - startTime;
      console.log(`[Input Detector] ⏸️ Paused for user input in ${duration}ms`);

      return {
        needsUserInput: true,
        userInputRequest: {
          type: (reasoning.missingInfo[0] as any) || 'clarification',
          question: reasoning.questionToAsk || 'Please provide additional information',
        },
        reasoningContext: {
          intent: reasoning.intent,
          intentType: reasoning.intentType,
          confidence: reasoning.confidence,
          entities: reasoning.entities,
          detectedRequirements: reasoning.detectedRequirements,
          suggestedAction: reasoning.suggestedAction,
          chainOfThought: reasoning.chainOfThought,
          alternatives: reasoning.alternatives,
        },
      };
    }

    // Store reasoning context for Tech Lead
    const duration = Date.now() - startTime;
    console.log(`[Input Detector] ✅ Analysis complete in ${duration}ms`);
    console.log(
      `[Input Detector] 🔀 Routing to: ${reasoning.suggestedAction === 'route_to_tech_lead' ? 'Tech Lead' : reasoning.suggestedAction}`
    );

    return {
      needsUserInput: false,
      reasoningContext: {
        intent: reasoning.intent,
        intentType: reasoning.intentType,
        confidence: reasoning.confidence,
        entities: reasoning.entities,
        detectedRequirements: reasoning.detectedRequirements,
        suggestedAction: reasoning.suggestedAction,
        chainOfThought: reasoning.chainOfThought,
        alternatives: reasoning.alternatives,
      },
    };
  } catch (error) {
    console.error('[Input Detector] Error:', error);

    // Safe fallback: continue to Tech Lead
    return {
      needsUserInput: false,
      reasoningContext: {
        intent: 'Unable to analyze intent, proceeding with caution',
        intentType: 'task',
        confidence: 0.3,
        entities: [],
        suggestedAction: 'route_to_tech_lead',
        chainOfThought: ['Error occurred during analysis', 'Falling back to Tech Lead'],
      },
    };
  }
}

// Export traced version of input detector node
export const inputDetectorNode = withLangSmithTracing('input-detector', inputDetectorNodeImpl);
