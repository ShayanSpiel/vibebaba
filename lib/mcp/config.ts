// MCP Configuration and Feature Flags

export interface MCPFeatureConfig {
  enabled: boolean;
  servers: string[];
  useForPlanning: boolean;
  useForPrototype: boolean;
  useForChat: boolean;
}

// Default MCP configuration
export const DEFAULT_MCP_CONFIG: MCPFeatureConfig = {
  enabled: true,
  // Working servers (tested and verified)
  // - memory: 9 tools for knowledge graph
  // - github: 26 tools for code search and repository access
  // - brave: 2 tools for web search (paid API - currently expired)
  // - duckduckgo: 1 tool for free web search (with rate limiting)
  servers: ['memory', 'github', 'brave', 'duckduckgo'],
  useForPlanning: true,
  useForPrototype: true,
  useForChat: true,
};

// Check if specific MCP features are available
export function isMCPEnabled(): boolean {
  return DEFAULT_MCP_CONFIG.enabled;
}

export function getMCPServers(): string[] {
  return DEFAULT_MCP_CONFIG.servers;
}

// Context-specific MCP server selection
export function getServersForContext(context: 'planning' | 'prototype' | 'chat'): string[] {
  const config = DEFAULT_MCP_CONFIG;

  if (!config.enabled) return [];

  switch (context) {
    case 'planning':
      return config.useForPlanning ? config.servers : [];
    case 'prototype':
      return config.useForPrototype ? config.servers : [];
    case 'chat':
      return config.useForChat ? config.servers : [];
    default:
      return [];
  }
}

// Tool usage guidelines for AI
export const MCP_TOOL_GUIDELINES = {
  memory: {
    when: 'Store important user preferences, project context, or decisions for future reference',
    examples: [
      'User prefers dark mode designs',
      'Project uses Next.js 14 with App Router',
      'User wants minimalist UI style',
    ],
  },
  fetch: {
    when: 'Need to fetch real-time data from public APIs, check if URLs are accessible, or scrape web pages',
    examples: [
      'Fetch latest package versions from npm',
      'Get current cryptocurrency prices',
      'Verify API endpoint availability',
      'Get data from REST APIs',
      'Check if URLs are accessible',
      'Scrape information from websites',
    ],
  },
  github: {
    when: 'Search for code examples, check documentation, or find similar projects',
    examples: [
      'Find React component examples for authentication',
      'Search for Next.js App Router best practices',
      'Look up library documentation',
    ],
  },
  brave: {
    when: 'Search the web for current information, trends, or solutions (primary - requires API key)',
    examples: [
      'Latest design trends for 2025',
      'Best practices for React 19',
      'Popular color schemes for SaaS apps',
    ],
  },
  duckduckgo: {
    when: 'Free web search (primary fallback when Brave fails or API key is unavailable)',
    examples: [
      'Search for brand design patterns',
      'Find component library examples',
      'Research UI/UX trends',
      'Find documentation for libraries',
      'Search for tutorials and guides',
    ],
  },
};

// Generate tool usage instructions for AI
export function getMCPToolInstructions(servers: string[]): string {
  let instructions = '\n\n## AVAILABLE TOOLS\n\n';
  instructions +=
    'You have access to MCP (Model Context Protocol) tools. Use them strategically:\n\n';

  for (const server of servers) {
    const guideline = MCP_TOOL_GUIDELINES[server as keyof typeof MCP_TOOL_GUIDELINES];
    if (guideline) {
      instructions += `### ${server.toUpperCase()}\n`;
      instructions += `**When to use:** ${guideline.when}\n`;
      instructions += `**Examples:**\n`;
      guideline.examples.forEach((ex) => {
        instructions += `  - ${ex}\n`;
      });
      instructions += '\n';
    }
  }

  instructions += `**How to use tools:**\n`;
  instructions += `Respond with: TOOL_CALL: server_name.tool_name(param1="value", param2="value")\n`;
  instructions += `Example: TOOL_CALL: memory.store(key="user_preference", value="dark mode")\n\n`;

  return instructions;
}
