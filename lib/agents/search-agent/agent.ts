/**
 * SEARCH AGENT - MAIN AGENT CLASS
 *
 * LangChain ReAct agent for intelligent search and retrieval
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { v4 as uuidv4 } from 'uuid';
import { getAnalyticsTracker } from './cache/analytics';
import { getQuotaManager } from './cache/quota-manager';
import { getSearchCache } from './cache/search-cache';
import { analyzeIntent, generateSearchQueries } from './intent-analyzer';
import {
  logAnalytics,
  logCacheStatus,
  logIntentDetection,
  logQuotaCheck,
  logSearchResults,
  logSearchStart,
  logSearchStrategy,
  SearchProgress,
} from './logger';
import { getCodeVectorStore } from './rag/vector-store';
import { createToolRegistry } from './tools';
// FIXME: AgentExecutor removed from @langchain/langgraph/prebuilt in newer versions
// Need to update to use new LangGraph agent architecture
// import { AgentExecutor, createReactAgent } from "@langchain/langgraph/prebuilt";
// import { pull } from "langchain/hub";
import type { SearchAgentConfig, SearchContext, SearchIntent, SearchResult } from './types';

/**
 * Main Search Agent class
 */
export class SearchAgent {
  private agent: any | null = null; // FIXME: Update type when AgentExecutor is fixed
  private llm: ChatAnthropic;
  private config: SearchAgentConfig;
  private cache = getSearchCache();
  private quotaManager = getQuotaManager();
  private analytics = getAnalyticsTracker();
  private vectorStore = getCodeVectorStore();

