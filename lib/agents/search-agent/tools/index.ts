/**
 * SEARCH AGENT - TOOL REGISTRY
 *
 * Creates and manages all search agent tools
 */

import type { SearchAgentConfig } from '../types';
import { createBrandScraperTool } from './brand-scraper';
import { createBraveSearchTool } from './brave-search';
import { createCloneAnalyzerTool } from './clone-analyzer';
import { createCodeExtractorTool } from './code-extractor';
import { createContentScraperTool } from './content-scraper';
import { createDuckDuckGoSearchTool } from './duckduckgo-search';
import { createExaSearchTool } from './exa-search';
import { createGitHubSearchTool } from './github-search';

/**
 * Create tool registry based on configuration
 */
export function createToolRegistry(config: SearchAgentConfig) {
  const tools: any[] = [];

  console.log('[ToolRegistry] Creating tools with config:', {
    enableExa: config.enableExa,
    enableGitHub: config.enableGitHub,
    enableDuckDuckGo: config.enableDuckDuckGo,
    enableBrave: config.enableBrave,
    enableCodeExtraction: config.enableCodeExtraction,
    enableBrandScraping: config.enableBrandScraping,
    enableCloneAnalysis: config.enableCloneAnalysis,
    enableContentScraping: config.enableContentScraping,
  });

  // Search tools (hierarchical fallback: Exa -> DuckDuckGo -> Brave)
  if (config.enableExa) {
    console.log('[ToolRegistry] Adding Exa search tool');
    tools.push(createExaSearchTool());
  }

  if (config.enableDuckDuckGo) {
    console.log('[ToolRegistry] Adding DuckDuckGo search tool');
    tools.push(createDuckDuckGoSearchTool());
  }

  if (config.enableBrave) {
    console.log('[ToolRegistry] Adding Brave search tool');
    tools.push(createBraveSearchTool());
  }

  // GitHub tools
  if (config.enableGitHub) {
    console.log('[ToolRegistry] Adding GitHub search tool');
    tools.push(createGitHubSearchTool());
  }

  // Extraction tools
  if (config.enableCodeExtraction) {
    console.log('[ToolRegistry] Adding code extractor tool');
    tools.push(createCodeExtractorTool());
  }

  if (config.enableBrandScraping) {
    console.log('[ToolRegistry] Adding brand scraper tool');
    tools.push(createBrandScraperTool());
  }

  if (config.enableCloneAnalysis) {
    console.log('[ToolRegistry] Adding clone analyzer tool');
    tools.push(createCloneAnalyzerTool());
  }

  if (config.enableContentScraping) {
    console.log('[ToolRegistry] Adding content scraper tool');
    tools.push(createContentScraperTool());
  }

  console.log(`[ToolRegistry] Created ${tools.length} tools`);
  return tools;
}

/**
 * Get tool descriptions for prompt
 */
export function getToolDescriptions(tools: any[]): string {
  let description = 'You have access to the following tools:\n\n';

  for (const tool of tools) {
    description += `- **${tool.name}**: ${tool.description}\n`;
  }

  description += '\nTOOL USAGE STRATEGY:\n';
  description +=
    '1. For web search: Try exa_search first, then duckduckgo_search, finally brave_search\n';
  description += '2. For code: Use github_search to find repos, then code_extractor to get files\n';
  description +=
    '3. For brands: Use brand_scraper for guidelines, clone_analyzer for website analysis\n';
  description += '4. For content: Use content_scraper to extract copy and tone\n';

  return description;
}
