// @ts-nocheck
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// MCP Server Configuration
export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

// Available free MCP servers
export const MCP_SERVERS: Record<string, MCPServerConfig> = {
  // GitHub - Search repos, read files, get documentation
  github: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || '',
    },
  },

  // Memory - Persistent context across conversations
  memory: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
  },

  // Brave Search - Web search capabilities
  brave: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: {
      BRAVE_API_KEY: process.env.BRAVE_API_KEY || '',
    },
  },

  // Exa Search - Alternative web search
  exa: {
    command: 'npx',
    args: ['-y', 'exa-mcp-server'],
    env: {
      EXA_API_KEY: process.env.EXA_API_KEY || '',
    },
  },

  // Fetch - HTTP requests for APIs and web scraping
  fetch: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
  },

  // DuckDuckGo Search - Free web search (custom wrapper, not official MCP server)
  // Note: This uses our custom implementation in lib/mcp-duckduckgo.ts
  duckduckgo: {
    command: 'node',
    args: ['-e', "console.log('DuckDuckGo custom implementation')"],
    // This is a placeholder - actual implementation is in searchDuckDuckGo function
  },

  // Filesystem - File operations for templates and generated code
  filesystem: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    env: {
      // Restrict to specific directories for security
      ALLOWED_DIRECTORIES:
        process.env.FILESYSTEM_ALLOWED_DIRS || './templates,./generated,./components',
    },
  },

  // SQLite - Structured data storage for analytics
  sqlite: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite'],
    env: {
      SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || './data/analytics.db',
    },
  },

  // Puppeteer - Browser automation for visual testing and screenshots
  puppeteer: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    env: {
      // Optional: Configure Puppeteer settings
      PUPPETEER_HEADLESS: process.env.PUPPETEER_HEADLESS || 'true',
    },
  },

  // Sequential Thinking - Multi-step reasoning for complex problems
  sequentialThinking: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
  },
};

// MCP Client wrapper
export class MCPClient {
  private client: Client;
  private connected: boolean = false;
  private serverName: string;

  constructor(serverName: string) {
    this.serverName = serverName;
    this.client = new Client(
      {
        name: 'vibebaba-ai',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  async connect() {
    if (this.connected) {
      console.log(`[MCP] Already connected to ${this.serverName}`);
      return;
    }

    const config = MCP_SERVERS[this.serverName];
    if (!config) {
      console.warn(`[MCP] ⚠️ Unknown MCP server: ${this.serverName} - skipping`);
      return; // Don't throw, just skip - MCP is optional
    }

    console.log(`[MCP] Connecting to ${this.serverName}...`);

    try {
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: { ...process.env, ...config.env } as Record<string, string>,
      });

      await this.client.connect(transport);
      this.connected = true;
      console.log(`[MCP] ✅ Connected to ${this.serverName}`);
    } catch (error) {
      console.warn(
        `[MCP] ⚠️ Failed to connect to ${this.serverName} - continuing without it`,
        error instanceof Error ? error.message : String(error)
      );
      // Don't throw - MCP is optional, app should work without it
    }
  }

  async disconnect() {
    if (!this.connected) return;

    try {
      await this.client.close();
      this.connected = false;
      console.log(`[MCP] Disconnected from ${this.serverName}`);
    } catch (error) {
      console.error(`[MCP] Error disconnecting from ${this.serverName}:`, error);
    }
  }

  async listTools() {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const response = await this.client.listTools();
      console.log(`[MCP] Available tools from ${this.serverName}:`, response.tools.length);
      return response.tools;
    } catch (error) {
      console.error(`[MCP] Error listing tools from ${this.serverName}:`, error);
      return [];
    }
  }

