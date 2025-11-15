/**
 * SEARCH AGENT - GITHUB SEARCH TOOL
 *
 * Search GitHub repositories for code examples
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { getMCPManager } from '@/lib/mcp/client';

export function createGitHubSearchTool() {
  return new DynamicStructuredTool({
    name: 'github_search',
    description:
      'Search GitHub repositories for code examples. Best for: finding Next.js projects, React components, authentication examples, specific features. Returns repository information.',
    schema: z.object({
      query: z.string().describe('GitHub search query (will be enhanced with filters)'),
      language: z
        .string()
        .optional()
        .describe("Programming language filter (e.g., 'typescript', 'javascript')"),
      stars: z.string().optional().describe("Minimum stars filter (e.g., '>100', '>1000')"),
      numResults: z
        .number()
        .default(5)
        .describe('Number of results to return (default: 5, max: 10)'),
    }),
    func: async ({ query, language, stars, numResults }) => {
      try {
        const mcpManager = getMCPManager();
        const client = await mcpManager.getClient('github');

        if (!client) {
          return JSON.stringify({
            success: false,
            error: 'GitHub MCP not available',
            message: 'Cannot search GitHub repositories',
          });
        }

        // Build enhanced GitHub search query
        let searchQuery = query;
        if (language) searchQuery += ` language:${language}`;
        if (stars) searchQuery += ` stars:${stars}`;

        // Call GitHub search repositories
        const result = await client.callTool('search_repositories', {
          query: searchQuery,
          page: 1,
          perPage: Math.min(numResults, 10),
        });

        if (!result || !result.content) {
          throw new Error('No results from GitHub Search');
        }

        // Parse GitHub MCP response
        const content = Array.isArray(result.content) ? result.content[0]?.text : result.content;
        const data = typeof content === 'string' ? JSON.parse(content) : content;

        const repositories = data.items || data || [];

        return JSON.stringify({
          success: true,
          source: 'github',
          repositories: repositories.slice(0, numResults).map((repo: any) => ({
            fullName: repo.full_name || repo.name,
            description: repo.description || '',
            stars: repo.stargazers_count || repo.stars || 0,
            url: repo.html_url || repo.url,
            language: repo.language || 'Unknown',
            topics: repo.topics || [],
            forks: repo.forks_count || repo.forks || 0,
            updatedAt: repo.updated_at || repo.updatedAt,
          })),
        });
      } catch (error: any) {
        console.error('[GitHub] Search failed:', error);
        return JSON.stringify({
          success: false,
          error: error.message || 'GitHub search failed',
          message: 'Failed to search GitHub repositories',
        });
      }
    },
  });
}
