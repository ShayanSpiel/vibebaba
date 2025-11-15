/**
 * Direct Database Seed - Bypasses API entirely
 * Connects directly to PocketBase SQLite database
 */

import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';
import { EXAMPLE_CATEGORIES } from '../lib/example-categories';

const DB_PATH = process.env.POCKETBASE_DB_PATH || './deployment-server/pb_data/data.db';

function generateId(): string {
  return randomBytes(7).toString('base64url').substring(0, 15);
}

async function seedDirectly() {
  console.log('\n🗄️  DIRECT DATABASE SEED\n');
  console.log(`Database: ${DB_PATH}\n`);

  try {
    // Open database
    const db = new Database(DB_PATH);
    console.log('✅ Connected to database\n');

    // Get collection ID
    const collection = db
      .prepare('SELECT id FROM _collections WHERE name = ?')
      .get('example_categories') as any;

    if (!collection) {
      console.error('❌ Collection "example_categories" not found!');
      console.error('Make sure you created the collection in PocketBase Admin first.\n');
      process.exit(1);
    }

    const collectionId = collection.id;
    console.log(`📋 Collection ID: ${collectionId}\n`);

    // Check existing
    const existing = db.prepare('SELECT slug FROM example_categories').all() as any[];
    console.log(`Found ${existing.length} existing categories\n`);

    const existingSlugs = new Set(existing.map((r: any) => r.slug));

    let created = 0;
    let skipped = 0;

    // Insert categories
    const insertStmt = db.prepare(`
      INSERT INTO example_categories (
        id, created, updated,
        slug, name, description, minExamplesRequired, targetExamples,
        isActive, priority, parentCategory
      ) VALUES (
        ?, datetime('now'), datetime('now'),
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `);

    for (const category of EXAMPLE_CATEGORIES) {
      if (existingSlugs.has(category.slug)) {
        console.log(`⏭️  Skipped: ${category.name} (already exists)`);
        skipped++;
        continue;
      }

      const id = generateId();

      insertStmt.run(
        id,
        category.slug,
        category.name,
        category.description,
        category.minExamplesRequired,
        category.targetExamples,
        category.isActive !== false ? 1 : 0,
        category.priority,
        category.parentCategory || ''
      );

      console.log(`✅ Created: ${category.name}`);
      created++;
    }

    db.close();

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 SEEDING COMPLETE!');
    console.log('═'.repeat(60));
    console.log(`✅ Created: ${created}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total: ${EXAMPLE_CATEGORIES.length} categories`);
    console.log('═'.repeat(60) + '\n');

    console.log('✅ SUCCESS! Refresh PocketBase Admin to see the categories.\n');
  } catch (error: any) {
    console.error('\n❌ FAILED:', error.message);
    console.error('\nMake sure:');
    console.error('1. PocketBase is STOPPED (not running)');
    console.error('2. Database path is correct:', DB_PATH);
    console.error('3. You have write permissions\n');
    process.exit(1);
  }
}

seedDirectly().catch(console.error);
