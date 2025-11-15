/**
 * DuckDuckGo Search MCP Wrapper
 *
 * Since there's no official @modelcontextprotocol/server-duckduckgo,
 * we create a wrapper using the duck-duck-scrape package with fallback to direct API
 */

import { search } from 'duck-duck-scrape';
import https from 'https';

export interface DuckDuckGoSearchOptions {
  maxResults?: number;
  region?: string;
  safeSearch?: 'off' | 'moderate' | 'strict';
  timeRange?: 'd' | 'w' | 'm' | 'y'; // day, week, month, year
}

export interface DuckDuckGoResult {
  title: string;
  href: string;
  body: string;
}

/**
 * Map safe search levels to duck-duck-scrape format (numeric)
 * STRICT = 0, MODERATE = -1, OFF = -2
 */
function mapSafeSearch(level: 'off' | 'moderate' | 'strict'): -2 | -1 | 0 {
  switch (level) {
    case 'off':
      return -2;
    case 'moderate':
      return -1;
    case 'strict':
      return 0;
    default:
      return -1;
  }
}

// Rate limiting state
let lastDuckDuckGoRequest = 0;
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests (increased to avoid rate limiting)

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fallback: Use DuckDuckGo Instant Answer API (limited but works)
 */
async function searchDuckDuckGoAPI(query: string, maxResults: number): Promise<DuckDuckGoResult[]> {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1`;

    https
      .get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const results: DuckDuckGoResult[] = [];

            // Add abstract if available
            if (json.Abstract && json.AbstractText) {
              results.push({
                title: json.Heading || query,
                href: json.AbstractURL || '',
                body: json.AbstractText,
              });
            }

            // Add related topics
            if (json.RelatedTopics && Array.isArray(json.RelatedTopics)) {
              json.RelatedTopics.forEach((topic: any) => {
                if (topic.Text && topic.FirstURL) {
                  results.push({
                    title: topic.Text.split(' - ')[0] || topic.Text,
                    href: topic.FirstURL,
                    body: topic.Text,
                  });
                }
              });
            }

            resolve(results.slice(0, maxResults));
          } catch (err) {
            reject(new Error('Failed to parse DuckDuckGo API response'));
          }
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * Search DuckDuckGo with the given query (with rate limiting and retry)
 * Now with fallback to API when scraping fails
 */
export async function searchDuckDuckGo(
  query: string,
  options: DuckDuckGoSearchOptions = {}
): Promise<DuckDuckGoResult[]> {
  const { maxResults = 10, safeSearch = 'moderate' } = options;

  // Rate limiting: ensure minimum interval between requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastDuckDuckGoRequest;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`[DuckDuckGo] ⏳ Rate limiting: waiting ${waitTime}ms...`);
    await sleep(waitTime);
  }

  lastDuckDuckGoRequest = Date.now();

  // Try the scraping method first (more detailed results)
  try {
    console.log(`[DuckDuckGo] Trying scrape method: "${query}"`);

    const searchResults = await search(query, {
      safeSearch: mapSafeSearch(safeSearch),
    });

    console.log(
      `[DuckDuckGo] ✅ Scrape succeeded - found ${searchResults.results?.length || 0} results`
    );

    // Format results and limit to maxResults
    const results = (searchResults.results || []).slice(0, maxResults).map((result: any) => ({
      title: result.title || '',
      href: result.url || '',
      body: result.description || '',
    }));

    if (results.length > 0) {
      return results;
    }
  } catch (scrapeError) {
    console.log(`[DuckDuckGo] Scrape failed, trying API fallback...`);
  }

  // Fallback to API method
  try {
    console.log(`[DuckDuckGo] Trying API method: "${query}"`);
    const apiResults = await searchDuckDuckGoAPI(query, maxResults);

    if (apiResults.length > 0) {
      console.log(`[DuckDuckGo] ✅ API succeeded - found ${apiResults.length} results`);
      return apiResults;
    } else {
      console.log(`[DuckDuckGo] ⚠️  API returned 0 results`);
      return [];
    }
  } catch (apiError) {
    console.error(`[DuckDuckGo] ❌ API also failed:`, apiError);
    // Return empty array instead of throwing - graceful degradation
    return [];
  }
}

/**
 * MCP-compatible tool interface for DuckDuckGo
 */
export const duckDuckGoMCPTool = {
  name: 'duckduckgo_search',
  description: 'Search the web using DuckDuckGo (free, no API key required)',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)',
        default: 10,
      },
      region: {
        type: 'string',
        description: 'Region for search results (default: wt-wt for worldwide)',
        default: 'wt-wt',
      },
      safeSearch: {
        type: 'string',
        enum: ['off', 'moderate', 'strict'],
        description: 'Safe search level',
        default: 'moderate',
      },
    },
    required: ['query'],
  },

  async execute(args: {
    query: string;
    maxResults?: number;
    region?: string;
    safeSearch?: 'off' | 'moderate' | 'strict';
  }) {
    return await searchDuckDuckGo(args.query, {
      maxResults: args.maxResults,
      region: args.region,
      safeSearch: args.safeSearch,
    });
  },
};

/**
 * Format DuckDuckGo results for AI consumption
 */
export function formatDuckDuckGoResults(results: DuckDuckGoResult[]): string {
  if (!results || results.length === 0) {
    return 'No results found.';
  }

  let formatted = `Found ${results.length} results:\n\n`;

  results.forEach((result, index) => {
    formatted += `${index + 1}. **${result.title}**\n`;
    formatted += `   URL: ${result.href}\n`;
    formatted += `   ${result.body}\n\n`;
  });

  return formatted;
}
