/**
 * Script to check users collection schema
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const pb = new PocketBase(PB_URL);

async function checkSchema() {
  console.log('🔧 Checking PocketBase collections...\n');

  try {
    // Get collections
    const collections = await pb.collections.getFullList();

    console.log(`Found ${collections.length} collection(s):\n`);

    collections.forEach((col) => {
      console.log(`📁 ${col.name} (${col.type})`);
      console.log(`   ID: ${col.id}`);

      if (col.schema && col.schema.length > 0) {
        console.log('   Fields:');
        col.schema.forEach((field: any) => {
          console.log(`   - ${field.name} (${field.type})${field.required ? ' [required]' : ''}`);
        });
      }
      console.log('');
    });

    // Find users collection
    const usersCol = collections.find((c) => c.name === 'users');
    if (usersCol) {
      console.log('✅ Users collection found!');
      const hasRole = usersCol.schema?.some((f: any) => f.name === 'role');
      console.log(`   Has "role" field: ${hasRole ? '✅ Yes' : '❌ No'}`);
    } else {
      console.log('❌ Users collection not found!');
    }
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

checkSchema().catch(console.error);
