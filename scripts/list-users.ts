/**
 * Script to list all users in PocketBase
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const pb = new PocketBase(PB_URL);

async function listUsers() {
  console.log('📋 Listing all users in PocketBase...\n');

  try {
    const records = await pb.collection('users').getFullList({
      sort: '-created',
    });

    if (records.length === 0) {
      console.log('⚠️  No users found in the database.');
      return;
    }

    console.log(`Found ${records.length} user(s):\n`);

    records.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role || 'none'}`);
      console.log(`   Created: ${user.created}`);
      console.log('');
    });
  } catch (error: any) {
    console.error('❌ Failed to list users:', error.message);
    process.exit(1);
  }
}

listUsers().catch(console.error);
