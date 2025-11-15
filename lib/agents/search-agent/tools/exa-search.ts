/**
 * SEARCH AGENT - EXA SEARCH TOOL
 *
 * AI-optimized web search using Exa API
 * FIXED: Enhanced error handling and logging
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import Exa from 'exa-js';
import { z } from 'zod';

export function createExaSearchTool() {
  return new DynamicStructuredTool({
    name: 'exa_search',
    description:
      'AI-optimized search for technical content, code, and documentation. Best for: code examples, tutorials, technical blogs, API docs, research papers. Use this as the PRIMARY search tool.',
    schema: z.object({
      query: z.string().describe('Search query optimized for AI search'),
      numResults: z.number().default(5).describe('Number of results to return (default: 5)'),
      category: z
        .enum(['research paper', 'github', 'tweet', 'company'])
        .optional()
        .describe('Optional category filter'),
    }),
    func: async ({ query, numResults, category }) => {
      try {
        if (!process.env.EXA_API_KEY) {
          console.warn('[Exa] EXA_API_KEY not configured - skipping Exa search');
          return JSON.stringify({
            success: false,
            source: 'exa',
            error: 'EXA_API_KEY not configured',
            fallback: 'Use duckduckgo_search or brave_search instead',
          });
        }

        console.log(`[Exa] Searching for: "${query}" (category: ${category || 'auto'})`);

        const exa = new Exa(process.env.EXA_API_KEY);

        const result = await exa.searchAndContents(query, {
          type: 'auto',
          numResults,
          category,
          text: true,
          highlights: true,
        });

        if (!result || !result.results || result.results.length === 0) {
          console.warn('[Exa] No results found');
          return JSON.stringify({
            success: false,
            source: 'exa',
            results: [],
            error: 'No results found',
            fallback: 'Use duckduckgo_search or brave_search instead',
          });
        }

        console.log(`[Exa] Found ${result.results.length} results`);

        return JSON.stringify({
          success: true,
          source: 'exa',
          results: result.results.map((r: any) => ({
            title: r.title || '',
            url: r.url || '',
            summary: r.text?.slice(0, 500) || r.description || '',
            highlights: r.highlights || [],
            score: r.score || 0,
          })),
        });
      } catch (error: any) {
        console.error('[Exa] Search failed:', error.message || error);

        // Detailed error logging for debugging
        if (error.response) {
          console.error('[Exa] API Response Error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          });
        }

        return JSON.stringify({
          success: false,
          source: 'exa',
          error: error.message || 'Exa search failed',
          errorDetails: error.response?.data?.message || error.response?.statusText || '',
          fallback: 'Use duckduckgo_search or brave_search instead',
        });
      }
    },
  });
}
