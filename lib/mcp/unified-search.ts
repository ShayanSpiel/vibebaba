/**
 * #done MCP Unified Search Layer
 *
 * Consolidates mcp-search, mcp-background-helper, and mcp-duckduckgo
 * into a single, optimized search interface with caching
 *
 * Features:
 * - Smart caching with LRU eviction
 * - Query optimization using brand recognition
 * - Multi-provider fallback (Brave → DuckDuckGo → Exa)
 * - Structured data extraction
 * - AI-ready formatting
 */

import { getMCPManager } from './client';
import {
  detectBrands,
  optimizeGitHubQuery,
  optimizeWebQuery,
  type BrandName
} from './query-optimizer';
import {
  extractGitHubData,
  extractWebData,
  aggregateExtractedData,
  type ExtractedRepository,
  type ExtractedWebResult,
  type ExtractedContext
} from './data-extractor';
import { searchDuckDuckGo } from './duckduckgo';
import { searchCache, queryOptimizerCache } from './cache';

export interface UnifiedSearchOptions {
  /** Enable caching (default: true) */
  useCache?: boolean;
  /** Minimum stars for GitHub repos (default: 20) */
  minStars?: number;
  /** Maximum results to return (default: 5) */
  maxResults?: number;
  /** Focus area: design, code, or general */
  focusOn?: 'design' | 'code' | 'architecture' | 'general';
  /** Timeout in ms (default: 3000) */
  timeout?: number;
}

export interface UnifiedSearchResult {
  success: boolean;
  source: 'cache' | 'github+web' | 'partial' | 'none';

  // GitHub results
  repositories?: ExtractedRepository[];
  githubQuery?: string;
  githubStrategy?: string;

  // Web results
  webResults?: ExtractedWebResult[];
  webQuery?: string;
  webStrategy?: string;
  webProvider?: 'brave' | 'duckduckgo' | 'exa' | 'none';

  // Aggregated insights
  aggregated?: ExtractedContext;

  // Brand detection
  brandInfo?: {
    detected: BrandName[];
    primary?: BrandName;
    isClone: boolean;
  };

  // Metadata
  cached: boolean;
  executionTime: number;
  error?: string;
}

/**
 * Unified search function - single entry point for all MCP searches
 *
 * @param description - User's app description
 * @param appType - Type of app (landing-page, dashboard, saas-app, etc.)
 * @param options - Search options
 * @returns Unified search results with structured data
 */
export async function unifiedSearch(
  description: string,
  appType: string = 'app',
  options: UnifiedSearchOptions = {}
): Promise<UnifiedSearchResult> {
  const startTime = Date.now();
  const {
    useCache = true,
    minStars = 20,
    maxResults = 5,
    focusOn = 'general',
    timeout = 3000
  } = options;

  console.log('[Unified Search] Starting search...');
  console.log(`  - Description: ${description.substring(0, 60)}...`);
  console.log(`  - App Type: ${appType}`);
  console.log(`  - Cache: ${useCache ? 'enabled' : 'disabled'}`);

  // Generate cache key
  const cacheKey = `${description}|${appType}|${minStars}|${focusOn}`;

  // Check cache first
  if (useCache) {
    const cached = searchCache.get(cacheKey);
    if (cached) {
      console.log('[Unified Search] ✅ Cache HIT');
      const cachedResult = cached as UnifiedSearchResult;
      return {
        ...cachedResult,
        success: cachedResult.success || false,
        source: cachedResult.source || 'cache',
        cached: true,
        executionTime: Date.now() - startTime
      };
    }
    console.log('[Unified Search] ⚠️  Cache MISS');
  }

  // Detect brands
  const brandInfo = detectBrands(description);
  console.log(`[Unified Search] 🔍 Brands detected: ${brandInfo.brands.join(', ') || 'none'}`);

  // Initialize result
  const result: UnifiedSearchResult = {
    success: false,
    source: 'none',
    cached: false,
    executionTime: 0,
    brandInfo: brandInfo.brands.length > 0 ? {
      detected: brandInfo.brands,
      primary: brandInfo.primaryBrand,
      isClone: brandInfo.isClone
    } : undefined
  };

  // Run searches with timeout
  try {
    await Promise.race([
      performSearches(description, appType, minStars, focusOn, brandInfo, result, maxResults),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Search timeout')), timeout)
      )
    ]);
  } catch (error: any) {
    console.log(`[Unified Search] ⚠️  ${error.message}`);
    result.error = error.message;
  }

  // Calculate execution time
  result.executionTime = Date.now() - startTime;

  // Determine source
  if (result.repositories && result.webResults) {
    result.source = 'github+web';
    result.success = true;
  } else if (result.repositories || result.webResults) {
    result.source = 'partial';
    result.success = true;
  }

  // Cache successful results
  if (useCache && result.success) {
    searchCache.set(cacheKey, {
      ...result,
      executionTime: 0 // Don't cache execution time
    });
    console.log('[Unified Search] 💾 Cached result');
  }

  console.log(`[Unified Search] ✅ Completed in ${result.executionTime}ms`);
  console.log(`  - Source: ${result.source}`);
  console.log(`  - Repos: ${result.repositories?.length || 0}`);
  console.log(`  - Web: ${result.webResults?.length || 0}`);

  return result;
}

