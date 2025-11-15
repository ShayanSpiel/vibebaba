#!/usr/bin/env tsx
/**
 * Recreate project_settings_memory collection with correct schema
 * Run: npx tsx scripts/recreate-project-settings-collection.ts
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@vibebaba.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin1234567890';

async function recreateCollection() {
  const pb = new PocketBase(PB_URL);

  try {
    // Authenticate as admin
    console.log('[Recreate] Authenticating as admin...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('[Recreate] ✅ Authenticated');

    // Try to delete existing collection
    try {
      await pb.collections.delete('project_settings_memory');
      console.log('[Recreate] 🗑️  Deleted existing collection');
    } catch (error: any) {
      if (error.status === 404) {
        console.log('[Recreate] ℹ️  Collection does not exist (will create new)');
      } else {
        throw error;
      }
    }

    // Create collection with correct schema
    const collection = await pb.collections.create({
      name: 'project_settings_memory',
      type: 'base',
      schema: [
        {
          name: 'projectId',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 100,
            pattern: '',
          },
        },
        {
          name: 'userId',
          type: 'text', // ✅ TEXT, not relation
          required: true,
          options: {
            min: 1,
            max: 100,
            pattern: '',
          },
        },
        {
          name: 'projectName',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 500,
            pattern: '',
          },
        },
        {
          name: 'initialPrompt',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: null,
            pattern: '',
          },
        },
        {
          name: 'stylingConfig',
          type: 'json',
          required: false,
          options: {
            maxSize: 2000000, // 2MB max for styling config JSON
          },
        },
        {
          name: 'timestamp',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 100,
            pattern: '',
          },
        },
        {
          name: 'updatedAt',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 100,
            pattern: '',
          },
        },
      ],
      indexes: [
        'CREATE INDEX idx_projectId ON project_settings_memory (projectId)',
        'CREATE INDEX idx_userId ON project_settings_memory (userId)',
      ],
      listRule: '@request.auth.id != "" && userId = @request.auth.id',
      viewRule: '@request.auth.id != "" && userId = @request.auth.id',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != "" && userId = @request.auth.id',
      deleteRule: '@request.auth.id != "" && userId = @request.auth.id',
    });

    console.log('[Recreate] ✅ Collection created successfully');
    console.log('[Recreate] Collection ID:', collection.id);
    console.log('[Recreate] Collection name:', collection.name);

    // Verify schema
    const userIdField = collection.schema.find((f: any) => f.name === 'userId');
    console.log('[Recreate] ✅ Verification:');
    console.log('[Recreate]   - userId type:', userIdField.type);
    console.log('[Recreate]   - Schema is correct!');
  } catch (error: any) {
    console.error('[Recreate] ❌ Error:', error.message);
    if (error.data) {
      console.error('[Recreate] Details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

recreateCollection();
