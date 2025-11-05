/**
 * Fix PocketBase Collection Permissions
 *
 * This script updates collection permissions to allow authenticated users
 * to perform necessary operations.
 *
 * Usage: node scripts/fix-pocketbase-permissions.js
 * Requires: POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in .env.local
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Error: POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in .env.local');
  console.error('Please add these to your .env.local file:\n');
  console.error('POCKETBASE_ADMIN_EMAIL=your-admin@email.com');
  console.error('POCKETBASE_ADMIN_PASSWORD=your-admin-password\n');
  process.exit(1);
}

async function fixPermissions() {
  console.log('🔧 Fixing PocketBase collection permissions...\n');

  // Authenticate as admin
  console.log('1. Authenticating as admin...');
  const authResponse = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  if (!authResponse.ok) {
    throw new Error(`Failed to authenticate: ${authResponse.status}`);
  }

  const authData = await authResponse.json();
  const token = authData.token;
  console.log('✅ Authenticated successfully\n');

  // Headers for authenticated requests
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  // Fix token_usage collection
  console.log('2. Updating token_usage collection permissions...');
  const tokenUsageResponse = await fetch(`${POCKETBASE_URL}/api/collections/token_usage`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      listRule: '@request.auth.id != "" && userId = @request.auth.id',
      viewRule: '@request.auth.id != "" && userId = @request.auth.id',
      createRule: '@request.auth.id != "" && userId = @request.auth.id',
      updateRule: null, // Don't allow updates
      deleteRule: null  // Don't allow deletes
    })
  });

  if (!tokenUsageResponse.ok) {
    const error = await tokenUsageResponse.text();
    console.error('❌ Failed to update token_usage:', error);
  } else {
    console.log('✅ token_usage permissions updated');
  }

  // Fix transactions collection
  console.log('3. Updating transactions collection permissions...');
  const transactionsResponse = await fetch(`${POCKETBASE_URL}/api/collections/transactions`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      listRule: '@request.auth.id != "" && userId = @request.auth.id',
      viewRule: '@request.auth.id != "" && userId = @request.auth.id',
      createRule: '@request.auth.id != "" && userId = @request.auth.id',
      updateRule: null, // Admins only
      deleteRule: null  // Admins only
    })
  });

  if (!transactionsResponse.ok) {
    const error = await transactionsResponse.text();
    console.error('❌ Failed to update transactions:', error);
  } else {
    console.log('✅ transactions permissions updated');
  }

  // Fix projects collection
  console.log('4. Updating projects collection permissions...');
  const projectsResponse = await fetch(`${POCKETBASE_URL}/api/collections/projects`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      listRule: '@request.auth.id != "" && userId = @request.auth.id',
      viewRule: '@request.auth.id != "" && (userId = @request.auth.id || userId = null)',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != "" && userId = @request.auth.id',
      deleteRule: '@request.auth.id != "" && userId = @request.auth.id'
    })
  });

  if (!projectsResponse.ok) {
    const error = await projectsResponse.text();
    console.error('❌ Failed to update projects:', error);
  } else {
    console.log('✅ projects permissions updated');
  }

  // Fix project_files collection
  console.log('5. Updating project_files collection permissions...');
  const filesResponse = await fetch(`${POCKETBASE_URL}/api/collections/project_files`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    })
  });

  if (!filesResponse.ok) {
    const error = await filesResponse.text();
    console.error('❌ Failed to update project_files:', error);
  } else {
    console.log('✅ project_files permissions updated');
  }

  // Fix project_messages collection
  console.log('6. Updating project_messages collection permissions...');
  const messagesResponse = await fetch(`${POCKETBASE_URL}/api/collections/project_messages`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    })
  });

  if (!messagesResponse.ok) {
    const error = await messagesResponse.text();
    console.error('❌ Failed to update project_messages:', error);
  } else {
    console.log('✅ project_messages permissions updated');
  }

  console.log('\n✅ All permissions updated successfully!');
  console.log('\nPermission Rules Applied:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('• token_usage: Users can create/view their own records');
  console.log('• transactions: Users can create/view their own transactions');
  console.log('• projects: Users can CRUD their own projects');
  console.log('• project_files: Authenticated users can CRUD files');
  console.log('• project_messages: Authenticated users can CRUD messages');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the script
fixPermissions().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