  async callTool(toolName: string, args: Record<string, unknown>) {
    if (!this.connected) {
      await this.connect();
      // If still not connected after connect attempt, return null
      if (!this.connected) {
        console.warn(`[MCP] ⚠️ Cannot call tool ${toolName} - not connected to ${this.serverName}`);
        return null;
      }
    }

    console.log(`[MCP] Calling tool ${toolName} on ${this.serverName}`, args);

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: args,
      });

      console.log(`[MCP] ✅ Tool ${toolName} executed successfully`);
      return result;
    } catch (error) {
      console.warn(
        `[MCP] ⚠️ Error calling tool ${toolName} on ${this.serverName} - returning null`,
        error instanceof Error ? error.message : String(error)
      );
      // Don't throw - return null so caller can handle gracefully
      return null;
    }
  }

  async listResources() {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const response = await this.client.listResources();
      console.log(`[MCP] Available resources from ${this.serverName}:`, response.resources.length);
      return response.resources;
    } catch (error) {
      console.error(`[MCP] Error listing resources from ${this.serverName}:`, error);
      return [];
    }
  }

  async readResource(uri: string) {
    if (!this.connected) {
      await this.connect();
      // If still not connected after connect attempt, return null
      if (!this.connected) {
        console.warn(`[MCP] ⚠️ Cannot read resource ${uri} - not connected to ${this.serverName}`);
        return null;
      }
    }

    console.log(`[MCP] Reading resource ${uri} from ${this.serverName}`);

    try {
      const result = await this.client.readResource({ uri });
      console.log(`[MCP] ✅ Resource ${uri} read successfully`);
      return result;
    } catch (error) {
      console.warn(
        `[MCP] ⚠️ Error reading resource ${uri} from ${this.serverName} - returning null`,
        error instanceof Error ? error.message : String(error)
      );
      // Don't throw - return null so caller can handle gracefully
      return null;
    }
  }
}

// MCP Manager for handling multiple servers
export class MCPManager {
  private clients: Map<string, MCPClient> = new Map();

  async getClient(serverName: string): Promise<MCPClient | null> {
    if (!this.clients.has(serverName)) {
      const client = new MCPClient(serverName);
      await client.connect();
      // Only add to cache if successfully connected
      if (client['connected']) {
        this.clients.set(serverName, client);
      } else {
        console.warn(`[MCP Manager] Failed to connect to ${serverName} - not caching`);
        return null;
      }
    }
    return this.clients.get(serverName) || null;
  }

  async getAllTools(serverNames: string[] = ['memory', 'fetch']) {
    console.log(`[MCP Manager] Getting tools from servers:`, serverNames);

    const allTools: Array<{
      server: string;
      tools: any[];
    }> = [];

    for (const serverName of serverNames) {
      try {
        const client = await this.getClient(serverName);
        const tools = await client.listTools();
        allTools.push({ server: serverName, tools });
      } catch (error) {
        console.warn(`[MCP Manager] Failed to get tools from ${serverName}:`, error);
      }
    }

    return allTools;
  }

  async callTool(serverName: string, toolName: string, args: Record<string, unknown>) {
    const client = await this.getClient(serverName);
    if (!client) {
      console.warn(`[MCP Manager] Cannot call tool ${toolName} - no client for ${serverName}`);
      return null;
    }
    return await client.callTool(toolName, args);
  }

  async disconnectAll() {
    console.log('[MCP Manager] Disconnecting all clients...');
    for (const [serverName, client] of this.clients.entries()) {
      await client.disconnect();
    }
    this.clients.clear();
  }
}

// Singleton instance
let mcpManagerInstance: MCPManager | null = null;

export function getMCPManager(): MCPManager {
  if (!mcpManagerInstance) {
    mcpManagerInstance = new MCPManager();
  }
  return mcpManagerInstance;
}

// Helper to format tools for AI prompt
export function formatToolsForPrompt(
  toolsByServer: Array<{ server: string; tools: any[] }>
): string {
  let prompt = 'You have access to these tools:\n\n';

  for (const { server, tools } of toolsByServer) {
    if (tools.length === 0) continue;

    prompt += `## ${server.toUpperCase()} Tools:\n`;
    for (const tool of tools) {
      prompt += `- **${tool.name}**: ${tool.description}\n`;
      if (tool.inputSchema?.properties) {
        prompt += `  Parameters: ${Object.keys(tool.inputSchema.properties).join(', ')}\n`;
      }
    }
    prompt += '\n';
  }

  prompt += `To use a tool, respond with:\nTOOL_CALL: server_name.tool_name(param1="value", param2="value")\n`;

  return prompt;
}

// Parse tool calls from AI response
export function parseToolCalls(response: string): Array<{
  server: string;
  tool: string;
  args: Record<string, string>;
}> {
  const toolCalls: Array<{ server: string; tool: string; args: Record<string, string> }> = [];
  const regex = /TOOL_CALL:\s*(\w+)\.(\w+)\((.*?)\)/g;

  let match;
  while ((match = regex.exec(response)) !== null) {
    const [, server, tool, argsString] = match;
    const args: Record<string, string> = {};

    // Parse arguments (simple key="value" format)
    const argRegex = /(\w+)="([^"]*)"/g;
    let argMatch;
    while ((argMatch = argRegex.exec(argsString)) !== null) {
      const [, key, value] = argMatch;
      args[key] = value;
    }

    toolCalls.push({ server, tool, args });
  }

  return toolCalls;
}
