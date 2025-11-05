/**
 * Force set admin role for all users with xhayan@gmail.com
 * This bypasses authentication and directly updates the database
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

async function forceSetAdmin() {
  console.log('🔧 Force setting admin role for xhayan@gmail.com...\n');

  try {
    // First, let's try to get the PocketBase admin credentials from env
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@admin.com';
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin1234567890';

    const pb = new PocketBase(PB_URL);

    console.log('Attempting to authenticate as PocketBase admin...');

    try {
      // Try to auth as admin
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      console.log('✅ Authenticated as PocketBase admin\n');
    } catch (adminAuthError) {
      console.log('⚠️  Could not auth as PocketBase admin, trying direct API access...\n');
    }

    // Get all users
    console.log('📋 Fetching all users...');
    const users = await pb.collection('users').getFullList();

    console.log(`Found ${users.length} user(s)\n`);

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\n💡 You need to create an account first:');
      console.log('   1. Go to http://localhost:3000');
      console.log('   2. Sign up with xhayan@gmail.com');
      console.log('   3. Then run this script again');
      return;
    }

    // Find xhayan@gmail.com
    const targetUser = users.find(u => u.email === 'xhayan@gmail.com');

    if (!targetUser) {
      console.log('❌ User xhayan@gmail.com not found!');
      console.log('\nExisting users:');
      users.forEach(u => console.log(`   - ${u.email} (role: ${u.role || 'none'})`));
      return;
    }

    console.log('Found user:');
    console.log(`   Email: ${targetUser.email}`);
    console.log(`   Current Role: ${targetUser.role || 'NONE'}`);
    console.log(`   ID: ${targetUser.id}\n`);

    if (targetUser.role === 'admin') {
      console.log('✅ User already has admin role!');
      console.log('\n🔍 If you still cant access /admin, the issue is with cookies.');
      console.log('   Try:');
      console.log('   1. Logout from your app');
      console.log('   2. Clear browser cookies/cache');
      console.log('   3. Login again');
      console.log('   4. Check browser console for errors');
      return;
    }

    // Update to admin
    console.log('🔄 Updating role to admin...');
    const updated = await pb.collection('users').update(targetUser.id, {
      role: 'admin'
    });

    console.log('✅ Successfully updated!');
    console.log(`   New role: ${updated.role}\n`);

    console.log('🎉 Done! Now:');
    console.log('   1. Logout from your app');
    console.log('   2. Login again with xhayan@gmail.com');
    console.log('   3. Try accessing http://localhost:3000/admin');

  } catch (error: any) {
    console.error('❌ Error:', error.message);

    if (error.status === 403) {
      console.error('\n💡 Permission denied. You may need to:');
      console.error('   - Set up PocketBase admin credentials');
      console.error('   - Or modify collection rules in PocketBase');
    }

    console.error('\nFull error:', error);
  }
}

forceSetAdmin().catch(console.error);
