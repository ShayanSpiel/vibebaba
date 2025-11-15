// @ts-nocheck
// lib/langgraph/nodes/founder-node.ts
import { generateWithFallback } from '@/lib/ai/ai';
import { traceAICall, withLangSmithTracing } from '@/lib/langsmith/tracing';
import { getConversationContext } from '@/lib/memory/conversation-memory';
import type { AppGenState } from '../../types';
import { extractAndParseJson } from '../../utils/json-parser';
import { estimateTokens, generateWithLogging } from '../../utils/logging/ai-with-logging';
import { emitNodeComplete, emitNodeError, emitNodeStart } from '../../utils/logging/events';

async function founderNodeImpl(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  // Ensure we have a string value for userDescription (used in try and catch blocks)
  const userDescription = String(state.userDescription || '');

  try {
    console.log('[Founder] 🚀 Starting founder node (CEO/Business Analyst)');
    console.log(
      `[Founder] 📝 User Description: "${userDescription.substring(0, 100)}${userDescription.length > 100 ? '...' : ''}"`
    );

    // Emit thinking process before starting
    emitNodeStart('founder', state, {
      userInput: userDescription,
      interpretation:
        'Analyzing the user request to understand the business context, target audience, and core objectives.',
      plan: 'I will extract key requirements, identify the target audience, define primary goals, and assess the complexity level to provide a clear foundation for the product team.',
    });

    // Load conversation context for LangSmith tracing metadata
    console.log('[Founder] 💬 Loading conversation memory...');
    const conversationContext = await getConversationContext(state.projectId);
    if (conversationContext) {
      console.log('[Founder] ✅ Loaded conversation context');
      console.log('[Founder] 📝 Context length:', conversationContext.length, 'characters');
    }

    const prompt = `You are a Founder CEO analyzing a product idea.

User Request: "${userDescription}"

Extract and return JSON:
{
  "refinedRequirements": "Clear, actionable requirements",
  "businessContext": {
    "targetAudience": "who is this for",
    "primaryGoal": "main objective",
    "successMetrics": ["metric1", "metric2"]
  },
  "complexity": "simple|moderate|complex"
}`;

    const estimatedTokens = estimateTokens(prompt);
    console.log(
      `[Founder] 🤖 AI Call: Business Analysis (~${estimatedTokens} tokens, gemini-2.0-flash)`
    );

    const result = await traceAICall(
      'founder-business-analysis',
      async () => {
        return await generateWithLogging({
          prompt,
          projectId: state.projectId,
          nodeName: 'founder',
          callType: 'analysis',
          estimatedTokens,
          attempt: 1,
        });
      },
      {
        userDescription: userDescription.substring(0, 200),
        estimatedTokens,
        hasConversationContext: !!conversationContext,
      }
    );

    // Parse JSON safely (handles control characters from AI responses)
    const parsed = extractAndParseJson(result, {
      refinedRequirements: userDescription,
      businessContext: {
        targetAudience: 'General users',
        primaryGoal: 'Provide value',
        successMetrics: ['User engagement'],
      },
      complexity: 'moderate',
    });

    const duration = Date.now() - startTime;
    console.log(`[Founder] ✅ Completed in ${duration}ms`);

    // Log analysis results
    console.log(
      `[Founder] 📊 Target Audience: ${parsed.businessContext?.targetAudience || 'General users'}`
    );
    console.log(`[Founder] 📊 Complexity: ${parsed.complexity || 'moderate'}`);
    console.log(
      `[Founder] 📊 Success Metrics: ${parsed.businessContext?.successMetrics?.length || 0} defined`
    );

    // Emit completion with detailed task information
    // Extract values safely to avoid [object Object] display
    const targetAudience =
      typeof parsed.businessContext?.targetAudience === 'string'
        ? parsed.businessContext.targetAudience
        : 'target users';
    const metricsCount = Array.isArray(parsed.businessContext?.successMetrics)
      ? parsed.businessContext.successMetrics.length
      : 0;
    const complexity = typeof parsed.complexity === 'string' ? parsed.complexity : 'moderate';

    emitNodeComplete('founder', state, duration, {
      taskDescription: 'Analyzed user requirements and defined business context',
      success: true,
      output: {
        refinedRequirements: parsed.refinedRequirements,
        targetAudience,
        complexity,
      },
      summary: `Successfully refined requirements for ${targetAudience}. Identified ${metricsCount} key success metrics. Complexity assessed as ${complexity}.`,
    });

    // MEMORY: Store founder analysis in conversation memory
    // Note: This is automatically tracked via conversation memory, no manual storage needed

    return {
      refinedRequirements: parsed.refinedRequirements || userDescription,
      businessContext: parsed.businessContext || {
        targetAudience: 'General users',
        primaryGoal: 'Provide value',
        successMetrics: ['User engagement'],
      },
      stage: 'planning',
      completedNodes: ['founder'], // Reducer auto-appends
    };
  } catch (error) {
    emitNodeError('founder', error as Error, state);

    // Fallback to basic processing
    return {
      refinedRequirements: userDescription,
      businessContext: {
        targetAudience: 'General users',
        primaryGoal: 'Provide value',
        successMetrics: ['User engagement'],
      },
      stage: 'planning',
      completedNodes: ['founder'], // Reducer auto-appends
      errors: [{ node: 'founder', message: (error as Error).message }], // Reducer auto-appends
    };
  }
}

// Export traced version of founder node
export const founderNode = withLangSmithTracing('founder', founderNodeImpl);
