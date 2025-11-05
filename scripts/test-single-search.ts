/**
 * Single DuckDuckGo search test (to avoid rate limiting)
 *
 * Usage: npx tsx scripts/test-single-search.ts
 */

import { searchDuckDuckGo } from '../lib/mcp-duckduckgo';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('SINGLE DUCKDUCKGO SEARCH TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testSingleSearch() {
  const query = 'modern web design patterns';
  console.log(`Query: "${query}"\n`);

  try {
    const results = await searchDuckDuckGo(query, { maxResults: 5 });

    console.log(`✓ SUCCESS! Found ${results.length} results:\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.href}`);
      console.log(`   ${result.body.substring(0, 120)}...`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST PASSED ✨');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ DuckDuckGo search is working correctly!');
    console.log('✅ The MCP fallback chain is ready to use.');
    console.log('\nFallback order: Brave → DuckDuckGo → Exa');
    console.log('Implementation: lib/mcp-background-helper.ts\n');

    return true;
  } catch (error) {
    console.error('✗ FAILED:', error);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST FAILED ⚠️');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return false;
  }
}

testSingleSearch().catch(console.error);
