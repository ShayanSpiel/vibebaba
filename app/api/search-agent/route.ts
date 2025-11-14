/**
 * SEARCH AGENT API ENDPOINT
 *
 * REST API for Search Agent - accessible by any part of the application
 */

import { NextRequest, NextResponse } from 'next/server';
import { SearchAgent, buildConfig, type SearchContext } from '@/lib/agents/search-agent';

/**
 * POST /api/search-agent
 *
 * Perform intelligent search and retrieval
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context, options } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // TODO: Get orgId from authentication/session
    const orgId = context?.orgId || 'default-org';
    const userId = context?.userId;

    console.log(`[API /search-agent] Query from org ${orgId}:`, query);

    // Build configuration
    const config = buildConfig(orgId, {
      userId,
      enableExa: options?.enableExa ?? true,
      enableGitHub: options?.enableGitHub ?? true,
      enableDuckDuckGo: options?.enableDuckDuckGo ?? true,
      enableBrave: options?.enableBrave ?? true,
      enableCodeExtraction: options?.enableCodeExtraction ?? true,
      enableBrandScraping: options?.enableBrandScraping ?? true,
      enableCloneAnalysis: options?.enableCloneAnalysis ?? false,
      enableContentScraping: options?.enableContentScraping ?? false,
      enableVectorStore: options?.enableVectorStore ?? true,
      cacheEnabled: options?.cacheEnabled ?? true,
    });

    // Create search agent
    const searchAgent = new SearchAgent(config);

    // Perform search
    const result = await searchAgent.search(query, context as SearchContext);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /search-agent] Error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Search failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search-agent/health
 *
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    service: 'search-agent',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
