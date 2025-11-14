/**
 * SEARCH AGENT - INTENT ANALYZER
 *
 * Analyzes user queries to determine search intent and extract entities
 */

import type { SearchIntent, SearchContext, ColorIntent } from './types';

/**
 * Analyze user query to determine intent and extract entities
 */
export async function analyzeIntent(
  query: string,
  context?: SearchContext
): Promise<SearchIntent> {
  const prompt = buildIntentAnalysisPrompt(query, context);

  // Call Claude API for intent analysis
  const result = await callClaudeForIntent(prompt);

  // Enrich color intent with hex values
  if (result.colors) {
    result.colors = await enrichColorIntent(result.colors);
  }

  return result;
}

/**
 * Build prompt for intent analysis
 */
function buildIntentAnalysisPrompt(query: string, context?: SearchContext): string {
  return `You are a search intent analyzer for a universal retrieval engine. Analyze this query and extract structured intent.

QUERY: "${query}"

CONTEXT:
${context ? JSON.stringify(context, null, 2) : 'None'}

INTENT CATEGORIES:
1. code-search: User wants code examples/repos (e.g., "find auth component", "nextjs dashboard", "stripe integration")
2. brand-clone: User wants to replicate a brand (e.g., "make it like Stripe", "Linear design", "copy Notion's style")
3. design-inspiration: User wants design ideas (e.g., "modern dashboard designs", "color schemes for SaaS")
4. content-research: User wants content/tone examples (e.g., "SaaS landing page copy", "error messages like Stripe")
5. api-documentation: User wants API docs (e.g., "Stripe API docs", "how to use OpenAI API")
6. tutorial-search: User wants tutorials (e.g., "how to deploy Next.js", "React authentication tutorial")
7. library-comparison: User wants to compare tools (e.g., "Prisma vs Drizzle", "best state management")
8. general-knowledge: General web search (e.g., "what is RAG", "best practices for SEO")

EXTRACTION RULES:
- techStack: Extract all mentioned technologies (nextjs, react, typescript, tailwind, etc.)
- features: Extract functional requirements (authentication, dashboard, collaboration, payments, etc.)
- brandMentions: Extract any brand names mentioned (stripe, linear, notion, vercel, etc.)
- colors: Extract color names AND provide hex values
- designStyle: Extract design aesthetics (trendy, high-end, minimal, modern, corporate, playful, etc.)
- urls: Extract any URLs mentioned
- searchSources: Which sources to search ['github', 'exa', 'duckduckgo', 'brave', 'brand', 'docs']
- requiresScreenshot: true if user wants to see/analyze screenshots
- requiresCodeExtraction: true if user needs actual code files
- requiresBrandScraping: true if brand guidelines needed
- requiresCloneAnalysis: true if cloning a website
- confidence: 0-1 based on query clarity
- priority: low/medium/high based on complexity

Return ONLY valid JSON (no markdown, no explanation):
{
  "category": "code-search",
  "subCategory": "dashboard-components",
  "techStack": ["nextjs", "react", "typescript"],
  "features": ["authentication", "collaboration"],
  "brandMentions": [],
  "colors": {
    "primary": { "name": "cream" },
    "secondary": { "name": "teal" }
  },
  "designStyle": ["trendy", "high-end"],
  "urls": [],
  "searchSources": ["github", "exa"],
  "requiresScreenshot": false,
  "requiresCodeExtraction": true,
  "requiresBrandScraping": false,
  "requiresCloneAnalysis": false,
  "confidence": 0.95,
  "priority": "high"
}`;
}

/**
 * Call Claude API for intent analysis
 */
async function callClaudeForIntent(prompt: string): Promise<SearchIntent> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse JSON response
    const intent = JSON.parse(content);

    return intent;
  } catch (error) {
    console.error('[IntentAnalyzer] Error calling Claude API:', error);

    // Fallback to basic intent
    return getFallbackIntent(prompt);
  }
}

/**
 * Fallback intent if Claude API fails
 */
function getFallbackIntent(query: string): SearchIntent {
  const lowerQuery = query.toLowerCase();

  // Simple heuristics
  let category: SearchIntent['category'] = 'general-knowledge';
  const searchSources: SearchIntent['searchSources'] = ['exa', 'duckduckgo'];

  if (lowerQuery.includes('code') || lowerQuery.includes('component') || lowerQuery.includes('repo')) {
    category = 'code-search';
    searchSources.push('github');
  } else if (lowerQuery.includes('like') && (lowerQuery.includes('stripe') || lowerQuery.includes('linear'))) {
    category = 'brand-clone';
    searchSources.push('brand');
  } else if (lowerQuery.includes('design') || lowerQuery.includes('ui') || lowerQuery.includes('layout')) {
    category = 'design-inspiration';
  } else if (lowerQuery.includes('api') || lowerQuery.includes('docs') || lowerQuery.includes('documentation')) {
    category = 'api-documentation';
    searchSources.push('docs');
  }

  return {
    category,
    confidence: 0.5,
    priority: 'medium',
    searchSources,
    requiresScreenshot: false,
    requiresCodeExtraction: category === 'code-search',
    requiresBrandScraping: category === 'brand-clone',
    requiresCloneAnalysis: category === 'brand-clone',
  };
}

