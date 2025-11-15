/**
 * SEARCH AGENT - WORKFLOW LOGGER
 *
 * Comprehensive logging for search operations in workflows
 */

import type { SearchIntent, SearchResult } from './types';

/**
 * Log search start in workflow
 */
export function logSearchStart(workflowName: string, query: string, context?: any) {
  console.log('');
  console.log('═'.repeat(80));
  console.log(`🔍 SEARCH AGENT - ${workflowName.toUpperCase()}`);
  console.log('═'.repeat(80));
  console.log(`Query: "${query}"`);
  if (context?.orgId) console.log(`Organization: ${context.orgId}`);
  if (context?.projectId) console.log(`Project: ${context.projectId}`);
  if (context?.appType) console.log(`App Type: ${context.appType}`);
  if (context?.features) console.log(`Features: ${context.features.join(', ')}`);
  console.log('─'.repeat(80));
}

/**
 * Log intent detection
 */
export function logIntentDetection(intent: SearchIntent) {
  console.log('');
  console.log('🧠 INTENT ANALYSIS');
  console.log('─'.repeat(80));
  console.log(`Category: ${intent.category}`);
  console.log(`Confidence: ${(intent.confidence * 100).toFixed(1)}%`);
  console.log(`Priority: ${intent.priority}`);

  if (intent.techStack && intent.techStack.length > 0) {
    console.log(`Tech Stack: ${intent.techStack.join(', ')}`);
  }

  if (intent.features && intent.features.length > 0) {
    console.log(`Features: ${intent.features.join(', ')}`);
  }

  if (intent.brandMentions && intent.brandMentions.length > 0) {
    console.log(`Brands: ${intent.brandMentions.join(', ')}`);
  }

  if (intent.colors) {
    const colors = [];
    if (intent.colors.primary) colors.push(`${intent.colors.primary.name} (primary)`);
    if (intent.colors.secondary) colors.push(`${intent.colors.secondary.name} (secondary)`);
    if (colors.length > 0) console.log(`Colors: ${colors.join(', ')}`);
  }

  console.log(`Search Sources: ${intent.searchSources.join(' → ')}`);
  console.log('─'.repeat(80));
}

/**
 * Log search strategy
 */
export function logSearchStrategy(intent: SearchIntent) {
  console.log('');
  console.log('📋 SEARCH STRATEGY');
  console.log('─'.repeat(80));

  const strategies = [];

  if (intent.searchSources.includes('exa')) {
    strategies.push('1️⃣  Exa AI Search (primary, AI-optimized)');
  }

  if (intent.searchSources.includes('github')) {
    strategies.push('2️⃣  GitHub Repository Search');
    if (intent.requiresCodeExtraction) {
      strategies.push('   └─ Code Extraction enabled');
    }
  }

  if (intent.searchSources.includes('duckduckgo')) {
    strategies.push('3️⃣  DuckDuckGo Search (fallback)');
  }

  if (intent.searchSources.includes('brave')) {
    strategies.push('4️⃣  Brave Search (final fallback)');
  }

  if (intent.requiresBrandScraping) {
    strategies.push('🎨 Brand Scraping enabled');
  }

  if (intent.requiresCloneAnalysis) {
    strategies.push('🔬 Clone Analysis enabled');
  }

  strategies.forEach((s) => console.log(s));
  console.log('─'.repeat(80));
}

/**
 * Log tool execution
 */
export function logToolExecution(
  toolName: string,
  status: 'start' | 'success' | 'error',
  details?: any
) {
  const timestamp = new Date().toLocaleTimeString();

  if (status === 'start') {
    console.log(`\n⚙️  [${timestamp}] Executing: ${toolName}`);
  } else if (status === 'success') {
    console.log(`✅ [${timestamp}] ${toolName} - Success`);
    if (details?.count !== undefined) {
      console.log(`   └─ Results: ${details.count}`);
    }
    if (details?.duration) {
      console.log(`   └─ Duration: ${details.duration}ms`);
    }
  } else if (status === 'error') {
    console.log(`❌ [${timestamp}] ${toolName} - Failed`);
    if (details?.error) {
      console.log(`   └─ Error: ${details.error}`);
    }
    if (details?.fallback) {
      console.log(`   └─ Fallback: ${details.fallback}`);
    }
  }
}

/**
 * Log search results
 */
