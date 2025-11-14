/// <reference path="../pb_data/types.d.ts" />

/**
 * Fix conversation_memory JSON size limits
 * Issue: entities and messages fields have 0 bytes limit, causing save failures
 * Fix: Set to 5MB (5 * 1024 * 1024 bytes)
 *
 * This migration UPDATES existing fields rather than adding new ones
 */
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("conversation_memory")

  console.log('[Migration] Fixing conversation_memory JSON size limits...')
  console.log('[Migration] Current schema:', JSON.stringify(collection.schema, null, 2))

  // Find and update entities field
  for (let i = 0; i < collection.schema.length; i++) {
    const field = collection.schema[i]

    if (field.name === 'entities') {
      console.log(`[Migration] Updating entities field (current maxSize: ${field.options?.maxSize || 0})`)
      field.options = field.options || {}
      field.options.maxSize = 5242880  // 5MB
      collection.schema[i] = field
    }

    if (field.name === 'messages') {
      console.log(`[Migration] Updating messages field (current maxSize: ${field.options?.maxSize || 0})`)
      field.options = field.options || {}
      field.options.maxSize = 5242880  // 5MB
      collection.schema[i] = field
    }
  }

  dao.saveCollection(collection)

  console.log('[Migration] ✅ conversation_memory JSON limits set to 5MB')
  console.log('[Migration] Updated schema:', JSON.stringify(collection.schema, null, 2))
}, (db) => {
  // Rollback (set back to 0 bytes - not recommended)
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("conversation_memory")

  console.log('[Migration] Rolling back conversation_memory JSON size limits...')

  for (let i = 0; i < collection.schema.length; i++) {
    const field = collection.schema[i]

    if (field.name === 'entities' || field.name === 'messages') {
      field.options = field.options || {}
      field.options.maxSize = 0
      collection.schema[i] = field
    }
  }

  dao.saveCollection(collection)

  console.log('[Migration] ✅ Rollback complete (limits set to 0)')
})
