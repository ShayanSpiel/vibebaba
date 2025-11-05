/**
 * Simple script to create workflow logging collections
 * Creates admin if needed, then creates collections
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function setupCollections() {
  try {
    console.log('🔧 Creating workflow logging collections...\n');

    // Try to create an admin if none exists
    let adminCreated = false;
    try {
      await pb.admins.create({
        email: 'admin@vibebaba.com',
        password: 'admin1234567890',
        passwordConfirm: 'admin1234567890',
      });
      console.log('✅ Created admin account: admin@vibebaba.com');
      adminCreated = true;
    } catch (error: any) {
      if (error.status === 400 && error.data?.email?.message?.includes('already exists')) {
        console.log('ℹ️  Admin account already exists');
      } else {
        console.log('⚠️  Could not create admin (may already exist):', error.message);
      }
    }

    // Authenticate as admin
    try {
      await pb.admins.authWithPassword('admin@vibebaba.com', 'admin1234567890');
      console.log('✅ Authenticated as admin\n');
    } catch (error: any) {
      console.error('❌ Failed to authenticate. Please create an admin account at http://127.0.0.1:8090/_/');
      console.error('   Then update the credentials in this script or in .env.local\n');
      return;
    }

    const collections = [
      {
        name: 'workflow_execution_logs',
        type: 'base',
        schema: [
          { name: 'project_id', type: 'text', required: true },
          { name: 'user_id', type: 'text', required: true },
          { name: 'workflow_id', type: 'text', required: true },
          { name: 'node_name', type: 'text', required: true },
          { name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['success', 'error', 'warning', 'timeout'] } },
          { name: 'error_type', type: 'text', required: false },
          { name: 'error_message', type: 'text', required: false, options: { max: 5000 } },
          { name: 'error_stack', type: 'text', required: false, options: { max: 10000 } },
          { name: 'duration_ms', type: 'number', required: true },
          { name: 'ai_model', type: 'text', required: false },
          { name: 'ai_provider', type: 'text', required: false },
          { name: 'tokens_used', type: 'number', required: false },
          { name: 'metadata', type: 'json', required: false, options: { maxSize: 50000 } },
          { name: 'timestamp', type: 'date', required: true },
        ],
      },
      {
        name: 'editor_operation_logs',
        type: 'base',
        schema: [
          { name: 'project_id', type: 'text', required: true },
          { name: 'user_id', type: 'text', required: true },
          { name: 'operation_type', type: 'select', required: true, options: { maxSelect: 1, values: ['create', 'rename', 'modify', 'delete'] } },
          { name: 'file_path', type: 'text', required: false, options: { max: 500 } },
          { name: 'change_scope', type: 'select', required: false, options: { maxSelect: 1, values: ['minimal', 'moderate', 'major'] } },
          { name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['success', 'error', 'warning'] } },
          { name: 'error_message', type: 'text', required: false, options: { max: 5000 } },
          { name: 'user_request', type: 'text', required: false, options: { max: 5000 } },
          { name: 'checkpoint_id', type: 'text', required: false },
          { name: 'duration_ms', type: 'number', required: false },
          { name: 'timestamp', type: 'date', required: true },
        ],
      },
      {
        name: 'deployment_logs',
        type: 'base',
        schema: [
          { name: 'project_id', type: 'text', required: true },
          { name: 'user_id', type: 'text', required: true },
          { name: 'deployment_url', type: 'text', required: false, options: { max: 500 } },
          { name: 'build_status', type: 'select', required: true, options: { maxSelect: 1, values: ['pending', 'building', 'success', 'failed'] } },
          { name: 'error_message', type: 'text', required: false, options: { max: 5000 } },
          { name: 'build_output', type: 'text', required: false, options: { max: 50000 } },
          { name: 'dependencies_installed', type: 'number', required: false },
          { name: 'build_duration_ms', type: 'number', required: false },
          { name: 'deployment_duration_ms', type: 'number', required: false },
          { name: 'timestamp', type: 'date', required: true },
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
          if (error.status !== 404) throw error;
        }

        // Create the collection
        console.log(`📝 Creating collection "${collectionDef.name}"...`);

        // Format schema fields with proper IDs
        const formattedSchema = collectionDef.schema.map((field, index) => ({
          id: field.name + '_' + index,
          name: field.name,
          type: field.type,
          system: false,
          required: field.required,
          presentable: false,
          unique: false,
          options: field.options || {}
        }));

        const result = await pb.collections.create({
          name: collectionDef.name,
          type: collectionDef.type as any,
          schema: formattedSchema,
          listRule: null,
          viewRule: null,
          createRule: null,
          updateRule: null,
          deleteRule: null,
        });

        console.log(`✅ Created collection "${collectionDef.name}" (ID: ${result.id})`);
      } catch (error: any) {
        console.error(`❌ Failed to create collection "${collectionDef.name}":`, error.message);
        if (error.data) {
          console.error('   Details:', JSON.stringify(error.data, null, 2));
        }
      }
    }

    console.log('\n🎉 Workflow logging collections setup complete!');
    console.log('📊 Logging will now work and errors will disappear.\n');

  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupCollections();
