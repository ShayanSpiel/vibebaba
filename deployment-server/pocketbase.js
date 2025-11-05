const PocketBase = require('pocketbase').default;

const pb = new PocketBase('http://localhost:8090');

// Track authentication state
let isAuthenticated = false;
let authPromise = null;

// Auto-login as admin (for development)
// In production, use proper auth
async function initPocketBase() {
  // Return cached promise if already authenticating
  if (authPromise) {
    return authPromise;
  }

  // Already authenticated
  if (isAuthenticated) {
    return Promise.resolve();
  }

  // Start authentication
  authPromise = (async () => {
    try {
      await pb.admins.authWithPassword('admin@vibebaba.com', 'admin1234567890');
      isAuthenticated = true;
      console.log('✅ PocketBase authenticated');
    } catch (error) {
      console.log('⚠️  PocketBase auth skipped (admin not created yet)');
      throw error;
    } finally {
      authPromise = null;
    }
  })();

  return authPromise;
}

// Field type mapping
function fieldTypeToPocketBase(type) {
  const mapping = {
    'text': 'text',
    'email': 'email',
    'number': 'number',
    'bool': 'bool',
    'boolean': 'bool',
    'date': 'date',
    'datetime': 'date'
  };
  return mapping[type] || 'text';
}

// Reserved PocketBase field names
const RESERVED_FIELDS = ['id', 'created', 'updated', 'collectionId', 'collectionName', 'expand'];

// Ensure collection exists, create if not
async function ensureCollection(projectId, collectionName, fields) {
  const fullName = `${projectId}_${collectionName}`;

  // Ensure PocketBase is authenticated before operations
  await initPocketBase();

  try {
    // Try to get existing collection
    await pb.collections.getOne(fullName);
    console.log(`📋 Collection exists: ${fullName}`);
  } catch (error) {
    // Collection doesn't exist, create it
    try {
      const schema = fields.map(f => {
        // Handle reserved field names by prefixing with 'f_'
        let fieldName = f.name;
        if (RESERVED_FIELDS.includes(fieldName.toLowerCase())) {
          fieldName = `f_${fieldName}`;
          console.log(`⚠️  Field '${f.name}' is reserved, renamed to '${fieldName}'`);
        }

        return {
          name: fieldName,
          type: fieldTypeToPocketBase(f.type),
          required: false,
          options: f.type === 'text' ? { max: 5000 } : {}
        };
      });

      console.log(`🔧 Creating collection ${fullName} with schema:`, JSON.stringify(schema, null, 2));

      await pb.collections.create({
        name: fullName,
        type: 'base',
        schema: schema,
        listRule: '',  // Public read
        viewRule: '',  // Public read
        createRule: '', // Public create
        updateRule: '', // Public update
        deleteRule: ''  // Public delete
      });

      console.log(`✅ Collection created: ${fullName}`);
    } catch (createError) {
      console.error(`❌ Failed to create collection ${fullName}:`, createError.message);
      console.error(`❌ Full error details:`, JSON.stringify(createError, null, 2));
      if (createError.data) {
        console.error(`❌ Error data:`, JSON.stringify(createError.data, null, 2));
      }
      throw createError;
    }
  }

  return fullName;
}

// Generate sample data for a collection
async function generateSampleData(projectId, collection) {
  const fullName = `${projectId}_${collection.name}`;

  // Ensure PocketBase is authenticated before operations
  await initPocketBase();

  try {
    // Check if data already exists
    const existingRecords = await pb.collection(fullName).getList(1, 1);
    if (existingRecords.totalItems > 0) {
      console.log(`📊 Sample data already exists for ${fullName}`);
      return;
    }

    // Generate sample records
    const count = collection.name.toLowerCase().includes('user') ? 3 : 5;

    for (let i = 1; i <= count; i++) {
      const record = {};

      if (!collection.fields || collection.fields.length === 0) {
        record['f_name'] = `Sample ${collection.name} ${i}`;
        record['description'] = `Sample data for ${collection.name}`;
      } else {
        collection.fields.forEach(field => {
          // Handle reserved field names (same as ensureCollection)
          let fieldName = field.name;
          if (RESERVED_FIELDS.includes(fieldName.toLowerCase())) {
            fieldName = `f_${fieldName}`;
          }

          switch (field.type) {
            case 'text':
              if (field.name.toLowerCase().includes('name')) {
                record[fieldName] = `Sample ${i}`;
              } else if (field.name.toLowerCase().includes('title')) {
                record[fieldName] = `Sample Title ${i}`;
              } else if (field.name.toLowerCase().includes('description')) {
                record[fieldName] = `This is a sample description for ${collection.name} ${i}`;
              } else {
                record[fieldName] = `Sample text ${i}`;
              }
              break;
            case 'email':
              record[fieldName] = `user${i}@example.com`;
              break;
            case 'number':
              record[fieldName] = (i * 10);
              break;
            case 'bool':
            case 'boolean':
              record[fieldName] = i % 2 === 0;
              break;
            case 'date':
            case 'datetime':
              const date = new Date();
              date.setDate(date.getDate() - i);
              record[fieldName] = date.toISOString().split('T')[0];
              break;
            default:
              record[fieldName] = `Value ${i}`;
          }
        });
      }

      try {
        await pb.collection(fullName).create(record);
      } catch (error) {
        console.error(`Failed to create sample record ${i}:`, error.message);
      }
    }

    console.log(`✅ Generated ${count} sample records for ${fullName}`);
  } catch (error) {
    console.error(`❌ Failed to generate sample data for ${fullName}:`, error.message);
  }
}

// Initialize on module load
initPocketBase();

module.exports = {
  pb,
  ensureCollection,
  generateSampleData
};
