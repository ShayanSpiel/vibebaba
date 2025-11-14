/// <reference path="../pb_data/types.d.ts" />

/**
 * Fix JSON field size limits for conversation_memory (AGAIN)
 * The previous migration didn't work - fields show 0 bytes limit
 * This time we'll be more explicit and check all JSON fields
 */
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("conversation_memory");

  console.log('[Migration] Fixing JSON size limits for conversation_memory...');

  // Update each JSON field explicitly using for loop (forEach not available in PocketBase JS)
  for (let i = 0; i < collection.schema.length; i++) {
    const field = collection.schema[i];

    if (field.type === 'json') {
      console.log('[Migration] Found JSON field: ' + field.name);

      // Ensure options object exists
      if (!field.options) {
        field.options = {};
      }

      // Set size based on field name
      if (field.name === 'messages') {
        field.options.maxSize = 5242880; // 5MB
        console.log('[Migration]   - Set ' + field.name + ' to 5MB');
      } else if (field.name === 'entities') {
        field.options.maxSize = 5242880; // 5MB
        console.log('[Migration]   - Set ' + field.name + ' to 5MB');
      } else if (field.name === 'projectConfig') {
        field.options.maxSize = 5242880; // 5MB
        console.log('[Migration]   - Set ' + field.name + ' to 5MB');
      } else if (field.name === 'userPreferences') {
        field.options.maxSize = 1048576; // 1MB
        console.log('[Migration]   - Set ' + field.name + ' to 1MB');
      } else if (field.name === 'workflowMetadata') {
        field.options.maxSize = 1048576; // 1MB
        console.log('[Migration]   - Set ' + field.name + ' to 1MB');
      } else {
        // Default for any other JSON fields
        field.options.maxSize = 2097152; // 2MB
        console.log('[Migration]   - Set ' + field.name + ' to 2MB (default)');
      }
    }
  }

  console.log('[Migration] Saving collection...');
  console.log('[Migration] ✅ Done!');

  return dao.saveCollection(collection);
}, (db) => {
  // Rollback: set to reasonable defaults
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("conversation_memory");

  for (let i = 0; i < collection.schema.length; i++) {
    const field = collection.schema[i];
    if (field.type === 'json') {
      if (!field.options) field.options = {};
      field.options.maxSize = 2097152; // 2MB default
    }
  }

  return dao.saveCollection(collection);
});
