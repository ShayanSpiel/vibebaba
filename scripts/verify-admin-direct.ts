/**
 * Direct verification of admin user in PocketBase
 * This connects directly to PocketBase database
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

async function verifyAdmin() {
  console.log('🔍 Direct PocketBase verification...\n');
  console.log(`Connecting to: ${PB_URL}\n`);

  const pb = new PocketBase(PB_URL);

  try {
    // Try to get ALL users without authentication
    console.log('Fetching users collection (no auth)...');
    const users = await pb.collection('users').getFullList({
      sort: '-created',
      requestKey: null, // Bypass request deduplication
    });

    console.log(`\n✅ Found ${users.length} user(s) in PocketBase:\n`);

    if (users.length === 0) {
      console.log('❌ No users found!');
      console.log('\nPossible reasons:');
      console.log('1. Users collection API rules prevent public access');
      console.log('2. No users actually exist');
      console.log('\nCheck PocketBase admin panel: http://localhost:8090/_/');
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role || '❌ NO ROLE FIELD'}`);
      console.log(`   Verified: ${user.verified || false}`);
      console.log(`   Created: ${user.created}`);

      if (user.email === 'xhayan@gmail.com') {
        console.log(`   ${'='.repeat(50)}`);
        console.log(`   THIS IS YOUR USER!`);
        if (user.role === 'admin') {
          console.log(`   ✅ Has admin role - should work!`);
        } else {
          console.log(`   ❌ Role is "${user.role || 'undefined'}" - NOT admin!`);
        }
        console.log(`   ${'='.repeat(50)}`);
      }
      console.log('');
    });
  } catch (error: any) {
    console.error('❌ Error accessing PocketBase:', error.message);

    if (error.status === 403 || error.status === 401) {
      console.error('\n🔒 Collection access denied!');
      console.error('The users collection API rules might require authentication.');
      console.error('\nTo fix:');
      console.error('1. Go to: http://localhost:8090/_/');
      console.error('2. Login to PocketBase admin');
      console.error('3. Go to Collections → users → API Rules');
      console.error('4. Temporarily set List/View rule to empty or allow all');
    }

    if (error.status === 404) {
      console.error('\n❌ Users collection not found!');
      console.error('Check if the collection exists in PocketBase admin panel');
    }
  }
}

verifyAdmin().catch(console.error);
