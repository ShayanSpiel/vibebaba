/**
 * Script to create admin user in PocketBase
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const pb = new PocketBase(PB_URL);

async function createAdmin() {
  const adminEmail = 'xhayan@gmail.com';
  const adminPassword = 'admin123'; // You should change this after first login
  const adminName = 'Shayan';

  console.log('🔧 Creating admin user in PocketBase...\n');

  try {
    // Check if user already exists
    console.log(`📋 Checking if ${adminEmail} exists...`);
    const existing = await pb.collection('users').getFullList({
      filter: `email = "${adminEmail}"`,
    });

    if (existing.length > 0) {
      console.log('⚠️  User already exists. Updating to admin role...');
      const updated = await pb.collection('users').update(existing[0].id, {
        role: 'admin',
      });
      console.log('✅ User updated to admin!');
      console.log(`   Email: ${updated.email}`);
      console.log(`   Role: ${updated.role}`);
    } else {
      // Create new admin user
      console.log('👤 Creating new admin user...');
      const user = await pb.collection('users').create({
        email: adminEmail,
        password: adminPassword,
        passwordConfirm: adminPassword,
        name: adminName,
        emailVisibility: true,
        verified: true,
        totalTokens: 100000,
        usedTokens: 0,
        dailyTokens: 10000,
        role: 'admin',
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
    }

    console.log('\n🎉 Setup complete!');
    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n🚀 Access admin panel at: http://localhost:3000/admin');
  } catch (error: any) {
    console.error('❌ Failed to create admin:', error.message);

    if (error.data) {
      console.error('\nError details:', JSON.stringify(error.data, null, 2));
    }

    if (error.status === 400) {
      console.error('\n💡 Possible issues:');
      console.error('   - The users collection might be missing required fields');
      console.error('   - Check PocketBase admin panel at http://localhost:8090/_/');
    }

    process.exit(1);
  }
}

createAdmin().catch(console.error);
