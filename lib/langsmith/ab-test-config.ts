// lib/langsmith/ab-test-config.ts
import type { ABTestConfig } from './prompt-manager';

/**
 * A/B Test Configuration for PM Node Planning Prompt
 *
 * SETUP INSTRUCTIONS:
 * 1. Create prompts in LangSmith Hub:
 *    - Go to https://smith.langchain.com/hub
 *    - Create a new prompt for "PM Planning V1"
 *    - Create a variation "PM Planning V2"
 *
 * 2. Format prompt names as: "your-username/prompt-name:version"
 *    Example: "vibebaba/pm-planning-v1:latest"
 *
 * 3. Update the promptName values below with your actual prompt names
 */
export const PM_PLANNING_AB_TEST: ABTestConfig = {
  enabled: false, // Set to true to enable A/B testing
  strategy: 'user-hash', // Consistent per user
  variants: [
    {
      name: 'v1-detailed',
      promptName: 'vibebaba/pm-planning-v1:latest', // TODO: Replace with your actual prompt
      weight: 50, // 50% of users
    },
    {
      name: 'v2-concise',
      promptName: 'vibebaba/pm-planning-v2:latest', // TODO: Replace with your actual prompt
      weight: 50, // 50% of users
    },
  ],
};

/**
 * Fallback hardcoded prompt (used when A/B testing is disabled or on error)
 */
export const PM_PLANNING_FALLBACK_PROMPT = (
  memoryPrompt: string,
  searchPrompt: string,
  requirements: string,
  context: any,
  mvpFeaturesList: string,
  mvpFeatureCount: number
) => `${memoryPrompt}${searchPrompt}Create MVP plan for: "${requirements}"

App Type: ${context.appType}
Complexity: ${context.complexity}
${mvpFeaturesList ? `\nMVP Features:\n${mvpFeaturesList}` : ''}

Generate:
- Overview (1-2 sentences)
- Core Features (${mvpFeatureCount} features)
- Design Direction (visual style)`;

/**
 * Check if LangSmith A/B testing is properly configured
 */
export function validateLangSmithSetup(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check environment variables
  if (!process.env.LANGCHAIN_API_KEY) {
    errors.push('LANGCHAIN_API_KEY not set in environment variables');
  }

  if (!process.env.LANGCHAIN_TRACING_V2) {
    errors.push('LANGCHAIN_TRACING_V2 not enabled');
  }

  // Check A/B test config
  if (PM_PLANNING_AB_TEST.enabled) {
    const totalWeight = PM_PLANNING_AB_TEST.variants.reduce((sum, v) => sum + v.weight, 0);

    if (Math.abs(totalWeight - 100) > 0.01) {
      errors.push(`Variant weights sum to ${totalWeight}, should be 100`);
    }

    // Check for placeholder prompt names
    for (const variant of PM_PLANNING_AB_TEST.variants) {
      if (variant.promptName.includes('TODO') || variant.promptName === '') {
        errors.push(`Variant "${variant.name}" has invalid promptName`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
