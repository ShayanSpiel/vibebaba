// Load environment variables
require('dotenv').config({ path: '.env.local' });

/**
 * Create remaining PocketBase collections
 * Simpler version that just creates what's missing
 */

const PocketBase = require('pocketbase').default;
const pb = new PocketBase('http://localhost:8090');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function createCollections() {
  console.log('🚀 Creating remaining PocketBase collections...\n');

  try {
    // Authenticate as admin
    console.log('🔐 Authenticating...');
    const authData = await fetch('http://localhost:8090/api/admins/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });
    const auth = await authData.json();
    pb.authStore.save(auth.token, auth.admin);
    console.log('✅ Authenticated\n');

    // Get existing collections
    const existing = await pb.collections.getFullList();
    const existingNames = existing.map((c) => c.name);
    console.log('📋 Existing collections:', existingNames.join(', '), '\n');

    // Get users collection ID
    const usersCollection = existing.find((c) => c.name === 'users');
    if (!usersCollection) {
      throw new Error('Users collection not found!');
    }

    // 1. Create transactions collection
    if (!existingNames.includes('transactions')) {
      console.log('💳 Creating transactions...');
      await pb.collections.create({
        name: 'transactions',
        type: 'base',
        schema: [
          {
            name: 'userId',
            type: 'relation',
            required: true,
            options: {
              collectionId: usersCollection.id,
              cascadeDelete: false,
              minSelect: 1,
              maxSelect: 1,
            },
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            options: {
              values: ['purchase', 'subscription', 'refund'],
              maxSelect: 1,
            },
          },
          {
            name: 'amount',
            type: 'number',
            required: true,
          },
          {
            name: 'tokens',
            type: 'number',
            required: true,
          },
          {
            name: 'currency',
            type: 'text',
            required: false,
          },
          {
            name: 'packageId',
            type: 'text',
            required: false,
          },
          {
            name: 'paymentProvider',
            type: 'select',
            required: false,
            options: {
              values: ['stripe', 'paypal', 'zibal'],
              maxSelect: 1,
            },
          },
          {
            name: 'paymentId',
            type: 'text',
            required: false,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            options: {
              values: ['pending', 'completed', 'failed', 'refunded'],
              maxSelect: 1,
            },
          },
        ],
        listRule: 'userId = @request.auth.id',
        viewRule: 'userId = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: null,
        deleteRule: null,
      });
      console.log('✅ Transactions created\n');
    } else {
      console.log('⏭️  Transactions already exists\n');
    }

    // 2. Create projects collection
    if (!existingNames.includes('projects')) {
      console.log('📁 Creating projects...');
      await pb.collections.create({
        name: 'projects',
        type: 'base',
        schema: [
          {
            name: 'userId',
            type: 'relation',
            required: true,
            options: {
              collectionId: usersCollection.id,
              cascadeDelete: false,
              minSelect: 1,
              maxSelect: 1,
            },
          },
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            type: 'text',
            required: true,
          },
          {
            name: 'stage',
            type: 'select',
            required: true,
            options: {
              values: ['planning', 'building', 'completed', 'error'],
              maxSelect: 1,
            },
          },
          {
            name: 'plan',
            type: 'text',
            required: false,
          },
          {
            name: 'backendConfig',
            type: 'json',
            required: false,
            options: {
              maxSize: 2000000,
            },
          },
          {
            name: 'context',
            type: 'json',
            required: false,
            options: {
              maxSize: 2000000,
            },
          },
          {
            name: 'thumbnail',
            type: 'file',
            required: false,
            options: {
              maxSelect: 1,
              maxSize: 2097152,
              mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            },
          },
          {
            name: 'deployUrl',
            type: 'url',
            required: false,
            options: {
              exceptDomains: [],
              onlyDomains: [],
            },
          },
        ],
        listRule: 'userId = @request.auth.id',
        viewRule: 'userId = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: 'userId = @request.auth.id',
        deleteRule: 'userId = @request.auth.id',
      });
      console.log('✅ Projects created\n');
    } else {
      console.log('⏭️  Projects already exists\n');
    }

    // Refresh collection list
    const updated = await pb.collections.getFullList();
    const projectsCollection = updated.find((c) => c.name === 'projects');

    if (!projectsCollection) {
      throw new Error('Failed to create projects collection');
    }

    // 3. Create project_files collection
    if (!existingNames.includes('project_files')) {
      console.log('📄 Creating project_files...');
      await pb.collections.create({
        name: 'project_files',
        type: 'base',
        schema: [
          {
            name: 'projectId',
            type: 'relation',
            required: true,
            options: {
              collectionId: projectsCollection.id,
              cascadeDelete: true,
              minSelect: 1,
              maxSelect: 1,
            },
          },
          {
            name: 'path',
            type: 'text',
            required: true,
          },
          {
            name: 'content',
            type: 'text',
            required: true,
          },
          {
            name: 'encoding',
            type: 'select',
            required: false,
            options: {
              values: ['utf-8', 'base64'],
              maxSelect: 1,
            },
          },
          {
            name: 'size',
            type: 'number',
            required: false,
          },
        ],
        listRule: 'projectId.userId = @request.auth.id',
        viewRule: 'projectId.userId = @request.auth.id',
        createRule: 'projectId.userId = @request.auth.id',
        updateRule: 'projectId.userId = @request.auth.id',
        deleteRule: 'projectId.userId = @request.auth.id',
      });
      console.log('✅ Project files created\n');
    } else {
      console.log('⏭️  Project files already exists\n');
    }

    // 4. Create project_messages collection
    if (!existingNames.includes('project_messages')) {
      console.log('💬 Creating project_messages...');
      await pb.collections.create({
        name: 'project_messages',
        type: 'base',
        schema: [
          {
            name: 'projectId',
            type: 'relation',
            required: true,
            options: {
              collectionId: projectsCollection.id,
              cascadeDelete: true,
              minSelect: 1,
              maxSelect: 1,
            },
          },
          {
            name: 'role',
            type: 'select',
            required: true,
            options: {
              values: ['user', 'assistant', 'system'],
              maxSelect: 1,
            },
          },
          {
            name: 'content',
            type: 'text',
            required: true,
          },
          {
            name: 'tokens',
            type: 'number',
            required: false,
          },
        ],
        listRule: 'projectId.userId = @request.auth.id',
        viewRule: 'projectId.userId = @request.auth.id',
        createRule: 'projectId.userId = @request.auth.id',
        updateRule: null,
        deleteRule: 'projectId.userId = @request.auth.id',
      });
      console.log('✅ Project messages created\n');
    } else {
      console.log('⏭️  Project messages already exists\n');
    }

    // Final summary
    const final = await pb.collections.getFullList();
    console.log('\n✨ Setup complete! Collections:');
    final.forEach((c) => {
      console.log(`   ✅ ${c.name} (${c.type})`);
    });

    console.log('\n🌐 View in admin UI: http://localhost:8090/_/#/collections');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', JSON.stringify(error.response, null, 2));
    }
    process.exit(1);
  }
}

createCollections();
