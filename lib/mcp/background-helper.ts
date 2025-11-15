/**
 * Background MCP Helper - Silently enriches AI context
 *
 * This runs BEFORE AI generation to gather helpful references,
 * but NEVER blocks or shows errors to users.
 *
 * Enhanced with:
 * - Smart query optimization
 * - Brand recognition
 * - Advanced data extraction
 * - Structured context passing
 */

import { getMCPManager } from './client';
import {
  aggregateExtractedData,
  type ExtractedContext,
  type ExtractedRepository,
  type ExtractedWebResult,
  extractGitHubData,
  extractWebData,
} from './data-extractor';
import { BrandName, detectBrands, optimizeGitHubQuery, optimizeWebQuery } from './query-optimizer';

export interface BackgroundContext {
  // Legacy format (for backward compatibility)
  githubExamples?: string[];
  webInsights?: string[];
  designPatterns?: string[];
  technicalNotes?: string[];
  hasReferences: boolean;

  // Enhanced structured data
  structured?: {
    repositories: ExtractedRepository[];
    webResults: ExtractedWebResult[];
    aggregated: ExtractedContext;
    queries: {
      github: { query: string; explanation: string; strategy: string };
      web: { query: string; explanation: string; strategy: string };
    };
    // COMMENTED OUT: BrandInfo dataset disabled
    // brandInfo?: {
    //   detected: BrandName[];
    //   primary?: BrandName;
    //   isClone: boolean;
    // };
  };
}

/**
 * Silently search for helpful examples
 * - Runs in background with timeout
 * - Never throws errors
 * - Returns empty object if nothing found
 */
export async function gatherBackgroundContext(
  description: string,
  appType: string = 'app',
  options: {
    timeout?: number;
    minStars?: number;
  } = {}
): Promise<BackgroundContext> {
  const timeout = options.timeout || 3000; // 3 seconds max
  const minStars = options.minStars || 20; // Lowered from 1000

  const context: BackgroundContext = {
    githubExamples: [],
    webInsights: [],
    designPatterns: [],
    technicalNotes: [],
    hasReferences: false,
  };

  console.log('[Background MCP] Gathering context silently...');

  try {
    // Run searches in parallel with timeout
    await Promise.race([
      gatherAllReferences(description, appType, minStars, context),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout)),
    ]);
  } catch (error: any) {
    // Silently fail - this is OK!
    console.log('[Background MCP] Timeout or error (this is OK):', error.message);
  }

  console.log(`[Background MCP] Found references: ${context.hasReferences}`);
  return context;
}

