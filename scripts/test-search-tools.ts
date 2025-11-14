/**
 * TEST SCRIPT: Search Tools
 *
 * Tests Exa and DuckDuckGo search tools to verify they work
 *
 * Usage: npx tsx scripts/test-search-tools.ts
 */

import { createExaSearchTool } from '../lib/agents/search-agent/tools/exa-search';
import { createDuckDuckGoSearchTool } from '../lib/agents/search-agent/tools/duckduckgo-search';

async function testSearchTools() {
  console.log('🧪 Testing Search Tools\n');

  const testQuery = 'Next.js authentication';

  // Test DuckDuckGo (should always work, no API key needed)
  console.log('1️⃣ Testing DuckDuckGo Search...');
  console.log('─'.repeat(50));

  try {
    const ddgTool = createDuckDuckGoSearchTool();
    const ddgResult = await ddgTool.func({ query: testQuery, numResults: 3 });
    const parsed = JSON.parse(ddgResult as string);

    if (parsed.success) {
      console.log('✅ DuckDuckGo: SUCCESS');
      console.log(`   Found ${parsed.results.length} results`);
      parsed.results.forEach((r: any, i: number) => {
        console.log(`   ${i + 1}. ${r.title}`);
        console.log(`      ${r.url}`);
      });
    } else {
      console.log('❌ DuckDuckGo: FAILED');
      console.log(`   Error: ${parsed.error}`);
    }
  } catch (error: any) {
    console.log('❌ DuckDuckGo: EXCEPTION');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n');

  // Test Exa (requires API key)
  console.log('2️⃣ Testing Exa Search...');
  console.log('─'.repeat(50));

  if (!process.env.EXA_API_KEY) {
    console.log('⚠️  EXA_API_KEY not set - skipping Exa test');
    console.log('   Set EXA_API_KEY in .env to test Exa search');
  } else {
    try {
      const exaTool = createExaSearchTool();
      const exaResult = await exaTool.func({ query: testQuery, numResults: 3 });
      const parsed = JSON.parse(exaResult as string);

      if (parsed.success) {
        console.log('✅ Exa: SUCCESS');
        console.log(`   Found ${parsed.results.length} results`);
        parsed.results.forEach((r: any, i: number) => {
          console.log(`   ${i + 1}. ${r.title}`);
          console.log(`      ${r.url}`);
          if (r.score) console.log(`      Score: ${r.score}`);
        });
      } else {
        console.log('❌ Exa: FAILED');
        console.log(`   Error: ${parsed.error}`);
        if (parsed.errorDetails) {
          console.log(`   Details: ${parsed.errorDetails}`);
        }
      }
    } catch (error: any) {
      console.log('❌ Exa: EXCEPTION');
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n');
  console.log('🏁 Test Complete');
  console.log('─'.repeat(50));
  console.log('\nNOTES:');
  console.log('- DuckDuckGo should ALWAYS work (no API key needed)');
  console.log('- Exa requires EXA_API_KEY in .env');
  console.log('- If both work, the Search Agent will work correctly');
  console.log('- Search Agent uses: Exa → DuckDuckGo → Brave (fallback hierarchy)');
}

// Run tests
testSearchTools().catch(console.error);
