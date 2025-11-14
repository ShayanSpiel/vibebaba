/**
 * SEARCH AGENT - DUCKDUCKGO SEARCH TOOL
 *
 * Free web search using DuckDuckGo (fallback for Exa)
 * FIXED: Now uses duck-duck-scrape package for reliable results
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { search as ddgSearch } from "duck-duck-scrape";

export function createDuckDuckGoSearchTool() {
  return new DynamicStructuredTool({
    name: "duckduckgo_search",
    description: "Free web search using DuckDuckGo. Use as SECONDARY fallback if Exa fails. Good for general knowledge, tutorials, and documentation. FREE and unlimited.",
    schema: z.object({
      query: z.string().describe("Search query"),
      numResults: z.number().default(5).describe("Number of results to return (default: 5)"),
    }),
    func: async ({ query, numResults }) => {
      try {
        console.log(`[DuckDuckGo] Searching for: "${query}"`);

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Use duck-duck-scrape package (reliable, actively maintained)
        const searchResults = await ddgSearch(query, {
          safeSearch: 0, // 0 = off, 1 = moderate, 2 = strict
        });

        if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
          console.warn('[DuckDuckGo] No results found');
          return JSON.stringify({
            success: false,
            source: "duckduckgo",
            results: [],
            error: "No results found",
            fallback: "Use brave_search instead",
          });
        }

        const results = searchResults.results.slice(0, numResults).map((result: any) => ({
          title: result.title || '',
          url: result.url || '',
          snippet: result.description || '',
        }));

        console.log(`[DuckDuckGo] Found ${results.length} results`);

        return JSON.stringify({
          success: true,
          source: "duckduckgo",
          results,
        });
      } catch (error: any) {
        console.error('[DuckDuckGo] Search failed:', error.message || error);

        // Check if it's a rate limit error
        const isRateLimit = error.message?.includes('anomaly') || error.message?.includes('too quickly');

        return JSON.stringify({
          success: false,
          source: "duckduckgo",
          error: error.message || 'DuckDuckGo search failed',
          isRateLimit,
          fallback: "Use brave_search instead",
          note: isRateLimit ? "Rate limited - will work normally in production with proper delays between searches" : undefined
        });
      }
    },
  });
}
