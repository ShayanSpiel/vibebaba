/// <reference path="../pb_data/types.d.ts" />

/**
 * Fix conversation_memory JSON size limits - V2
 * Uses removeField + addField to properly update field options
 */
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("conversation_memory")

  console.log('[Migration] FORCE FIX: Setting JSON limits to 5MB...')

  // Remove and re-add entities field with correct limit
  collection.schema.removeField("gpy1ktzd")
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "gpy1ktzd",
    "name": "entities",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 5242880  // 5MB
    }
  }))

  // Remove and re-add messages field with correct limit
  collection.schema.removeField("g6haizqg")
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "g6haizqg",
    "name": "messages",
    "type": "json",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 5242880  // 5MB
    }
  }))

  console.log('[Migration] Saving collection...')
  dao.saveCollection(collection)

  console.log('[Migration] ✅ conversation_memory JSON limits set to 5MB')
}, (db) => {
  // Rollback - restore original 0 byte limits
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("conversation_memory")

  collection.schema.removeField("gpy1ktzd")
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "gpy1ktzd",
    "name": "entities",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 0
    }
  }))

  collection.schema.removeField("g6haizqg")
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "g6haizqg",
    "name": "messages",
    "type": "json",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 0
    }
  }))

  dao.saveCollection(collection)
})
