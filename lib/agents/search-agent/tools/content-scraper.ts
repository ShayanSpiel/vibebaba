/**
 * SEARCH AGENT - CONTENT SCRAPER TOOL
 *
 * Extract content, copy, and tone from websites
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { getMCPManager } from '@/lib/mcp/client';

export function createContentScraperTool() {
  return new DynamicStructuredTool({
    name: 'content_scraper',
    description:
      'Extract content, copy, and tone from websites. Best for: analyzing landing page copy, understanding brand voice, extracting text content.',
    schema: z.object({
      url: z.string().describe('URL to scrape content from'),
      extractTone: z.boolean().default(true).describe('Analyze the tone/voice of content'),
      extractCopy: z.boolean().default(true).describe('Extract key copy/headlines'),
      sections: z.array(z.string()).optional().describe('Specific CSS selectors to target'),
    }),
    func: async ({ url, extractTone, extractCopy, sections }) => {
      try {
        const mcpManager = getMCPManager();
        const fetchClient = await mcpManager.getClient('fetch');

        if (!fetchClient) {
          return JSON.stringify({
            success: false,
            error: 'Fetch MCP not available',
          });
        }

        // Fetch page content
        const result = await fetchClient.callTool('fetch', {
          url,
          max_length: 100000,
        });

        if (!result || !result.content) {
          return JSON.stringify({
            success: false,
            error: 'Could not fetch page content',
          });
        }

        const content = Array.isArray(result.content) ? result.content[0]?.text : result.content;
        const html = typeof content === 'string' ? content : JSON.stringify(content);

        // Extract content
        const extracted = extractContentFromHtml(html, { extractTone, extractCopy, sections });

        return JSON.stringify({
          success: true,
          url,
          ...extracted,
        });
      } catch (error: any) {
        console.error('[ContentScraper] Scraping failed:', error);
        return JSON.stringify({
          success: false,
          error: error.message || 'Content scraping failed',
        });
      }
    },
  });
}

/**
 * Extract content from HTML
 */
function extractContentFromHtml(
  html: string,
  options: {
    extractTone: boolean;
    extractCopy: boolean;
    sections?: string[];
  }
): any {
  const result: any = {};

  // Remove script and style tags
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Extract headings
  if (options.extractCopy) {
    const headings: string[] = [];

    // H1
    const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
    let match;
    while ((match = h1Regex.exec(cleanHtml)) !== null) {
      const text = stripHtmlTags(match[1]).trim();
      if (text) headings.push(text);
    }

    // H2
    const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
    while ((match = h2Regex.exec(cleanHtml)) !== null) {
      const text = stripHtmlTags(match[1]).trim();
      if (text) headings.push(text);
    }

    result.headings = headings.slice(0, 10);

    // Extract paragraphs
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>(.*?)<\/p>/gi;
    while ((match = pRegex.exec(cleanHtml)) !== null) {
      const text = stripHtmlTags(match[1]).trim();
      if (text && text.length > 20) {
        paragraphs.push(text);
      }
    }

    result.paragraphs = paragraphs.slice(0, 5);

    // Extract CTA buttons
    const buttons: string[] = [];
    const buttonRegex = /<button[^>]*>(.*?)<\/button>/gi;
    while ((match = buttonRegex.exec(cleanHtml)) !== null) {
      const text = stripHtmlTags(match[1]).trim();
      if (text) buttons.push(text);
    }

    const linkRegex = /<a[^>]*class="[^"]*btn[^"]*"[^>]*>(.*?)<\/a>/gi;
    while ((match = linkRegex.exec(cleanHtml)) !== null) {
      const text = stripHtmlTags(match[1]).trim();
      if (text) buttons.push(text);
    }

    result.ctaButtons = buttons.slice(0, 5);
  }

  // Analyze tone (basic analysis)
  if (options.extractTone) {
    const allText = stripHtmlTags(cleanHtml).toLowerCase();

    const toneIndicators = {
      professional: ['enterprise', 'solution', 'optimize', 'leverage', 'streamline'],
      casual: ['hey', 'awesome', 'cool', 'super', 'easy'],
      technical: ['api', 'sdk', 'integration', 'configuration', 'deploy'],
      friendly: ['we', 'you', 'your', 'our', 'together'],
      urgent: ['now', 'today', 'limited', 'hurry', "don't miss"],
    };

    const toneScores: Record<string, number> = {};

    for (const [tone, keywords] of Object.entries(toneIndicators)) {
      let score = 0;
      for (const keyword of keywords) {
        const count = (allText.match(new RegExp(keyword, 'g')) || []).length;
        score += count;
      }
      toneScores[tone] = score;
    }

    // Get dominant tone
    const dominantTone = Object.entries(toneScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([tone]) => tone);

    result.tone = dominantTone;
  }

  return result;
}

/**
 * Strip HTML tags from string
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ');
}
