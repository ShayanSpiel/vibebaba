/**
 * Script to check and fix admin role
 * Usage: npx tsx scripts/check-and-fix-admin.ts <password>
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const pb = new PocketBase(PB_URL);

const email = 'xhayan@gmail.com';
const password = process.argv[2];

if (!password) {
  console.error('❌ Please provide your password as argument');
  console.error('Usage: npx tsx scripts/check-and-fix-admin.ts <your-password>');
  process.exit(1);
}

async function checkAndFix() {
  console.log('🔧 Checking user role...\n');

  try {
    // Authenticate
    console.log(`📋 Logging in as ${email}...`);
    const authData = await pb.collection('users').authWithPassword(email, password);
    console.log('✅ Authentication successful!\n');

    const user = authData.record;

    console.log('Current User Info:');
    console.log('─'.repeat(50));
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name || 'N/A'}`);
    console.log(`Current Role: ${user.role || 'UNDEFINED'}`);
    console.log('─'.repeat(50));

    if (user.role === 'admin') {
      console.log('\n✅ You already have admin role!');
      console.log('\n🔍 The issue might be with cookies. Try:');
      console.log('   1. Logout from the app');
      console.log('   2. Clear your browser cookies');
      console.log('   3. Login again');
      console.log('   4. Try accessing /admin');
    } else {
      console.log(`\n⚠️  Your role is: "${user.role || 'undefined'}" - updating to admin...`);

      const updated = await pb.collection('users').update(user.id, {
        role: 'admin',
      });

      console.log('✅ Role updated to admin!');
      console.log(`New role: ${updated.role}`);
      console.log('\n🎉 You should now be able to access /admin');
      console.log('   Please logout and login again to refresh your session.');
    }
  } catch (error: any) {
    if (error.status === 400) {
      console.error('❌ Incorrect password!');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

checkAndFix().catch(console.error);
