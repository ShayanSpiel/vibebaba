/**
 * Seed Categories Script
 * Populates the database with all component categories
 */

import PocketBase from 'pocketbase';
import { EXAMPLE_CATEGORIES } from '../lib/example-categories';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || '';

const pb = new PocketBase(PB_URL);

async function seedCategories() {
  console.log('🌱 Seeding example categories...\n');
  console.log(`PocketBase URL: ${PB_URL}\n`);

  try {
    console.log(
      '⚠️  Note: Make sure example_categories collection has public Create/Update rules enabled temporarily\n'
    );
    console.log('Checking existing categories...');

    const existingCategories = await pb.collection('example_categories').getFullList();
    console.log(`Found ${existingCategories.length} existing categories\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const category of EXAMPLE_CATEGORIES) {
      try {
        // Check if category exists by slug
        const existing = existingCategories.find((c) => c.slug === category.slug);

        if (existing) {
          // Update existing category
          await pb.collection('example_categories').update(existing.id, {
            name: category.name,
            description: category.description,
            minExamplesRequired: category.minExamplesRequired,
            targetExamples: category.targetExamples,
            priority: category.priority,
            parentCategory: category.parentCategory || null,
            isActive: true,
          });

          console.log(`✏️  Updated: ${category.name}`);
          updated++;
        } else {
          // Create new category
          await pb.collection('example_categories').create({
            slug: category.slug,
            name: category.name,
            description: category.description,
            minExamplesRequired: category.minExamplesRequired,
            targetExamples: category.targetExamples,
            priority: category.priority,
            parentCategory: category.parentCategory || null,
            isActive: true,
          });

          console.log(`✅ Created: ${category.name}`);
          created++;
        }
      } catch (error) {
        console.error(`❌ Failed to process ${category.name}:`, error);
        skipped++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('SEEDING COMPLETE');
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Created: ${created}`);
    console.log(`✏️  Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total: ${EXAMPLE_CATEGORIES.length} categories`);
    console.log(`${'='.repeat(60)}\n`);

    // Show summary by priority
    const highPriority = EXAMPLE_CATEGORIES.filter((c) => c.priority >= 8).length;
    const mediumPriority = EXAMPLE_CATEGORIES.filter(
      (c) => c.priority >= 5 && c.priority < 8
    ).length;
    const lowPriority = EXAMPLE_CATEGORIES.filter((c) => c.priority < 5).length;

    console.log('Priority Distribution:');
    console.log(`  High (8-10): ${highPriority} categories`);
    console.log(`  Medium (5-7): ${mediumPriority} categories`);
    console.log(`  Low (1-4): ${lowPriority} categories\n`);

    console.log('Target Examples:');
    const totalTarget = EXAMPLE_CATEGORIES.reduce((sum, c) => sum + c.targetExamples, 0);
    console.log(`  Total target: ${totalTarget} examples`);
    console.log(
      `  High priority target: ${EXAMPLE_CATEGORIES.filter((c) => c.priority >= 8).reduce((sum, c) => sum + c.targetExamples, 0)} examples\n`
    );
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedCategories().catch(console.error);
