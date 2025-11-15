/**
 * Create Settings Collection in PocketBase
 *
 * This script creates the "settings" collection required for admin pricing management.
 *
 * Usage:
 *   npx ts-node scripts/create-settings-collection.ts
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function createSettingsCollection() {
  console.log('🔧 Creating settings collection...\n');

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ Error: Admin credentials not found in environment variables');
    console.error('   Please add to .env:');
    console.error('   POCKETBASE_ADMIN_EMAIL=admin@yourdomain.com');
    console.error('   POCKETBASE_ADMIN_PASSWORD=your-password');
    process.exit(1);
  }

  const pb = new PocketBase(PB_URL);

  try {
    // Authenticate as admin
    console.log('🔐 Authenticating with PocketBase...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Authenticated successfully\n');

    // Check if collection already exists
    try {
      await pb.collection('settings').getList(1, 1);
      console.log('⚠️  Settings collection already exists!');
      console.log('   No action needed.\n');
      process.exit(0);
    } catch (error) {
      // Collection doesn't exist, continue to create it
    }

    // Create the collection
    console.log('📦 Creating settings collection...');

    const collection = await pb.collections.create({
      name: 'settings',
      type: 'base',
      schema: [
        {
          name: 'key',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 255,
          },
        },
        {
          name: 'value',
          type: 'json',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
          required: false,
          options: {
            max: 500,
          },
        },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_settings_key ON settings (key)'],
      listRule: null, // Only admins can list
      viewRule: null, // Only admins can view
      createRule: null, // Only admins can create
      updateRule: null, // Only admins can update
      deleteRule: null, // Only admins can delete
    });

    console.log('✅ Settings collection created successfully!\n');
    console.log('📊 Collection details:');
    console.log('   - Name:', collection.name);
    console.log('   - Type:', collection.type);
    console.log('   - Fields: key (text), value (json), description (text)');
    console.log('   - Auto fields: id, created, updated (managed by PocketBase)');
    console.log('   - Unique index on "key" field');
    console.log('   - Admin-only access rules\n');

    console.log('🎉 Setup complete! You can now save pricing changes in the admin panel.\n');
  } catch (error: any) {
    console.error('❌ Error creating settings collection:', error.message);
    if (error.data) {
      console.error('   Details:', JSON.stringify(error.data, null, 2));
    }
    console.error('\n💡 Manual setup instructions:');
    console.error('   1. Go to http://localhost:8090/_/');
    console.error('   2. Click "Collections" → "New Collection"');
    console.error('   3. Name: settings, Type: Base');
    console.error('   4. Add fields:');
    console.error('      - key (Text, Required, Unique)');
    console.error('      - value (JSON, Required)');
    console.error('      - description (Text, Optional)');
    console.error('      - updated (Date, Optional)\n');
    process.exit(1);
  }
}

createSettingsCollection();
