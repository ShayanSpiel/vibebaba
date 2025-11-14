/// <reference path="../pb_data/types.d.ts" />

/**
 * FORCE FIX: Set JSON limits directly without fancy logic
 * The 0 bytes error means maxSize is somehow null/undefined/0
 */
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("conversation_memory");

  console.log('[Migration] FORCE FIX: Setting JSON limits to 5MB...');

  // Direct approach - set maxSize for ALL JSON fields
  for (let i = 0; i < collection.schema.length; i++) {
    if (collection.schema[i].type === 'json') {
      const fieldName = collection.schema[i].name;
      console.log('[Migration]   Processing field: ' + fieldName);

      // Initialize options if missing
      if (!collection.schema[i].options) {
        collection.schema[i].options = {};
      }

      // Set maxSize to 5MB for all JSON fields (no conditionals)
      collection.schema[i].options.maxSize = 5242880;

      console.log('[Migration]   ✓ Set ' + fieldName + ' maxSize to 5242880');
    }
  }

  console.log('[Migration] Saving collection...');
  return dao.saveCollection(collection);
}, (db) => {
  // Rollback
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("conversation_memory");

  for (let i = 0; i < collection.schema.length; i++) {
    if (collection.schema[i].type === 'json') {
      if (!collection.schema[i].options) {
        collection.schema[i].options = {};
      }
      collection.schema[i].options.maxSize = 2097152; // 2MB
    }
  }

  return dao.saveCollection(collection);
});
