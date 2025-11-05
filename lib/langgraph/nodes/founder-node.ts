// @ts-nocheck
// lib/langgraph/nodes/founder-node.ts
import { generateWithFallback } from '@/lib/ai';
import type { AppGenState } from '../types';
import { emitNodeStart, emitNodeComplete, emitNodeError } from '../events';
import { getMemoryService } from '@/lib/services/memory-service';
import { generateWithLogging, estimateTokens } from '@/lib/langgraph/ai-with-logging';
import { extractAndParseJson } from '../utils/json-parser';

export async function founderNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  // Ensure we have a string value for userDescription (used in try and catch blocks)
  const userDescription = String(state.userDescription || '');

  try {
    console.log('[Founder] 🚀 Starting founder node (CEO/Business Analyst)');
    console.log(`[Founder] 📝 User Description: "${userDescription.substring(0, 100)}${userDescription.length > 100 ? '...' : ''}"`);

    // Emit thinking process before starting
    emitNodeStart('founder', state, {
      userInput: userDescription,
      interpretation: 'Analyzing the user request to understand the business context, target audience, and core objectives.',
      plan: 'I will extract key requirements, identify the target audience, define primary goals, and assess the complexity level to provide a clear foundation for the product team.'
    });

    // MEMORY: Fetch user preferences and project context in parallel
    console.log('[Founder] 💾 Fetching memory context...');
    const memoryService = getMemoryService();
    const [previousContext, userPreferences] = await Promise.all([
      state.projectId ? memoryService.getProjectContext(state.projectId) : null,
      state.userId ? memoryService.getUserPreferences(state.userId) : null
    ]);

    if (previousContext) {
      console.log(`[Founder] 💾 Found previous context for project ${state.projectId}`);
    } else {
      console.log('[Founder] 💾 No previous context found (first time analysis)');
    }

    if (userPreferences) {
      console.log(`[Founder] 💾 Found user preferences (typical audience: ${userPreferences.typicalAudience || 'not set'})`);
    }

    const prompt = `You are a Founder CEO analyzing a product idea.

${previousContext ? `
⚠️ PREVIOUS CONTEXT FOUND:
This project was analyzed before. Here's what we know:
${JSON.stringify(previousContext, null, 2)}

Build upon this context, don't start from scratch.
` : ''}

${userPreferences ? `
📚 USER HISTORY:
- Typical Audience: ${userPreferences.typicalAudience || 'Not specified'}

Use this context to better understand the user's intent and business goals.
` : ''}

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
    console.log(`[Founder] 🤖 AI Call: Business Analysis (~${estimatedTokens} tokens, gemini-2.0-flash)`);

    const result = await generateWithLogging({
      prompt,
      projectId: state.projectId,
      nodeName: 'founder',
      callType: 'analysis',
      estimatedTokens,
      attempt: 1
    });

    // Parse JSON safely (handles control characters from AI responses)
    const parsed = extractAndParseJson(result, {
      refinedRequirements: userDescription,
      businessContext: {
        targetAudience: 'General users',
        primaryGoal: 'Provide value',
        successMetrics: ['User engagement']
      },
      complexity: 'moderate'
    });

    const duration = Date.now() - startTime;
    console.log(`[Founder] ✅ Completed in ${duration}ms`);

    // Log analysis results
    console.log(`[Founder] 📊 Target Audience: ${parsed.businessContext?.targetAudience || 'General users'}`);
    console.log(`[Founder] 📊 Complexity: ${parsed.complexity || 'moderate'}`);
    console.log(`[Founder] 📊 Success Metrics: ${parsed.businessContext?.successMetrics?.length || 0} defined`);

    // Emit completion with detailed task information
    // Extract values safely to avoid [object Object] display
    const targetAudience = typeof parsed.businessContext?.targetAudience === 'string'
      ? parsed.businessContext.targetAudience
      : 'target users';
    const metricsCount = Array.isArray(parsed.businessContext?.successMetrics)
      ? parsed.businessContext.successMetrics.length
      : 0;
    const complexity = typeof parsed.complexity === 'string'
      ? parsed.complexity
      : 'moderate';

    emitNodeComplete('founder', state, duration, {
      taskDescription: 'Analyzed user requirements and defined business context',
      success: true,
      output: {
        refinedRequirements: parsed.refinedRequirements,
        targetAudience,
        complexity
      },
      summary: `Successfully refined requirements for ${targetAudience}. Identified ${metricsCount} key success metrics. Complexity assessed as ${complexity}.`
    });

    // MEMORY: Store founder analysis and learnings
    if (state.projectId) {
      console.log('[Founder] 💾 Storing analysis in memory...');
      await memoryService.addObservation(
        `project_${state.projectId}`,
        `founder_analysis: ${JSON.stringify(parsed.businessContext)}`
      );
      console.log('[Founder] 💾 Analysis stored successfully');
    }

    // MEMORY: Learn user's project patterns
    if (state.userId && parsed.businessContext?.targetAudience) {
      console.log('[Founder] 💾 Storing user preference...');
      await memoryService.storeUserPreference(
        state.userId,
        'typicalAudience',
        parsed.businessContext.targetAudience
      );
      console.log('[Founder] 💾 User preference stored');
    }

    return {
      refinedRequirements: parsed.refinedRequirements || userDescription,
      businessContext: parsed.businessContext || {
        targetAudience: 'General users',
        primaryGoal: 'Provide value',
        successMetrics: ['User engagement']
      },
      stage: 'planning',
      completedNodes: ['founder'] // Reducer auto-appends
    };
  } catch (error) {
    emitNodeError('founder', error as Error, state);

    // Fallback to basic processing
    return {
      refinedRequirements: userDescription,
      businessContext: {
        targetAudience: 'General users',
        primaryGoal: 'Provide value',
        successMetrics: ['User engagement']
      },
      stage: 'planning',
      completedNodes: ['founder'], // Reducer auto-appends
      errors: [{ node: 'founder', message: (error as Error).message }] // Reducer auto-appends
    };
  }
}
