// scripts/test-conversation-memory.ts

import {
  conversationMemoryStore,
  addUserMessage,
  addAssistantMessage,
  getConversationContext
} from '../lib/memory/conversation-memory';

async function testMemory() {
  console.log('🧪 Testing Conversation Memory (Phase 2 - LangChain Memory Management)...\n');

  const projectId = 'test-project-123';

  // Test 1: Add messages
  console.log('1️⃣  Adding messages...');
  addUserMessage(projectId, 'Create a landing page with dark mode');
  addAssistantMessage(projectId, 'Generated landing page with dark mode theme', 'frontend');

  addUserMessage(projectId, 'Add a contact form to it');
  addAssistantMessage(projectId, 'Added contact form with dark mode styling', 'frontend');

  addUserMessage(projectId, 'Make the hero section more modern');
  addAssistantMessage(projectId, 'Updated hero section with modern gradient background', 'frontend');

  console.log('✅ Added 6 messages (3 user, 3 assistant)\n');

  // Test 2: Get context
  console.log('2️⃣  Getting conversation context:');
  const context = getConversationContext(projectId);
  console.log(context);

  // Test 3: Generate summary
  console.log('\n3️⃣  Generating summary...');
  const summary = await conversationMemoryStore.generateSummary(projectId);
  console.log('Summary:', summary);

  // Test 4: Check entities
  const memory = conversationMemoryStore.getMemory(projectId);
  console.log('\n4️⃣  Extracted entities:');
  console.log('Components:', memory.entities.components);
  console.log('Features:', memory.entities.features);
  console.log('Design:', memory.entities.designDecisions);

  // Test 5: Get formatted history (different modes)
  console.log('\n5️⃣  Testing different history modes:');

  console.log('\n📝 Window mode (last 3 messages):');
  const windowHistory = conversationMemoryStore.getFormattedHistory(projectId, 'window', 3);
  console.log(windowHistory);

  console.log('\n📝 Full mode (all messages):');
  const fullHistory = conversationMemoryStore.getFormattedHistory(projectId, 'full');
  console.log(fullHistory);

  console.log('\n📝 Summary mode:');
  const summaryHistory = conversationMemoryStore.getFormattedHistory(projectId, 'summary');
  console.log(summaryHistory);

  // Test 6: Entities summary
  console.log('\n6️⃣  Entities summary for AI prompt:');
  const entitiesSummary = conversationMemoryStore.getEntitiesSummary(projectId);
  console.log(entitiesSummary);

  console.log('\n✅ Memory test complete!');
  console.log('\nMemory structure:');
  console.log('- Total messages:', memory.messages.length);
  console.log('- User messages:', memory.messages.filter(m => m.role === 'user').length);
  console.log('- Assistant messages:', memory.messages.filter(m => m.role === 'assistant').length);
  console.log('- Components tracked:', memory.entities.components.length);
  console.log('- Features tracked:', memory.entities.features.length);
  console.log('- Design decisions tracked:', memory.entities.designDecisions.length);
}

testMemory().catch(console.error);
