/**
 * AI Example Generator System
 * Generates world-class component examples using AI
 */

import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import {
  type QualityScores,
  validateExampleQuality,
} from '../langgraph/validation/post-gen/quality-validator';

// Load environment variables
if (!process.env.OPENAI_API_KEY) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedExample {
  htmlContent: string;
  name: string;
  description: string;
  tags: string[];
  qualityScores?: QualityScores;
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
  return `Generate a world-class ${categoryName} component with these requirements:

CONTEXT:
- Category: ${categoryName}
- Description: ${categoryDescription}
- Industry: ${industryContext}
- Style: ${styleVariant}
- Complexity: ${complexityLevel}

PRIORITIES (in order):
1. Modern design trends (2025):
   - Subtle gradients and color transitions
   - Backdrop blur effects (backdrop-blur-sm, backdrop-blur-md)
   - Smooth shadows (shadow-sm, shadow-lg, shadow-2xl)
   - Rounded corners (rounded-lg, rounded-xl)
   - Modern spacing (gap-4, gap-6, space-y-4)
   - Smooth transitions and hover effects

2. Performance optimization:
   - Minimal HTML structure (semantic, clean)
   - Efficient Tailwind classes (no redundancy)
   - No external images or heavy assets
   - Use SVG for icons (inline, simple paths)
   - Lightweight gradient backgrounds instead of images

3. Accessibility:
   - Semantic HTML5 elements (nav, header, section, article, etc.)
   - ARIA labels where appropriate (aria-label, aria-labelledby)
   - Keyboard navigation support (focus-visible, focus-within)
   - Proper heading hierarchy (h1, h2, h3)
   - High contrast text (text-gray-900, text-white with dark bg)

4. Best practices:
   - Fully responsive (mobile-first with sm:, md:, lg: breakpoints)
   - Consistent spacing (using 8px grid: p-4, p-6, p-8)
   - Modern color palette (slate, gray, blue, purple, emerald)
   - Clean code structure with comments
   - Production-ready quality

STYLE-SPECIFIC GUIDELINES:

${getStyleSpecificGuidelines(styleVariant)}

CONSTRAINTS:
- Use ONLY Tailwind CSS classes (no custom CSS)
- No external images (use gradients, patterns, or placeholder text)
- Inline SVG icons only (simple, clean paths)
- Must include hover and focus states
- Must work perfectly on mobile, tablet, and desktop
- Component should be self-contained (no external dependencies)

OUTPUT FORMAT:
Return a JSON object with this structure (no markdown, no code blocks):
{
  "htmlContent": "<complete HTML here>",
  "name": "Descriptive name for this specific example",
  "description": "Brief description of the component's features and use case",
  "tags": ["tag1", "tag2", "tag3"]
}

Make this component truly world-class - something that could be featured on Dribbble or Awwwards!`;
}

/**
 * Get style-specific design guidelines
 */
function getStyleSpecificGuidelines(styleVariant: string): string {
  const guidelines: Record<string, string> = {
    minimal: `MINIMAL STYLE:
- Use neutral colors (gray-50 to gray-900, white)
- Simple, clean layouts with lots of whitespace
- Subtle shadows (shadow-sm)
- No gradients or complex effects
- Focus on typography and spacing
- Clean lines and simple borders`,

    modern: `MODERN STYLE:
- Gradient accents (from-blue-500 to-purple-600)
- Medium shadows (shadow-md, shadow-lg)
- Rounded corners (rounded-lg, rounded-xl)
- Smooth transitions (transition-all duration-300)
- Balanced use of color and whitespace
- Contemporary feel with clean aesthetics`,

    glassmorphism: `GLASSMORPHISM STYLE:
- Frosted glass effect (backdrop-blur-md, backdrop-blur-lg)
- Semi-transparent backgrounds (bg-white/10, bg-black/20)
- Subtle borders (border border-white/20)
- Soft shadows (shadow-xl, shadow-2xl)
- Light, airy feel with blur effects
- Layered depth with transparency`,

    brutalist: `BRUTALIST STYLE:
- Bold, chunky elements
- Strong borders (border-2, border-4, border-black)
- High contrast (black and white with one accent color)
- Sharp corners (rounded-none or minimal rounding)
- Strong shadows (shadow-brutal style: 8px 8px 0 0 black)
- Unconventional layouts, bold typography`,

    gradient: `GRADIENT STYLE:
- Vibrant gradient backgrounds (from-pink-500 via-purple-500 to-indigo-600)
- Gradient text (bg-gradient-to-r bg-clip-text text-transparent)
- Multiple gradient layers
- Colorful, eye-catching design
- Smooth color transitions
- Modern, energetic feel`,

    dark: `DARK MODE STYLE:
- Dark backgrounds (bg-gray-900, bg-slate-900)
- Light text (text-gray-100, text-white)
- Subtle colored accents (blue-400, purple-400)
- Soft glows (shadow-lg shadow-blue-500/50)
- High contrast for readability
- Elegant, sophisticated atmosphere`,
  };

  return guidelines[styleVariant] || guidelines.modern;
}

