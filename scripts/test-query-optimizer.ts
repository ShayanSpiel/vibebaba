/**
 * Test script for query optimizer improvements
 *
 * Run with: npx tsx scripts/test-query-optimizer.ts
 */

import { optimizeGitHubQuery, optimizeWebQuery } from '../lib/mcp-query-optimizer';

console.log('🧪 Testing Query Optimizer Improvements\n');
console.log('='.repeat(80));

// Test Case 1: Calendar Checklist App
console.log('\n📅 Test Case 1: Calendar Checklist App');
console.log('-'.repeat(80));

const description1 = 'A checklist building app with ability to attach tasks to checklists, with a big calendar view';

const githubQuery1 = optimizeGitHubQuery(description1, 'app', {
  minStars: 20,
  language: 'typescript',
  includeTopics: true
});

console.log('GitHub Query:');
console.log(`  Query: ${githubQuery1.query}`);
console.log(`  Strategy: ${githubQuery1.strategy}`);
console.log(`  Explanation: ${githubQuery1.explanation}`);

const webQuery1 = optimizeWebQuery(description1, 'app', {
  includeYear: true,
  focusOn: 'general'
});

console.log('\nWeb Query:');
console.log(`  Query: ${webQuery1.query}`);
console.log(`  Strategy: ${webQuery1.strategy}`);
console.log(`  Explanation: ${webQuery1.explanation}`);

// Test Case 2: Todo App
console.log('\n\n✅ Test Case 2: Todo App');
console.log('-'.repeat(80));

const description2 = 'A simple todo list app with categories and due dates';

const githubQuery2 = optimizeGitHubQuery(description2, 'app', {
  minStars: 20,
  language: 'typescript',
  includeTopics: true
});

console.log('GitHub Query:');
console.log(`  Query: ${githubQuery2.query}`);
console.log(`  Strategy: ${githubQuery2.strategy}`);

const webQuery2 = optimizeWebQuery(description2, 'app', {
  includeYear: true,
  focusOn: 'code'
});

console.log('\nWeb Query:');
console.log(`  Query: ${webQuery2.query}`);
console.log(`  Strategy: ${webQuery2.strategy}`);

// Test Case 3: Dashboard with Analytics
console.log('\n\n📊 Test Case 3: Dashboard with Analytics');
console.log('-'.repeat(80));

const description3 = 'An admin dashboard with charts, graphs, and real-time analytics';

const githubQuery3 = optimizeGitHubQuery(description3, 'dashboard', {
  minStars: 20,
  language: 'typescript',
  includeTopics: true
});

console.log('GitHub Query:');
console.log(`  Query: ${githubQuery3.query}`);
console.log(`  Strategy: ${githubQuery3.strategy}`);

const webQuery3 = optimizeWebQuery(description3, 'dashboard', {
  includeYear: true,
  focusOn: 'design'
});

console.log('\nWeb Query:');
console.log(`  Query: ${webQuery3.query}`);
console.log(`  Strategy: ${webQuery3.strategy}`);

// Test Case 4: Chat Application
console.log('\n\n💬 Test Case 4: Chat Application');
console.log('-'.repeat(80));

const description4 = 'A real-time chat app with message history and user profiles';

const githubQuery4 = optimizeGitHubQuery(description4, 'chat', {
  minStars: 20,
  language: 'typescript',
  includeTopics: true
});

console.log('GitHub Query:');
console.log(`  Query: ${githubQuery4.query}`);
console.log(`  Strategy: ${githubQuery4.strategy}`);

const webQuery4 = optimizeWebQuery(description4, 'chat', {
  includeYear: true,
  focusOn: 'architecture'
});

console.log('\nWeb Query:');
console.log(`  Query: ${webQuery4.query}`);
console.log(`  Strategy: ${webQuery4.strategy}`);

console.log('\n' + '='.repeat(80));
console.log('✅ All tests completed!\n');
console.log('Expected improvements:');
console.log('  ✓ Domain keywords preserved (calendar, checklist, todo, task, etc.)');
console.log('  ✓ Synonym expansion for better coverage');
console.log('  ✓ Cleaner queries without redundant terms');
console.log('  ✓ More relevant search results');
