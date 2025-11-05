/**
 * Script to setup admin user in PocketBase
 *
 * Usage: npx tsx scripts/setup-pocketbase-admin.ts
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const pb = new PocketBase(PB_URL);

async function setupAdmin() {
  console.log('🔧 Setting up PocketBase admin user...\n');

  try {
    // Admin credentials
    const adminEmail = 'xhayan@gmail.com';
    const adminPassword = 'admin123'; // Change this!
    const adminName = 'Shayan';

    // Check if users collection has role field
    console.log('📋 Checking users collection...');

    // Try to create/update the user
    try {
      // Try to create new user with admin role
      console.log(`👤 Creating admin user: ${adminEmail}`);

      const user = await pb.collection('users').create({
        email: adminEmail,
        password: adminPassword,
        passwordConfirm: adminPassword,
        name: adminName,
        emailVisibility: true,
        verified: true,
        totalTokens: 100000, // Give admin 100k tokens
        usedTokens: 0,
        dailyTokens: 10000,
        role: 'admin' // Set as admin
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);

    } catch (createError: any) {
      if (createError.status === 400 && createError.message.includes('email')) {
        console.log('⚠️  User already exists. Trying to update...');

        // Get existing user
        const records = await pb.collection('users').getFullList({
          filter: `email = "${adminEmail}"`
        });

        if (records.length > 0) {
          const userId = records[0].id;

          // Update to admin role
          await pb.collection('users').update(userId, {
            role: 'admin'
          });

          console.log('✅ User updated to admin role!');
          console.log(`   ID: ${userId}`);
          console.log(`   Email: ${adminEmail}`);
        }
      } else {
        throw createError;
      }
    }

    console.log('\n🎉 Setup complete!');
    console.log('\n📝 You can now login with:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`\n🚀 Go to: http://localhost:3000/admin`);

  } catch (error: any) {
    console.error('❌ Setup failed:', error);
    console.error('\nError details:', error.message);

    if (error.status === 404) {
      console.error('\n💡 Tip: Make sure PocketBase is running on http://localhost:8090');
      console.error('   If the users collection doesn\'t have a "role" field, add it in PocketBase admin panel:');
      console.error('   1. Go to http://localhost:8090/_/');
      console.error('   2. Open "users" collection');
      console.error('   3. Add a "role" field (type: text, default: "user")');
    }

    process.exit(1);
  }
}

setupAdmin().catch(console.error);
