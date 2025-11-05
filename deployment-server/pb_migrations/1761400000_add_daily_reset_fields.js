/// <reference path="../pb_data/types.d.ts" />
/**
 * Phase 1: Performance Optimization - Add needsDailyReset field
 * This migration adds a flag to track which users need daily token reset
 * instead of checking and writing on every credit check (performance fix)
 */
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("_pb_users_auth_")

  // Add needsDailyReset field (boolean, default false)
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "daily_reset_flag",
    "name": "needsDailyReset",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
}, (db) => {
  // Rollback: remove the field
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("_pb_users_auth_")

  collection.schema.removeField("daily_reset_flag")

  return dao.saveCollection(collection)
})
