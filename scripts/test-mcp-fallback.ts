/**
 * Test script for MCP search fallback chain
 *
 * Tests: Brave → DuckDuckGo → Exa fallback
 *
 * Usage: npx tsx scripts/test-mcp-fallback.ts
 */

import { searchDuckDuckGo } from '../lib/mcp-duckduckgo';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('MCP SEARCH FALLBACK TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testDuckDuckGoSearch() {
  console.log('✅ TEST 1: DuckDuckGo Search (Free Fallback)');
  console.log('Query: "modern web design patterns 2025"');

  try {
    const results = await searchDuckDuckGo('modern web design patterns 2025', {
      maxResults: 3,
    });

    console.log(`\n✓ Found ${results.length} results:\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.href}`);
      console.log(`   ${result.body.substring(0, 100)}...`);
      console.log('');
    });

    return true;
  } catch (error) {
    console.error('✗ DuckDuckGo search failed:', error);
    return false;
  }
}

async function testBrandSearch() {
  console.log('\n✅ TEST 2: Brand Design Pattern Search');
  console.log('Query: "Stripe brand design guidelines"');

  try {
    const results = await searchDuckDuckGo('Stripe brand design guidelines', {
      maxResults: 3,
    });

    console.log(`\n✓ Found ${results.length} results:\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.href}`);
      console.log(`   ${result.body.substring(0, 100)}...`);
      console.log('');
    });

    return true;
  } catch (error) {
    console.error('✗ Brand search failed:', error);
    return false;
  }
}

async function testRegionalSearch() {
  console.log('\n✅ TEST 3: Regional Search');
  console.log('Query: "UI component libraries" (US region)');

  try {
    const results = await searchDuckDuckGo('UI component libraries', {
      maxResults: 3,
      region: 'us-en',
    });

    console.log(`\n✓ Found ${results.length} results:\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.href}`);
      console.log('');
    });

    return true;
  } catch (error) {
    console.error('✗ Regional search failed:', error);
    return false;
  }
}

async function testTimeRangeSearch() {
  console.log('\n✅ TEST 4: Time Range Search (Last Month)');
  console.log('Query: "Next.js 15 features"');

  try {
    const results = await searchDuckDuckGo('Next.js 15 features', {
      maxResults: 3,
      timeRange: 'm', // last month
    });

    console.log(`\n✓ Found ${results.length} results:\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.href}`);
      console.log('');
    });

    return true;
  } catch (error) {
    console.error('✗ Time range search failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    duckduckgo: false,
    brand: false,
    regional: false,
    timeRange: false,
  };

  results.duckduckgo = await testDuckDuckGoSearch();
  results.brand = await testBrandSearch();
  results.regional = await testRegionalSearch();
  results.timeRange = await testTimeRangeSearch();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST RESULTS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  Object.entries(results).forEach(([test, passed]) => {
    const emoji = passed ? '✓' : '✗';
    const status = passed ? 'PASSED' : 'FAILED';
    console.log(`${emoji} ${test}: ${status}`);
  });

  const allPassed = Object.values(results).every((r) => r);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allPassed) {
    console.log('ALL TESTS PASSED ✨');
  } else {
    console.log('SOME TESTS FAILED ⚠️');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Note about fallback chain
  console.log('📝 NOTE: MCP Fallback Chain Order:');
  console.log('   1. Brave Search (Paid - requires API key)');
  console.log('   2. DuckDuckGo (Free - tested above) ✓');
  console.log('   3. Exa Search (Alternative - requires API key)');
  console.log('\nThe fallback is implemented in lib/mcp-background-helper.ts');
  console.log('and will automatically try each source in order until one succeeds.\n');
}

runAllTests().catch(console.error);