/**
 * Perform GitHub and web searches in parallel
 */
async function performSearches(
  description: string,
  appType: string,
  minStars: number,
  focusOn: string,
  brandInfo: ReturnType<typeof detectBrands>,
  result: UnifiedSearchResult,
  maxResults: number
): Promise<void> {
  const mcpManager = getMCPManager();

  // Run GitHub and Web searches in parallel
  await Promise.allSettled([
    // GitHub Search with retry fallback
    (async () => {
      try {
        console.log('[Unified Search] 📦 Starting GitHub search...');

        // Check query cache
        const queryCacheKey = `github|${description}|${appType}|${minStars}`;
        let githubQuery: any = queryOptimizerCache.get(queryCacheKey);

        if (!githubQuery) {
          githubQuery = optimizeGitHubQuery(description, appType, {
            minStars,
            language: 'typescript',
            includeTopics: true
          });
          queryOptimizerCache.set(queryCacheKey, githubQuery);
        }

        result.githubQuery = githubQuery.query;
        result.githubStrategy = githubQuery.strategy;

        console.log(`[Unified Search] 🎯 GitHub query: ${githubQuery.query}`);

        let rawResult = await mcpManager.callTool('github', 'search_repositories', {
          query: githubQuery.query
        });

        // RETRY LOGIC: If 0 results, try broader query
        if (rawResult && extractGitHubData(rawResult, { description, appType, brandName: brandInfo.primaryBrand }).length === 0) {
          console.log('[Unified Search] 🔄 Got 0 results, trying broader query...');

          // Fallback 1: Lower star threshold
          const fallbackQuery1 = optimizeGitHubQuery(description, appType, {
            minStars: 10,
            language: 'typescript',
            includeTopics: true
          });

          console.log(`[Unified Search] 🎯 Fallback query 1: ${fallbackQuery1.query}`);
          rawResult = await mcpManager.callTool('github', 'search_repositories', {
            query: fallbackQuery1.query
          });

          // Fallback 2: Remove language filter if still 0 results
          if (rawResult && extractGitHubData(rawResult, { description, appType, brandName: brandInfo.primaryBrand }).length === 0) {
            console.log('[Unified Search] 🔄 Still 0 results, trying without language filter...');
            const fallbackQuery2 = optimizeGitHubQuery(description, appType, {
              minStars: 5,
              language: '',
              includeTopics: false
            });

            console.log(`[Unified Search] 🎯 Fallback query 2: ${fallbackQuery2.query}`);
            rawResult = await mcpManager.callTool('github', 'search_repositories', {
              query: fallbackQuery2.query
            });
          }
        }

        if (rawResult) {
          const repositories = extractGitHubData(rawResult, {
            description,
            appType,
            brandName: brandInfo.primaryBrand
          });

          result.repositories = repositories.slice(0, maxResults);
          console.log(`[Unified Search] ✅ Found ${result.repositories.length} GitHub repos`);
        }
      } catch (error: any) {
        console.warn('[Unified Search] ⚠️  GitHub search failed:', error.message);
      }
    })(),

    // Web Search
    (async () => {
      try {
        console.log('[Unified Search] 🌐 Starting web search...');

        // Check query cache
        const queryCacheKey = `web|${description}|${appType}|${focusOn}`;
        let webQuery: any = queryOptimizerCache.get(queryCacheKey);

        if (!webQuery) {
          webQuery = optimizeWebQuery(description, appType, {
            includeYear: true,
            focusOn: focusOn as any
          });
          queryOptimizerCache.set(queryCacheKey, webQuery);
        }

        result.webQuery = webQuery.query;
        result.webStrategy = webQuery.strategy;

        console.log(`[Unified Search] 🎯 Web query: ${webQuery.query}`);

        let rawWebResults: any = null;

        // Try DuckDuckGo first (free, no API key required)
        // Note: DuckDuckGo works best with simple queries (2-4 words)
        try {
          console.log('[Unified Search] 🦆 Trying DuckDuckGo Search...');

          // Simplify query for DuckDuckGo (it works better with shorter queries)
          const simpleQuery = webQuery.query
            .split(' ')
            .filter((word: string) => !['2024', '2025', 'app', 'library'].includes(word))
            .slice(0, 5)
            .join(' ');

          console.log(`[Unified Search] 🦆 Simplified query: "${simpleQuery}"`);

          const duckResults = await searchDuckDuckGo(simpleQuery, { maxResults: 10 });

          if (duckResults && duckResults.length > 0) {
            rawWebResults = duckResults.map(r => ({
              title: r.title,
              description: r.body,
              snippet: r.body,
              url: r.href
            }));
            result.webProvider = 'duckduckgo';
            console.log(`[Unified Search] ✅ DuckDuckGo succeeded with ${duckResults.length} results`);
          } else {
            console.log('[Unified Search] ⚠️  DuckDuckGo returned 0 results, trying Exa...');
          }
        } catch (duckError) {
          console.log('[Unified Search] ⚠️  DuckDuckGo failed, trying Exa...');
        }

        // Try Exa if DuckDuckGo failed or returned no results
        if (!rawWebResults || rawWebResults.length === 0) {
          try {
            console.log('[Unified Search] 🔍 Trying Exa Search...');
            const exaResult = await mcpManager.callTool('exa', 'web_search_exa', {
              query: webQuery.query,
              numResults: 10,
              type: 'auto'
            });

            console.log('[Unified Search] 🔍 Exa raw result:', JSON.stringify(exaResult).substring(0, 200));

            if (exaResult && exaResult.content && Array.isArray(exaResult.content)) {
              // Extract results from MCP response format
              const exaContent = exaResult.content[0];
              if (exaContent && exaContent.text) {
                try {
                  const parsed = JSON.parse(exaContent.text);
                  if (parsed.results && Array.isArray(parsed.results)) {
                    rawWebResults = parsed.results.map((r: any) => ({
                      title: r.title || '',
                      description: r.text || r.snippet || r.summary || '',
                      snippet: r.text || r.snippet || r.summary || '',
                      url: r.url || ''
                    }));
                    result.webProvider = 'exa';
                    console.log(`[Unified Search] ✅ Exa succeeded with ${rawWebResults.length} results`);
                  }
                } catch (parseError) {
                  console.log('[Unified Search] ⚠️  Failed to parse Exa results:', parseError);
                }
              }
            }
          } catch (exaError: any) {
            console.log('[Unified Search] ⚠️  Exa also failed:', exaError.message);
          }
        }

        // Last resort: Try Brave if available
        if ((!rawWebResults || rawWebResults.length === 0) && process.env.BRAVE_API_KEY) {
          try {
            console.log('[Unified Search] 🔍 Trying Brave Search...');
            const braveResult = await mcpManager.callTool('brave', 'brave_web_search', {
              query: webQuery.query,
              count: 10
            });

            console.log('[Unified Search] 🔍 Brave raw result:', JSON.stringify(braveResult).substring(0, 200));

            if (braveResult && braveResult.content && Array.isArray(braveResult.content)) {
              const braveContent = braveResult.content[0];
              if (braveContent && braveContent.text) {
                try {
                  const parsed = JSON.parse(braveContent.text);

                  // Brave returns results in web.results array
                  if (parsed.web && parsed.web.results && Array.isArray(parsed.web.results)) {
                    rawWebResults = parsed.web.results.map((r: any) => ({
                      title: r.title || '',
                      description: r.description || '',
                      snippet: r.description || '',
                      url: r.url || ''
                    }));
                    result.webProvider = 'brave';
                    console.log(`[Unified Search] ✅ Brave succeeded with ${rawWebResults.length} results`);
                  } else {
                    console.log('[Unified Search] ⚠️  Brave result format unexpected:', Object.keys(parsed));
                  }
                } catch (parseError: any) {
                  console.log('[Unified Search] ⚠️  Failed to parse Brave results:', parseError.message);
                  console.log('[Unified Search] Raw Brave text:', braveContent.text.substring(0, 300));
                }
              }
            }
          } catch (braveError: any) {
            console.log('[Unified Search] ⚠️  Brave also failed:', braveError.message);
          }
        }

        if (!rawWebResults || rawWebResults.length === 0) {
          console.log('[Unified Search] ❌ All web search providers failed or returned 0 results');
          result.webProvider = 'none';
        }

        if (rawWebResults && rawWebResults.length > 0) {
          const webResults = extractWebData(rawWebResults, {
            description,
            appType,
            brandName: brandInfo.primaryBrand
          });

          result.webResults = webResults.slice(0, maxResults);
          console.log(`[Unified Search] ✅ Found ${result.webResults.length} web results`);
        }
      } catch (error: any) {
        console.warn('[Unified Search] ⚠️  Web search failed:', error.message);
      }
    })()
  ]);

  // Aggregate data if we have results
  if (result.repositories || result.webResults) {
    result.aggregated = aggregateExtractedData(
      result.repositories || [],
      result.webResults || [],
      brandInfo.primaryBrand
    );

    console.log('[Unified Search] 📊 Aggregated data:');
    console.log(`  - Total sources: ${result.aggregated.totalSources}`);
    console.log(`  - Top tech: ${result.aggregated.topTechStack.slice(0, 3).join(', ')}`);
    console.log(`  - Avg quality: ${result.aggregated.averageQuality}/100`);
  }
}

