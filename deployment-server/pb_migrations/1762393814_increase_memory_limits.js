/// <reference path="../pb_data/types.d.ts" />

/**
 * Increase JSON field size limits for conversation_memory
 * This fixes the 400 "Failed to create record" errors
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

      // Increase all JSON fields to 10MB to handle large conversations
      field.options.maxSize = 10485760; // 10MB
    }
  }

  return dao.saveCollection(collection);
}, (db) => {
  // Rollback: set back to 5MB
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("conversation_memory");

  for (let i = 0; i < collection.schema.length; i++) {
    const field = collection.schema[i];
    if (field.type === 'json' && field.options) {
      field.options.maxSize = 5242880; // 5MB
    }
  }

  return dao.saveCollection(collection);
});
