import { getMCPManager } from "./mcp-client";

/**
 * Smart search function that tries multiple search providers with fallback
 * Priority: Brave → Exa → Fetch (DuckDuckGo scraping)
 */
export async function searchWeb(query: string): Promise<{
  success: boolean;
  results: any;
  provider: string;
  error?: string;
}> {
  const mcpManager = getMCPManager();

  // Try 1: Brave Search (requires API key)
  if (process.env.BRAVE_API_KEY) {
    try {
      console.log("[Search] Trying Brave Search...");
      const result = await mcpManager.callTool("brave", "search", { query });
      console.log("[Search] ✅ Brave Search succeeded");
      return {
        success: true,
        results: result,
        provider: "brave",
      };
    } catch (error: any) {
      console.warn("[Search] Brave Search failed:", error.message);
    }
  }

  // Try 2: Exa Search (alternative search API)
  try {
    console.log("[Search] Trying Exa Search...");
    const result = await mcpManager.callTool("exa", "search", { query });
    console.log("[Search] ✅ Exa Search succeeded");
    return {
      success: true,
      results: result,
      provider: "exa",
    };
  } catch (error: any) {
    console.warn("[Search] Exa Search failed:", error.message);
  }

  // Try 3: Fetch with DuckDuckGo HTML API (no API key needed)
  try {
    console.log("[Search] Trying DuckDuckGo (via Fetch)...");
    const duckduckgoUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const result = await mcpManager.callTool("fetch", "get", { url: duckduckgoUrl });
    console.log("[Search] ✅ DuckDuckGo succeeded");
    return {
      success: true,
      results: result,
      provider: "duckduckgo",
    };
  } catch (error: any) {
    console.warn("[Search] DuckDuckGo failed:", error.message);
  }

  // All providers failed
  console.error("[Search] ❌ All search providers failed");
  return {
    success: false,
    results: null,
    provider: "none",
    error: "All search providers are currently unavailable",
  };
}

/**
 * Search GitHub repositories
 */
export async function searchGitHub(
  query: string,
  options: { type?: "repositories" | "code" | "issues" } = {}
): Promise<{
  success: boolean;
  results: any;
  error?: string;
}> {
  if (!process.env.GITHUB_TOKEN) {
    return {
      success: false,
      results: null,
      error: "GitHub token not configured",
    };
  }

  const mcpManager = getMCPManager();

  try {
    console.log(`[GitHub] Searching for: ${query}`);
    const result = await mcpManager.callTool("github", "search_repositories", {
      query,
    });
    console.log("[GitHub] ✅ Search succeeded");
    return {
      success: true,
      results: result,
    };
  } catch (error: any) {
    console.error("[GitHub] ❌ Search failed:", error.message);
    return {
      success: false,
      results: null,
      error: error.message,
    };
  }
}

/**
 * Get GitHub file contents
 */
export async function getGitHubFile(
  repo: string,
  path: string,
  ref: string = "main"
): Promise<{
  success: boolean;
  content: string | null;
  error?: string;
}> {
  if (!process.env.GITHUB_TOKEN) {
    return {
      success: false,
      content: null,
      error: "GitHub token not configured",
    };
  }

  const mcpManager = getMCPManager();

  try {
    console.log(`[GitHub] Reading file: ${repo}/${path}`);
    const result = await mcpManager.callTool("github", "read_file", {
      repo,
      path,
      ref,
    });
    console.log("[GitHub] ✅ File read succeeded");
    return {
      success: true,
      content: typeof result === 'string' ? result : JSON.stringify(result),
    };
  } catch (error: any) {
    console.error("[GitHub] ❌ File read failed:", error.message);
    return {
      success: false,
      content: null,
      error: error.message,
    };
  }
}

/**
 * Smart search for code examples
 * Tries GitHub first, then falls back to web search
 */
export async function searchCodeExamples(query: string): Promise<{
  success: boolean;
  results: any;
  source: string;
}> {
  // Try GitHub first
  const githubResult = await searchGitHub(`${query} language:typescript OR language:javascript`);
  if (githubResult.success) {
    return {
      success: true,
      results: githubResult.results,
      source: "github",
    };
  }

  // Fallback to web search
  const webResult = await searchWeb(`${query} code example typescript react`);
  return {
    success: webResult.success,
    results: webResult.results,
    source: webResult.provider,
  };
}
