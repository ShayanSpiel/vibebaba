/**
 * Simple script to create user with minimal fields
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const pb = new PocketBase(PB_URL);

async function createUser() {
  console.log('🔧 Creating user with minimal fields...\n');

  const email = 'xhayan@gmail.com';
  const password = 'admin123456'; // Longer password

  try {
    console.log('Attempting to create user...');
    const user = await pb.collection('users').create({
      email: email,
      password: password,
      passwordConfirm: password,
      name: 'Shayan',
    });

    console.log('✅ User created!');
    console.log(JSON.stringify(user, null, 2));

    // Now try to update with role
    console.log('\n🔄 Updating user to admin role...');
    const updated = await pb.collection('users').update(user.id, {
      role: 'admin',
    });

    console.log('✅ Role updated!');
    console.log(`   Email: ${updated.email}`);
    console.log(`   Role: ${updated.role}`);

    console.log('\n🎉 Success! Login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', JSON.stringify(error, null, 2));
  }
}

createUser().catch(console.error);
