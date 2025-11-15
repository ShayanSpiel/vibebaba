/**
 * Setup script for validation system database collections
 *
 * Run with: npx tsx scripts/setup-validation-db.ts
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function setupValidationCollections() {
  console.log('🔧 Setting up validation system collections...\n');

  try {
    // Login as admin (you'll need to provide credentials)
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456';

    console.log('🔐 Logging in as admin...');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Admin authenticated\n');

    // Create validation_errors collection
    console.log('📦 Creating validation_errors collection...');
    try {
      await pb.collections.create({
        name: 'validation_errors',
        type: 'base',
        schema: [
          {
            name: 'projectId',
            type: 'text',
            required: true,
          },
          {
            name: 'userId',
            type: 'text',
            required: true,
          },
          {
            name: 'endpoint',
            type: 'text',
            required: true,
          },
          {
            name: 'errorType',
            type: 'select',
            required: true,
            options: {
              maxSelect: 1,
              values: ['structure', 'html', 'css', 'javascript', 'placeholder', 'multi-page'],
            },
          },
          {
            name: 'severity',
            type: 'select',
            required: true,
            options: {
              maxSelect: 1,
              values: ['error', 'warning'],
            },
          },
          {
            name: 'rule',
            type: 'text',
            required: true,
          },
          {
            name: 'file',
            type: 'text',
            required: true,
          },
          {
            name: 'line',
            type: 'number',
            required: true,
            options: {
              min: 1,
            },
          },
          {
            name: 'column',
            type: 'number',
            required: false,
            options: {
              min: 1,
            },
          },
          {
            name: 'message',
            type: 'text',
            required: true,
          },
          {
            name: 'suggestion',
            type: 'text',
            required: false,
          },
          {
            name: 'context',
            type: 'text',
            required: false,
          },
          {
            name: 'autoFixable',
            type: 'bool',
            required: true,
          },
          {
            name: 'isFixed',
            type: 'bool',
            required: true,
          },
          {
            name: 'attemptNumber',
            type: 'number',
            required: true,
            options: {
              min: 1,
            },
          },
          {
            name: 'aiModel',
            type: 'text',
            required: false,
          },
          {
            name: 'aiProvider',
            type: 'text',
            required: false,
          },
          {
            name: 'filesGenerated',
            type: 'number',
            required: true,
            options: {
              min: 1,
            },
          },
          {
            name: 'totalErrors',
            type: 'number',
            required: true,
            options: {
              min: 0,
            },
          },
          {
            name: 'totalWarnings',
            type: 'number',
            required: true,
            options: {
              min: 0,
            },
          },
        ],
        listRule: '@request.auth.id != "" && userId = @request.auth.id',
        viewRule: '@request.auth.id != "" && userId = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != "" && userId = @request.auth.id',
        deleteRule: '@request.auth.id != "" && userId = @request.auth.id',
        indexes: [
          'CREATE INDEX idx_validation_errors_projectId ON validation_errors (projectId)',
          'CREATE INDEX idx_validation_errors_userId ON validation_errors (userId)',
          'CREATE INDEX idx_validation_errors_errorType ON validation_errors (errorType)',
          'CREATE INDEX idx_validation_errors_severity ON validation_errors (severity)',
          'CREATE INDEX idx_validation_errors_created ON validation_errors (created)',
        ],
      });
      console.log('✅ validation_errors collection created\n');
    } catch (error: any) {
      if (error.status === 400 && error.data?.data?.name) {
        console.log('⚠️  validation_errors collection already exists\n');
      } else {
        throw error;
      }
    }

    // Create validation_sessions collection
    console.log('📦 Creating validation_sessions collection...');
    try {
      await pb.collections.create({
        name: 'validation_sessions',
        type: 'base',
        schema: [
          {
            name: 'projectId',
            type: 'text',
            required: true,
          },
          {
            name: 'userId',
            type: 'text',
            required: true,
          },
          {
            name: 'endpoint',
            type: 'text',
            required: true,
          },
          {
            name: 'sessionType',
            type: 'select',
            required: true,
            options: {
              maxSelect: 1,
              values: ['generation', 'debug_attempt'],
            },
          },
          {
            name: 'attemptNumber',
            type: 'number',
            required: true,
            options: {
              min: 1,
            },
          },
          {
            name: 'totalFiles',
            type: 'number',
            required: true,
            options: {
              min: 1,
            },
          },
          {
            name: 'totalErrors',
            type: 'number',
            required: true,
            options: {
              min: 0,
            },
          },
          {
            name: 'totalWarnings',
            type: 'number',
            required: true,
            options: {
              min: 0,
            },
          },
          {
            name: 'totalFixed',
            type: 'number',
            required: true,
            options: {
              min: 0,
            },
          },
          {
            name: 'wasSuccessful',
            type: 'bool',
            required: true,
          },
          {
            name: 'aiModel',
            type: 'text',
            required: false,
          },
          {
            name: 'aiProvider',
            type: 'text',
            required: false,
          },
          {
            name: 'errorSummary',
            type: 'json',
            required: true,
          },
        ],
        listRule: '@request.auth.id != "" && userId = @request.auth.id',
        viewRule: '@request.auth.id != "" && userId = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != "" && userId = @request.auth.id',
        deleteRule: '@request.auth.id != "" && userId = @request.auth.id',
        indexes: [
          'CREATE INDEX idx_validation_sessions_projectId ON validation_sessions (projectId)',
          'CREATE INDEX idx_validation_sessions_userId ON validation_sessions (userId)',
          'CREATE INDEX idx_validation_sessions_wasSuccessful ON validation_sessions (wasSuccessful)',
          'CREATE INDEX idx_validation_sessions_created ON validation_sessions (created)',
        ],
      });
      console.log('✅ validation_sessions collection created\n');
    } catch (error: any) {
      if (error.status === 400 && error.data?.data?.name) {
        console.log('⚠️  validation_sessions collection already exists\n');
      } else {
        throw error;
      }
    }

    console.log('🎉 Validation system setup complete!');
    console.log('\n📊 You can now access the dashboard at: http://localhost:3000/admin/validation');
  } catch (error: any) {
    console.error('❌ Error setting up collections:', error);
    if (error.data) {
      console.error('Error details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

// Run setup
setupValidationCollections();