/**
 * Format unified search results for AI prompt
 *
 * @param result - Unified search result
 * @param description - Original user description
 * @returns Formatted prompt string (empty if no results)
 */
export function formatUnifiedSearchForAI(
  result: UnifiedSearchResult,
  description: string = ''
): string {
  if (!result.success || !result.aggregated) {
    return '';
  }

  const { aggregated, brandInfo, repositories, webResults } = result;
  const isBrandClone = brandInfo?.isClone || false;

  let prompt = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  prompt += '🔍 RESEARCH CONTEXT (MCP-Powered Unified Search)\n';
  prompt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  // Brand detection
  if (brandInfo && brandInfo.detected.length > 0) {
    prompt += '🏢 BRAND DETECTION:\n';
    prompt += `   • Detected: ${brandInfo.detected.join(', ')}\n`;
    prompt += `   • Primary: ${brandInfo.primary || 'N/A'}\n`;
    prompt += `   • Clone Request: ${isBrandClone ? '✅ YES' : '❌ NO'}\n\n`;

    if (isBrandClone) {
      prompt += '⚠️  CRITICAL: This is a BRAND CLONE request!\n';
      prompt += 'You MUST study the resources below and replicate the design patterns.\n\n';
    }
  }

  // Aggregated insights
  prompt += '📊 AGGREGATED INSIGHTS:\n';
  prompt += `   • Total Sources Analyzed: ${aggregated.totalSources}\n`;
  prompt += `   • Average Quality Score: ${aggregated.averageQuality}/100\n`;
  prompt += `   • Official Documentation: ${aggregated.hasOfficialSources ? '✅ Found' : '❌ Not Found'}\n\n`;

  // Tech stack
  if (aggregated.topTechStack.length > 0) {
    prompt += '💻 RECOMMENDED TECH STACK:\n';
    aggregated.topTechStack.slice(0, 5).forEach((tech, i) => {
      prompt += `   ${i + 1}. ${tech}\n`;
    });
    prompt += '\n';
  }

  // Design patterns
  if (aggregated.topDesignPatterns.length > 0) {
    prompt += '🎨 TOP DESIGN PATTERNS:\n';
    aggregated.topDesignPatterns.slice(0, 8).forEach((pattern, i) => {
      prompt += `   ${i + 1}. ${pattern}\n`;
    });
    prompt += '\n';
  }

  // Essential components
  if (aggregated.topComponents.length > 0) {
    prompt += '🧩 ESSENTIAL COMPONENTS:\n';
    aggregated.topComponents.slice(0, 8).forEach((component, i) => {
      prompt += `   ${i + 1}. ${component}\n`;
    });
    prompt += '\n';
  }

  // Color schemes (for brand clones)
  if (isBrandClone && aggregated.colorSchemes.length > 0) {
    prompt += '🎨 BRAND COLOR SCHEME:\n';
    prompt += `   ${aggregated.colorSchemes[0].join(', ')}\n\n`;
  }

  // Top repositories
  if (repositories && repositories.length > 0) {
    prompt += '📦 TOP GITHUB REPOSITORIES:\n\n';
    repositories.slice(0, 3).forEach((repo, i) => {
      prompt += `${i + 1}. ${repo.fullName} (⭐ ${repo.stars})\n`;
      prompt += `   ${repo.description}\n`;
      prompt += `   Tech: ${repo.techStack.slice(0, 4).join(', ')}\n`;
      prompt += `   Quality: ${repo.qualityScore}/100 | Relevance: ${repo.relevanceScore}/100\n\n`;
    });
  }

  // Top web results
  if (webResults && webResults.length > 0) {
    prompt += '🌐 WEB RESOURCES:\n\n';
    webResults.slice(0, 3).forEach((result, i) => {
      prompt += `${i + 1}. ${result.title} ${result.isOfficial ? '⭐ OFFICIAL' : ''}\n`;
      prompt += `   ${result.description.substring(0, 120)}...\n`;
      prompt += `   Type: ${result.isTutorial ? 'Tutorial' : result.isDocumentation ? 'Documentation' : 'Article'}\n\n`;
    });
  }

  prompt += '✅ ACTION ITEMS:\n';
  if (isBrandClone && brandInfo?.primary) {
    prompt += `   1. Study the ${brandInfo.primary} resources above\n`;
    prompt += `   2. Replicate their design language and components\n`;
    prompt += `   3. Use the recommended tech stack: ${aggregated.topTechStack.slice(0, 3).join(', ')}\n`;
    prompt += `   4. Match the color scheme and branding\n`;
  } else {
    prompt += `   1. Use recommended tech stack: ${aggregated.topTechStack.slice(0, 3).join(', ')}\n`;
    prompt += `   2. Implement top design patterns from research\n`;
    prompt += `   3. Include essential components identified above\n`;
    prompt += `   4. Follow modern web standards and best practices\n`;
  }

  prompt += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  return prompt;
}

/**
 * Clear all search caches
 */
export function clearSearchCache() {
  searchCache.clear();
  queryOptimizerCache.clear();
  console.log('[Unified Search] Cleared all caches');
}

/**
 * Get search cache statistics
 */
export function getSearchCacheStats() {
  return {
    searchCache: searchCache.getStats(),
    queryCache: queryOptimizerCache.getStats()
  };
}
