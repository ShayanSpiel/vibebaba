/**
 * SEARCH AGENT - BRAVE SEARCH TOOL
 *
 * Web search using Brave Search API (final fallback)
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { getMCPManager } from "@/lib/mcp/client";

export function createBraveSearchTool() {
  return new DynamicStructuredTool({
    name: "brave_search",
    description: "Web search using Brave Search API. Use as FINAL fallback if both Exa and DuckDuckGo fail. Good for general web search.",
    schema: z.object({
      query: z.string().describe("Search query"),
      numResults: z.number().default(5).describe("Number of results to return (default: 5)"),
    }),
    func: async ({ query, numResults }) => {
      try {
        const mcpManager = getMCPManager();
        const client = await mcpManager.getClient('brave');

        if (!client) {
          return JSON.stringify({
            success: false,
            error: "Brave MCP not available",
            message: "All search sources exhausted. Please check API keys."
          });
        }

        const result = await client.callTool('brave_web_search', {
          query,
          count: numResults,
        });

        if (!result || !result.content) {
          throw new Error('No results from Brave Search');
        }

        // Parse Brave MCP response
        const content = Array.isArray(result.content) ? result.content[0]?.text : result.content;
        const results = typeof content === 'string' ? JSON.parse(content) : content;

        return JSON.stringify({
          success: true,
          source: "brave",
          results: results.web?.results?.slice(0, numResults).map((r: any) => ({
            title: r.title,
            url: r.url,
            snippet: r.description || r.snippet || '',
          })) || [],
        });
      } catch (error: any) {
        console.error('[Brave] Search failed:', error);
        return JSON.stringify({
          success: false,
          error: error.message || 'Brave search failed',
          message: "All search sources exhausted. Please check API keys and connections."
        });
      }
    },
  });
}
