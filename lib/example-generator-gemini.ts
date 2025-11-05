/**
 * AI Example Generator System (Multi-Model with Fallback)
 * Generates world-class component examples using ALL available free AI models
 * Fallback chain: Gemini → OpenRouter (30+ free models including Claude, DeepSeek, etc.)
 */

import dotenv from 'dotenv';
import path from 'path';
import { generateWithFallback } from './ai';

// Load environment variables
if (!process.env.GEMINI_API_KEY) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

export interface GeneratedExample {
  htmlContent: string;
  name: string;
  description: string;
  tags: string[];
}

export interface QualityScores {
  qualityScore: number;
  performanceScore: number;
  accessibilityScore: number;
  designTrendScore: number;
  issues: string[];
  strengths: string[];
  suggestions: string[];
}

/**
 * Generate component example using multi-model fallback
 * Will try all available models (Gemini + 30+ OpenRouter models)
 */
export async function generateExample(
  categoryName: string,
  categoryDescription: string,
  styleVariant: string,
  industryContext: string,
  complexityLevel: string,
  validateQuality: boolean = true,
  model: string = 'auto' // 'auto' uses fallback chain
): Promise<GeneratedExample> {
  try {
    const prompt = getGenerationPrompt(
      categoryName,
      categoryDescription,
      styleVariant,
      industryContext,
      complexityLevel
    );

    // Use the robust multi-model fallback system from lib/ai.ts
    // This will try all Gemini models, then OpenRouter models (Claude, DeepSeek, etc.)
    const response = await generateWithFallback(prompt);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const example: GeneratedExample = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!example.htmlContent || !example.name) {
      throw new Error('Missing required fields in generated example');
    }

    return example;
  } catch (error) {
    console.error('Example generation error:', error);
    throw new Error(`Failed to generate example: ${(error as Error).message}`);
  }
}

/**
 * Validate example quality using multi-model fallback
 */
export async function validateExampleQuality(
  categoryName: string,
  htmlContent: string,
  styleVariant: string,
  industryContext: string,
  model: string = 'auto' // 'auto' uses fallback chain
): Promise<QualityScores> {
  try {
    const prompt = getQualityValidationPrompt(
      categoryName,
      htmlContent,
      styleVariant,
      industryContext
    );

    // Use the robust multi-model fallback system
    const response = await generateWithFallback(prompt);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const scores: QualityScores = JSON.parse(jsonMatch[0]);

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
 * Generate component generation prompt
 */
function getGenerationPrompt(
  categoryName: string,
  categoryDescription: string,
  styleVariant: string,
  industryContext: string,
  complexityLevel: string
): string {
  return `You are a world-class UI/UX designer and frontend developer. Generate a production-ready ${categoryName} component.

REQUIREMENTS:
- Category: ${categoryName} (${categoryDescription})
- Style: ${styleVariant}
- Industry: ${industryContext}
- Complexity: ${complexityLevel}

DESIGN SPECIFICATIONS:
1. Modern 2025 Design Trends:
   - Subtle gradients and blur effects
   - Smooth shadows (no harsh borders)
   - Generous white space
   - Modern color palettes
   - Fluid animations and transitions

2. Style Variant Guidelines:
   ${getStyleVariantGuidelines(styleVariant)}

3. Industry Context:
   ${getIndustryGuidelines(industryContext)}

4. Complexity Level:
   ${getComplexityGuidelines(complexityLevel)}

TECHNICAL REQUIREMENTS:
- Use only Tailwind CSS classes (no custom CSS)
- Fully responsive (mobile-first approach)
- Semantic HTML5 elements
- ARIA labels and accessibility features
- Modern JavaScript (if needed, use vanilla JS)
- No external dependencies
- Production-ready code quality

OUTPUT FORMAT:
Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "name": "Clear, descriptive name (e.g., 'Minimal Hero with Gradient Background')",
  "description": "1-2 sentence description of the component and its use case",
  "htmlContent": "Complete HTML with inline Tailwind classes",
  "tags": ["tag1", "tag2", "tag3"]
}

Generate a truly world-class, production-ready component that would impress designers and developers.`;
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
   - Uses modern 2025 design patterns
   - Visual hierarchy is clear
   - Spacing follows modern grid systems
   - Typography is modern and well-scaled
   - Colors are harmonious and on-trend

2. PERFORMANCE (0-100):
   - HTML is concise and semantic
   - Tailwind classes are efficient
   - No performance anti-patterns
   - CSS is optimized

3. ACCESSIBILITY (0-100):
   - Uses semantic HTML5 elements
   - ARIA labels where needed
   - Keyboard navigable
   - Color contrast meets WCAG AA
   - Focus indicators visible

4. OVERALL QUALITY (0-100):
   - Production-ready code
   - Fully responsive
   - Clean, readable structure
   - No obvious bugs

SCORING GUIDELINES:
- Score ≥85 means truly world-class quality
- Score 70-84 means good but needs improvement
- Score <70 means significant issues

Return ONLY a valid JSON object (no markdown, no code blocks):
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

function getStyleVariantGuidelines(variant: string): string {
  const guidelines: Record<string, string> = {
    minimal: '- Clean lines, maximum white space\n   - Monochromatic or limited color palette\n   - Subtle shadows\n   - Simple typography',
    modern: '- Bold typography\n   - Vibrant gradients\n   - Smooth animations\n   - Contemporary spacing',
    glassmorphism: '- Frosted glass effect (backdrop-blur)\n   - Semi-transparent backgrounds\n   - Light borders\n   - Layered depth',
    brutalist: '- Bold, raw aesthetics\n   - High contrast\n   - Unconventional layouts\n   - Strong typography',
    gradient: '- Rich gradient backgrounds\n   - Smooth color transitions\n   - Vibrant colors\n   - Modern aesthetics',
    dark: '- Dark backgrounds (#0f172a, #1e293b)\n   - High contrast text\n   - Subtle glows\n   - Modern dark UI patterns',
  };

  return guidelines[variant] || guidelines.modern;
}

function getIndustryGuidelines(industry: string): string {
  const guidelines: Record<string, string> = {
    saas: 'Clean, professional, trust-building, conversion-focused',
    ecommerce: 'Product-focused, engaging, clear CTAs, shopping-oriented',
    blog: 'Content-first, readable, editorial feel, engaging',
    portfolio: 'Creative, personality-driven, showcase-oriented',
    agency: 'Bold, creative, impressive, professional',
    fintech: 'Trustworthy, secure, professional, data-driven',
    healthcare: 'Calm, trustworthy, accessible, informative',
    education: 'Friendly, clear, engaging, learning-focused',
    media: 'Dynamic, engaging, content-rich, modern',
    nonprofit: 'Heartfelt, mission-driven, donation-focused, trustworthy',
  };

  return guidelines[industry] || guidelines.saas;
}

function getComplexityGuidelines(level: string): string {
  const guidelines: Record<string, string> = {
    simple: '- 1-3 main elements\n   - Straightforward layout\n   - Minimal interactions\n   - Quick to implement',
    medium: '- 4-8 elements\n   - Moderate layout complexity\n   - Some interactive features\n   - Balanced functionality',
    complex: '- 9+ elements\n   - Advanced layout techniques\n   - Rich interactions\n   - Full-featured component',
  };

  return guidelines[level] || guidelines.medium;
}
