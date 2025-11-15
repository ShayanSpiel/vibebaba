// Load environment variables
require('dotenv').config({ path: '.env.local' });

/**
 * PocketBase Schema Setup Script
 *
 * This script programmatically creates all required collections in PocketBase.
 * Run this ONCE after starting PocketBase for the first time.
 *
 * Usage: node scripts/setup-pocketbase-schema.js
 */

const PocketBase = require('pocketbase').default;

const pb = new PocketBase('http://localhost:8090');

// Admin credentials (change these after first setup!)
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function setupSchema() {
  console.log('🚀 Starting PocketBase Schema Setup...\n');

  try {
    // Authenticate as admin using the correct API endpoint
    console.log('🔐 Authenticating as admin...');
    const authData = await fetch('http://localhost:8090/api/admins/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });
    const auth = await authData.json();

    if (!auth.token) {
      throw new Error('Failed to authenticate');
    }

    // Set the auth token for subsequent requests
    pb.authStore.save(auth.token, auth.admin);
    console.log('✅ Authenticated successfully\n');

    // 1. Update users collection (auth collection - already exists)
    console.log('👤 Updating users collection...');
    try {
      const usersCollection = await pb.collections.getOne('users');

      // Add custom fields to users
      const updatedSchema = [
        ...usersCollection.schema,
        {
          name: 'totalTokens',
          type: 'number',
          required: false,
          options: { min: 0 },
        },
        {
          name: 'usedTokens',
          type: 'number',
          required: false,
          options: { min: 0 },
        },
        {
          name: 'dailyTokens',
          type: 'number',
          required: false,
          options: { min: 0 },
        },
        {
          name: 'lastDailyReset',
          type: 'date',
          required: false,
        },
        {
          name: 'packageId',
          type: 'text',
          required: false,
        },
        {
          name: 'packageExpiry',
          type: 'date',
          required: false,
        },
      ];

      await pb.collections.update(usersCollection.id, {
        schema: updatedSchema,
      });
      console.log('✅ Users collection updated\n');
    } catch (error) {
      // Users collection doesn't exist, create it
      await pb.collections.create({
        name: 'users',
        type: 'auth',
        schema: [
          {
            name: 'name',
            type: 'text',
            required: false,
          },
          {
            name: 'avatar',
            type: 'file',
            required: false,
            options: {
              maxSelect: 1,
              maxSize: 5242880, // 5MB
              mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            },
          },
          {
            name: 'totalTokens',
            type: 'number',
            required: false,
            options: { min: 0 },
          },
          {
            name: 'usedTokens',
            type: 'number',
            required: false,
            options: { min: 0 },
          },
          {
            name: 'dailyTokens',
            type: 'number',
            required: false,
            options: { min: 0 },
          },
          {
            name: 'lastDailyReset',
            type: 'date',
            required: false,
          },
          {
            name: 'packageId',
            type: 'text',
            required: false,
          },
          {
            name: 'packageExpiry',
            type: 'date',
            required: false,
          },
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '',
        updateRule: '@request.auth.id = id',
        deleteRule: '@request.auth.id = id',
      });
      console.log('✅ Users collection created\n');
    }

    // 2. Create transactions collection
    console.log('💳 Creating transactions collection...');
    try {
      await pb.collections.create({
        name: 'transactions',
        type: 'base',
        schema: [
          {
            name: 'userId',
            type: 'relation',
            required: true,
            options: {
              collectionId: (await pb.collections.getOne('users')).id,
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
            },
          },
        ],
        listRule: 'userId = @request.auth.id',
        viewRule: 'userId = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: null, // Admin only
        deleteRule: null, // Admin only
        indexes: [
          'CREATE INDEX idx_transactions_userId ON transactions (userId)',
          'CREATE INDEX idx_transactions_status ON transactions (status)',
        ],
      });
      console.log('✅ Transactions collection created\n');
    } catch (error) {
      if (error.status === 400) {
        console.log('⚠️  Transactions collection already exists\n');
      } else {
        throw error;
      }
    }

    // 3. Create token_usage collection
    console.log('📊 Creating token_usage collection...');
    try {
      await pb.collections.create({
        name: 'token_usage',
        type: 'base',
        schema: [
          {
            name: 'userId',
            type: 'relation',
            required: true,
            options: {
              collectionId: (await pb.collections.getOne('users')).id,
              cascadeDelete: false,
              minSelect: 1,
              maxSelect: 1,
            },
          },
          {
            name: 'tokensUsed',
            type: 'number',
            required: true,
          },
          {
            name: 'endpoint',
            type: 'text',
            required: false,
          },
          {
            name: 'projectId',
            type: 'text',
            required: false,
          },
        ],
        listRule: 'userId = @request.auth.id',
        viewRule: 'userId = @request.auth.id',
        createRule: null, // Backend only
        updateRule: null,
        deleteRule: null, // Admin only
        indexes: [
          'CREATE INDEX idx_token_usage_userId ON token_usage (userId)',
          'CREATE INDEX idx_token_usage_endpoint ON token_usage (endpoint)',
        ],
      });
      console.log('✅ Token usage collection created\n');
    } catch (error) {
      if (error.status === 400) {
        console.log('⚠️  Token usage collection already exists\n');
      } else {
        throw error;
      }
    }

    // 4. Create projects collection
    console.log('📁 Creating projects collection...');
    try {
      await pb.collections.create({
        name: 'projects',
        type: 'base',
        schema: [
          {
            name: 'userId',
            type: 'relation',
            required: true,
            options: {
              collectionId: (await pb.collections.getOne('users')).id,
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
          },
          {
            name: 'context',
            type: 'json',
            required: false,
          },
          {
            name: 'thumbnail',
            type: 'file',
            required: false,
            options: {
              maxSelect: 1,
              maxSize: 2097152, // 2MB
              mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            },
          },
          {
            name: 'deployUrl',
            type: 'url',
            required: false,
          },
        ],
        listRule: 'userId = @request.auth.id',
        viewRule: 'userId = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: 'userId = @request.auth.id',
        deleteRule: 'userId = @request.auth.id',
        indexes: [
          'CREATE INDEX idx_projects_userId ON projects (userId)',
          'CREATE INDEX idx_projects_stage ON projects (stage)',
        ],
      });
      console.log('✅ Projects collection created\n');
    } catch (error) {
      if (error.status === 400) {
        console.log('⚠️  Projects collection already exists\n');
      } else {
        throw error;
      }
    }

    // 5. Create project_files collection
    console.log('📄 Creating project_files collection...');
    try {
      await pb.collections.create({
        name: 'project_files',
        type: 'base',
        schema: [
          {
            name: 'projectId',
            type: 'relation',
            required: true,
            options: {
              collectionId: (await pb.collections.getOne('projects')).id,
              cascadeDelete: true, // Delete files when project is deleted
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
        indexes: [
          'CREATE INDEX idx_project_files_projectId ON project_files (projectId)',
          'CREATE UNIQUE INDEX idx_project_files_unique ON project_files (projectId, path)',
        ],
      });
      console.log('✅ Project files collection created\n');
    } catch (error) {
      if (error.status === 400) {
        console.log('⚠️  Project files collection already exists\n');
      } else {
        throw error;
      }
    }

    // 6. Create project_messages collection
    console.log('💬 Creating project_messages collection...');
    try {
      await pb.collections.create({
        name: 'project_messages',
        type: 'base',
        schema: [
          {
            name: 'projectId',
            type: 'relation',
            required: true,
            options: {
              collectionId: (await pb.collections.getOne('projects')).id,
              cascadeDelete: true, // Delete messages when project is deleted
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
        updateRule: null, // Messages are immutable
        deleteRule: 'projectId.userId = @request.auth.id',
        indexes: ['CREATE INDEX idx_project_messages_projectId ON project_messages (projectId)'],
      });
      console.log('✅ Project messages collection created\n');
    } catch (error) {
      if (error.status === 400) {
        console.log('⚠️  Project messages collection already exists\n');
      } else {
        throw error;
      }
    }

    console.log('\n✨ PocketBase schema setup completed successfully!');
    console.log('\n📋 Created collections:');
    console.log('   - users (auth)');
    console.log('   - transactions');
    console.log('   - token_usage');
    console.log('   - projects');
    console.log('   - project_files');
    console.log('   - project_messages');
    console.log('\n🌐 Admin UI: http://localhost:8090/_/');
    console.log('📚 API Docs: http://localhost:8090/api/');
  } catch (error) {
    console.error('\n❌ Error setting up schema:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run setup
setupSchema();