/**
 * Enrich color intent with hex values
 */
async function enrichColorIntent(colors: SearchIntent['colors']): Promise<SearchIntent['colors']> {
  if (!colors) return colors;

  const colorMap = getColorHexMap();

  const enrichColor = (color?: ColorIntent): ColorIntent | undefined => {
    if (!color) return color;

    const hex = colorMap[color.name.toLowerCase()];
    if (hex) {
      return {
        ...color,
        hex,
        rgb: hexToRgb(hex),
        tailwind: getTailwindColor(color.name),
      };
    }
    return color;
  };

  return {
    primary: enrichColor(colors.primary),
    secondary: enrichColor(colors.secondary),
    accent: enrichColor(colors.accent),
    others: colors.others?.map(enrichColor).filter(Boolean) as ColorIntent[],
  };
}

/**
 * Get color hex map
 */
function getColorHexMap(): Record<string, string> {
  return {
    // Basic colors
    'red': '#EF4444',
    'orange': '#F97316',
    'yellow': '#EAB308',
    'green': '#10B981',
    'blue': '#3B82F6',
    'purple': '#8B5CF6',
    'pink': '#EC4899',
    'teal': '#14B8A6',
    'cyan': '#06B6D4',
    'indigo': '#6366F1',

    // Shades
    'black': '#000000',
    'white': '#FFFFFF',
    'gray': '#6B7280',
    'grey': '#6B7280',

    // Special colors
    'cream': '#FFFDD0',
    'beige': '#F5F5DC',
    'navy': '#000080',
    'maroon': '#800000',
    'olive': '#808000',
    'lime': '#00FF00',
    'aqua': '#00FFFF',
    'fuchsia': '#FF00FF',
    'silver': '#C0C0C0',

    // Pastel colors
    'pastel pink': '#FFD1DC',
    'pastel blue': '#AEC6CF',
    'pastel green': '#77DD77',
    'pastel yellow': '#FDFD96',
    'pastel purple': '#DDA0DD',
  };
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '';

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Get Tailwind color class
 */
function getTailwindColor(colorName: string): string {
  const colorMap: Record<string, string> = {
    'red': 'red-500',
    'orange': 'orange-500',
    'yellow': 'yellow-500',
    'green': 'green-500',
    'blue': 'blue-500',
    'purple': 'purple-500',
    'pink': 'pink-500',
    'teal': 'teal-500',
    'cyan': 'cyan-500',
    'indigo': 'indigo-500',
    'gray': 'gray-500',
    'grey': 'gray-500',
  };

  return colorMap[colorName.toLowerCase()] || 'gray-500';
}

/**
 * Generate optimized search queries based on intent
 */
export function generateSearchQueries(intent: SearchIntent, originalQuery: string): SearchIntent['queries'] {
  const queries: SearchIntent['queries'] = {
    github: [],
    exa: [],
    web: [],
  };

  // GitHub queries
  if (intent.searchSources.includes('github')) {
    if (intent.techStack && intent.features) {
      queries.github = intent.features.map(feature => {
        const tech = intent.techStack?.join(' ') || '';
        return `${feature} ${tech} stars:>100`;
      });
    } else {
      queries.github = [originalQuery + ' stars:>50'];
    }
  }

  // Exa queries (AI-optimized)
  if (intent.searchSources.includes('exa')) {
    if (intent.category === 'api-documentation') {
      queries.exa = [`${originalQuery} official documentation`];
    } else if (intent.category === 'tutorial-search') {
      queries.exa = [`${originalQuery} tutorial guide`];
    } else {
      queries.exa = [originalQuery];
    }
  }

  // Web queries (DuckDuckGo/Brave)
  if (intent.searchSources.includes('duckduckgo') || intent.searchSources.includes('brave')) {
    queries.web = [originalQuery];

    if (intent.brandMentions && intent.brandMentions.length > 0) {
      queries.web.push(...intent.brandMentions.map(brand => `${brand} brand guidelines`));
    }
  }

  return queries;
}
