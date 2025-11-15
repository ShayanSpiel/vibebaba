/**
 * SEARCH AGENT - CODE EXTRACTOR TOOL
 *
 * Extract code files from GitHub repositories
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { getMCPManager } from '@/lib/mcp/client';

export function createCodeExtractorTool() {
  return new DynamicStructuredTool({
    name: 'code_extractor',
    description:
      'Extract code files from GitHub repository. Best for: downloading components, utils, configs from repos. Provide either specific file paths OR features to find relevant files.',
    schema: z.object({
      repo: z.string().describe("GitHub repo in format 'owner/repo'"),
      paths: z
        .array(z.string())
        .optional()
        .describe("Specific file paths to extract (e.g., ['src/components/Auth.tsx'])"),
      features: z
        .array(z.string())
        .optional()
        .describe("Features to find if paths not provided (e.g., ['auth', 'dashboard'])"),
      maxFiles: z.number().default(5).describe('Maximum number of files to extract (default: 5)'),
    }),
    func: async ({ repo, paths, features, maxFiles }) => {
      try {
        const mcpManager = getMCPManager();
        const client = await mcpManager.getClient('github');

        if (!client) {
          return JSON.stringify({
            success: false,
            error: 'GitHub MCP not available',
            message: 'Cannot extract code from GitHub',
          });
        }

        let filePaths = paths || [];

        // If features provided but not paths, search for relevant files
        if (features && features.length > 0 && (!paths || paths.length === 0)) {
          filePaths = await findRelevantFiles(client, repo, features, maxFiles);
        }

        if (filePaths.length === 0) {
          return JSON.stringify({
            success: false,
            error: 'No files specified or found',
            message: "Please provide either 'paths' or 'features' to extract code",
          });
        }

        // Extract file contents
        const extractedCode: any[] = [];
        const [owner, repoName] = repo.split('/');

        for (const path of filePaths.slice(0, maxFiles)) {
          try {
            const result = await client.callTool('get_file_contents', {
              owner,
              repo: repoName,
              path,
            });

            if (result && result.content) {
              const content = Array.isArray(result.content)
                ? result.content[0]?.text
                : result.content;
              const fileData = typeof content === 'string' ? JSON.parse(content) : content;

              extractedCode.push({
                path,
                content: fileData.content || fileData,
                language: getLanguageFromPath(path),
                size: fileData.size || fileData.content?.length || 0,
                repo,
              });
            }
          } catch (error) {
            console.error(`[CodeExtractor] Failed to extract ${path}:`, error);
          }
        }

        return JSON.stringify({
          success: true,
          repo,
          files: extractedCode,
          totalFiles: extractedCode.length,
        });
      } catch (error: any) {
        console.error('[CodeExtractor] Extraction failed:', error);
        return JSON.stringify({
          success: false,
          error: error.message || 'Code extraction failed',
          message: 'Failed to extract code from GitHub repository',
        });
      }
    },
  });
}

/**
 * Find relevant files based on features
 */
async function findRelevantFiles(
  client: any,
  repo: string,
  features: string[],
  maxFiles: number
): Promise<string[]> {
  const filePaths: string[] = [];

  try {
    // Search for each feature in the repository
    for (const feature of features) {
      const searchQuery = `repo:${repo} ${feature} path:components OR path:lib OR path:utils OR path:src`;

      const result = await client.callTool('search_code', {
        q: searchQuery,
        per_page: 3,
      });

      if (result && result.content) {
        const content = Array.isArray(result.content) ? result.content[0]?.text : result.content;
        const data = typeof content === 'string' ? JSON.parse(content) : content;
        const items = data.items || [];

        for (const item of items) {
          const path = item.path || item.file?.path;
          if (path && !filePaths.includes(path)) {
            filePaths.push(path);
          }
        }
      }
    }
  } catch (error) {
    console.error('[CodeExtractor] Error finding relevant files:', error);
  }

  return filePaths.slice(0, maxFiles);
}

/**
 * Get language from file path
 */
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    rb: 'ruby',
    php: 'php',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    md: 'markdown',
  };

  return langMap[ext || ''] || 'unknown';
}
