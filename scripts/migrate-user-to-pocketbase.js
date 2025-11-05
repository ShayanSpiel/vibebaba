// Load environment variables
require("dotenv").config({ path: ".env.local" });

/**
 * Migrate user from SQLite auth.db to PocketBase
 */

const Database = require('better-sqlite3');
const PocketBase = require('pocketbase').default;
const path = require('path');

const pb = new PocketBase('http://localhost:8090');
const dbPath = path.join(process.cwd(), 'data', 'auth.db');

async function migrateUser() {
  console.log('🚀 Starting user migration from SQLite to PocketBase...\n');

  try {
    // 1. Read from SQLite
    console.log('📖 Reading user from SQLite...');
    const db = new Database(dbPath);

    const user = db.prepare('SELECT * FROM user LIMIT 1').get();
    const credits = db.prepare('SELECT * FROM user_credits WHERE userId = ?').get(user.id);

    console.log('Found user:', user.email);
    console.log('Credits:', {
      totalTokens: credits.totalTokens,
      usedTokens: credits.usedTokens,
      dailyTokens: credits.dailyTokens
    });

    // Get transactions and usage before closing DB
    const transactions = db.prepare('SELECT * FROM transactions WHERE userId = ?').all(user.id);
    const usageRecords = db.prepare('SELECT * FROM token_usage WHERE userId = ? LIMIT 100').all(user.id);

    db.close();

    // 2. Check if user already exists in PocketBase
    console.log('\n🔍 Checking if user exists in PocketBase...');

    const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

    // Authenticate as admin
    const authData = await fetch('http://localhost:8090/api/admins/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });
    const auth = await authData.json();
    pb.authStore.save(auth.token, auth.admin);

    let pbUser;
    try {
      const users = await pb.collection('users').getFullList({
        filter: `email = "${user.email}"`
      });

      if (users.length > 0) {
        pbUser = users[0];
        console.log('✅ User already exists in PocketBase');
      }
    } catch (error) {
      console.log('User not found, will create new one');
    }

    // 3. Create or update user in PocketBase
    if (pbUser) {
      console.log('\n📝 Updating existing user with credit data...');
      await pb.collection('users').update(pbUser.id, {
        name: user.name || 'User',
        totalTokens: credits.totalTokens || 0,
        usedTokens: credits.usedTokens || 0,
        dailyTokens: credits.dailyTokens || 0,
        lastDailyReset: credits.lastDailyReset ? new Date(credits.lastDailyReset).toISOString() : new Date().toISOString(),
        packageId: credits.packageId || undefined,
        packageExpiry: credits.packageExpiry ? new Date(credits.packageExpiry).toISOString() : undefined
      });
      console.log('✅ User updated successfully');
    } else {
      console.log('\n➕ Creating new user in PocketBase...');
      console.log('⚠️  Note: You will need to set a password for this user');
      console.log('   Default password will be: changeme123\n');

      pbUser = await pb.collection('users').create({
        email: user.email,
        password: 'changeme123',
        passwordConfirm: 'changeme123',
        emailVisibility: true,
        name: user.name || 'User',
        totalTokens: credits.totalTokens || 0,
        usedTokens: credits.usedTokens || 0,
        dailyTokens: credits.dailyTokens || 0,
        lastDailyReset: credits.lastDailyReset ? new Date(credits.lastDailyReset).toISOString() : new Date().toISOString(),
        packageId: credits.packageId || undefined,
        packageExpiry: credits.packageExpiry ? new Date(credits.packageExpiry).toISOString() : undefined
      });
      console.log('✅ User created successfully');
    }

    // 4. Migrate transactions
    console.log('\n💳 Migrating transactions...');

    if (transactions && transactions.length > 0) {
      let migratedCount = 0;
      for (const txn of transactions) {
        try {
          await pb.collection('transactions').create({
            userId: pbUser.id,
            type: txn.type,
            amount: txn.amount,
            tokens: txn.tokens,
            currency: txn.currency || 'USD',
            packageId: txn.packageId || undefined,
            paymentProvider: txn.paymentProvider || undefined,
            paymentId: txn.paymentId || undefined,
            status: txn.status || 'completed'
          });
          migratedCount++;
        } catch (error) {
          console.error('Failed to migrate transaction:', error.message);
        }
      }
      console.log(`✅ Migrated ${migratedCount}/${transactions.length} transactions`);
    } else {
      console.log('No transactions to migrate');
    }

    // 5. Migrate token usage
    console.log('\n📊 Migrating token usage history...');

    if (usageRecords && usageRecords.length > 0) {
      let migratedCount = 0;
      for (const usage of usageRecords) {
        try {
          await pb.collection('token_usage').create({
            userId: pbUser.id,
            tokensUsed: usage.tokensUsed,
            endpoint: usage.endpoint || 'unknown'
          });
          migratedCount++;
        } catch (error) {
          console.error('Failed to migrate usage record:', error.message);
        }
      }
      console.log(`✅ Migrated ${migratedCount}/${usageRecords.length} usage records`);
    } else {
      console.log('No usage records to migrate');
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Email: ${pbUser.email}`);
    console.log(`   Name: ${pbUser.name}`);
    console.log(`   Total Tokens: ${pbUser.totalTokens.toLocaleString()}`);
    console.log(`   Used Tokens: ${pbUser.usedTokens.toLocaleString()}`);
    console.log(`   Daily Tokens: ${pbUser.dailyTokens.toLocaleString()}`);
    console.log(`   Available: ${(pbUser.totalTokens + pbUser.dailyTokens - pbUser.usedTokens).toLocaleString()}`);

    if (!pbUser.id.startsWith('existing')) {
      console.log('\n⚠️  IMPORTANT: User password is set to: changeme123');
      console.log('   Please change it in PocketBase admin UI or ask user to reset it');
    }

    console.log('\n🌐 View user in admin: http://localhost:8090/_/#/collections/users');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    process.exit(1);
  }
}

migrateUser();
