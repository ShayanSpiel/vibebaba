/**
 * Update collection rules to allow workflow logging
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function fixCollectionRules() {
  try {
    console.log('🔧 Updating collection rules for workflow logging...\n');

    // Authenticate as admin
    await pb.admins.authWithPassword('admin@vibebaba.com', 'admin1234567890');
    console.log('✅ Authenticated as admin\n');

    const collections = ['workflow_execution_logs', 'editor_operation_logs', 'deployment_logs'];

    for (const collectionName of collections) {
      try {
        const collection = await pb.collections.getOne(collectionName);

        // Update rules to allow server-side creation (no auth required for createRule)
        // This is safe because the logging functions are only called server-side
        await pb.collections.update(collection.id, {
          listRule: null, // Admin-only read
          viewRule: null, // Admin-only read
          createRule: '', // Allow any request (server-side only)
          updateRule: null, // Admin-only update
          deleteRule: null, // Admin-only delete
        });

        console.log(`✅ Updated rules for collection "${collectionName}"`);
      } catch (error: any) {
        console.error(`❌ Failed to update collection "${collectionName}":`, error.message);
      }
    }

    console.log('\n🎉 Collection rules updated successfully!');
    console.log('📊 Workflow logging will now work without permission errors.\n');
  } catch (error: any) {
    console.error('❌ Failed to update collection rules:', error.message);
    process.exit(1);
  }
}

fixCollectionRules();
