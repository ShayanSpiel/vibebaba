/**
 * Automated PocketBase Collections Setup
 * Creates all 4 collections with proper schema
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const pb = new PocketBase(PB_URL);

// Admin credentials - update these!
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || '66shayan@gmail.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'Szajan12081';

async function setupCollections() {
  console.log('🚀 Setting up PocketBase collections...\n');
  console.log(`PocketBase URL: ${PB_URL}\n`);

  try {
    // Authenticate as admin
    console.log('🔐 Authenticating as admin...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Authenticated successfully\n');

    // Collection 1: example_categories
    console.log('📦 Creating collection: example_categories');
    try {
      await pb.collections.create({
        name: 'example_categories',
        type: 'base',
        schema: [
          {
            name: 'slug',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 100,
              pattern: '',
            },
          },
          {
            name: 'name',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 200,
              pattern: '',
            },
          },
          {
            name: 'description',
            type: 'text',
            required: false,
            options: {
              min: 0,
              max: 500,
              pattern: '',
            },
          },
          {
            name: 'minExamplesRequired',
            type: 'number',
            required: false,
            options: {
              min: 0,
              max: null,
            },
          },
          {
            name: 'targetExamples',
            type: 'number',
            required: false,
            options: {
              min: 0,
              max: null,
            },
          },
          {
            name: 'parentCategory',
            type: 'text',
            required: false,
            options: {
              min: 0,
              max: 100,
              pattern: '',
            },
          },
          {
            name: 'isActive',
            type: 'bool',
            required: false,
            options: {},
          },
          {
            name: 'priority',
            type: 'number',
            required: false,
            options: {
              min: 0,
              max: 10,
            },
          },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_slug ON example_categories (slug)',
          'CREATE INDEX idx_priority ON example_categories (priority)',
        ],
        listRule: '',
        viewRule: '',
        createRule: null,
        updateRule: null,
        deleteRule: null,
      });
      console.log('✅ Created: example_categories\n');
    } catch (error: any) {
      if (error.status === 400 && error.message?.includes('already exists')) {
        console.log('⏭️  Skipped: example_categories (already exists)\n');
      } else {
        throw error;
      }
    }

    // Collection 2: design_examples
    console.log('📦 Creating collection: design_examples');
    try {
      await pb.collections.create({
        name: 'design_examples',
        type: 'base',
        schema: [
          {
            name: 'categoryId',
            type: 'relation',
            required: true,
            options: {
              collectionId: '', // Will be auto-resolved
              cascadeDelete: false,
              minSelect: null,
              maxSelect: 1,
              displayFields: ['name'],
            },
          },
          {
            name: 'name',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 200,
              pattern: '',
            },
          },
          {
            name: 'description',
            type: 'text',
            required: false,
            options: {
              min: 0,
              max: 1000,
              pattern: '',
            },
          },
          {
            name: 'htmlContent',
            type: 'editor',
            required: true,
            options: {
              convertUrls: false,
            },
          },
          {
            name: 'styleVariant',
            type: 'select',
            required: true,
            options: {
              maxSelect: 1,
              values: ['minimal', 'modern', 'glassmorphism', 'brutalist', 'gradient', 'dark'],
            },
          },
          {
            name: 'industryContext',
            type: 'select',
            required: false,
            options: {
              maxSelect: 10,
              values: [
                'saas',
                'ecommerce',
                'blog',
                'portfolio',
                'agency',
                'fintech',
                'healthcare',
                'education',
                'media',
                'nonprofit',
              ],
            },
          },
          {
            name: 'complexityLevel',
            type: 'select',
            required: false,
            options: {
              maxSelect: 1,
              values: ['simple', 'medium', 'complex'],
            },
          },
          {
            name: 'qualityScore',
            type: 'number',
            required: false,
            options: {
              min: 0,
              max: 100,
            },
          },
          {
            name: 'performanceScore',
            type: 'number',
            required: false,
            options: {
              min: 0,
              max: 100,
            },
          },
          {
            name: 'accessibilityScore',
            type: 'number',
            required: false,
            options: {
              min: 0,
              max: 100,
            },
          },
          {
            name: 'designTrendScore',
            type: 'number',
            required: false,
            options: {
              min: 0,
              max: 100,
            },
          },
          {
            name: 'version',
            type: 'text',
            required: false,
            options: {
              min: 0,
              max: 20,
              pattern: '',
            },
          },
          {
            name: 'isActive',
            type: 'bool',
            required: false,
            options: {},
          },
          {
            name: 'replacedBy',
            type: 'text',
            required: false,
            options: {
              min: 0,
              max: 100,
              pattern: '',
            },
          },
          {
            name: 'usageCount',
            type: 'number',
            required: false,
            options: {
              min: 0,
              max: null,
            },
          },
          {
            name: 'successRate',
            type: 'number',
            required: false,
            options: {
              min: 0,
              max: 100,
            },
          },
          {
            name: 'tags',
            type: 'json',
            required: false,
            options: {},
          },
          {
            name: 'previewImage',
            type: 'text',
            required: false,
            options: {
              min: 0,
              max: null,
              pattern: '',
            },
          },
        ],
        indexes: [
          'CREATE INDEX idx_category_active ON design_examples (categoryId, isActive)',
          'CREATE INDEX idx_quality ON design_examples (qualityScore)',
        ],
        listRule: '',
        viewRule: '',
        createRule: null,
        updateRule: null,
        deleteRule: null,
      });
      console.log('✅ Created: design_examples\n');
    } catch (error: any) {
      if (error.status === 400 && error.message?.includes('already exists')) {
        console.log('⏭️  Skipped: design_examples (already exists)\n');
      } else {
        throw error;
      }
    }

    // Collection 3: example_generation_queue
    console.log('📦 Creating collection: example_generation_queue');
    try {
      await pb.collections.create({
        name: 'example_generation_queue',
        type: 'base',
        schema: [
          {
            name: 'categoryId',
            type: 'relation',
            required: true,
            options: {
              collectionId: '',
              cascadeDelete: false,
              minSelect: null,
              maxSelect: 1,
              displayFields: ['name'],
            },
          },
          {
            name: 'targetCount',
            type: 'number',
            required: true,
            options: {
              min: 0,
              max: null,
            },
          },
          {
            name: 'currentCount',
            type: 'number',
            required: false,
            options: {
              min: 0,
              max: null,
            },
          },
          {
            name: 'status',
            type: 'select',
            required: false,
            options: {
              maxSelect: 1,
              values: ['pending', 'in_progress', 'completed', 'failed'],
            },
          },
          {
            name: 'priority',
            type: 'number',
            required: false,
            options: {
              min: 1,
              max: 10,
            },
          },
          {
            name: 'reason',
            type: 'text',
            required: false,
            options: {
              min: 0,
              max: 500,
              pattern: '',
            },
          },
          {
            name: 'generationConfig',
            type: 'json',
            required: false,
            options: {},
          },
          {
            name: 'generatedIds',
            type: 'json',
            required: false,
            options: {},
          },
          {
            name: 'errorLog',
            type: 'text',
            required: false,
            options: {
              min: 0,
              max: null,
              pattern: '',
            },
          },
          {
            name: 'completed',
            type: 'date',
            required: false,
            options: {
              min: '',
              max: '',
            },
          },
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: null,
        updateRule: null,
        deleteRule: null,
      });
      console.log('✅ Created: example_generation_queue\n');
    } catch (error: any) {
      if (error.status === 400 && error.message?.includes('already exists')) {
        console.log('⏭️  Skipped: example_generation_queue (already exists)\n');
      } else {
        throw error;
      }
    }

    // Collection 4: user_contributions
    console.log('📦 Creating collection: user_contributions');
    try {
      await pb.collections.create({
        name: 'user_contributions',
        type: 'base',
        schema: [
          {
            name: 'projectId',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 100,
              pattern: '',
            },
          },
          {
            name: 'userId',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 100,
              pattern: '',
            },
          },
          {
            name: 'extractedHtml',
            type: 'editor',
            required: false,
            options: {
              convertUrls: false,
            },
          },
          {
            name: 'componentType',
            type: 'text',
            required: false,
            options: {
              min: 0,
              max: 100,
              pattern: '',
            },
          },
          {
            name: 'aiQualityScore',
            type: 'number',
            required: false,
            options: {
              min: 0,
              max: 100,
            },
          },
          {
            name: 'meetsCriteria',
            type: 'bool',
            required: false,
            options: {},
          },
          {
            name: 'assessmentNotes',
            type: 'text',
            required: false,
            options: {
              min: 0,
              max: 1000,
              pattern: '',
            },
          },
          {
            name: 'status',
            type: 'select',
            required: false,
            options: {
              maxSelect: 1,
              values: ['pending', 'approved', 'rejected', 'in_library'],
            },
          },
          {
            name: 'approvedAsExampleId',
            type: 'text',
            required: false,
            options: {
              min: 0,
              max: 100,
              pattern: '',
            },
          },
          {
            name: 'reviewed',
            type: 'date',
            required: false,
            options: {
              min: '',
              max: '',
            },
          },
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: null,
        updateRule: null,
        deleteRule: null,
      });
      console.log('✅ Created: user_contributions\n');
    } catch (error: any) {
      if (error.status === 400 && error.message?.includes('already exists')) {
        console.log('⏭️  Skipped: user_contributions (already exists)\n');
      } else {
        throw error;
      }
    }

    console.log('═'.repeat(60));
    console.log('🎉 SETUP COMPLETE!');
    console.log('═'.repeat(60));
    console.log('\n✅ All 4 collections created successfully!\n');
    console.log('Next steps:');
    console.log('1. Run: npx tsx scripts/seed-categories.ts');
    console.log('2. Run: npx tsx scripts/generate-examples.ts --high-priority --count 5');
    console.log('3. Check dashboard: http://localhost:3000/admin/examples\n');
  } catch (error: any) {
    console.error('\n❌ Setup failed:', error);

    if (error.status === 401) {
      console.error('\n⚠️  Authentication failed!');
      console.error('Please update admin credentials in the script or set environment variables:');
      console.error('  POCKETBASE_ADMIN_EMAIL=your@email.com');
      console.error('  POCKETBASE_ADMIN_PASSWORD=yourpassword\n');
    }

    process.exit(1);
  }
}

// Run setup
setupCollections().catch(console.error);
