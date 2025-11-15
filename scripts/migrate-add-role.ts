/**
 * Migration Script: Add 'role' column to user table
 *
 * Run this script once to add the role column to existing users
 * Usage: npx tsx scripts/migrate-add-role.ts
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'auth.db');

async function migrate() {
  console.log('Starting migration: Add role column to user table...');

  const db = new Database(dbPath);

  try {
    // Check if role column already exists
    const tableInfo = db.pragma('table_info(user)');
    const hasRoleColumn = tableInfo.some((col: any) => col.name === 'role');

    if (hasRoleColumn) {
      console.log('✅ Role column already exists. Migration not needed.');
      db.close();
      return;
    }

    console.log('Adding role column...');

    // Add role column with default value 'user'
    db.exec(`
      ALTER TABLE user ADD COLUMN role TEXT DEFAULT 'user'
    `);

    // Create index on role column
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_role ON user(role)
    `);

    console.log('✅ Successfully added role column and index');

    // Count users
    const userCount = db.prepare('SELECT COUNT(*) as count FROM user').get() as { count: number };
    console.log(`📊 Total users: ${userCount.count}`);

    // Set first user as admin (optional)
    if (userCount.count > 0) {
      const firstUser = db
        .prepare('SELECT id, email FROM user ORDER BY createdAt ASC LIMIT 1')
        .get() as any;
      if (firstUser) {
        db.prepare('UPDATE user SET role = ? WHERE id = ?').run('admin', firstUser.id);
        console.log(`👑 Set first user as admin: ${firstUser.email}`);
      }
    }

    db.close();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    db.close();
    process.exit(1);
  }
}

migrate().catch(console.error);