/**
 * Generate a single example
 */
export async function generateExample(
  categoryName: string,
  categoryDescription: string,
  styleVariant: string,
  industryContext: string,
  complexityLevel: string,
  validateQuality: boolean = true,
  model: string = 'gpt-4o'
): Promise<GeneratedExample> {
  try {
    const prompt = getGenerationPrompt(
      categoryName,
      categoryDescription,
      styleVariant,
      industryContext,
      complexityLevel
    );

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert UI/UX designer and front-end developer. You create world-class, production-ready components using Tailwind CSS. You always return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8, // Higher creativity for design variation
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const example: GeneratedExample = JSON.parse(response);

    // Validate quality if requested
    if (validateQuality) {
      const qualityScores = await validateExampleQuality(
        categoryName,
        example.htmlContent,
        styleVariant,
        industryContext
      );
      example.qualityScores = qualityScores;
    }

    return example;
  } catch (error) {
    console.error('Example generation error:', error);
    throw new Error(`Failed to generate example: ${(error as Error).message}`);
  }
}

/**
 * Generate multiple examples with retry logic for quality
 */
export async function generateExamplesWithQuality(
  categoryName: string,
  categoryDescription: string,
  styleVariant: string,
  industryContext: string,
  complexityLevel: string,
  minQualityScore: number = 80,
  maxAttempts: number = 3
): Promise<GeneratedExample> {
  let attempts = 0;
  let bestExample: GeneratedExample | null = null;
  let bestScore = 0;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const example = await generateExample(
        categoryName,
        categoryDescription,
        styleVariant,
        industryContext,
        complexityLevel,
        true // validate quality
      );

      const qualityScore = example.qualityScores?.qualityScore || 0;

      // Keep track of best example
      if (qualityScore > bestScore) {
        bestScore = qualityScore;
        bestExample = example;
      }

      // If meets threshold, return immediately
      if (qualityScore >= minQualityScore) {
        console.log(`✓ Quality example generated (score: ${qualityScore}) on attempt ${attempts}`);
        return example;
      }

      console.log(
        `✗ Example quality too low (score: ${qualityScore}), retrying... (${attempts}/${maxAttempts})`
      );

      // Small delay before retry
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Attempt ${attempts} failed:`, error);
      if (attempts === maxAttempts) {
        throw error;
      }
    }
  }

  // Return best example even if below threshold
  if (bestExample) {
    console.log(
      `⚠ Returning best example with score ${bestScore} (below threshold ${minQualityScore})`
    );
    return bestExample;
  }

  throw new Error('Failed to generate any valid example');
}

/**
 * Generate multiple examples for a category
 */
export async function generateCategoryExamples(
  categoryName: string,
  categoryDescription: string,
  count: number = 5,
  onProgress?: (current: number, total: number, example: GeneratedExample) => void
): Promise<GeneratedExample[]> {
  const examples: GeneratedExample[] = [];

  // Define variety matrix for comprehensive coverage
  const styleVariants = ['minimal', 'modern', 'glassmorphism', 'gradient', 'dark'];
  const industries = ['saas', 'ecommerce', 'blog', 'agency', 'fintech'];
  const complexities = ['simple', 'medium', 'complex'];

  for (let i = 0; i < count; i++) {
    const styleVariant = styleVariants[i % styleVariants.length];
    const industryContext = industries[i % industries.length];
    const complexityLevel = complexities[i % complexities.length];

    console.log(
      `\nGenerating example ${i + 1}/${count}: ${categoryName} (${styleVariant}, ${industryContext}, ${complexityLevel})`
    );

    try {
      const example = await generateExamplesWithQuality(
        categoryName,
        categoryDescription,
        styleVariant,
        industryContext,
        complexityLevel
      );

      examples.push(example);

      if (onProgress) {
        onProgress(i + 1, count, example);
      }

      // Rate limiting delay
      if (i < count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Failed to generate example ${i + 1}:`, error);
      // Continue with next example instead of failing completely
    }
  }

  return examples;
}

/**
 * Regenerate low-quality examples
 */
export async function regenerateLowQualityExamples(
  examples: Array<GeneratedExample & { id: string }>,
  minQualityScore: number = 80
): Promise<Array<{ id: string; newExample: GeneratedExample }>> {
  const regenerated: Array<{ id: string; newExample: GeneratedExample }> = [];

  for (const example of examples) {
    const qualityScore = example.qualityScores?.qualityScore || 0;

    if (qualityScore < minQualityScore) {
      console.log(`Regenerating example ${example.id} (current score: ${qualityScore})`);

      try {
        // Extract original parameters (would need to be stored with example)
        // For now, use defaults
        const newExample = await generateExamplesWithQuality(
          'Component', // Would need actual category name
          'Regenerated component',
          'modern',
          'saas',
          'medium',
          minQualityScore
        );

        regenerated.push({
          id: example.id,
          newExample,
        });
      } catch (error) {
        console.error(`Failed to regenerate example ${example.id}:`, error);
      }
    }
  }

  return regenerated;
}
