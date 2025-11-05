import { GoogleGenerativeAI } from '@google/generative-ai';
import { DesignInspiration } from '@/lib/langgraph/types';

/**
 * Design Inspiration Service
 *
 * Analyzes UI screenshots to extract design tokens (colors, fonts, patterns)
 * Uses Gemini Vision as primary, Pixtral as fallback
 */

interface AnalysisContext {
  appType: string;
  designStyle?: string;
  visualTone?: string;
}

/**
 * Analyze design inspiration from uploaded screenshot
 */
export async function analyzeDesignInspiration(params: {
  imageUrl: string;
  context: AnalysisContext;
}): Promise<DesignInspiration | null> {
  try {
    console.log('[Design Inspiration] Starting analysis...');
    console.log('[Design Inspiration] Image URL:', params.imageUrl);

    // Fetch image from URL
    const imageResponse = await fetch(params.imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image');
    }

    // Convert to base64
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/png';

    // Try Gemini Vision first
    let result = await analyzeWithGemini(base64Image, mimeType, params.context);

    // Fallback to Pixtral if Gemini fails
    if (!result || result.quality < 50) {
      console.log('[Design Inspiration] Gemini failed or low quality, trying Pixtral...');
      result = await analyzeWithPixtral(base64Image, mimeType, params.context);
    }

    // Validate and return
    if (result && result.quality > 50) {
      console.log('[Design Inspiration] ✅ Analysis complete');
      console.log(`[Design Inspiration]   - Primary color: ${result.colors.primary}`);
      console.log(`[Design Inspiration]   - Quality: ${result.quality}/100`);
      return result;
    }

    console.warn('[Design Inspiration] ⚠️  Low quality analysis, skipping');
    return null;

  } catch (error) {
    console.error('[Design Inspiration] ❌ Analysis failed:', error);
    return null; // Non-blocking
  }
}

/**
 * Analyze with Gemini 2.0 Flash (Vision)
 */
async function analyzeWithGemini(
  base64Image: string,
  mimeType: string,
  context: AnalysisContext
): Promise<DesignInspiration | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Gemini Vision] API key not configured');
      return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = buildAnalysisPrompt(context);

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const response = result.response.text();

    // Parse JSON response
    const parsed = parseDesignTokens(response, 'screenshot');

    // Validate WCAG compliance
    if (parsed) {
      parsed.colors = validateColorPalette(parsed.colors);
    }

    return parsed;

  } catch (error) {
    console.error('[Gemini Vision] Error:', error);
    return null;
  }
}

/**
 * Analyze with Pixtral (Mistral Vision) - Fallback
 */
async function analyzeWithPixtral(
  base64Image: string,
  mimeType: string,
  context: AnalysisContext
): Promise<DesignInspiration | null> {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.error('[Pixtral] API key not configured');
      return null;
    }

    const prompt = buildAnalysisPrompt(context);

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: `data:${mimeType};base64,${base64Image}`
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Pixtral API error: ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.choices[0].message.content;

    // Parse JSON response
    const parsed = parseDesignTokens(textResponse, 'screenshot');

    // Validate WCAG compliance
    if (parsed) {
      parsed.colors = validateColorPalette(parsed.colors);
    }

    return parsed;

  } catch (error) {
    console.error('[Pixtral] Error:', error);
    return null;
  }
}

/**
 * Build analysis prompt
 */
