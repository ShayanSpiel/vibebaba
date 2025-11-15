/**
 * Script to check user details after authentication
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const pb = new PocketBase(PB_URL);

async function checkUser() {
  const email = 'xhayan@gmail.com';
  const password = 'admin123456'; // Try common password

  console.log('🔧 Authenticating and checking user...\n');

  try {
    // Try to authenticate
    console.log(`📋 Attempting to login as ${email}...`);

    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      console.log('✅ Successfully authenticated!\n');

      console.log('User Details:');
      console.log('─'.repeat(50));
      console.log(`ID: ${authData.record.id}`);
      console.log(`Email: ${authData.record.email}`);
      console.log(`Name: ${authData.record.name || 'N/A'}`);
      console.log(`Role: ${authData.record.role || 'NONE/UNDEFINED'}`);
      console.log(`Verified: ${authData.record.verified || false}`);
      console.log('─'.repeat(50));

      console.log('\nFull user object:');
      console.log(JSON.stringify(authData.record, null, 2));

      // Check if role is admin
      if (authData.record.role === 'admin') {
        console.log('\n✅ User has admin role!');
      } else {
        console.log(`\n⚠️  User role is "${authData.record.role || 'undefined'}" - NOT admin`);
        console.log('\nTrying to update role to admin...');

        const updated = await pb.collection('users').update(authData.record.id, {
          role: 'admin',
        });

        console.log('✅ Role updated to admin!');
        console.log(`New role: ${updated.role}`);
      }
    } catch (authError: any) {
      if (authError.status === 400) {
        console.log('❌ Authentication failed - incorrect password');
        console.log('\nPlease try with the correct password.');
        console.log('You can also check all users by looking at the PocketBase admin panel:');
        console.log('http://localhost:8090/_/\n');
      } else {
        throw authError;
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
  }
}

checkUser().catch(console.error);
