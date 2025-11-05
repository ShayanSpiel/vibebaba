/**
 * Check user with PocketBase admin authentication
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || '';

async function checkWithAdmin() {
  console.log('🔧 Authenticating with PocketBase admin credentials...\n');

  const pb = new PocketBase(PB_URL);

  try {
    // Authenticate as PocketBase admin
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Authenticated as PocketBase admin\n');

    // Get ALL users
    console.log('📋 Fetching users collection...');
    const users = await pb.collection('users').getFullList({
      sort: '-created'
    });

    console.log(`\nFound ${users.length} user(s):\n`);

    if (users.length === 0) {
      console.log('❌ No users in database!');
      console.log('\nYou need to create a user account first.');
      return;
    }

    for (let index = 0; index < users.length; index++) {
      const user = users[index];
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role || '❌ NO ROLE'}`);
      console.log(`   Verified: ${user.verified || false}`);

      if (user.email === 'xhayan@gmail.com') {
        console.log(`\n   ${'='.repeat(60)}`);
        console.log(`   ⭐ THIS IS YOUR USER!`);

        if (user.role === 'admin') {
          console.log(`   ✅ Has admin role`);
          console.log(`\n   The issue is with COOKIES/SESSION, not the database!`);
          console.log(`   \n   Troubleshooting steps:`);
          console.log(`   1. Open browser DevTools (F12)`);
          console.log(`   2. Go to Application → Cookies → http://localhost:3000`);
          console.log(`   3. Check if "pb_auth" cookie exists`);
          console.log(`   4. If it exists, check its value contains your user data`);
          console.log(`   5. Try: Logout → Clear cookies → Login again`);
        } else {
          console.log(`   ❌ Role is: "${user.role || 'undefined'}" - NOT admin`);
          console.log(`\n   Updating to admin...`);

          const updated = await pb.collection('users').update(user.id, {
            role: 'admin'
          });

          console.log(`   ✅ Updated! New role: ${updated.role}`);
          console.log(`   Now logout and login again.`);
        }
        console.log(`   ${'='.repeat(60)}`);
      }
      console.log('');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);

    if (error.status === 400 || error.status === 401) {
      console.error('\n❌ Admin authentication failed!');
      console.error('Check your POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in .env.local');
    }
  }
}

checkWithAdmin().catch(console.error);
