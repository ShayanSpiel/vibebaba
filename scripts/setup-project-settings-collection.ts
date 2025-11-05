#!/usr/bin/env tsx
/**
 * Setup script for project_settings_memory collection
 * Run: npx tsx scripts/setup-project-settings-collection.ts
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@vibebaba.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin1234567890';

async function setupCollection() {
  const pb = new PocketBase(PB_URL);

  try {
    // Authenticate as admin
    console.log('[Setup] Authenticating as admin...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('[Setup] ✅ Authenticated');

    // Check if collection exists
    try {
      const existing = await pb.collections.getOne('project_settings_memory');
      console.log('[Setup] ✅ Collection already exists');
      console.log('[Setup] Schema:', JSON.stringify(existing.schema, null, 2));
      return;
    } catch (error: any) {
      if (error.status === 404) {
        console.log('[Setup] Collection does not exist, creating...');
      } else {
        throw error;
      }
    }

    // Create collection
    const collection = await pb.collections.create({
      name: 'project_settings_memory',
      type: 'base',
      schema: [
        {
          name: 'projectId',
          type: 'text',
          required: true,
          options: {
            min: null,
            max: null,
            pattern: '',
          },
        },
        {
          name: 'userId',
          type: 'text',
          required: true,
          options: {
            min: null,
            max: null,
            pattern: '',
          },
        },
        {
          name: 'projectName',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: null,
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
          options: {},
        },
        {
          name: 'timestamp',
          type: 'date',
          required: false,
          options: {
            min: '',
            max: '',
          },
        },
        {
          name: 'updatedAt',
          type: 'date',
          required: false,
          options: {
            min: '',
            max: '',
          },
        },
      ],
      indexes: [
        'CREATE INDEX idx_projectId ON project_settings_memory (projectId)',
        'CREATE INDEX idx_userId ON project_settings_memory (userId)',
      ],
      listRule: '@request.auth.id != "" && userId = @request.auth.id',
      viewRule: '@request.auth.id != "" && userId = @request.auth.id',
      createRule: '@request.auth.id != "" && userId = @request.auth.id',
      updateRule: '@request.auth.id != "" && userId = @request.auth.id',
      deleteRule: '@request.auth.id != "" && userId = @request.auth.id',
    });

    console.log('[Setup] ✅ Collection created successfully');
    console.log('[Setup] Collection ID:', collection.id);
    console.log('[Setup] Collection name:', collection.name);
  } catch (error) {
    console.error('[Setup] ❌ Error:', error);
    process.exit(1);
  }
}

setupCollection();
