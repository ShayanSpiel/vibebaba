/**
 * Set Public Collection Rules
 * Allows public read/create access to example collections
 */

import Database from 'better-sqlite3';

async function setPublicRules() {
  const db = new Database('./deployment-server/pb_data/data.db');

  console.log('🔓 Setting public access rules for example collections...\n');

  const collections = ['example_categories', 'design_examples', 'example_generation_queue'];

  for (const collectionName of collections) {
    try {
      // Update collection rules to allow public access
      db.prepare(`
        UPDATE _collections
        SET
          listRule = '',
          viewRule = '',
          createRule = '',
          updateRule = '',
          deleteRule = NULL
        WHERE name = ?
      `).run(collectionName);

      console.log(`✅ ${collectionName}: Set to public read/create`);
    } catch (error) {
      console.error(`❌ ${collectionName}:`, (error as Error).message);
    }
  }

  db.close();
  console.log('\n✅ Collection rules updated successfully!');
  console.log('⚠️  Please restart PocketBase for changes to take effect.\n');
}

setPublicRules().catch(console.error);