export function logSearchResults(result: SearchResult) {
  console.log('');
  console.log('📊 SEARCH RESULTS');
  console.log('═'.repeat(80));
  console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Duration: ${result.metadata.duration}ms`);
  console.log(`Tools Used: ${result.metadata.toolsUsed.join(', ') || 'none'}`);
  console.log(`Cache Hit: ${result.metadata.cacheHit ? 'Yes' : 'No'}`);
  console.log('─'.repeat(80));

  // GitHub repositories
  if (result.repositories && result.repositories.length > 0) {
    console.log(`\n📦 GitHub Repositories (${result.repositories.length})`);
    result.repositories.slice(0, 3).forEach((repo, i) => {
      console.log(`   ${i + 1}. ${repo.fullName} (⭐ ${repo.stars})`);
      console.log(`      ${repo.description || 'No description'}`);
      console.log(`      ${repo.url}`);
    });
    if (result.repositories.length > 3) {
      console.log(`   ... and ${result.repositories.length - 3} more`);
    }
  }

  // Extracted code
  if (result.code && result.code.length > 0) {
    console.log(`\n💾 Code Files (${result.code.length})`);
    result.code.forEach((code, i) => {
      console.log(`   ${i + 1}. ${code.path} (${code.language})`);
      console.log(`      Repo: ${code.repo}`);
      console.log(`      Size: ${code.size} bytes`);
    });
  }

  // Brand guidelines
  if (result.brandGuidelines && result.brandGuidelines.length > 0) {
    console.log(`\n🎨 Brand Guidelines (${result.brandGuidelines.length})`);
    result.brandGuidelines.forEach((brand, i) => {
      console.log(`   ${i + 1}. ${brand.brandName}`);
      if (brand.colors?.primary) {
        console.log(
          `      Primary Color: ${brand.colors.primary.name} (${brand.colors.primary.hex})`
        );
      }
      if (brand.typography?.fontFamily) {
        console.log(`      Font: ${brand.typography.fontFamily}`);
      }
    });
  }

  // Web results
  if (result.webResults && result.webResults.length > 0) {
    console.log(`\n🌐 Web Results (${result.webResults.length})`);
    result.webResults.slice(0, 3).forEach((web, i) => {
      console.log(`   ${i + 1}. ${web.title}`);
      console.log(`      ${web.url}`);
    });
    if (result.webResults.length > 3) {
      console.log(`   ... and ${result.webResults.length - 3} more`);
    }
  }

  // Errors
  if (result.errors && result.errors.length > 0) {
    console.log(`\n⚠️  Errors (${result.errors.length})`);
    result.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error.tool}: ${error.error}`);
      if (error.fallbackUsed) {
        console.log(`      Fallback: ${error.fallbackUsed}`);
      }
    });
  }

  console.log('═'.repeat(80));
  console.log('');
}

/**
 * Log quota check
 */
export function logQuotaCheck(orgId: string, allowed: boolean, usage?: number, limit?: number) {
  if (allowed) {
    console.log(`✅ Quota OK for org ${orgId} (${usage}/${limit} searches used)`);
  } else {
    console.log(`❌ QUOTA EXCEEDED for org ${orgId} (${usage}/${limit} searches used)`);
    console.log('   └─ Search blocked to prevent quota overrun');
  }
}

/**
 * Log cache hit/miss
 */
export function logCacheStatus(hit: boolean, query: string, orgId: string) {
  if (hit) {
    console.log(`💾 CACHE HIT - Returning cached results for: "${query}"`);
    console.log(`   Organization: ${orgId}`);
    console.log(`   (Search completed instantly)`);
  } else {
    console.log(`🔍 CACHE MISS - Performing new search for: "${query}"`);
  }
}

/**
 * Log analytics tracking
 */
export function logAnalytics(searchId: string, orgId: string) {
  console.log(`\n📈 Analytics tracked - Search ID: ${searchId}`);
  console.log(`   View analytics for org ${orgId} in dashboard`);
}

/**
 * Simple progress indicator for long operations
 */
export class SearchProgress {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
    console.log(`\n⏳ ${operation}...`);
  }

  update(message: string) {
    const elapsed = Date.now() - this.startTime;
    console.log(`   [${(elapsed / 1000).toFixed(1)}s] ${message}`);
  }

  complete(message?: string) {
    const elapsed = Date.now() - this.startTime;
    console.log(`✅ ${this.operation} complete (${(elapsed / 1000).toFixed(2)}s)`);
    if (message) console.log(`   ${message}`);
  }

  error(message: string) {
    const elapsed = Date.now() - this.startTime;
    console.log(`❌ ${this.operation} failed (${(elapsed / 1000).toFixed(2)}s)`);
    console.log(`   Error: ${message}`);
  }
}