function buildAnalysisPrompt(context: AnalysisContext): string {
  return `Analyze this UI design screenshot and extract design tokens.

Context:
- App Type: ${context.appType}
- Design Style: ${context.designStyle || 'modern'}
- Visual Tone: ${context.visualTone || 'professional'}

Extract the following:

1. COLOR PALETTE (provide hex values):
   - Primary color (most prominent brand color)
   - Secondary color (complementary color)
   - Accent color (call-to-action, highlights)
   - Background color (main background)
   - Surface color (cards, panels)

2. TYPOGRAPHY:
   - Heading font family (detect or infer, use web-safe fonts)
   - Body font family
   - Font size scale (5-6 common sizes in px)

3. UI PATTERNS (identify which are present):
   - Layout: hero-centered, hero-split, dashboard, landing-page, sidebar-layout
   - Components: card-grid-3-col, feature-list, testimonial-carousel, pricing-table
   - Styles: glassmorphism, neumorphism, gradient-backgrounds, minimal-flat

4. SPACING & BORDERS:
   - Spacing scale (e.g., [8, 16, 24, 32, 48, 64])
   - Border radius value (e.g., "8px", "12px", "rounded")

5. COMPONENTS (describe key elements):
   - Navigation structure
   - Hero section layout
   - Content sections
   - Footer structure

6. SUGGESTIONS:
   - 2-3 sentences describing the overall design aesthetic
   - Key visual characteristics

7. QUALITY SCORE:
   - 0-100 based on how clearly you can extract design elements
   - Lower score if image is blurry, partial, or unclear

Return ONLY valid JSON in this exact format:
{
  "colors": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "background": "#hexcode",
    "surface": "#hexcode"
  },
  "typography": {
    "headingFont": "Font Name",
    "bodyFont": "Font Name",
    "scale": ["14px", "16px", "20px", "24px", "32px", "48px"]
  },
  "patterns": ["pattern1", "pattern2", "pattern3"],
  "spacing": [8, 16, 24, 32, 48],
  "borderRadius": "8px",
  "components": ["description1", "description2"],
  "suggestions": "Overall design aesthetic description",
  "quality": 85
}`;
}

/**
 * Parse AI response into DesignInspiration object
 */
function parseDesignTokens(response: string, source: 'screenshot' | 'brand' | 'url'): DesignInspiration | null {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                     response.match(/(\{[\s\S]*?\})/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[1]);

    return {
      source,
      colors: parsed.colors || {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        background: '#FFFFFF',
        surface: '#F3F4F6'
      },
      typography: parsed.typography || {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        scale: ['14px', '16px', '20px', '24px', '32px', '48px']
      },
      patterns: parsed.patterns || [],
      spacing: parsed.spacing || [8, 16, 24, 32],
      borderRadius: parsed.borderRadius || '8px',
      components: parsed.components || [],
      suggestions: parsed.suggestions || '',
      quality: parsed.quality || 0
    };

  } catch (error) {
    console.error('[Parse] Failed to parse design tokens:', error);
    console.error('[Parse] Response:', response.substring(0, 500));
    return null;
  }
}

/**
 * Validate color palette for WCAG compliance
 */
function validateColorPalette(colors: any): any {
  try {
    const { colord, extend } = require('colord');
    const a11yPlugin = require('colord/plugins/a11y');
    extend([a11yPlugin]);

    // Validate primary/background contrast
    const primaryColor = colord(colors.primary);
    const bgColor = colord(colors.background);

    const contrast = primaryColor.contrast(bgColor);

    if (contrast < 4.5) {
      // Adjust primary color for better contrast
      console.warn('[WCAG] Primary color contrast too low, adjusting...');

      // Darken or lighten primary to achieve AA compliance
      colors.primary = bgColor.isLight()
        ? primaryColor.darken(0.2).toHex()
        : primaryColor.lighten(0.2).toHex();
    }

    return colors;
  } catch (error) {
    console.error('[WCAG] Color validation error:', error);
    // Return original colors if validation fails
    return colors;
  }
}

/**
 * Detect brand mention in user description
 */
export function detectBrandInDescription(description: string): string | null {
  const SUPPORTED_BRANDS = [
    'stripe', 'linear', 'notion', 'figma', 'vercel',
    'slack', 'discord', 'spotify', 'netflix', 'airbnb',
    'openai', 'anthropic', 'midjourney', 'twitter', 'github',
    'google', 'facebook', 'apple', 'microsoft', 'amazon'
  ];

  const lowerDesc = description.toLowerCase();

  for (const brand of SUPPORTED_BRANDS) {
    if (lowerDesc.includes(brand)) {
      return brand;
    }
  }

  return null;
}
