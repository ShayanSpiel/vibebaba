/**
 * Script to update existing user to admin role
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const pb = new PocketBase(PB_URL);

async function updateToAdmin() {
  const adminEmail = 'xhayan@gmail.com';

  console.log('🔧 Updating user to admin role...\n');

  try {
    // Get all users to find xhayan@gmail.com
    console.log(`📋 Searching for user: ${adminEmail}`);

    const records = await pb.collection('users').getFullList({
      filter: `email = "${adminEmail}"`
    });

    if (records.length === 0) {
      console.error('❌ User not found!');
      console.log('\n💡 Please make sure you have an account with this email.');
      process.exit(1);
    }

    const user = records[0];
    console.log(`✅ Found user: ${user.email}`);
    console.log(`   Current role: ${user.role || 'none'}`);
    console.log(`   ID: ${user.id}\n`);

    // Update to admin role
    console.log('🔄 Updating role to admin...');
    const updated = await pb.collection('users').update(user.id, {
      role: 'admin'
    });

    console.log('✅ Successfully updated to admin!');
    console.log(`   Email: ${updated.email}`);
    console.log(`   Role: ${updated.role}`);
    console.log(`\n🎉 You can now access: http://localhost:3000/admin`);

  } catch (error: any) {
    console.error('❌ Update failed:', error.message);

    if (error.status === 404) {
      console.error('\n💡 Tip: Make sure the users collection has a "role" field');
      console.error('   Add it in PocketBase admin panel at http://localhost:8090/_/');
    }

    process.exit(1);
  }
}

updateToAdmin().catch(console.error);