async function gatherAllReferences(
  description: string,
  appType: string,
  minStars: number,
  context: BackgroundContext
): Promise<void> {
  const mcpManager = getMCPManager();

  // COMMENTED OUT: Smart brand detection
  // const brandInfo = detectBrands(description);
  // console.log(`[Background MCP] 🔍 Brand Detection:`, {
  //   detected: brandInfo.brands,
  //   primary: brandInfo.primaryBrand,
  //   isClone: brandInfo.isClone,
  // });
  const brandInfo = { brands: [], primaryBrand: undefined, isClone: false }; // Disabled for workflow optimization

  let githubQuery: ReturnType<typeof optimizeGitHubQuery> | undefined;
  let webQuery: ReturnType<typeof optimizeWebQuery> | undefined;
  let extractedRepos: ExtractedRepository[] = [];
  let extractedWeb: ExtractedWebResult[] = [];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📦 GITHUB SEARCH - Optimized query generation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  try {
    console.log('[Background MCP] 📦 Optimizing GitHub query...');

    githubQuery = optimizeGitHubQuery(description, appType, {
      minStars,
      language: 'typescript',
      includeTopics: true,
    });

    console.log(`[Background MCP] 🎯 GitHub Strategy: ${githubQuery.strategy}`);
    console.log(`[Background MCP] 🔎 Query: ${githubQuery.query}`);
    console.log(`[Background MCP] 💡 ${githubQuery.explanation}`);

    const result = await mcpManager.callTool('github', 'search_repositories', {
      query: githubQuery.query,
    });

    if (result && typeof result === 'object') {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🎯 ENHANCED: Extract structured data from results
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      extractedRepos = extractGitHubData(result, {
        description,
        appType,
        brandName: brandInfo.primaryBrand,
      });

      // Legacy format for backward compatibility
      if (extractedRepos.length > 0) {
        context.githubExamples = extractedRepos.map(
          (repo) =>
            `${repo.fullName} (${repo.stars} ⭐) - ${repo.description}\n` +
            `  Tech: ${repo.techStack.slice(0, 3).join(', ')}\n` +
            `  Patterns: ${repo.designPatterns.slice(0, 3).join(', ')}\n` +
            `  Quality: ${repo.qualityScore}/100 | Relevance: ${repo.relevanceScore}/100`
        );
        context.hasReferences = true;
        console.log(`[Background MCP] ✅ Found ${extractedRepos.length} high-quality GitHub repos`);
      }
    }
  } catch (error) {
    console.log('[Background MCP] ⚠️ GitHub search failed (OK)');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🌐 WEB SEARCH - Optimized query generation with fallbacks
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  try {
    console.log('[Background MCP] 🌐 Optimizing web query...');

    // Generate optimized queries for different focuses
    const designQuery = optimizeWebQuery(description, appType, {
      includeYear: true,
      focusOn: 'design',
    });

    const codeQuery = optimizeWebQuery(description, appType, {
      includeYear: true,
      focusOn: 'code',
    });

    // Use design query as primary (best for UI/UX insights)
    webQuery = designQuery;

    console.log(`[Background MCP] 🎯 Web Strategy: ${webQuery.strategy}`);
    console.log(`[Background MCP] 🔎 Design Query: ${webQuery.query}`);
    console.log(`[Background MCP] 💡 ${webQuery.explanation}`);

    let rawWebResults: any = null;
    let searchSource = '';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Try Brave first (primary - best quality)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      console.log('[Background MCP] 🔵 Trying Brave Search (primary)...');
      const result = await mcpManager.callTool('brave', 'brave_web_search', {
        query: webQuery.query,
        count: 10, // Request more results for better extraction
      });
      rawWebResults = result;
      searchSource = 'Brave Search';
      console.log(`[Background MCP] ✅ Brave found results`);
    } catch (braveError) {
      console.log('[Background MCP] ⚠️ Brave failed, trying DuckDuckGo...');

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Try DuckDuckGo (free fallback - no API key needed)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      try {
        const { searchDuckDuckGo } = await import('./duckduckgo');
        const duckResults = await searchDuckDuckGo(webQuery.query, { maxResults: 10 });
        rawWebResults = duckResults.map((r) => ({
          title: r.title,
          description: r.body,
          snippet: r.body,
          url: r.href,
        }));
        searchSource = 'DuckDuckGo';
        console.log(`[Background MCP] ✅ DuckDuckGo found ${duckResults.length} results`);
      } catch (duckError) {
        console.log('[Background MCP] ⚠️ DuckDuckGo failed, trying Exa...');

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Try Exa (last fallback - alternative search API)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        try {
          const result = await mcpManager.callTool('exa', 'search', {
            query: webQuery.query,
            num_results: 10,
          });
          rawWebResults = result;
          searchSource = 'Exa Search';
          console.log(`[Background MCP] ✅ Exa found results`);
        } catch (exaError) {
          console.log('[Background MCP] ❌ All web searches failed (OK)');
        }
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎯 ENHANCED: Extract structured data from web results
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (rawWebResults) {
      extractedWeb = extractWebData(rawWebResults, {
        description,
        appType,
        brandName: brandInfo.primaryBrand,
      });

      // Legacy format for backward compatibility
      if (extractedWeb.length > 0) {
        context.webInsights = extractedWeb.map(
          (result) =>
            `${result.title}\n` +
            `  ${result.description.substring(0, 150)}...\n` +
            `  Source: ${result.domain} ${result.isOfficial ? '⭐ OFFICIAL' : ''}\n` +
            `  Type: ${result.isTutorial ? 'Tutorial' : result.isDocumentation ? 'Docs' : 'Article'}\n` +
            `  Relevance: ${result.relevanceScore}/100`
        );
        context.hasReferences = true;
        console.log(
          `[Background MCP] ✅ Extracted ${extractedWeb.length} high-quality web results from ${searchSource}`
        );
      }
    }
  } catch (error) {
    console.log('[Background MCP] ⚠️ Web search failed (OK)');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 AGGREGATE DATA - Create structured context for AI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (extractedRepos.length > 0 || extractedWeb.length > 0) {
    const aggregated = aggregateExtractedData(extractedRepos, extractedWeb, brandInfo.primaryBrand);

    // Store structured data for advanced AI processing
    context.structured = {
      repositories: extractedRepos,
      webResults: extractedWeb,
      aggregated,
      queries: {
        github: githubQuery || { query: '', explanation: '', strategy: '' },
        web: webQuery || { query: '', explanation: '', strategy: '' },
      },
      // COMMENTED OUT: BrandInfo dataset disabled
      // brandInfo: brandInfo.brands.length > 0 ? {
      //   detected: brandInfo.brands,
      //   primary: brandInfo.primaryBrand,
      //   isClone: brandInfo.isClone,
      // } : undefined,
    };

    // Legacy design patterns (extracted from aggregated data)
    context.designPatterns = [
      ...aggregated.topDesignPatterns.slice(0, 5),
      ...aggregated.topComponents.slice(0, 3).map((c) => `Include ${c}`),
    ];

    // Legacy technical notes (enhanced with aggregated insights)
    context.technicalNotes = [
      `Recommended stack: ${aggregated.topTechStack.slice(0, 3).join(', ')}`,
      `Quality sources: ${aggregated.totalSources} (avg quality: ${aggregated.averageQuality}/100)`,
      aggregated.hasOfficialSources ? '✅ Official documentation found' : '',
      'Follow 2025 modern web standards',
      'Prioritize accessibility and performance',
    ].filter(Boolean);

    console.log(`[Background MCP] 📊 Aggregation Summary:`);
    console.log(`  - Total sources: ${aggregated.totalSources}`);
    console.log(`  - Top tech: ${aggregated.topTechStack.slice(0, 3).join(', ')}`);
    console.log(`  - Top patterns: ${aggregated.topDesignPatterns.slice(0, 3).join(', ')}`);
    console.log(`  - Official sources: ${aggregated.hasOfficialSources ? 'Yes' : 'No'}`);
    console.log(`  - Average quality: ${aggregated.averageQuality}/100`);
  }
}

/**
 * Format context for AI prompt
 * - If references found: Make them MANDATORY for brand mentions
 * - If no references: Don't mention it at all
 */
export function formatContextForAI(context: BackgroundContext, description: string = ''): string {
  if (!context.hasReferences) {
    // No references found - don't mention it!
    return '';
  }

  // Check if this is a brand clone/replication request
  const isBrandClone = /\b(clone|like|similar to|replica|copy|replicate)\b/i.test(description);
  const hasBrandMention =
    /\b(openai|chatgpt|claude|stripe|airbnb|uber|shopify|amazon|netflix|spotify|twitter|instagram|facebook|linkedin|github|notion|linear|figma|slack|discord)\b/i.test(
      description
    );

  let prompt = '\n\n━━━ REFERENCE CONTEXT ━━━\n';

  if (isBrandClone || hasBrandMention) {
    prompt += '⚠️ CRITICAL: User requested brand replication or mentioned specific company.\n';
    prompt += 'YOU MUST study and replicate the design patterns found below.\n';
    prompt += 'This is NOT optional - match the visual style, layout, and components.\n\n';
  } else {
    prompt += 'The following references were found and should inform your design choices:\n\n';
  }

  if (context.githubExamples && context.githubExamples.length > 0) {
    prompt += '**Similar Projects Found:**\n';
    context.githubExamples.forEach((ex) => {
      prompt += `- ${ex}\n`;
    });
    prompt += '\n';
    if (isBrandClone || hasBrandMention) {
      prompt += 'ACTION: Study these repositories and replicate their design patterns.\n\n';
    }
  }

  if (context.webInsights && context.webInsights.length > 0) {
    prompt += '**Industry Insights:**\n';
    context.webInsights.forEach((insight) => {
      prompt += `- ${insight}\n`;
    });
    prompt += '\n';
    if (isBrandClone || hasBrandMention) {
      prompt += 'ACTION: Use these insights to match industry standards for this brand.\n\n';
    }
  }

  if (context.designPatterns && context.designPatterns.length > 0) {
    prompt += '**Design Patterns to Apply:**\n';
    context.designPatterns.forEach((pattern) => {
      prompt += `- ${pattern}\n`;
    });
    prompt += '\n';
  }

  if (!isBrandClone && !hasBrandMention) {
    prompt +=
      "NOTE: Use these to inform your design, but prioritize user's specific requirements.\n";
  }

  prompt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  return prompt;
}

/**
 * Enhanced format with structured data
 */
export function formatEnhancedContextForAI(
  context: BackgroundContext,
  description: string = ''
): string {
  if (!context.hasReferences) {
    return '';
  }

  // COMMENTED OUT: BrandInfo dataset disabled
  const brandInfo = undefined; // context.structured?.brandInfo;
  const aggregated = context.structured?.aggregated;
  const isBrandClone = brandInfo?.isClone || false;
  const hasBrandMention = (brandInfo?.detected.length || 0) > 0;

  let prompt = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  prompt += '🎯 ENHANCED REFERENCE CONTEXT (MCP-Powered)\n';
  prompt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  if (brandInfo && hasBrandMention) {
    prompt += '🏢 BRAND DETECTION:\n';
    prompt += `   Detected: ${brandInfo.detected.join(', ')}\n`;
    prompt += `   Primary: ${brandInfo.primary || 'N/A'}\n`;
    prompt += `   Clone Request: ${isBrandClone ? '✅ YES' : '❌ NO'}\n\n`;

    if (isBrandClone) {
      prompt += '⚠️ CRITICAL INSTRUCTION:\n';
      prompt += 'This is a BRAND CLONE request. You MUST:\n';
      prompt += '1. Study the official design patterns below\n';
      prompt += '2. Replicate the visual style, layout, and components\n';
      prompt += '3. Match the color scheme and branding\n';
      prompt += '4. Include similar features and functionality\n';
      prompt += 'This is MANDATORY - not a suggestion!\n\n';
    }
  }

  if (aggregated) {
    prompt += '📊 DATA ANALYSIS:\n';
    prompt += `   Total Sources: ${aggregated.totalSources}\n`;
    prompt += `   Average Quality: ${aggregated.averageQuality}/100\n`;
    prompt += `   Official Sources: ${aggregated.hasOfficialSources ? '✅ Found' : '❌ Not Found'}\n\n`;

    if (aggregated.topTechStack.length > 0) {
      prompt += '💻 RECOMMENDED TECH STACK:\n';
      aggregated.topTechStack.slice(0, 5).forEach((tech, i) => {
        prompt += `   ${i + 1}. ${tech}\n`;
      });
      prompt += '\n';
    }

    if (aggregated.topDesignPatterns.length > 0) {
      prompt += '🎨 TOP DESIGN PATTERNS:\n';
      aggregated.topDesignPatterns.slice(0, 8).forEach((pattern, i) => {
        prompt += `   ${i + 1}. ${pattern}\n`;
      });
      prompt += '\n';
    }

    if (aggregated.topComponents.length > 0) {
      prompt += '🧩 ESSENTIAL COMPONENTS:\n';
      aggregated.topComponents.slice(0, 8).forEach((component, i) => {
        prompt += `   ${i + 1}. ${component}\n`;
      });
      prompt += '\n';
    }

    if (aggregated.colorSchemes.length > 0 && brandInfo?.primary) {
      prompt += '🎨 COLOR SCHEME:\n';
      prompt += `   ${aggregated.colorSchemes[0].join(', ')}\n\n`;
    }
  }

  if (context.structured?.repositories && context.structured.repositories.length > 0) {
    prompt += '📦 HIGH-QUALITY GITHUB REPOSITORIES:\n\n';
    context.structured.repositories.slice(0, 3).forEach((repo, i) => {
      prompt += `${i + 1}. ${repo.fullName} (⭐ ${repo.stars})\n`;
      prompt += `   ${repo.description}\n`;
      prompt += `   Tech: ${repo.techStack.slice(0, 4).join(', ')}\n`;
      prompt += `   Patterns: ${repo.designPatterns.slice(0, 3).join(', ')}\n`;
      prompt += `   Quality: ${repo.qualityScore}/100 | Relevance: ${repo.relevanceScore}/100\n`;
      if (repo.homepage) prompt += `   Demo: ${repo.homepage}\n`;
      prompt += `   URL: ${repo.url}\n\n`;
    });
  }

  if (context.structured?.webResults && context.structured.webResults.length > 0) {
    prompt += '🌐 WEB INSIGHTS & RESOURCES:\n\n';
    context.structured.webResults.slice(0, 3).forEach((result, i) => {
      prompt += `${i + 1}. ${result.title} ${result.isOfficial ? '⭐ OFFICIAL' : ''}\n`;
      prompt += `   ${result.description.substring(0, 120)}...\n`;
      prompt += `   Source: ${result.domain}\n`;
      prompt += `   Type: ${result.isTutorial ? 'Tutorial' : result.isDocumentation ? 'Documentation' : 'Article'}\n`;
      prompt += `   Relevance: ${result.relevanceScore}/100\n`;
      prompt += `   URL: ${result.url}\n\n`;
    });
  }

  if (context.technicalNotes && context.technicalNotes.length > 0) {
    prompt += '📝 TECHNICAL REQUIREMENTS:\n';
    context.technicalNotes.forEach((note) => {
      prompt += `   • ${note}\n`;
    });
    prompt += '\n';
  }

  prompt += '✅ ACTION ITEMS:\n';
  if (isBrandClone && brandInfo?.primary) {
    prompt += `   1. Study the ${brandInfo.primary} repositories and resources above\n`;
    prompt += `   2. Replicate their design language and component structure\n`;
    prompt += `   3. Use the recommended tech stack and patterns\n`;
    prompt += `   4. Match the official color scheme and branding\n`;
    prompt += `   5. Implement similar features and user flows\n`;
  } else {
    prompt += '   1. Use the tech stack and patterns from top repositories\n';
    prompt += '   2. Implement the essential components listed above\n';
    prompt += '   3. Follow the design patterns identified in research\n';
    prompt += "   4. Prioritize user's specific requirements\n";
  }
  prompt += '\n';

  prompt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  return prompt;
}

/**
 * Get suggested star threshold based on app type
 */
export function getSuggestedStarThreshold(appType: string): number {
  const thresholds: Record<string, number> = {
    'landing-page': 20,
    dashboard: 50,
    'saas-app': 100,
    ecommerce: 50,
    blog: 20,
    portfolio: 20,
    tool: 30,
    game: 50,
    other: 20,
  };

  return thresholds[appType] || 20;
}
