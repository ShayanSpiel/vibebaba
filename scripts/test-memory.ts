/**
 * Memory Service Test Script
 *
 * Tests the memory MCP server integration
 *
 * Run: npx tsx scripts/test-memory.ts
 */

import { getMemoryService } from '../lib/services/memory-service';

async function testMemoryService() {
  console.log('🧪 Testing Memory Service...\n');

  const memoryService = getMemoryService();
  const testUserId = 'test_user_123';
  const testProjectId = 'test_project_456';

  try {
    // Test 1: Store and retrieve user preferences
    console.log('Test 1: User Preferences');
    console.log('------------------------');

    await memoryService.storeUserPreference(testUserId, 'prefersDarkMode', true);
    await memoryService.storeUserPreference(testUserId, 'designStyle', 'modern');
    await memoryService.storeUserPreference(testUserId, 'favoriteComponents', ['navbar', 'hero', 'footer']);

    const userPrefs = await memoryService.getUserPreferences(testUserId);
    console.log('✅ Stored and retrieved user preferences:', userPrefs);
    console.log('');

    // Test 2: Store and retrieve project context
    console.log('Test 2: Project Context');
    console.log('------------------------');

    await memoryService.storeProjectContext(testProjectId, {
      projectId: testProjectId,
      description: 'Test AI chatbot landing page',
      plan: '## Features\n- Hero section\n- Pricing\n- CTA',
      designDecisions: ['Dark mode', 'Gradient backgrounds'],
      componentChoices: ['hero', 'pricing', 'cta'],
      technicalStack: ['React', 'Tailwind', 'Ant Design'],
      timestamp: Date.now()
    });

    const projectContext = await memoryService.getProjectContext(testProjectId);
    console.log('✅ Stored and retrieved project context:', projectContext);
    console.log('');

    // Test 3: Store and retrieve conversation history
    console.log('Test 3: Conversation History');
    console.log('------------------------');

    const sessionId = `${testUserId}_${testProjectId}`;

    await memoryService.storeConversation(sessionId, {
      role: 'user',
      content: 'Can you make it dark mode?',
      timestamp: Date.now()
    });

    await memoryService.storeConversation(sessionId, {
      role: 'assistant',
      content: 'Sure! I\'ll update the theme to dark mode.',
      timestamp: Date.now()
    });

    const conversation = await memoryService.getConversationHistory(sessionId);
    console.log('✅ Stored and retrieved conversation:', conversation);
    console.log('');

    // Test 4: Link entities
    console.log('Test 4: Entity Relations');
    console.log('------------------------');

    await memoryService.linkEntities(
      `user_${testUserId}`,
      `project_${testProjectId}`,
      'owns'
    );
    console.log('✅ Linked user to project');
    console.log('');

    // Test 5: Search memory
    console.log('Test 5: Memory Search');
    console.log('------------------------');

    const searchResults = await memoryService.searchMemory('dark');
    console.log('✅ Search results for "dark":', searchResults.length, 'entities found');
    console.log('');

    // Test 6: Get knowledge graph
    console.log('Test 6: Knowledge Graph');
    console.log('------------------------');

    const graph = await memoryService.getKnowledgeGraph();
    console.log('✅ Knowledge graph:', JSON.stringify(graph, null, 2));
    console.log('');

    // Test 7: Add observation
    console.log('Test 7: Add Observation');
    console.log('------------------------');

    await memoryService.addObservation(
      `project_${testProjectId}`,
      'prototype_generated: 2025-01-15, 3 files'
    );
    console.log('✅ Added observation to project');
    console.log('');

    // Cleanup
    console.log('Cleanup: Deleting test data');
    console.log('------------------------');

    await memoryService.clearUserMemory(testUserId);
    await memoryService.clearProjectMemory(testProjectId);
    await memoryService.clearSession(sessionId);
    console.log('✅ Cleaned up test data');
    console.log('');

    console.log('🎉 All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testMemoryService();