  constructor(config: SearchAgentConfig) {
    this.config = config;

    // Initialize LLM
    this.llm = new ChatAnthropic({
      model: config.llmModel || 'claude-3-5-sonnet-20241022',
      temperature: config.llmTemperature || 0,
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log('[SearchAgent] Initialized with config:', {
      orgId: config.orgId,
      llmModel: config.llmModel,
      cacheEnabled: config.cacheEnabled,
    });
  }

  /**
   * Initialize tools (no ReAct agent needed)
   */
  private async initializeAgent(): Promise<void> {
    if (this.agent) return;

    try {
      // Create tools registry
      const tools = createToolRegistry(this.config);

      // Store tools for direct orchestration (no ReAct agent)
      this.agent = { tools };

      console.log('[SearchAgent] ✅ Tools initialized:', tools.length, 'tools available');
      console.log('[SearchAgent] Using simple orchestrator (no ReAct)');
    } catch (error) {
      console.error('[SearchAgent] Failed to initialize tools:', error);
      throw error;
    }
  }

  /**
   * Main search method
   */
  async search(query: string, context?: SearchContext): Promise<SearchResult> {
    const searchId = uuidv4();
    const startTime = Date.now();
    const orgId = this.config.orgId;

    // Log search start
    logSearchStart('Search Agent', query, {
      orgId,
      projectId: context?.userId,
      appType: context?.appType,
      features: context?.features,
    });

    try {
      // Check quota
      const usage = await this.quotaManager.getUsage(orgId, 'search');
      const limit = await this.quotaManager.getLimit(orgId, 'search');
      const quotaAllowed = await this.quotaManager.checkQuota(orgId, 'search');

      logQuotaCheck(orgId, quotaAllowed, usage, limit);

      if (!quotaAllowed) {
        throw new Error('Search quota exceeded for organization');
      }

      // Check cache
      if (this.config.cacheEnabled) {
        const cached = await this.cache.get(query, orgId);
        if (cached) {
          logCacheStatus(true, query, orgId);
          return {
            ...cached,
            metadata: {
              ...cached.metadata,
              cacheHit: true,
            },
          };
        }
        logCacheStatus(false, query, orgId);
      }

      // Analyze intent
      const progress = new SearchProgress('Analyzing search intent');
      const intent = await analyzeIntent(query, context);
      progress.complete(
        `Detected: ${intent.category} (${(intent.confidence * 100).toFixed(0)}% confidence)`
      );

      logIntentDetection(intent);

      // Generate search queries
      intent.queries = generateSearchQueries(intent, query);
      logSearchStrategy(intent);

      // Initialize tools
      const initProgress = new SearchProgress('Initializing search tools');
      await this.initializeAgent();
      if (!this.agent) {
        throw new Error('Failed to initialize search tools');
      }
      initProgress.complete('Tools ready for orchestration');

      // Execute search using simple orchestrator (no ReAct)
      const searchProgress = new SearchProgress('Executing search across all sources');
      const searchResults = await this.executeSearch(intent, query, context);
      searchProgress.complete('Search completed');

      // Format result
      const formatProgress = new SearchProgress('Formatting results');
      const result = await this.formatSearchResult(
        searchResults,
        intent,
        searchId,
        orgId,
        startTime,
        context
      );
      formatProgress.complete();

      // Log comprehensive results
      logSearchResults(result);

      // Cache result
      if (this.config.cacheEnabled) {
        await this.cache.set(query, orgId, result);
        console.log('💾 Results cached for future searches');
      }

      // Track quota
      await this.quotaManager.trackUsage(orgId, 'search');

      // Track analytics
      await this.analytics.track({
        searchId,
        orgId,
        userId: this.config.userId,
        query,
        intent: intent.category,
        duration: result.metadata.duration,
        success: result.success,
        toolsUsed: result.metadata.toolsUsed,
        toolDurations: {},
        toolErrors: {},
        resultsCount: {
          repositories: result.repositories?.length || 0,
          codeFiles: result.code?.length || 0,
          webResults: result.webResults?.length || 0,
          brandGuidelines: result.brandGuidelines?.length || 0,
        },
        cacheHit: false,
        tokensUsed: result.metadata.tokensUsed,
        timestamp: new Date(),
      });

      logAnalytics(searchId, orgId);

      return result;
    } catch (error: any) {
      console.error(`[SearchAgent] Search ${searchId} failed:`, error);

      const duration = Date.now() - startTime;

      // Track failed search
      await this.analytics.track({
        searchId,
        orgId,
        query,
        intent: 'general-knowledge',
        duration,
        success: false,
        toolsUsed: [],
        toolDurations: {},
        toolErrors: { agent: error.message },
        resultsCount: {
          repositories: 0,
          codeFiles: 0,
          webResults: 0,
          brandGuidelines: 0,
        },
        cacheHit: false,
        tokensUsed: 0,
        timestamp: new Date(),
      });

      return {
        success: false,
        intent: {
          category: 'general-knowledge',
          searchSources: [],
          requiresScreenshot: false,
          requiresCodeExtraction: false,
          requiresBrandScraping: false,
          requiresCloneAnalysis: false,
          confidence: 0,
          priority: 'low',
        },
        metadata: {
          searchId,
          orgId,
          timestamp: new Date(),
          duration,
          toolsUsed: [],
          cacheHit: false,
          tokensUsed: 0,
        },
        errors: [
          {
            tool: 'agent',
            error: error.message || 'Search failed',
            recoverable: false,
          },
        ],
      };
    }
  }

  /**
   * Execute search based on intent using direct tool orchestration
   * Replaces ReAct agent with simple conditional logic
   */
  private async executeSearch(
    intent: SearchIntent,
    query: string,
    context?: SearchContext
  ): Promise<any> {
    const tools = this.agent.tools;
    const results: any = {
      toolsUsed: [],
      repositories: [],
      webResults: [],
      brandGuidelines: [],
      code: [],
      errors: [],
    };

    console.log(`[SearchAgent] 🎯 Executing search for category: ${intent.category}`);

    try {
      // Route based on intent category
      switch (intent.category) {
        case 'design-inspiration':
          await this.executeDesignSearch(tools, intent, query, results);
          break;

        case 'code-search':
          await this.executeCodeSearch(tools, intent, query, results);
          break;

        case 'brand-clone':
          await this.executeBrandClone(tools, intent, query, results);
          break;

        case 'api-documentation':
          await this.executeApiDocSearch(tools, intent, query, results);
          break;

        case 'tutorial-search':
        case 'library-comparison':
        case 'general-knowledge':
        default:
          await this.executeGeneralSearch(tools, intent, query, results);
          break;
      }
    } catch (error: any) {
      console.error('[SearchAgent] Search execution error:', error);
      results.errors.push({
        tool: 'orchestrator',
        error: error.message,
        recoverable: true,
      });
    }

    return results;
  }

  /**
   * Execute design inspiration search (for PM node)
   */
  private async executeDesignSearch(
    tools: any[],
    intent: SearchIntent,
    query: string,
    results: any
  ): Promise<void> {
    console.log('[SearchAgent] 🎨 Executing design inspiration search...');

    // Use Exa for design-focused content
    const exaTool = tools.find((t) => t.name === 'exa_search');
    if (exaTool && intent.searchSources.includes('exa')) {
      try {
        const exaQuery = `${query} design system CSS color palette typography`;
        const exaResult = await exaTool.func({ query: exaQuery, numResults: 5 });
        const parsed = JSON.parse(exaResult);

        if (parsed.success && parsed.results) {
          results.webResults.push(...parsed.results);
          results.toolsUsed.push('exa_search');
          console.log(`[SearchAgent] ✅ Exa found ${parsed.results.length} design resources`);
        }
      } catch (error: any) {
        console.warn('[SearchAgent] Exa search failed:', error.message);
        results.errors.push({ tool: 'exa_search', error: error.message, recoverable: true });
      }
    }

    // Use Brand Scraper if brands mentioned
    if (intent.requiresBrandScraping && intent.brandMentions && intent.brandMentions.length > 0) {
      const scraperTool = tools.find((t) => t.name === 'brand_scraper');
      if (scraperTool) {
        try {
          const brandUrl = `https://${intent.brandMentions[0]}.com`;
          const scraperResult = await scraperTool.func({ url: brandUrl });
          const parsed = JSON.parse(scraperResult);

          if (parsed.success) {
            results.brandGuidelines.push(parsed);
            results.toolsUsed.push('brand_scraper');
            console.log(
              `[SearchAgent] ✅ Scraped brand guidelines from ${intent.brandMentions[0]}`
            );
          }
        } catch (error: any) {
          console.warn('[SearchAgent] Brand scraper failed:', error.message);
          results.errors.push({ tool: 'brand_scraper', error: error.message, recoverable: true });
        }
      }
    }
  }

  /**
   * Execute code search (for Editor node)
   */
  private async executeCodeSearch(
    tools: any[],
    intent: SearchIntent,
    query: string,
    results: any
  ): Promise<void> {
    console.log('[SearchAgent] 💻 Executing code search...');

    // GitHub search with progressive fallback
    const githubTool = tools.find((t) => t.name === 'github_search');
    if (githubTool && intent.searchSources.includes('github')) {
      const techStackStr = intent.techStack?.join(' ') || '';

      // Try specific query first
      const githubQuery = `${query} ${techStackStr}`.trim();
      let found = false;

      // Progressive fallback
      const queries = [
        githubQuery, // Full query with tech stack
        query, // Without tech stack
        query
          .split(' ')
          .slice(0, 2)
          .join(' '), // First 2 words only
      ];

      for (const q of queries) {
        try {
          const githubResult = await githubTool.func({ query: q, maxResults: 5 });
          const parsed = JSON.parse(githubResult);

          if (parsed.success && parsed.results && parsed.results.length > 0) {
            results.repositories.push(...parsed.results);
            results.toolsUsed.push('github_search');
            console.log(`[SearchAgent] ✅ GitHub found ${parsed.results.length} repositories`);
            found = true;
            break;
          }
        } catch (error: any) {
          console.warn(`[SearchAgent] GitHub search failed for "${q}":`, error.message);
        }
      }

      if (!found) {
        results.errors.push({
          tool: 'github_search',
          error: 'No repositories found',
          recoverable: true,
        });
      }
    }

    // Extract code if requested
    if (intent.requiresCodeExtraction && results.repositories.length > 0) {
      const extractorTool = tools.find((t) => t.name === 'code_extractor');
      if (extractorTool) {
        try {
          const topRepo = results.repositories[0];
          const extractResult = await extractorTool.func({
            repoUrl: topRepo.url,
            filePattern: '**/*.{tsx,ts,jsx,js}',
            maxFiles: 3,
          });
          const parsed = JSON.parse(extractResult);

          if (parsed.success) {
            results.code.push(...parsed.files);
            results.toolsUsed.push('code_extractor');
            console.log(`[SearchAgent] ✅ Extracted ${parsed.files.length} code files`);
          }
        } catch (error: any) {
          console.warn('[SearchAgent] Code extraction failed:', error.message);
          results.errors.push({ tool: 'code_extractor', error: error.message, recoverable: true });
        }
      }
    }
  }

  /**
   * Execute brand cloning (for brand-like requests)
   */
  private async executeBrandClone(
    tools: any[],
    intent: SearchIntent,
    query: string,
    results: any
  ): Promise<void> {
    console.log('[SearchAgent] 🎯 Executing brand clone analysis...');

    if (intent.brandMentions && intent.brandMentions.length > 0) {
      const brandUrl = `https://${intent.brandMentions[0]}.com`;

      // Clone Analyzer
      if (intent.requiresCloneAnalysis) {
        const cloneTool = tools.find((t) => t.name === 'clone_analyzer');
        if (cloneTool) {
          try {
            const cloneResult = await cloneTool.func({ url: brandUrl });
            results.cloneAnalysis = JSON.parse(cloneResult);
            results.toolsUsed.push('clone_analyzer');
            console.log(`[SearchAgent] ✅ Analyzed ${intent.brandMentions[0]} structure`);
          } catch (error: any) {
            console.warn('[SearchAgent] Clone analyzer failed:', error.message);
            results.errors.push({
              tool: 'clone_analyzer',
              error: error.message,
              recoverable: true,
            });
          }
        }
      }

      // Brand Scraper
      if (intent.requiresBrandScraping) {
        const scraperTool = tools.find((t) => t.name === 'brand_scraper');
        if (scraperTool) {
          try {
            const scraperResult = await scraperTool.func({ url: brandUrl });
            const parsed = JSON.parse(scraperResult);
            if (parsed.success) {
              results.brandGuidelines.push(parsed);
              results.toolsUsed.push('brand_scraper');
              console.log(`[SearchAgent] ✅ Scraped ${intent.brandMentions[0]} brand guidelines`);
            }
          } catch (error: any) {
            console.warn('[SearchAgent] Brand scraper failed:', error.message);
            results.errors.push({ tool: 'brand_scraper', error: error.message, recoverable: true });
          }
        }
      }
    }
  }

  /**
   * Execute API documentation search
   */
  private async executeApiDocSearch(
    tools: any[],
    intent: SearchIntent,
    query: string,
    results: any
  ): Promise<void> {
    console.log('[SearchAgent] 📚 Executing API documentation search...');

    // Exa is best for documentation
    const exaTool = tools.find((t) => t.name === 'exa_search');
    if (exaTool) {
      try {
        const docQuery = `${query} official documentation API reference`;
        const exaResult = await exaTool.func({ query: docQuery, numResults: 3 });
        const parsed = JSON.parse(exaResult);

        if (parsed.success && parsed.results) {
          results.webResults.push(...parsed.results);
          results.toolsUsed.push('exa_search');
          console.log(
            `[SearchAgent] ✅ Exa found ${parsed.results.length} documentation resources`
          );
        }
      } catch (error: any) {
        console.warn('[SearchAgent] Exa search failed:', error.message);
        await this.executeGeneralSearch(tools, intent, query, results);
      }
    }
  }

  /**
   * Execute general web search (fallback chain)
   */
  private async executeGeneralSearch(
    tools: any[],
    intent: SearchIntent,
    query: string,
    results: any
  ): Promise<void> {
    console.log('[SearchAgent] 🌐 Executing general web search...');

    // Try Exa first
    if (intent.searchSources.includes('exa')) {
      const exaTool = tools.find((t) => t.name === 'exa_search');
      if (exaTool) {
        try {
          const exaResult = await exaTool.func({ query, numResults: 5 });
          const parsed = JSON.parse(exaResult);

          if (parsed.success && parsed.results && parsed.results.length > 0) {
            results.webResults.push(...parsed.results);
            results.toolsUsed.push('exa_search');
            console.log(`[SearchAgent] ✅ Exa found ${parsed.results.length} results`);
            return; // Success, no need for fallback
          }
        } catch (error: any) {
          console.warn('[SearchAgent] Exa failed, trying DuckDuckGo...', error.message);
        }
      }
    }

    // Fallback to DuckDuckGo
    if (intent.searchSources.includes('duckduckgo')) {
      const ddgTool = tools.find((t) => t.name === 'duckduckgo_search');
      if (ddgTool) {
        try {
          const ddgResult = await ddgTool.func({ query, maxResults: 5 });
          const parsed = JSON.parse(ddgResult);

          if (parsed.success && parsed.results && parsed.results.length > 0) {
            results.webResults.push(...parsed.results);
            results.toolsUsed.push('duckduckgo_search');
            console.log(`[SearchAgent] ✅ DuckDuckGo found ${parsed.results.length} results`);
            return;
          }
        } catch (error: any) {
          console.warn('[SearchAgent] DuckDuckGo failed, trying Brave...', error.message);
        }
      }
    }

    // Final fallback to Brave
    if (intent.searchSources.includes('brave')) {
      const braveTool = tools.find((t) => t.name === 'brave_search');
      if (braveTool) {
        try {
          const braveResult = await braveTool.func({ query, count: 5 });
          const parsed = JSON.parse(braveResult);

          if (parsed.success && parsed.results) {
            results.webResults.push(...parsed.results);
            results.toolsUsed.push('brave_search');
            console.log(`[SearchAgent] ✅ Brave found ${parsed.results.length} results`);
          }
        } catch (error: any) {
          console.warn('[SearchAgent] Brave search failed:', error.message);
          results.errors.push({ tool: 'brave_search', error: error.message, recoverable: false });
        }
      }
    }
  }

  /**
   * Build task for agent (DEPRECATED - kept for backward compatibility)
   */
  private buildAgentTask(intent: SearchIntent, query: string, context?: SearchContext): string {
    let task = `You are a search and retrieval agent. Your task is to find relevant information based on this query:\n\n`;
    task += `QUERY: "${query}"\n\n`;
    task += `INTENT: ${intent.category}\n`;

    if (intent.techStack && intent.techStack.length > 0) {
      task += `TECH STACK: ${intent.techStack.join(', ')}\n`;
    }

    if (intent.features && intent.features.length > 0) {
      task += `FEATURES: ${intent.features.join(', ')}\n`;
    }

    if (intent.brandMentions && intent.brandMentions.length > 0) {
      task += `BRANDS: ${intent.brandMentions.join(', ')}\n`;
    }

    task += `\nSTRATEGY:\n`;

    // Hierarchical search strategy
    if (intent.searchSources.includes('exa')) {
      task += `1. Try exa_search first (most accurate for technical content)\n`;
    }

    if (intent.searchSources.includes('github')) {
      task += `2. Use github_search to find repositories\n`;
      if (intent.requiresCodeExtraction) {
        task += `3. Use code_extractor to get actual code files from top repos\n`;
      }
    }

    if (intent.searchSources.includes('duckduckgo')) {
      task += `4. If exa fails, fallback to duckduckgo_search\n`;
    }

    if (intent.searchSources.includes('brave')) {
      task += `5. If both fail, use brave_search as final fallback\n`;
    }

    if (intent.requiresBrandScraping) {
      task += `6. Use brand_scraper to extract brand guidelines\n`;
    }

    if (intent.requiresCloneAnalysis) {
      task += `7. Use clone_analyzer to analyze website structure\n`;
    }

    task += `\nReturn as much relevant information as possible. If one tool fails, try alternatives.`;

    return task;
  }

  /**
   * Format search results with caller-specific filtering
   */
  private async formatSearchResult(
    searchResults: any,
    intent: SearchIntent,
    searchId: string,
    orgId: string,
    startTime: number,
    context?: SearchContext
  ): Promise<SearchResult> {
    const duration = Date.now() - startTime;

    const result: SearchResult = {
      success:
        searchResults.repositories?.length > 0 ||
        searchResults.webResults?.length > 0 ||
        searchResults.brandGuidelines?.length > 0,
      intent,
      metadata: {
        searchId,
        orgId,
        timestamp: new Date(),
        duration,
        toolsUsed: searchResults.toolsUsed || [],
        cacheHit: false,
        tokensUsed: 0,
      },
    };

    // Filter results based on caller (if provided in context)
    const caller = context?.caller || 'general';

    if (caller === 'pm-node' || intent.category === 'design-inspiration') {
      // PM Node: ONLY design data (NO code, NO full repos)
      result.brandGuidelines = searchResults.brandGuidelines;
      result.webResults = searchResults.webResults; // Design inspiration articles
      result.designTokens = searchResults.designTokens;

      // NO repositories for PM node (they need design, not code)
      console.log('[SearchAgent] ✅ Filtered results for PM node (design only)');
    } else if (caller === 'editor-node' || intent.category === 'code-search') {
      // Editor Node: ONLY code data (NO design, NO brand guidelines)
      result.code = searchResults.code;
      result.repositories = searchResults.repositories?.slice(0, 3); // Top 3 repos only
      result.webResults = searchResults.webResults?.filter(
        (r: any) => r.url?.includes('github.com') || r.url?.includes('stackoverflow.com')
      );

      // NO brand guidelines or design tokens for Editor
      console.log('[SearchAgent] ✅ Filtered results for Editor node (code only)');
    } else if (caller === 'context-analyzer' || intent.category === 'brand-clone') {
      // Context Analyzer: Full brand data for cloning
      result.cloneAnalysis = searchResults.cloneAnalysis;
      result.brandGuidelines = searchResults.brandGuidelines;
      result.repositories = searchResults.repositories;

      console.log('[SearchAgent] ✅ Filtered results for Context Analyzer (brand clone)');
    } else {
      // General: Return all results
      result.repositories = searchResults.repositories;
      result.code = searchResults.code;
      result.webResults = searchResults.webResults;
      result.brandGuidelines = searchResults.brandGuidelines;
      result.cloneAnalysis = searchResults.cloneAnalysis;
      result.designTokens = searchResults.designTokens;

      console.log('[SearchAgent] ✅ Returning all results (general search)');
    }

    // Add errors if any
    if (searchResults.errors && searchResults.errors.length > 0) {
      result.errors = searchResults.errors;
    }

    return result;
  }
}
