/**
 * Smart Example Selector System
 * Intelligently selects the best design examples based on context
 */

import { COMPONENT_LIBRARY } from '../components/design-components';
import { type DesignExample, type ExampleCategory, pb } from '../database/pocketbase';

export interface SelectionContext {
  projectDescription?: string;
  previousGenerations?: string[];
  userPreferences?: {
    styleVariant?: string;
    industryContext?: string;
  };
}

export interface SelectedExample {
  example: DesignExample;
  matchScore: number;
  matchReasons: string[];
}

/**
 * Detect industry context from project description
 */
export function detectIndustryContext(description: string): string[] {
  const keywords: Record<string, string[]> = {
    saas: ['saas', 'software', 'platform', 'service', 'cloud', 'app', 'tool'],
    ecommerce: ['shop', 'store', 'ecommerce', 'product', 'cart', 'checkout', 'buy', 'sell'],
    blog: ['blog', 'article', 'news', 'magazine', 'content', 'publish', 'post'],
    portfolio: ['portfolio', 'showcase', 'work', 'designer', 'developer', 'creative'],
    agency: ['agency', 'studio', 'design', 'marketing', 'consulting', 'services'],
    fintech: ['finance', 'fintech', 'banking', 'payment', 'crypto', 'investment', 'trading'],
    healthcare: ['health', 'medical', 'doctor', 'patient', 'clinic', 'hospital', 'wellness'],
    education: ['education', 'learning', 'course', 'school', 'university', 'training', 'teach'],
    media: ['media', 'video', 'streaming', 'podcast', 'entertainment', 'music'],
    nonprofit: ['nonprofit', 'charity', 'foundation', 'donation', 'cause', 'volunteer'],
  };

  const lowerDesc = description.toLowerCase();
  const detected: string[] = [];

  for (const [industry, terms] of Object.entries(keywords)) {
    if (terms.some((term) => lowerDesc.includes(term))) {
      detected.push(industry);
    }
  }

  // Default to saas if nothing detected
  return detected.length > 0 ? detected : ['saas'];
}

/**
 * Detect style preference from project description
 */
export function detectStylePreference(description: string): string | null {
  const keywords: Record<string, string[]> = {
    minimal: ['minimal', 'minimalist', 'simple', 'clean', 'plain'],
    modern: ['modern', 'contemporary', 'sleek', 'professional'],
    glassmorphism: ['glass', 'frosted', 'blur', 'transparent', 'glossy'],
    brutalist: ['brutalist', 'bold', 'stark', 'raw'],
    gradient: ['gradient', 'colorful', 'vibrant', 'dynamic'],
    dark: ['dark mode', 'dark theme', 'dark', 'night'],
  };

  const lowerDesc = description.toLowerCase();

  for (const [style, terms] of Object.entries(keywords)) {
    if (terms.some((term) => lowerDesc.includes(term))) {
      return style;
    }
  }

  return null;
}

/**
 * Calculate match score for an example
 */
function calculateMatchScore(
  example: DesignExample,
  detectedIndustries: string[],
  preferredStyle: string | null,
  usedExampleIds: string[]
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Base quality score (40% weight)
  score += example.qualityScore * 0.4;
  if (example.qualityScore >= 90) {
    reasons.push('exceptional quality');
  }

  // Industry match (30% weight)
  const industryMatch = example.industryContext.some((ctx) => detectedIndustries.includes(ctx));
  if (industryMatch) {
    score += 30;
    reasons.push(`matches ${detectedIndustries.join('/')} industry`);
  }

  // Style match (20% weight)
  if (preferredStyle && example.styleVariant === preferredStyle) {
    score += 20;
    reasons.push(`matches ${preferredStyle} style`);
  }

  // Freshness/variety bonus (10% weight)
  // Prefer examples that haven't been used recently
  if (!usedExampleIds.includes(example.id)) {
    score += 10;
    reasons.push('fresh example');
  }

  // Low usage bonus (encourage variety)
  if (example.usageCount < 10) {
    score += 5;
    reasons.push('rarely used');
  }

  // Version bonus (prefer latest versions)
  if (!example.replacedBy && example.isActive) {
    score += 5;
    reasons.push('latest version');
  }

  // Accessibility bonus
  if (example.accessibilityScore >= 95) {
    score += 5;
    reasons.push('highly accessible');
  }

  return { score, reasons };
}

/**
 * Select best examples for a category
 */
