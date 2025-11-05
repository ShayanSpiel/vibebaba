/**
 * Fix Transactions Collection Schema
 * Adds 'zarinpal' to paymentProvider options
 */

require('dotenv').config({ path: '.env.local' });

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Error: POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in .env.local');
  process.exit(1);
}

async function fixTransactionSchema() {
  console.log('🔧 Fixing transactions collection schema...\n');

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

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  // Get current transactions collection
  console.log('2. Getting transactions collection...');
  const getResponse = await fetch(`${POCKETBASE_URL}/api/collections/transactions`, {
    headers
  });

  if (!getResponse.ok) {
    throw new Error(`Failed to get collection: ${getResponse.status}`);
  }

  const collection = await getResponse.json();
  console.log('✅ Got collection schema\n');

  // Find paymentProvider field and update its values
  console.log('3. Updating paymentProvider field...');
  const updatedSchema = collection.schema.map(field => {
    if (field.name === 'paymentProvider') {
      return {
        ...field,
        options: {
          ...field.options,
          values: ['stripe', 'paypal', 'zibal', 'zarinpal']
        }
      };
    }
    return field;
  });

  // Update collection
  const updateResponse = await fetch(`${POCKETBASE_URL}/api/collections/${collection.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      schema: updatedSchema
    })
  });

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    console.error('❌ Failed to update collection:', error);
    throw new Error('Failed to update collection');
  }

  console.log('✅ Transaction schema updated successfully!\n');
  console.log('Payment providers now include: stripe, paypal, zibal, zarinpal');
}

// Run the script
fixTransactionSchema().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
