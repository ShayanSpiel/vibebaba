/**
 * Simple Seed Categories Script (No Auth Required)
 * Make sure to set example_categories collection to allow public Create/Update temporarily
 */

import PocketBase from 'pocketbase';
import { EXAMPLE_CATEGORIES } from '../lib/example-categories';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const pb = new PocketBase(PB_URL);

async function seedCategories() {
  console.log('\n🌱 SEEDING CATEGORIES (Simple Version)\n');
  console.log(`PocketBase URL: ${PB_URL}\n`);
  console.log('⚠️  IMPORTANT: Ensure example_categories collection has:');
  console.log('   - Create rule: "" (empty = public)');
  console.log('   - Update rule: "" (empty = public)\n');
  console.log('   You can set this in PocketBase Admin > example_categories > API Rules\n');
  console.log('─'.repeat(60));

  try {
    // Get existing categories
    console.log('\n📋 Checking existing categories...');
    const existingCategories = await pb.collection('example_categories').getFullList();
    console.log(`   Found: ${existingCategories.length} existing\n`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Process each category
    for (const category of EXAMPLE_CATEGORIES) {
      try {
        const existing = existingCategories.find((c) => c.slug === category.slug);

        if (existing) {
          // Update
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
          // Create
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
      } catch (error: any) {
        console.error(`❌ Failed: ${category.name} - ${error.message}`);
        errors++;
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 SEEDING COMPLETE!');
    console.log('═'.repeat(60));
    console.log(`✅ Created: ${created}`);
    console.log(`✏️  Updated: ${updated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total: ${EXAMPLE_CATEGORIES.length} categories`);
    console.log('═'.repeat(60));

    // Stats
    const highPriority = EXAMPLE_CATEGORIES.filter((c) => c.priority >= 8).length;
    const mediumPriority = EXAMPLE_CATEGORIES.filter(
      (c) => c.priority >= 5 && c.priority < 8
    ).length;
    const lowPriority = EXAMPLE_CATEGORIES.filter((c) => c.priority < 5).length;
    const totalTarget = EXAMPLE_CATEGORIES.reduce((sum, c) => sum + c.targetExamples, 0);

    console.log('\n📊 Priority Distribution:');
    console.log(`   High (8-10): ${highPriority} categories`);
    console.log(`   Medium (5-7): ${mediumPriority} categories`);
    console.log(`   Low (1-4): ${lowPriority} categories`);

    console.log('\n🎯 Target Examples:');
    console.log(`   Total target: ${totalTarget} examples`);
    console.log(
      `   High priority: ${EXAMPLE_CATEGORIES.filter((c) => c.priority >= 8).reduce((sum, c) => sum + c.targetExamples, 0)} examples\n`
    );

    console.log('✅ SUCCESS! Now lock down permissions:');
    console.log('   PocketBase Admin > example_categories > API Rules');
    console.log('   - Create rule: null (admin only)');
    console.log('   - Update rule: null (admin only)\n');
  } catch (error: any) {
    console.error('\n❌ SEEDING FAILED:', error.message);
    console.error('\nMake sure:');
    console.error('1. PocketBase is running (http://localhost:8090)');
    console.error('2. example_categories collection exists');
    console.error('3. Collection has public Create/Update rules enabled\n');
    process.exit(1);
  }
}

// Run
seedCategories().catch(console.error);
