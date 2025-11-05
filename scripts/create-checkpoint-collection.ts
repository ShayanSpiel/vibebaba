/**
 * Minimal script to create workflow_checkpoints collection
 */

import PocketBase from 'pocketbase';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

async function createCheckpointCollection() {
  try {
    console.log('🔧 Creating workflow_checkpoints collection...\n');

    // Authenticate
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com',
      process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456'
    );
    console.log('✅ Authenticated as admin\n');

    // Try to create with minimal schema
    try {
      const collection = await pb.collections.create({
        name: 'workflow_checkpoints',
        type: 'base',
        schema: [
          {
            name: 'projectId',
            type: 'text',
            required: true
          },
          {
            name: 'description',
            type: 'text',
            required: false
          }
        ]
      });

      console.log('✅ Created minimal collection:', collection.name);

      // Now update with full schema
      await pb.collections.update(collection.id, {
        schema: [
          { name: 'projectId', type: 'text', required: true },
          { name: 'userId', type: 'text', required: false },
          { name: 'userRequest', type: 'text', required: false },
          { name: 'filesSnapshot', type: 'json', required: false, options: { maxSize: 2000000 } }, // 2MB limit
          { name: 'previousFilesSnapshot', type: 'json', required: false, options: { maxSize: 2000000 } }, // 2MB limit
          { name: 'changeScope', type: 'text', required: false },
          { name: 'description', type: 'text', required: false }
        ]
      });

      console.log('✅ Updated collection with full schema');
      console.log('\n🎉 Checkpoint collection ready!\n');

    } catch (error: any) {
      if (error.status === 400) {
        console.log('⚠️  Collection might already exist. Trying to update instead...');

        const collections = await pb.collections.getFullList();
        const existing = collections.find(c => c.name === 'workflow_checkpoints');

        if (existing) {
          console.log('Found existing collection, updating schema...');
          await pb.collections.update(existing.id, {
            schema: [
              { name: 'projectId', type: 'text', required: true },
              { name: 'userId', type: 'text', required: false },
              { name: 'userRequest', type: 'text', required: false },
              { name: 'filesSnapshot', type: 'json', required: false, options: { maxSize: 2000000 } }, // 2MB limit
              { name: 'previousFilesSnapshot', type: 'json', required: false, options: { maxSize: 2000000 } }, // 2MB limit
              { name: 'changeScope', type: 'text', required: false },
              { name: 'description', type: 'text', required: false }
            ]
          });
          console.log('✅ Updated existing collection');
        } else {
          throw new Error('Collection does not exist and cannot be created');
        }
      } else {
        throw error;
      }
    }

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

createCheckpointCollection();
