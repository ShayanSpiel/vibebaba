// lib/langsmith/pm-node-integration-example.ts
/**
 * Example integration of LangSmith A/B testing into PM Node
 *
 * This file shows how to modify pm-node.ts to use LangSmith prompts
 * with A/B testing instead of hardcoded prompts.
 *
 * INTEGRATION STEPS:
 * ==================
 *
 * 1. Add imports at the top of pm-node.ts:
 */

/*
import {
  fetchPromptWithABTest,
  formatPrompt,
  trackPromptMetrics,
  type PromptMetrics,
} from '@/lib/langsmith/prompt-manager';
import {
  PM_PLANNING_AB_TEST,
  PM_PLANNING_FALLBACK_PROMPT,
  validateLangSmithSetup,
} from '@/lib/langsmith/ab-test-config';
*/

/**
 * 2. Replace the planning section (around line 263-295) with this code:
 */

export async function pmNodePlanningWithABTest(
  state: any,
  requirements: string,
  context: any,
  allFeatures: any[],
  memoryPrompt: string,
  searchPrompt: string
) {
  console.log('[PM] 📝 Generating comprehensive product plan...');
  // emitProgress('pm', state.projectId, 'Generating comprehensive product plan...');

  const startTime = Date.now();
  let selectedVariant: string | undefined;

  try {
    // Build MVP feature list for prompt
    const mvpFeaturesList = allFeatures
      .filter((f: any) => f.included_in_mvp)
      .map((f: any) => `- ${f.name}`)
      .join('\n');

    const mvpFeatureCount = allFeatures.filter((f: any) => f.included_in_mvp).length;

    // Try to use LangSmith A/B testing if enabled
    let planPrompt: string;

    if (PM_PLANNING_AB_TEST.enabled) {
      console.log('[PM] 🧪 A/B Testing enabled - fetching prompt from LangSmith Hub');

      const validation = validateLangSmithSetup();
      if (!validation.isValid) {
        console.warn('[PM] ⚠️ LangSmith setup invalid:', validation.errors);
        throw new Error('Invalid LangSmith configuration');
      }

      try {
        // Fetch prompt from LangSmith Hub with A/B testing
        const { prompt, variant } = await fetchPromptWithABTest(
          PM_PLANNING_AB_TEST,
          state.userId
        );

        selectedVariant = variant;

        // Format prompt with variables
        planPrompt = formatPrompt(prompt, {
          memoryContext: memoryPrompt,
          searchContext: searchPrompt,
          requirements,
          appType: context.appType,
          complexity: context.complexity,
          mvpFeatures: mvpFeaturesList,
          featureCount: mvpFeatureCount,
        });

        console.log(`[PM] ✅ Using LangSmith prompt variant: ${variant}`);
      } catch (error: any) {
        console.warn('[PM] ⚠️ Failed to fetch LangSmith prompt:', error.message);
        console.log('[PM] 📝 Falling back to hardcoded prompt');

        // Fallback to hardcoded prompt
        planPrompt = PM_PLANNING_FALLBACK_PROMPT(
          memoryPrompt,
          searchPrompt,
          requirements,
          context,
          mvpFeaturesList,
          mvpFeatureCount
        );
      }
    } else {
      // A/B testing disabled - use fallback
      console.log('[PM] 📝 Using hardcoded prompt (A/B testing disabled)');
      planPrompt = PM_PLANNING_FALLBACK_PROMPT(
        memoryPrompt,
        searchPrompt,
        requirements,
        context,
        mvpFeaturesList,
        mvpFeatureCount
      );
    }

    // Generate plan with AI
    // const estimatedTokensPlan = estimateTokens(planPrompt);
    // console.log(`[PM] 🤖 AI Call: Planning (~${estimatedTokensPlan} tokens, gemini-2.0-flash)`);

    // const plan = await generateWithLogging({
    //   prompt: planPrompt,
    //   projectId: state.projectId,
    //   nodeName: 'pm',
    //   callType: 'planning',
    //   estimatedTokens: estimatedTokensPlan,
    //   attempt: 1,
    // });

    // Placeholder for example
    const plan = 'Generated plan here...';

    // Track metrics for A/B testing analysis
    if (selectedVariant) {
      const metrics: PromptMetrics = {
        promptName: 'pm-planning',
        variant: selectedVariant,
        // tokensUsed: plan includes token count
        latencyMs: Date.now() - startTime,
        success: true,
        timestamp: new Date().toISOString(),
        userId: state.userId,
        projectId: state.projectId,
      };

      await trackPromptMetrics(metrics);
    }

    return plan;
  } catch (error: any) {
    // Track error metrics
    if (selectedVariant) {
      await trackPromptMetrics({
        promptName: 'pm-planning',
        variant: selectedVariant,
        latencyMs: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        userId: state.userId,
        projectId: state.projectId,
      });
    }

    throw error;
  }
}

/**
 * 3. TESTING THE INTEGRATION
 * ==========================
 *
 * Step 1: Keep A/B testing disabled initially
 * - Set PM_PLANNING_AB_TEST.enabled = false in ab-test-config.ts
 * - Test that the app works with hardcoded prompts
 *
 * Step 2: Create prompts in LangSmith Hub
 * - Go to https://smith.langchain.com/hub
 * - Click "New Prompt"
 * - Create two versions of the planning prompt:
 *
 *   Version 1 (Detailed):
 *   ```
 *   {memoryContext}{searchContext}Create a detailed MVP plan for: "{requirements}"
 *
 *   App Type: {appType}
 *   Complexity: {complexity}
 *   MVP Features:
 *   {mvpFeatures}
 *
 *   Generate a comprehensive plan including:
 *   - Detailed Overview (2-3 sentences)
 *   - Core Features ({featureCount} features with descriptions)
 *   - Design Direction (visual style, colors, typography)
 *   - User Experience considerations
 *   ```
 *
 *   Version 2 (Concise):
 *   ```
 *   {memoryContext}{searchContext}Create a concise MVP plan for: "{requirements}"
 *
 *   Type: {appType} | Complexity: {complexity}
 *
 *   MVP Features:
 *   {mvpFeatures}
 *
 *   Generate:
 *   - Overview (1 sentence)
 *   - Features ({featureCount} items, bullet points only)
 *   - Design (visual style in 5 words)
 *   ```
 *
 * Step 3: Update ab-test-config.ts
 * - Set the correct prompt names (e.g., "vibebaba/pm-planning-v1:latest")
 * - Set enabled = true
 *
 * Step 4: Test A/B testing
 * - Run your workflow with different user IDs
 * - Check console logs to see which variant was selected
 * - Check LangSmith dashboard to see traces and metrics
 *
 * Step 5: Analyze results
 * - Go to LangSmith Experiments tab
 * - Compare metrics between variants:
 *   * Success rate
 *   * Average latency
 *   * Token usage
 *   * User feedback/quality
 */

/**
 * 4. EVALUATING PROMPTS WITH DATASETS
 * ====================================
 *
 * Once you have dataset and prompts set up, you can run evaluations:
 *
 * ```typescript
 * import { runEvaluation } from '@/lib/langsmith/evaluation';
 *
 * const results = await runEvaluation({
 *   datasetName: 'vibebaba-pm-node-tests',
 *   promptName: 'vibebaba/pm-planning-v1:latest',
 *   evaluators: ['correctness', 'completeness'],
 * });
 *
 * console.log('Evaluation results:', results);
 * ```
 */
