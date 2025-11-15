/**
 * Setup script to create workflow logging collections in PocketBase
 * Run with: npx tsx scripts/setup-workflow-collections.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import PocketBase from 'pocketbase';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

async function setupCollections() {
  try {
    console.log('🔧 Setting up workflow logging collections...\n');

    // Authenticate as admin
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456';

    console.log(`Attempting to authenticate with email: ${adminEmail}`);

    try {
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      console.log('✅ Authenticated as admin\n');
    } catch (error: any) {
      console.error('❌ Failed to authenticate as admin.');
      console.error('   Error:', error.message);
      console.error('   Email used:', adminEmail);
      console.error('   Please ensure PocketBase is running and the admin account exists.');
      console.error('   You can create an admin account by visiting http://127.0.0.1:8090/_/\n');
      process.exit(1);
    }

    const collections = [
      {
        name: 'workflow_execution_logs',
        schema: [
          { name: 'project_id', type: 'text', required: true },
          { name: 'user_id', type: 'text', required: true },
          { name: 'workflow_id', type: 'text', required: true },
          { name: 'node_name', type: 'text', required: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            options: { values: ['success', 'error', 'warning', 'timeout'] },
          },
          { name: 'error_type', type: 'text', required: false },
          { name: 'error_message', type: 'text', required: false, options: { max: 5000 } },
          { name: 'error_stack', type: 'text', required: false, options: { max: 10000 } },
          { name: 'duration_ms', type: 'number', required: true },
          { name: 'ai_model', type: 'text', required: false },
          { name: 'ai_provider', type: 'text', required: false },
          { name: 'tokens_used', type: 'number', required: false },
          { name: 'metadata', type: 'json', required: false },
          { name: 'timestamp', type: 'date', required: true },
        ],
      },
      {
        name: 'editor_operation_logs',
        schema: [
          { name: 'project_id', type: 'text', required: true },
          { name: 'user_id', type: 'text', required: true },
          {
            name: 'operation_type',
            type: 'select',
            required: true,
            options: { values: ['create', 'rename', 'modify', 'delete'] },
          },
          { name: 'file_path', type: 'text', required: false, options: { max: 500 } },
          {
            name: 'change_scope',
            type: 'select',
            required: false,
            options: { values: ['minimal', 'moderate', 'major'] },
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            options: { values: ['success', 'error', 'warning'] },
          },
          { name: 'error_message', type: 'text', required: false, options: { max: 5000 } },
          { name: 'user_request', type: 'text', required: false, options: { max: 5000 } },
          { name: 'checkpoint_id', type: 'text', required: false },
          { name: 'duration_ms', type: 'number', required: false },
          { name: 'timestamp', type: 'date', required: true },
        ],
      },
      {
        name: 'deployment_logs',
        schema: [
          { name: 'project_id', type: 'text', required: true },
          { name: 'user_id', type: 'text', required: true },
          { name: 'deployment_url', type: 'text', required: false, options: { max: 500 } },
          {
            name: 'build_status',
            type: 'select',
            required: true,
            options: { values: ['pending', 'building', 'success', 'failed'] },
          },
          { name: 'error_message', type: 'text', required: false, options: { max: 5000 } },
          { name: 'build_output', type: 'text', required: false, options: { max: 50000 } },
          { name: 'dependencies_installed', type: 'number', required: false },
          { name: 'build_duration_ms', type: 'number', required: false },
          { name: 'deployment_duration_ms', type: 'number', required: false },
          { name: 'timestamp', type: 'date', required: true },
        ],
      },
      {
        name: 'validation_errors',
        schema: [
          { name: 'project_id', type: 'text', required: true },
          { name: 'user_id', type: 'text', required: true },
          { name: 'file_path', type: 'text', required: false, options: { max: 500 } },
          {
            name: 'severity',
            type: 'select',
            required: true,
            options: { values: ['error', 'warning', 'info'] },
          },
          { name: 'error_type', type: 'text', required: false },
          { name: 'error_message', type: 'text', required: false, options: { max: 5000 } },
          { name: 'line_number', type: 'number', required: false },
          { name: 'timestamp', type: 'date', required: true },
        ],
      },
      {
        name: 'workflow_checkpoints',
        schema: [
          { name: 'projectId', type: 'text', required: true },
          { name: 'userId', type: 'text', required: false },
          { name: 'userRequest', type: 'text', required: false },
          { name: 'filesSnapshot', type: 'json', required: true, options: { maxSize: 2000000 } }, // 2MB max for file snapshots
          {
            name: 'previousFilesSnapshot',
            type: 'json',
            required: false,
            options: { maxSize: 2000000 },
          },
          { name: 'changeScope', type: 'text', required: false },
          { name: 'description', type: 'text', required: false },
          // PocketBase auto-creates 'id', 'created', and 'updated' fields
        ],
      },
    ];

    for (const collectionDef of collections) {
      try {
        // Check if collection already exists
        try {
          await pb.collections.getOne(collectionDef.name);
          console.log(`⏭️  Collection "${collectionDef.name}" already exists, skipping...`);
          continue;
        } catch (error: any) {
          // Collection doesn't exist, create it
          if (error.status === 404) {
            console.log(`📝 Creating collection "${collectionDef.name}"...`);
          } else {
            throw error;
          }
        }

        // Create the collection
        await pb.collections.create({
          name: collectionDef.name,
          type: 'base',
          schema: collectionDef.schema,
          listRule: null, // Admin-only by default
          viewRule: null,
          createRule: null,
          updateRule: null,
          deleteRule: null,
        });

        console.log(`✅ Created collection "${collectionDef.name}"`);
      } catch (error: any) {
        console.error(`❌ Failed to create collection "${collectionDef.name}":`, error.message);
      }
    }

    console.log('\n🎉 Workflow logging collections setup complete!');
    console.log(
      '\n📊 You can now view the admin workflow health dashboard at /admin/workflow-health\n'
    );
  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupCollections();
