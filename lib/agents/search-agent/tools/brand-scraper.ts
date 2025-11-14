/**
 * SEARCH AGENT - BRAND SCRAPER TOOL
 *
 * Extract brand guidelines, colors, fonts, and design tokens
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { getMCPManager } from "@/lib/mcp/client";

export function createBrandScraperTool() {
  return new DynamicStructuredTool({
    name: "brand_scraper",
    description: "Extract brand guidelines, colors, fonts, and design tokens from a brand name or URL. Best for: replicating brand design, getting color schemes, analyzing competitor brands.",
    schema: z.object({
      brand: z.string().describe("Brand name (e.g., 'stripe', 'linear') or URL"),
      extractColors: z.boolean().default(true).describe("Extract color palette"),
      extractTypography: z.boolean().default(true).describe("Extract typography/fonts"),
      extractSpacing: z.boolean().default(false).describe("Extract spacing scale"),
    }),
    func: async ({ brand, extractColors, extractTypography, extractSpacing }) => {
      try {
        // Try to scrape brand guidelines from common URLs
        const guidelines = await scrapeBrandGuidelines(brand, {
          extractColors,
          extractTypography,
          extractSpacing,
        });

        if (guidelines) {
          return JSON.stringify({
            success: true,
            brand: guidelines.brandName,
            source: guidelines.source,
            colors: extractColors ? guidelines.colors : undefined,
            typography: extractTypography ? guidelines.typography : undefined,
            spacing: extractSpacing ? guidelines.spacing : undefined,
            confidence: guidelines.confidence,
          });
        }

        return JSON.stringify({
          success: false,
          error: `Could not extract brand guidelines for ${brand}`,
          suggestion: "Try providing a direct URL to brand guidelines or use clone_analyzer for a full website"
        });
      } catch (error: any) {
        console.error('[BrandScraper] Scraping failed:', error);
        return JSON.stringify({
          success: false,
          error: error.message || 'Brand scraping failed',
        });
      }
    },
  });
}

/**
 * Scrape brand guidelines from common paths
 */
async function scrapeBrandGuidelines(
  brand: string,
  options: { extractColors: boolean; extractTypography: boolean; extractSpacing: boolean }
): Promise<any | null> {
  const isUrl = brand.startsWith('http://') || brand.startsWith('https://');
  const urls = isUrl
    ? [brand]
    : [
        `https://${brand}.com/brand`,
        `https://${brand}.com/brand-guidelines`,
        `https://${brand}.com/press-kit`,
        `https://brand.${brand}.com`,
        `https://${brand}.com`,
      ];

  for (const url of urls) {
    try {
      // Use fetch MCP to get the page
      const mcpManager = getMCPManager();
      const fetchClient = await mcpManager.getClient('fetch');

      if (!fetchClient) continue;

      const result = await fetchClient.callTool('fetch', {
        url,
        max_length: 50000,
      });

      if (!result || !result.content) continue;

      const content = Array.isArray(result.content) ? result.content[0]?.text : result.content;
      const html = typeof content === 'string' ? content : JSON.stringify(content);

      // Extract design tokens from HTML
      const tokens = extractDesignTokens(html, options);

      if (tokens && tokens.confidence > 0.3) {
        return {
          brandName: brand,
          source: url,
          colors: tokens.colors,
          typography: tokens.typography,
          spacing: tokens.spacing,
          confidence: tokens.confidence,
        };
      }
    } catch (error) {
      console.log(`[BrandScraper] Failed to scrape ${url}:`, error);
      continue;
    }
  }

  return null;
}

/**
 * Extract design tokens from HTML
 */
function extractDesignTokens(
  html: string,
  options: { extractColors: boolean; extractTypography: boolean; extractSpacing: boolean }
): any {
  const tokens: any = {
    colors: {},
    typography: {},
    spacing: {},
    confidence: 0,
  };

  // Extract colors from CSS variables and inline styles
  if (options.extractColors) {
    const colorRegex = /--[\w-]+:\s*(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\))/g;
    const colors: Record<string, string> = {};
    let match;

    while ((match = colorRegex.exec(html)) !== null) {
      const [fullMatch, colorValue] = match;
      const varName = fullMatch.split(':')[0].replace('--', '').trim();
      colors[varName] = colorValue.trim();
    }

    if (Object.keys(colors).length > 0) {
      tokens.colors = colors;
      tokens.confidence += 0.4;
    }
  }

  // Extract typography
  if (options.extractTypography) {
    const fontFamilyRegex = /font-family:\s*([^;]+)/g;
    const fonts = new Set<string>();

    let match;
    while ((match = fontFamilyRegex.exec(html)) !== null) {
      fonts.add(match[1].trim().replace(/['"]/g, ''));
    }

    if (fonts.size > 0) {
      tokens.typography = {
        fonts: Array.from(fonts),
      };
      tokens.confidence += 0.3;
    }
  }

  // Extract spacing
  if (options.extractSpacing) {
    const spacingRegex = /--spacing-[\w-]+:\s*(\d+(?:px|rem|em))/g;
    const spacing: Record<string, string> = {};

    let match;
    while ((match = spacingRegex.exec(html)) !== null) {
      const [fullMatch, value] = match;
      const varName = fullMatch.split(':')[0].replace('--spacing-', '').trim();
      spacing[varName] = value.trim();
    }

    if (Object.keys(spacing).length > 0) {
      tokens.spacing = spacing;
      tokens.confidence += 0.3;
    }
  }

  return tokens;
}