export async function selectExamplesForCategory(
  categorySlug: string,
  context: SelectionContext,
  limit: number = 3
): Promise<SelectedExample[]> {
  try {
    // Detect context
    const detectedIndustries = context.projectDescription
      ? detectIndustryContext(context.projectDescription)
      : context.userPreferences?.industryContext
        ? [context.userPreferences.industryContext]
        : ['saas'];

    const preferredStyle =
      context.userPreferences?.styleVariant ||
      (context.projectDescription ? detectStylePreference(context.projectDescription) : null);

    const usedExampleIds = context.previousGenerations || [];

    // Get category
    const categories = await pb.collection('example_categories').getFullList<ExampleCategory>({
      filter: `slug = "${categorySlug}"`,
    });

    if (categories.length === 0) {
      console.log(`Category not found: ${categorySlug}`);
      return [];
    }

    const category = categories[0];

    // Query examples
    const examples = await pb.collection('design_examples').getFullList<DesignExample>({
      filter: `categoryId = "${category.id}" && isActive = true && qualityScore >= 80`,
      sort: '-version,-qualityScore',
    });

    if (examples.length === 0) {
      console.log(`No examples found for category: ${categorySlug}`);
      return [];
    }

    // Score and rank examples
    const scoredExamples = examples.map((example) => {
      const { score, reasons } = calculateMatchScore(
        example,
        detectedIndustries,
        preferredStyle,
        usedExampleIds
      );

      return {
        example,
        matchScore: score,
        matchReasons: reasons,
      };
    });

    // Sort by score and take top N
    scoredExamples.sort((a, b) => b.matchScore - a.matchScore);

    return scoredExamples.slice(0, limit);
  } catch (error) {
    console.error('Error selecting examples:', error);
    return [];
  }
}

/**
 * Select examples for multiple categories at once
 */
export async function selectExamplesForCategories(
  categorySlugs: string[],
  context: SelectionContext,
  examplesPerCategory: number = 3
): Promise<Record<string, SelectedExample[]>> {
  const results: Record<string, SelectedExample[]> = {};

  for (const slug of categorySlugs) {
    results[slug] = await selectExamplesForCategory(slug, context, examplesPerCategory);
  }

  return results;
}

/**
 * Get fallback examples from hardcoded library
 * TODO: Implement proper component library mapping
 */
export function getFallbackExamples(categorySlug: string): string[] {
  // Component library structure changed - return empty for now
  return [];
}

/**
 * Select examples with automatic fallback
 */
export async function selectExamplesWithFallback(
  categorySlug: string,
  context: SelectionContext,
  limit: number = 3
): Promise<Array<{ html: string; source: 'database' | 'fallback' }>> {
  try {
    // Try database first
    const dbExamples = await selectExamplesForCategory(categorySlug, context, limit);

    if (dbExamples.length > 0) {
      return dbExamples.map((selected) => ({
        html: selected.example.htmlContent,
        source: 'database' as const,
      }));
    }

    // Fallback to hardcoded examples
    console.log(`Using fallback examples for ${categorySlug}`);
    const fallbackExamples = getFallbackExamples(categorySlug);

    return fallbackExamples.map((html) => ({
      html,
      source: 'fallback' as const,
    }));
  } catch (error) {
    console.error('Error in selectExamplesWithFallback:', error);

    // Return fallback on error
    const fallbackExamples = getFallbackExamples(categorySlug);
    return fallbackExamples.map((html) => ({
      html,
      source: 'fallback' as const,
    }));
  }
}

/**
 * Format examples for AI prompt
 */
export function formatExamplesForPrompt(
  examples: Array<{ html: string; source: 'database' | 'fallback' }>,
  categoryName: string
): string {
  if (examples.length === 0) {
    return '';
  }

  let prompt = `\n\nHERE ARE ${examples.length} WORLD-CLASS ${categoryName.toUpperCase()} EXAMPLES FOR REFERENCE:\n\n`;

  examples.forEach((example, index) => {
    prompt += `EXAMPLE ${index + 1}:\n\`\`\`html\n${example.html}\n\`\`\`\n\n`;
  });

  prompt += `Use these examples as inspiration for style, structure, and quality. Create something similar but unique.\n`;

  return prompt;
}

/**
 * Increment usage count for examples
 */
export async function trackExampleUsage(exampleIds: string[]): Promise<void> {
  try {
    for (const id of exampleIds) {
      const example = await pb.collection('design_examples').getOne<DesignExample>(id);

      await pb.collection('design_examples').update(id, {
        usageCount: (example.usageCount || 0) + 1,
      });
    }
  } catch (error) {
    console.error('Error tracking example usage:', error);
    // Non-critical, don't throw
  }
}
