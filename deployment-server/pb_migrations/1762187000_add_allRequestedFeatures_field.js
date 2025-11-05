/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("projects")

  // Add allRequestedFeatures field
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "allreqfeat",
    "name": "allRequestedFeatures",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 2000000
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("projects")

  // Remove allRequestedFeatures field
  collection.schema.removeField("allreqfeat")

  return dao.saveCollection(collection)
})
