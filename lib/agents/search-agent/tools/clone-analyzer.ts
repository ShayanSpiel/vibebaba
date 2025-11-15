/**
 * SEARCH AGENT - CLONE ANALYZER TOOL
 *
 * Analyze a website for cloning - detect framework, components, layout
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { getMCPManager } from '@/lib/mcp/client';

export function createCloneAnalyzerTool() {
  return new DynamicStructuredTool({
    name: 'clone_analyzer',
    description:
      "Analyze a website for cloning - detect framework, component library, layout structure. Best for: 'make it like X' requests, understanding website architecture.",
    schema: z.object({
      url: z.string().describe('Target URL to analyze'),
      analyzePages: z
        .array(z.string())
        .default(['/'])
        .describe("Pages to analyze (default: ['/'])"),
      extractCode: z.boolean().default(false).describe('Whether to attempt code extraction'),
    }),
    func: async ({ url, analyzePages, extractCode }) => {
      try {
        const mcpManager = getMCPManager();

        // Get HTML content
        const fetchClient = await mcpManager.getClient('fetch');
        if (!fetchClient) {
          return JSON.stringify({
            success: false,
            error: 'Fetch MCP not available',
          });
        }

        const analyses: any[] = [];

        for (const page of analyzePages) {
          const pageUrl = url + page;

          try {
            // Fetch page HTML
            const result = await fetchClient.callTool('fetch', {
              url: pageUrl,
              max_length: 100000,
            });

            if (!result || !result.content) continue;

            const content = Array.isArray(result.content)
              ? result.content[0]?.text
              : result.content;
            const html = typeof content === 'string' ? content : JSON.stringify(content);

            // Analyze the page
            const analysis = analyzePageStructure(html, pageUrl);
            analyses.push(analysis);
          } catch (error) {
            console.error(`[CloneAnalyzer] Failed to analyze ${pageUrl}:`, error);
          }
        }

        if (analyses.length === 0) {
          return JSON.stringify({
            success: false,
            error: 'Could not analyze any pages',
          });
        }

        // Aggregate results
        const framework = detectFramework(analyses[0].html);
        const componentLibrary = detectComponentLibrary(analyses[0].html);

        return JSON.stringify({
          success: true,
          url,
          framework,
          componentLibrary,
          layouts: analyses.map((a) => ({
            page: a.page,
            sections: a.sections,
            components: a.components,
          })),
          designTokens: analyses[0].designTokens,
        });
      } catch (error: any) {
        console.error('[CloneAnalyzer] Analysis failed:', error);
        return JSON.stringify({
          success: false,
          error: error.message || 'Clone analysis failed',
        });
      }
    },
  });
}

/**
 * Analyze page structure
 */
function analyzePageStructure(html: string, page: string): any {
  // Extract sections (headers, nav, main, footer)
  const sections: string[] = [];
  if (html.includes('<header') || html.includes('header')) sections.push('header');
  if (html.includes('<nav') || html.includes('navigation')) sections.push('nav');
  if (html.includes('<main') || html.includes('main')) sections.push('main');
  if (html.includes('<footer') || html.includes('footer')) sections.push('footer');
  if (html.includes('hero')) sections.push('hero');
  if (html.includes('pricing')) sections.push('pricing');
  if (html.includes('testimonial') || html.includes('review')) sections.push('testimonials');
  if (html.includes('feature')) sections.push('features');

  // Detect common components
  const components: string[] = [];
  if (html.includes('button') || html.includes('btn')) components.push('button');
  if (html.includes('card')) components.push('card');
  if (html.includes('modal') || html.includes('dialog')) components.push('modal');
  if (html.includes('dropdown') || html.includes('select')) components.push('dropdown');
  if (html.includes('input') || html.includes('form')) components.push('form');
  if (html.includes('table')) components.push('table');
  if (html.includes('tab')) components.push('tabs');

  // Extract design tokens (basic)
  const designTokens = {
    colors: extractColorsFromHtml(html),
    fonts: extractFontsFromHtml(html),
  };

  return {
    page,
    html,
    sections,
    components,
    designTokens,
  };
}

/**
 * Detect framework from HTML
 */
function detectFramework(html: string): string | null {
  if (html.includes('__next') || html.includes('_next')) return 'Next.js';
  if (html.includes('__nuxt') || html.includes('_nuxt')) return 'Nuxt.js';
  if (html.includes('react') || html.includes('React')) return 'React';
  if (html.includes('vue') || html.includes('Vue')) return 'Vue';
  if (html.includes('angular') || html.includes('ng-')) return 'Angular';
  if (html.includes('svelte')) return 'Svelte';

  return null;
}

/**
 * Detect component library from HTML
 */
function detectComponentLibrary(html: string): string | null {
  if (html.includes('tailwind') || html.includes('tw-')) return 'Tailwind CSS';
  if (html.includes('MuiButton') || html.includes('mui')) return 'Material-UI';
  if (html.includes('chakra')) return 'Chakra UI';
  if (html.includes('ant-') || html.includes('antd')) return 'Ant Design';
  if (html.includes('bootstrap')) return 'Bootstrap';
  if (html.includes('mantine')) return 'Mantine';

  return null;
}

/**
 * Extract colors from HTML
 */
function extractColorsFromHtml(html: string): string[] {
  const colors = new Set<string>();
  const colorRegex = /#[0-9a-fA-F]{3,8}/g;

  let match;
  while ((match = colorRegex.exec(html)) !== null) {
    colors.add(match[0]);
  }

  return Array.from(colors).slice(0, 10);
}

/**
 * Extract fonts from HTML
 */
function extractFontsFromHtml(html: string): string[] {
  const fonts = new Set<string>();
  const fontRegex = /font-family:\s*([^;]+)/g;

  let match;
  while ((match = fontRegex.exec(html)) !== null) {
    const font = match[1].trim().replace(/['"]/g, '').split(',')[0];
    fonts.add(font);
  }

  return Array.from(fonts).slice(0, 5);
}
