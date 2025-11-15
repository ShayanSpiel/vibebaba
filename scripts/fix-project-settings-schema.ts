#!/usr/bin/env tsx
/**
 * Fix project_settings_memory collection schema
 * Changes userId from relation to text field
 * Run: npx tsx scripts/fix-project-settings-schema.ts
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@vibebaba.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin1234567890';

async function fixSchema() {
  const pb = new PocketBase(PB_URL);

  try {
    // Authenticate as admin
    console.log('[Fix] Authenticating as admin...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('[Fix] ✅ Authenticated');

    // Get the collection
    const collection = await pb.collections.getOne('project_settings_memory');
    console.log('[Fix] ✅ Found collection');

    // Update the schema - change userId from relation to text
    const updatedSchema = collection.schema.map((field: any) => {
      if (field.name === 'userId') {
        console.log('[Fix] 🔧 Changing userId from relation to text...');
        return {
          ...field,
          type: 'text',
          options: {
            min: 1,
            max: 100,
            pattern: '',
          },
        };
      }
      return field;
    });

    // Update the collection
    await pb.collections.update(collection.id, {
      schema: updatedSchema,
    });

    console.log('[Fix] ✅ Schema updated successfully!');
    console.log('[Fix] userId field is now type: text');

    // Verify the change
    const updated = await pb.collections.getOne('project_settings_memory');
    const userIdField = updated.schema.find((f: any) => f.name === 'userId');
    console.log('[Fix] ✅ Verification:');
    console.log('[Fix]   - userId type:', userIdField.type);
    console.log('[Fix]   - userId options:', userIdField.options);
  } catch (error: any) {
    console.error('[Fix] ❌ Error:', error.message);
    if (error.data) {
      console.error('[Fix] Details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

fixSchema();
