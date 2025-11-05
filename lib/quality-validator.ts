/**
 * Quality Validator System
 * AI-powered quality assessment for design examples
 */

import dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

// Load environment variables
if (!process.env.OPENAI_API_KEY) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface QualityScores {
  qualityScore: number; // Overall 0-100
  performanceScore: number; // 0-100
  accessibilityScore: number; // 0-100
  designTrendScore: number; // 0-100
  issues: string[];
  strengths: string[];
  suggestions: string[];
}

/**
 * Generate quality validation prompt
 */
function getQualityValidationPrompt(
  categoryName: string,
  htmlContent: string,
  styleVariant: string,
  industryContext: string
): string {
  return `You are an expert design and code quality evaluator. Evaluate this ${categoryName} component designed for ${industryContext} with a ${styleVariant} style.

COMPONENT HTML:
\`\`\`html
${htmlContent}
\`\`\`

Evaluate on these dimensions (0-100 scale):

1. DESIGN TRENDS (0-100):
   - Uses modern 2025 design patterns (subtle gradients, blur effects, smooth shadows)
   - Follows current design aesthetics (not dated or old-fashioned)
   - Visual hierarchy is clear and intentional
   - Spacing follows modern grid systems (8px or 4px)
   - Typography is modern and well-scaled
   - Colors are harmonious and on-trend

2. PERFORMANCE (0-100):
   - HTML is concise and semantic
   - Tailwind classes are efficient (no redundancy)
   - No performance anti-patterns
   - No heavy inline styles or unnecessary div nesting
   - CSS is optimized (uses Tailwind utilities properly)
   - No external dependencies that slow loading

3. ACCESSIBILITY (0-100):
   - Uses semantic HTML5 elements appropriately
   - ARIA labels are present where needed
   - Keyboard navigable (proper tab order, focus states)
   - Color contrast meets WCAG AA standards
   - Interactive elements have proper roles
   - Form inputs have associated labels
   - Focus indicators are visible

4. OVERALL QUALITY (0-100):
   - Production-ready code
   - Fully responsive (mobile, tablet, desktop)
   - Clean, readable code structure
   - Consistent design system usage
   - No obvious bugs or issues
   - Follows best practices

IMPORTANT:
- Be strict but fair in scoring
- Score ≥85 means truly world-class quality
- Score 70-84 means good but needs improvement
- Score <70 means significant issues
- Provide specific, actionable feedback

Return ONLY a valid JSON object with this structure (no markdown, no code blocks):
{
  "designTrendScore": <number>,
  "performanceScore": <number>,
  "accessibilityScore": <number>,
  "qualityScore": <number>,
  "issues": ["issue1", "issue2"],
  "strengths": ["strength1", "strength2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;
}

/**
 * Validate example quality using AI
 */
export async function validateExampleQuality(
  categoryName: string,
  htmlContent: string,
  styleVariant: string,
  industryContext: string,
  model: string = 'gpt-4o-mini'
): Promise<QualityScores> {
  try {
    const prompt = getQualityValidationPrompt(
      categoryName,
      htmlContent,
      styleVariant,
      industryContext
    );

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert design and code quality evaluator. You provide detailed, objective assessments of UI components. Always return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent scoring
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const scores: QualityScores = JSON.parse(response);

    // Validate scores are in range
    const validateScore = (score: number) => Math.max(0, Math.min(100, score));
    scores.qualityScore = validateScore(scores.qualityScore);
    scores.performanceScore = validateScore(scores.performanceScore);
    scores.accessibilityScore = validateScore(scores.accessibilityScore);
    scores.designTrendScore = validateScore(scores.designTrendScore);

    return scores;
  } catch (error) {
    console.error('Quality validation error:', error);

    // Return default scores on error
    return {
      qualityScore: 0,
      performanceScore: 0,
      accessibilityScore: 0,
      designTrendScore: 0,
      issues: ['Failed to validate quality: ' + (error as Error).message],
      strengths: [],
      suggestions: [],
    };
  }
}

/**
 * Quick validation check (pass/fail)
 * Returns true if example meets minimum quality threshold
 */
export async function meetsQualityThreshold(
  categoryName: string,
  htmlContent: string,
  styleVariant: string,
  industryContext: string,
  minScore: number = 80
): Promise<boolean> {
  const scores = await validateExampleQuality(
    categoryName,
    htmlContent,
    styleVariant,
    industryContext
  );

  return scores.qualityScore >= minScore;
}

/**
 * Batch validate multiple examples
 */
export async function batchValidateExamples(
  examples: Array<{
    categoryName: string;
    htmlContent: string;
    styleVariant: string;
    industryContext: string;
  }>,
  onProgress?: (index: number, total: number) => void
): Promise<QualityScores[]> {
  const results: QualityScores[] = [];

  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    const scores = await validateExampleQuality(
      example.categoryName,
      example.htmlContent,
      example.styleVariant,
      example.industryContext
    );

    results.push(scores);

    if (onProgress) {
      onProgress(i + 1, examples.length);
    }

    // Add small delay to avoid rate limits
    if (i < examples.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Calculate average scores from batch
 */
export function calculateAverageScores(scores: QualityScores[]): {
  avgQuality: number;
  avgPerformance: number;
  avgAccessibility: number;
  avgDesignTrend: number;
} {
  if (scores.length === 0) {
    return {
      avgQuality: 0,
      avgPerformance: 0,
      avgAccessibility: 0,
      avgDesignTrend: 0,
    };
  }

  const sum = scores.reduce(
    (acc, score) => ({
      quality: acc.quality + score.qualityScore,
      performance: acc.performance + score.performanceScore,
      accessibility: acc.accessibility + score.accessibilityScore,
      designTrend: acc.designTrend + score.designTrendScore,
    }),
    { quality: 0, performance: 0, accessibility: 0, designTrend: 0 }
  );

  return {
    avgQuality: Math.round(sum.quality / scores.length),
    avgPerformance: Math.round(sum.performance / scores.length),
    avgAccessibility: Math.round(sum.accessibility / scores.length),
    avgDesignTrend: Math.round(sum.designTrend / scores.length),
  };
}
