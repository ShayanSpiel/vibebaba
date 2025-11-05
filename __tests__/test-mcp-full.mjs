// Comprehensive MCP test script
// Run with: node test-mcp-full.mjs

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, ".env.local") });

console.log("🧪 Comprehensive MCP Integration Test\n");

async function testServer(name, config) {
  console.log(`Testing ${name}...`);

  try {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: { ...process.env, ...config.env },
    });

    const client = new Client(
      {
        name: "vibebaba-test",
        version: "1.0.0",
      },
      {
        capabilities: { tools: {} },
      }
    );

    await client.connect(transport);
    console.log(`   ✅ Connected to ${name}`);

    // List available tools
    const tools = await client.listTools();
    console.log(`   ✅ Found ${tools.tools.length} tools`);
    if (tools.tools.length > 0) {
      tools.tools.slice(0, 3).forEach((tool) => {
        console.log(`      - ${tool.name}`);
      });
      if (tools.tools.length > 3) {
        console.log(`      ... and ${tools.tools.length - 3} more`);
      }
    }

    await client.close();
    console.log(`   ✅ ${name} test passed\n`);
    return { success: true, toolCount: tools.tools.length };
  } catch (error) {
    console.error(`   ❌ ${name} test failed:`, error.message);
    console.log();
    return { success: false, error: error.message };
  }
}

// Run tests
(async () => {
  const results = {};

  // 1. Memory Server (always works, no API key)
  results.memory = await testServer("Memory Server", {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
  });

  // 2. GitHub Server (requires GITHUB_TOKEN)
  if (process.env.GITHUB_TOKEN) {
    console.log("   🔑 GitHub token found");
    results.github = await testServer("GitHub Server", {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN,
      },
    });
  } else {
    console.log("❌ GitHub Server - GITHUB_TOKEN not set");
    console.log("   Add GITHUB_TOKEN to .env.local to enable\n");
    results.github = { success: false, skipped: true };
  }

  // 3. Brave Search Server (requires BRAVE_API_KEY)
  if (process.env.BRAVE_API_KEY) {
    console.log("   🔑 Brave API key found");
    results.brave = await testServer("Brave Search Server", {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: {
        BRAVE_API_KEY: process.env.BRAVE_API_KEY,
      },
    });
  } else {
    console.log("❌ Brave Search Server - BRAVE_API_KEY not set");
    console.log("   Add BRAVE_API_KEY to .env.local to enable\n");
    results.brave = { success: false, skipped: true };
  }

  // 4. Test if Exa exists (alternative search)
  console.log("Testing Exa Search (fallback)...");
  try {
    results.exa = await testServer("Exa Search Server", {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-exa"],
      env: {
        EXA_API_KEY: process.env.EXA_API_KEY || "",
      },
    });
  } catch (error) {
    console.log("   ℹ️  Exa server not available (this is OK)\n");
    results.exa = { success: false, notAvailable: true };
  }

  // 5. Test Fetch server
  console.log("Testing Fetch Server (DuckDuckGo fallback)...");
  try {
    results.fetch = await testServer("Fetch Server", {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch"],
    });
  } catch (error) {
    console.log("   ℹ️  Fetch server not available as standalone package\n");
    results.fetch = { success: false, notAvailable: true };
  }

  // Summary
  console.log("=".repeat(50));
  console.log("📊 Test Results Summary:");
  console.log("=".repeat(50));

  const working = [];
  const failed = [];
  const skipped = [];

  Object.entries(results).forEach(([name, result]) => {
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    if (result.success) {
      console.log(`✅ ${displayName}: WORKING (${result.toolCount} tools)`);
      working.push(displayName);
    } else if (result.skipped) {
      console.log(`⚠️  ${displayName}: SKIPPED (API key not configured)`);
      skipped.push(displayName);
    } else if (result.notAvailable) {
      console.log(`ℹ️  ${displayName}: NOT AVAILABLE (package doesn't exist)`);
    } else {
      console.log(`❌ ${displayName}: FAILED`);
      failed.push(displayName);
    }
  });

  console.log("=".repeat(50));

  if (working.length > 0) {
    console.log("\n🎉 MCP Integration Status: WORKING!");
    console.log(`\n✨ Active Servers (${working.length}):`);
    working.forEach((name) => console.log(`   • ${name}`));
  }

  if (skipped.length > 0) {
    console.log(`\n💡 Available but not configured (${skipped.length}):`);
    skipped.forEach((name) => console.log(`   • ${name}`));
    console.log("\n   To enable, add API keys to .env.local:");
    if (skipped.includes("GitHub")) {
      console.log("   • GITHUB_TOKEN=ghp_xxxxx");
    }
    if (skipped.includes("Brave")) {
      console.log("   • BRAVE_API_KEY=BSxxxxx");
    }
  }

  console.log("\n🔧 How your AI uses these tools:");
  console.log("   • Memory: Stores preferences, learns from projects");
  if (working.includes("GitHub")) {
    console.log("   • GitHub: Searches code examples, reads documentation");
  }
  if (working.includes("Brave")) {
    console.log("   • Brave: Web search for current trends and information");
  }

  console.log("\n📝 Next steps:");
  console.log("   1. Start your app: npm run dev");
  console.log("   2. Create a project and mention preferences");
  console.log("   3. Check logs for [MCP] messages");
  console.log("   4. See AI use these tools automatically!");

  const exitCode = working.length > 0 ? 0 : 1;
  process.exit(exitCode);
})();
