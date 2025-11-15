/**
 * SEARCH AGENT - INTEGRATION HELPERS
 *
 * Helper functions to integrate SearchAgent into existing workflows
 */

import { buildConfig, SearchAgent, type SearchContext, type SearchResult } from './index';
import { logSearchStart } from './logger';

/**
 * Perform search for app generation (PM Node integration)
 */
export async function searchForAppContext(
  query: string,
  options: {
    orgId: string;
    userId?: string;
    projectId?: string;
    appType?: string;
    features?: string[];
    techStack?: string[];
  }
): Promise<SearchResult> {
  logSearchStart('PM Node - App Generation', query, options);

  const config = buildConfig(options.orgId, {
    userId: options.userId,
    enableExa: true,
    enableGitHub: true,
    enableDuckDuckGo: true,
    enableBrave: true,
    enableCodeExtraction: true,
    enableBrandScraping: true,
    enableCloneAnalysis: false, // Not needed for app generation
    enableContentScraping: false,
    enableVectorStore: true,
    cacheEnabled: true,
    cacheTTL: 3600,
  });

  const searchAgent = new SearchAgent(config);

  const context: SearchContext = {
    orgId: options.orgId,
    userId: options.userId,
    appType: options.appType as any,
    features: options.features,
    techStack: options.techStack || ['nextjs', 'typescript', 'tailwindcss'],
    maxResults: 5,
    cacheEnabled: true,
  };

  const result = await searchAgent.search(query, context);

  console.log('[SearchAgent Integration] Search completed:', {
    success: result.success,
    repositories: result.repositories?.length || 0,
    codeFiles: result.code?.length || 0,
    brandGuidelines: result.brandGuidelines?.length || 0,
  });

  return result;
}

/**
 * Format search result for AI consumption (PM Node)
 */
export function formatSearchResultForAI(result: SearchResult, query: string): string {
  if (!result.success) {
    return `No relevant results found for: "${query}"`;
  }

  let formatted = `# Background Research Results\n\n`;
  formatted += `**Query**: ${query}\n`;
  formatted += `**Intent**: ${result.intent.category}\n\n`;

  // GitHub repositories
  if (result.repositories && result.repositories.length > 0) {
    formatted += `## GitHub Repositories\n\n`;
    for (const repo of result.repositories.slice(0, 3)) {
      formatted += `### ${repo.fullName}\n`;
      formatted += `- **Stars**: ${repo.stars}\n`;
      formatted += `- **Description**: ${repo.description}\n`;
      formatted += `- **Language**: ${repo.language}\n`;
      formatted += `- **URL**: ${repo.url}\n`;
      if (repo.topics && repo.topics.length > 0) {
        formatted += `- **Topics**: ${repo.topics.join(', ')}\n`;
      }
      formatted += `\n`;
    }
  }

  // Extracted code
  if (result.code && result.code.length > 0) {
    formatted += `## Code Examples\n\n`;
    for (const code of result.code.slice(0, 2)) {
      formatted += `### ${code.path}\n`;
      formatted += `**Language**: ${code.language}\n`;
      formatted += `**Repo**: ${code.repo}\n\n`;
      formatted += `\`\`\`${code.language}\n`;
      formatted += code.content.slice(0, 1000); // Truncate for AI context
      if (code.content.length > 1000) {
        formatted += `\n... (truncated)\n`;
      }
      formatted += `\`\`\`\n\n`;
    }
  }

  // Brand guidelines
  if (result.brandGuidelines && result.brandGuidelines.length > 0) {
    formatted += `## Brand Guidelines\n\n`;
    for (const brand of result.brandGuidelines) {
      formatted += `### ${brand.brandName}\n`;
      if (brand.colors) {
        formatted += `**Colors**:\n`;
        if (brand.colors.primary)
          formatted += `- Primary: ${brand.colors.primary.name} (${brand.colors.primary.hex})\n`;
        if (brand.colors.secondary)
          formatted += `- Secondary: ${brand.colors.secondary.name} (${brand.colors.secondary.hex})\n`;
      }
      if (brand.typography) {
        formatted += `**Typography**: ${brand.typography.fontFamily}\n`;
      }
      formatted += `\n`;
    }
  }

  // Web results
  if (result.webResults && result.webResults.length > 0) {
    formatted += `## Web Results\n\n`;
    for (const web of result.webResults.slice(0, 3)) {
      formatted += `- **${web.title}**: ${web.snippet}\n`;
      formatted += `  URL: ${web.url}\n`;
    }
  }

  return formatted;
}

/**
 * Search for conversation context (Context Analyzer integration)
 */
export async function searchForConversationContext(
  query: string,
  conversationHistory: string[],
  options: {
    orgId: string;
    userId?: string;
    projectId?: string;
  }
): Promise<SearchResult> {
  logSearchStart('Context Analyzer - Conversation', query, options);

  const config = buildConfig(options.orgId, {
    userId: options.userId,
    enableExa: true,
    enableDuckDuckGo: true,
    enableBrave: true,
    enableGitHub: false, // Not needed for conversation
    enableCodeExtraction: false,
    enableBrandScraping: false,
    enableCloneAnalysis: false,
    enableContentScraping: false,
    cacheEnabled: true,
  });

  const searchAgent = new SearchAgent(config);

  const result = await searchAgent.search(query, {
    orgId: options.orgId,
    userId: options.userId,
    maxResults: 3,
    cacheEnabled: true,
  });

  return result;
}

/**
 * Search for code assistance (Editor Node integration)
 */
export async function searchForCodeAssistance(
  query: string,
  codeContext: {
    currentFile?: string;
    language?: string;
    errorMessage?: string;
    missingFeature?: string;
  },
  options: {
    orgId: string;
    userId?: string;
  }
): Promise<SearchResult> {
  logSearchStart('Editor Node - Code Assistance', query, {
    orgId: options.orgId,
    context: codeContext,
  });

  const config = buildConfig(options.orgId, {
    userId: options.userId,
    enableExa: true,
    enableGitHub: true,
    enableDuckDuckGo: true,
    enableBrave: false,
    enableCodeExtraction: true,
    enableBrandScraping: false,
    enableCloneAnalysis: false,
    enableContentScraping: false,
    enableVectorStore: true,
    cacheEnabled: true,
  });

  const searchAgent = new SearchAgent(config);

  const enhancedQuery = codeContext.errorMessage
    ? `${query} error: ${codeContext.errorMessage}`
    : query;

  const result = await searchAgent.search(enhancedQuery, {
    orgId: options.orgId,
    userId: options.userId,
    techStack: codeContext.language ? [codeContext.language] : undefined,
    maxResults: 5,
    cacheEnabled: true,
  });

  return result;
}
