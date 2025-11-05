/// <reference path="../pb_data/types.d.ts" />

/**
 * Fix JSON field size limits for conversation_memory
 * Sets maxSize to 5MB (5242880 bytes) for all JSON fields
 */
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("conversation_memory");

  // PocketBase schema is an array, need to iterate
  for (let i = 0; i < collection.schema.length; i++) {
    const field = collection.schema[i];

    if (field.type === 'json') {
      // Initialize options if not exists
      if (!field.options) {
        field.options = {};
      }

      // Set appropriate size based on field
      if (field.name === 'messages' || field.name === 'entities' || field.name === 'projectConfig') {
        field.options.maxSize = 5242880; // 5MB for large data
      } else if (field.name === 'userPreferences' || field.name === 'workflowMetadata') {
        field.options.maxSize = 2097152; // 2MB for smaller data
      }
    }
  }

  return dao.saveCollection(collection);
}, (db) => {
  // Rollback: set back to default (2MB)
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("conversation_memory");

  for (let i = 0; i < collection.schema.length; i++) {
    const field = collection.schema[i];
    if (field.type === 'json' && field.options) {
      field.options.maxSize = 2097152; // 2MB default
    }
  }

  return dao.saveCollection(collection);
});
